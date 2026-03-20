import base64
import boto3
import hashlib
import hmac
import json
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote
from urllib.request import Request, urlopen


REGION = os.environ.get("AWS_REGION", "me-south-1")
BUCKET = os.environ.get("KYC_BUCKET", "fll-kyc-documents-230811072086")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "FLL Platform <no-reply@fll.sa>")
ADMIN_EMAILS = [
    email.strip()
    for email in os.environ.get("ADMIN_EMAILS", "M.Z@FLL.SA,A.ALZAMIL@FLL.SA").split(",")
    if email.strip()
]
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
OTP_TTL_MINUTES = int(os.environ.get("OTP_TTL_MINUTES", "10"))
OTP_SEND_LIMIT = int(os.environ.get("OTP_SEND_LIMIT", "5"))
OTP_VERIFY_LIMIT = int(os.environ.get("OTP_VERIFY_LIMIT", "5"))
OTP_VERIFIED_WINDOW_MINUTES = int(os.environ.get("OTP_VERIFIED_WINDOW_MINUTES", "30"))


s3 = boto3.client("s3", region_name=REGION)
ses = boto3.client("ses", region_name=REGION)


def cors(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "https://fll.sa",
            "Access-Control-Allow-Headers": "content-type,authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


def now_utc():
    return datetime.now(timezone.utc)


def parse_json_body(event):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    try:
        return json.loads(raw)
    except Exception:
        return {}


def query_params(event):
    raw = event.get("rawQueryString") or ""
    if raw:
        return {k: v[0] for k, v in parse_qs(raw).items()}
    params = event.get("queryStringParameters") or {}
    return params if isinstance(params, dict) else {}


def request_method(event):
    return event.get("requestContext", {}).get("http", {}).get("method", "GET").upper()


def request_path(event):
    return event.get("requestContext", {}).get("http", {}).get("path") or event.get("rawPath") or event.get("path") or "/"


def source_ip(event):
    return (
        event.get("requestContext", {}).get("http", {}).get("sourceIp")
        or event.get("requestContext", {}).get("identity", {}).get("sourceIp")
        or ""
    )


def supabase_headers(prefer_representation=True):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer_representation:
        headers["Prefer"] = "return=representation"
    return headers


def auth_headers(token=None):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")
    bearer = token or SUPABASE_KEY
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {bearer}",
        "Content-Type": "application/json",
    }


def supabase_request(method, path, payload=None, prefer_representation=True):
    url = f"{SUPABASE_URL}/rest/v1{path}"
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        headers=supabase_headers(prefer_representation=prefer_representation),
        method=method,
    )
    try:
        with urlopen(request, timeout=15) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(detail or str(exc))
    except URLError as exc:
        raise RuntimeError(str(exc))


def supabase_rpc(function_name, payload, prefer_representation=False):
    return supabase_request("POST", f"/rpc/{function_name}", payload, prefer_representation=prefer_representation)


def supabase_auth_request(method, path, payload=None, token=None):
    url = f"{SUPABASE_URL}/auth/v1{path}"
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(url, data=body, headers=auth_headers(token=token), method=method)
    try:
        with urlopen(request, timeout=15) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(detail or str(exc))
    except URLError as exc:
        raise RuntimeError(str(exc))


def extract_bearer_token(event):
    headers = event.get("headers") or {}
    auth_header = headers.get("authorization") or headers.get("Authorization")
    if not auth_header or not isinstance(auth_header, str):
        return None
    if not auth_header.lower().startswith("bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def require_admin_actor(event):
    token = extract_bearer_token(event)
    if not token:
        raise PermissionError("Unauthorized")

    auth_user = supabase_auth_request("GET", "/user", token=token)
    user_id = auth_user.get("id") if isinstance(auth_user, dict) else None
    if not user_id:
        raise PermissionError("Unauthorized")

    user_rows = supabase_request(
        "GET",
        f"/users?id=eq.{quote(user_id)}&select=id,email,role,is_active&limit=1",
    ) or []
    if not user_rows:
        raise PermissionError("Forbidden")

    user_row = user_rows[0]
    role = (user_row.get("role") or "").lower()
    if role in ("admin", "owner"):
        return {"id": user_id, "email": user_row.get("email")}

    if role != "staff":
        raise PermissionError("Forbidden")

    staff_rows = supabase_request(
        "GET",
        f"/staff_profiles?user_id=eq.{quote(user_id)}&select=is_active,permissions,can_approve&limit=1",
    ) or []
    if not staff_rows:
        raise PermissionError("Forbidden")

    profile = staff_rows[0]
    permissions = profile.get("permissions") if isinstance(profile.get("permissions"), dict) else {}
    allowed = bool(profile.get("is_active")) and (permissions.get("couriers") is True or bool(profile.get("can_approve")))
    if not allowed:
        raise PermissionError("Forbidden")

    return {"id": user_id, "email": user_row.get("email")}


def otp_hash(email, code):
    secret = (SUPABASE_KEY or "dev-secret").encode("utf-8")
    msg = f"{email.lower()}:{code}".encode("utf-8")
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()


def generate_otp():
    return str(secrets.randbelow(900000) + 100000)


def generate_app_ref():
    return f"APP-{now_utc().strftime('%Y%m%d')}-{secrets.token_hex(2).upper()}"


def validate_email(value):
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", value or ""))


def ensure_required_fields(body, fields):
    missing = [field for field in fields if not body.get(field)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def track_otp_attempt(identifier, action, ip_address):
    payload = {
        "identifier": identifier,
        "action": action,
        "ip_address": ip_address,
    }
    return supabase_request("POST", "/otp_attempts", payload)


def recent_otp_attempts(identifier, action):
    since = (now_utc() - timedelta(minutes=OTP_TTL_MINUTES)).isoformat()
    query = (
        f"/otp_attempts?identifier=eq.{quote(identifier)}"
        f"&action=eq.{quote(action)}"
        f"&created_at=gte.{quote(since)}"
        f"&select=id,created_at"
    )
    return supabase_request("GET", query) or []


def check_duplicate_registration(body):
    for field in ("national_id", "email", "phone"):
        value = body.get(field)
        if not value:
            continue
        query = (
            f"/driver_applications?{field}=eq.{quote(str(value))}"
            "&status=not.in.(rejected)"
            "&select=id,app_ref,status&limit=1"
        )
        rows = supabase_request("GET", query) or []
        if rows:
            raise ValueError(f"يوجد طلب مسجل مسبقاً بنفس {field}")

    phone = body.get("phone")
    if phone:
        courier_rows = supabase_request(
            "GET",
            f"/couriers?phone=eq.{quote(str(phone))}&select=id,phone&limit=1",
        ) or []
        if courier_rows:
            raise ValueError("يوجد حساب مندوب نشط بنفس رقم الجوال")

    email = body.get("email")
    if email:
        user_rows = supabase_request(
            "GET",
            f"/users?email=eq.{quote(str(email).lower())}&select=id,email,role&limit=1",
        ) or []
        if user_rows:
            raise ValueError("يوجد حساب مستخدم سابق بنفس البريد الإلكتروني")


def upsert_email_otp(email, otp_code_hash, expires_at, ip_address):
    existing = supabase_request(
        "GET",
        f"/driver_email_otps?email=eq.{quote(email)}&select=id&limit=1",
    ) or []

    payload = {
        "email": email,
        "otp_hash": otp_code_hash,
        "otp_expires_at": expires_at,
        "attempts": 0,
        "verified_at": None,
        "ip_address": ip_address,
        "last_sent_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    }

    if existing:
        supabase_request("PATCH", f"/driver_email_otps?id=eq.{existing[0]['id']}", payload)
    else:
        supabase_request("POST", "/driver_email_otps", payload)


def read_email_otp(email):
    rows = supabase_request(
        "GET",
        f"/driver_email_otps?email=eq.{quote(email)}&select=id,otp_hash,otp_expires_at,attempts,verified_at,last_sent_at&limit=1",
    ) or []
    return rows[0] if rows else None


def ensure_recent_email_verification(email):
    otp_row = read_email_otp(email)
    if not otp_row or not otp_row.get("verified_at"):
        raise ValueError("يجب التحقق من البريد الإلكتروني أولاً")

    verified_at = datetime.fromisoformat(otp_row["verified_at"].replace("Z", "+00:00"))
    if verified_at < now_utc() - timedelta(minutes=OTP_VERIFIED_WINDOW_MINUTES):
        raise ValueError("انتهت مهلة التحقق من البريد الإلكتروني، أعد طلب رمز جديد")


def upload_binary_to_s3(key, content, content_type, metadata=None):
    extra = {"Bucket": BUCKET, "Key": key, "Body": content, "ContentType": content_type}
    if metadata:
        extra["Metadata"] = metadata
    s3.put_object(**extra)
    return key


def decode_base64_blob(value):
    if not value:
        return None
    if "," in value:
        value = value.split(",", 1)[1]
    return base64.b64decode(value)


def content_type_from_name(name):
    name = (name or "").lower()
    if name.endswith(".pdf"):
        return "application/pdf"
    if name.endswith(".png"):
        return "image/png"
    return "image/jpeg"


def upload_document_bundle(app_ref, body):
    document_map = {
        "doc_national_id": "doc_national_id",
        "doc_national_id_back": "doc_national_id_back",
        "doc_driver_license": "doc_driver_license",
        "doc_bank_cert": "doc_bank_cert",
        "doc_vehicle_front": "doc_vehicle_front",
        "doc_vehicle_back": "doc_vehicle_back",
        "doc_vehicle_side": "doc_vehicle_side",
        "doc_vehicle_reg": "doc_vehicle_reg",
        "doc_vehicle_insurance": "doc_vehicle_insurance",
    }

    uploaded = {}
    for field, db_field in document_map.items():
        file_obj = body.get(field)
        if not isinstance(file_obj, dict) or not file_obj.get("data"):
            uploaded[db_field] = None
            continue
        extension = (file_obj.get("name") or "document.jpg").rsplit(".", 1)[-1].lower()
        key = f"driver-applications/{app_ref}/{db_field}/{uuid.uuid4().hex}.{extension}"
        binary = decode_base64_blob(file_obj.get("data"))
        uploaded[db_field] = upload_binary_to_s3(
            key,
            binary,
            content_type_from_name(file_obj.get("name")),
            metadata={"app_ref": app_ref, "doc_type": db_field},
        )

    selfie_key = None
    selfie_data = body.get("selfieDataUrl") or body.get("selfie_data_url")
    if selfie_data:
        selfie_key = f"driver-applications/{app_ref}/doc_selfie/{uuid.uuid4().hex}.jpg"
        upload_binary_to_s3(
            selfie_key,
            decode_base64_blob(selfie_data),
            "image/jpeg",
            metadata={"app_ref": app_ref, "doc_type": "doc_selfie"},
        )

    uploaded["doc_selfie"] = selfie_key
    return uploaded


def send_email(to_addresses, subject, html):
    ses.send_email(
        Source=FROM_EMAIL,
        Destination={"ToAddresses": to_addresses},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {"Html": {"Data": html, "Charset": "UTF-8"}},
        },
    )


def fll_email_template(subject_ar, intro_html, body_html, footer_note=None):
    footer_note = footer_note or "هذه رسالة تلقائية من نظام FLL — الرجاء عدم الرد عليها."
    return f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:24px 0;background:#07111d;font-family:Tahoma,Arial,sans-serif;color:#e5e7eb;">
  <div style="max-width:640px;margin:0 auto;background:#08111b;border-radius:18px;overflow:hidden;border:1px solid #16263d;box-shadow:0 12px 40px rgba(0,0,0,0.35);">
    <div style="background:#12315f;padding:28px 24px;text-align:center;">
      <div style="font-size:18px;font-weight:700;letter-spacing:2px;color:#e5e7eb;">FIRST LINE LOGISTICS</div>
      <div style="margin-top:8px;font-size:13px;color:#d1d5db;">شركة الخط الأول للخدمات اللوجستية</div>
    </div>
    <div style="padding:28px 24px;background:#08111b;">
      <div style="font-size:28px;line-height:1.7;color:#f3f4f6;font-weight:700;margin-bottom:14px;">{subject_ar}</div>
      <div style="font-size:16px;line-height:1.9;color:#e5e7eb;margin-bottom:14px;">{intro_html}</div>
      <div style="font-size:15px;line-height:1.9;color:#cbd5e1;">{body_html}</div>
      <div style="margin-top:22px;background:#020817;border:1px solid #0f2744;border-radius:12px;padding:18px 16px;">
        <div style="font-size:15px;line-height:1.9;color:#e5e7eb;"><strong>التواصل المباشر:</strong> <a href="tel:920014948" style="color:#2563eb;text-decoration:none;font-weight:700;">920014948</a></div>
        <div style="font-size:15px;line-height:1.9;color:#e5e7eb;"><strong>البريد:</strong> <a href="mailto:support@fll.sa" style="color:#2563eb;text-decoration:none;font-weight:700;">support@fll.sa</a></div>
      </div>
      <div style="margin-top:18px;font-size:12px;line-height:1.8;color:#94a3b8;text-align:center;">{footer_note}</div>
    </div>
    <div style="background:#12315f;padding:22px 20px;text-align:center;">
      <div style="width:54px;height:54px;margin:0 auto 12px;background:#062b45;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;letter-spacing:1px;">FLL</div>
      <div style="font-size:13px;color:#d1d5db;">fll.sa — First Line Logistics 2026 &copy;</div>
    </div>
  </div>
</body>
</html>
"""


def otp_email_html(full_name, code):
    return fll_email_template(
        "رمز التحقق - فيرست لاين لوجستكس",
        f"مرحباً {full_name}،",
        f"<p style=\"margin:0 0 14px;\">رمز التحقق الخاص بك لإتمام عملية التسجيل:</p><div style=\"text-align:center;margin:24px 0\"><span style=\"display:inline-block;background:#020817;border:1px solid #12315f;border-radius:14px;padding:16px 22px;font-size:36px;font-weight:700;letter-spacing:0.45rem;color:#2563eb;font-family:monospace\">{code}</span></div><p style=\"margin:0;text-align:center;color:#94a3b8;font-size:13px;\">صالح لمدة {OTP_TTL_MINUTES} دقائق</p>",
        "هذه رسالة تحقق تلقائية — الرجاء عدم مشاركة الرمز مع أي شخص."
    )


def admin_application_email_html(record):
    body = f"""
<table style=\"width:100%;border-collapse:collapse;font-size:14px\">
  <tr><td style=\"padding:6px 0;color:#94a3b8\">رقم الطلب</td><td style=\"font-weight:700;color:#2563eb\">{record['app_ref']}</td></tr>
  <tr><td style=\"padding:6px 0;color:#94a3b8\">الاسم</td><td>{record['full_name']}</td></tr>
  <tr><td style=\"padding:6px 0;color:#94a3b8\">رقم الهوية</td><td style=\"font-family:monospace\">{record['national_id']}</td></tr>
  <tr><td style=\"padding:6px 0;color:#94a3b8\">الجوال</td><td>{record['phone']}</td></tr>
  <tr><td style=\"padding:6px 0;color:#94a3b8\">البريد</td><td>{record['email']}</td></tr>
  <tr><td style=\"padding:6px 0;color:#94a3b8\">المدينة</td><td>{record['city']}</td></tr>
  <tr><td style=\"padding:6px 0;color:#94a3b8\">التعاقد</td><td>{record['contract_type']}</td></tr>
</table>
"""
    return fll_email_template("طلب تسجيل مندوب جديد", "تم استلام طلب تسجيل جديد ويحتاج مراجعة.", body)


def decision_email_html(full_name, app_ref, approved, reason=""):
    if approved:
        body = """
<p style=\"color:#15803d;font-size:16px;font-weight:700\">تهانينا! تمت الموافقة على طلب تسجيلك.</p>
<p>سيتم التواصل معك قريباً لإتمام إجراءات الانضمام وتزويدك ببيانات الدخول.</p>
"""
    else:
        reason_html = ""
        if reason:
            reason_html = f"<p style=\"background:#fef2f2;padding:12px;border-right:4px solid #dc2626;border-radius:4px\"><strong>السبب:</strong> {reason}</p>"
        body = f"""
<p>شكراً لاهتمامك بالانضمام إلى فيرست لاين لوجستيكس.</p>
<p>بعد مراجعة طلبك <strong>({app_ref})</strong>، نأسف لإبلاغك بأنه لم يُقبل في الوقت الحالي.</p>
{reason_html}
<p>يمكنك التقديم مجدداً بعد معالجة الملاحظات المذكورة.</p>
"""

    return fll_email_template("بخصوص طلب التسجيل", f"مرحباً {full_name}،", body)


def decision_approved_with_account_html(full_name, app_ref, temp_password):
    body = f"""
<p style=\"color:#22c55e;font-size:16px;font-weight:700\">تمت الموافقة على طلبك ({app_ref}) وإنشاء حساب السائق.</p>
<p>يمكنك تسجيل الدخول عبر بوابة السائق باستخدام البريد الذي سجلت به وكلمة المرور المؤقتة التالية:</p>
<div style=\"background:#020817;border:1px solid #12315f;border-radius:12px;padding:14px;font-family:monospace;font-size:18px;font-weight:700;color:#2563eb;text-align:center\">{temp_password}</div>
<p style=\"margin-top:12px\">لأمان حسابك، قم بتغيير كلمة المرور بعد أول تسجيل دخول.</p>
"""
    return fll_email_template("تمت الموافقة على طلبك", f"مرحباً {full_name}،", body)


def handle_otp_send(body, ip_address):
    email = (body.get("email") or "").strip().lower()
    full_name = (body.get("full_name") or "").strip() or "المتقدم"
    if not validate_email(email):
        return cors(400, {"message": "بريد إلكتروني غير صحيح"})

    if len(recent_otp_attempts(email, "send")) >= OTP_SEND_LIMIT:
        return cors(429, {"message": "تم تجاوز عدد مرات إرسال الرمز. حاول لاحقاً."})

    if len(recent_otp_attempts(ip_address or email, "send_ip")) >= OTP_SEND_LIMIT:
        return cors(429, {"message": "تم تجاوز الحد الأقصى من هذا الجهاز. حاول لاحقاً."})

    code = generate_otp()
    expires_at = (now_utc() + timedelta(minutes=OTP_TTL_MINUTES)).isoformat()
    upsert_email_otp(email, otp_hash(email, code), expires_at, ip_address)

    track_otp_attempt(email, "send", ip_address)
    if ip_address:
        track_otp_attempt(ip_address, "send_ip", ip_address)

    try:
        send_email([email], "رمز التحقق — فيرست لاين لوجستيكس", otp_email_html(full_name, code))
    except Exception:
        return cors(500, {"message": "تعذر إرسال رمز التحقق، حاول لاحقاً"})

    return cors(200, {"success": True})


def handle_otp_verify(body, ip_address):
    email = (body.get("email") or "").strip().lower()
    code = (body.get("code") or "").strip()
    if not validate_email(email) or not re.match(r"^\d{6}$", code):
        return cors(400, {"message": "البريد والرمز مطلوبان بصيغة صحيحة"})

    if len(recent_otp_attempts(email, "verify")) >= OTP_VERIFY_LIMIT:
        return cors(429, {"message": "تم تجاوز عدد محاولات التحقق. حاول لاحقاً."})

    if len(recent_otp_attempts(ip_address or email, "verify_ip")) >= OTP_VERIFY_LIMIT:
        return cors(429, {"message": "تم تجاوز عدد محاولات التحقق من هذا الجهاز"})

    track_otp_attempt(email, "verify", ip_address)
    if ip_address:
        track_otp_attempt(ip_address, "verify_ip", ip_address)

    record = read_email_otp(email)
    if not record or not record.get("otp_hash") or not record.get("otp_expires_at"):
        return cors(400, {"message": "لم يتم إرسال رمز تحقق بعد"})

    if record.get("attempts", 0) >= OTP_VERIFY_LIMIT:
        return cors(429, {"message": "تم قفل التحقق مؤقتاً لكثرة المحاولات"})

    if record["otp_expires_at"] <= now_utc().isoformat():
        return cors(400, {"message": "انتهت صلاحية رمز التحقق"})

    if record["otp_hash"] != otp_hash(email, code):
        supabase_request(
            "PATCH",
            f"/driver_email_otps?id=eq.{record['id']}",
            {
                "attempts": int(record.get("attempts", 0)) + 1,
                "updated_at": now_utc().isoformat(),
            },
        )
        return cors(400, {"message": "رمز التحقق غير صحيح"})

    supabase_request(
        "PATCH",
        f"/driver_email_otps?id=eq.{record['id']}",
        {
            "verified_at": now_utc().isoformat(),
            "attempts": 0,
            "otp_hash": None,
            "otp_expires_at": None,
            "updated_at": now_utc().isoformat(),
        },
    )
    return cors(200, {"success": True, "verified": True})


def handle_apply(body, ip_address):
    try:
        ensure_required_fields(
            body,
            ["full_name", "national_id", "city", "phone", "email", "contract_type", "iban"],
        )
    except ValueError as exc:
        return cors(400, {"message": str(exc)})

    if not validate_email(body.get("email")):
        return cors(400, {"message": "بريد إلكتروني غير صحيح"})

    if body.get("emailVerified") is not True and body.get("email_verified") is not True:
        return cors(400, {"message": "يجب التحقق من البريد الإلكتروني أولاً"})

    try:
        ensure_recent_email_verification((body.get("email") or "").strip().lower())
    except ValueError as exc:
        return cors(400, {"message": str(exc)})

    required_docs = ["doc_national_id", "doc_national_id_back", "doc_bank_cert", "doc_driver_license"]
    missing_docs = []
    for doc_field in required_docs:
        file_obj = body.get(doc_field)
        if not isinstance(file_obj, dict) or not file_obj.get("data"):
            missing_docs.append(doc_field)
    if missing_docs:
        return cors(400, {"message": "الوثائق الإلزامية غير مكتملة"})

    if not (body.get("selfieDataUrl") or body.get("selfie_data_url")):
        return cors(400, {"message": "الصورة الشخصية عبر الكاميرا مطلوبة"})

    if not bool(body.get("livenessComplete") or body.get("liveness_passed")):
        return cors(400, {"message": "التحقق الحيوي مطلوب قبل إرسال الطلب"})

    if body.get("has_vehicle"):
        required_vehicle_fields = ["vehicle_type", "vehicle_brand", "vehicle_model", "vehicle_plate", "doc_vehicle_reg", "doc_vehicle_insurance"]
        for field in required_vehicle_fields:
            if field.startswith("doc_"):
                fobj = body.get(field)
                if not isinstance(fobj, dict) or not fobj.get("data"):
                    return cors(400, {"message": "بيانات المركبة والوثائق الإلزامية غير مكتملة"})
            elif not body.get(field):
                return cors(400, {"message": "بيانات المركبة والوثائق الإلزامية غير مكتملة"})

    try:
        check_duplicate_registration(body)
    except ValueError as exc:
        return cors(409, {"message": str(exc)})

    app_ref = generate_app_ref()
    uploaded = upload_document_bundle(app_ref, body)

    record = {
        "app_ref": app_ref,
        "full_name": body.get("full_name", "").strip(),
        "national_id": body.get("national_id", "").strip(),
        "nationality": body.get("nationality") or "سعودي",
        "city": body.get("city", "").strip(),
        "phone": body.get("phone", "").strip(),
        "email": body.get("email", "").strip().lower(),
        "platform_app": body.get("platform_app"),
        "contract_type": body.get("contract_type"),
        "bank_name": body.get("bank_name"),
        "bank_account": body.get("bank_account"),
        "iban": (body.get("iban") or "").strip().upper(),
        "has_vehicle": bool(body.get("has_vehicle")),
        "vehicle_type": body.get("vehicle_type"),
        "vehicle_brand": body.get("vehicle_brand"),
        "vehicle_model": body.get("vehicle_model"),
        "vehicle_year": int(body["vehicle_year"]) if str(body.get("vehicle_year") or "").isdigit() else None,
        "vehicle_plate": body.get("vehicle_plate"),
        "vehicle_color": body.get("vehicle_color"),
        "face_similarity_score": body.get("livenessScore") or body.get("liveness_score"),
        "liveness_passed": bool(body.get("livenessComplete") or body.get("liveness_passed")),
        "email_verified": True,
        "device_fingerprint": body.get("device_fingerprint"),
        "ip_address": ip_address,
        "user_agent": body.get("user_agent"),
        "status": "pending",
        **uploaded,
    }

    rows = supabase_request("POST", "/driver_applications", record) or []
    inserted = rows[0] if rows else record

    try:
        send_email(ADMIN_EMAILS, f"طلب تسجيل جديد — {record['full_name']} ({app_ref})", admin_application_email_html(record))
    except Exception:
        pass

    return cors(200, {"success": True, "app_ref": app_ref, "id": inserted.get("id")})


def get_application_by_id(app_id):
    query = (
        f"/driver_applications?id=eq.{quote(app_id)}"
        "&select=id,app_ref,full_name,email,phone,city,vehicle_type,status"
        "&limit=1"
    )
    rows = supabase_request("GET", query) or []
    if not rows:
        raise RuntimeError("Application not found")
    return rows[0]


def generate_temp_password(length=12):
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_auth_user(email, full_name, phone, temp_password):
    payload = {
        "email": email,
        "password": temp_password,
        "email_confirm": True,
        "user_metadata": {
            "full_name": full_name,
            "role": "courier",
            "phone": phone,
        },
    }
    return supabase_auth_request("POST", "/admin/users", payload)


def upsert_user_profile(auth_user_id, full_name, email, phone):
    payload_full_name = {
        "id": auth_user_id,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "role": "courier",
        "status": "active",
    }
    try:
        supabase_request(
            "POST",
            "/users?on_conflict=id",
            payload_full_name,
            prefer_representation=False,
        )
        return
    except Exception:
        payload_name = {
            "id": auth_user_id,
            "name": full_name,
            "email": email,
            "phone": phone,
            "role": "courier",
            "status": "active",
        }
        supabase_request(
            "POST",
            "/users?on_conflict=id",
            payload_name,
            prefer_representation=False,
        )


def ensure_driver_account(application):
    existing = supabase_request(
        "GET",
        f"/users?email=eq.{quote(application['email'].lower())}&select=id,role&limit=1",
    ) or []
    if existing:
        return None

    temp_password = generate_temp_password()
    auth_user = create_auth_user(application["email"], application["full_name"], application.get("phone"), temp_password)
    auth_user_id = auth_user.get("id") if isinstance(auth_user, dict) else None
    if not auth_user_id:
        raise RuntimeError("تعذر إنشاء حساب السائق")

    upsert_user_profile(auth_user_id, application["full_name"], application["email"], application.get("phone"))
    return temp_password


def handle_approve(app_id, _body, actor):
    application = get_application_by_id(app_id)
    if application.get("status") not in ("pending", "under_review", "requires_correction"):
        return cors(400, {"message": "لا يمكن اعتماد هذا الطلب في حالته الحالية"})

    courier_id = supabase_rpc(
        "approve_driver_application",
        {"p_application_id": app_id, "p_reviewed_by": actor.get("id")},
        prefer_representation=True,
    )

    temp_password = ensure_driver_account(application)

    try:
        if courier_id:
            supabase_request(
                "PATCH",
                f"/couriers?id=eq.{quote(str(courier_id))}",
                {
                    "email": application["email"],
                    "username": application["email"],
                    "updated_at": now_utc().isoformat(),
                },
                prefer_representation=False,
            )
    except Exception:
        pass

    try:
        approved_html = decision_email_html(application["full_name"], application["app_ref"], True)
        if temp_password:
            approved_html = decision_approved_with_account_html(application["full_name"], application["app_ref"], temp_password)
        send_email(
            [application["email"]],
            f"تهانينا! تمت الموافقة على طلبك — {application['app_ref']}",
            approved_html,
        )
    except Exception:
        pass
    return cors(200, {"success": True, "driver_account_created": temp_password is not None})


def handle_reject(app_id, body, actor):
    reason = (body.get("reason") or body.get("rejection_reason") or "").strip()
    if not reason:
        return cors(400, {"message": "سبب الرفض مطلوب"})

    application = get_application_by_id(app_id)
    supabase_request(
        "PATCH",
        f"/driver_applications?id=eq.{quote(app_id)}",
        {
            "status": "rejected",
            "rejection_reason": reason,
            "reviewed_by": actor.get("id"),
            "reviewed_at": now_utc().isoformat(),
            "updated_at": now_utc().isoformat(),
        },
    )
    try:
        send_email(
            [application["email"]],
            f"بخصوص طلب تسجيلك في FLL — {application['app_ref']}",
            decision_email_html(application["full_name"], application["app_ref"], False, reason),
        )
    except Exception:
        pass
    return cors(200, {"success": True})


def handle_status(params):
    ref = (params.get("ref") or "").strip().upper()
    if not ref:
        return cors(400, {"message": "رقم الطلب مطلوب"})

    query = (
        f"/driver_applications?app_ref=eq.{quote(ref)}"
        "&select=app_ref,full_name,email,phone,city,status,rejection_reason,admin_notes,created_at,updated_at"
        "&limit=1"
    )
    rows = supabase_request("GET", query) or []
    if not rows:
        return cors(404, {"message": "لم يتم العثور على طلب بهذا الرقم"})

    row = rows[0]
    return cors(
        200,
        {
            "app_ref": row.get("app_ref"),
            "full_name": row.get("full_name"),
            "email": row.get("email"),
            "phone": row.get("phone"),
            "city": row.get("city"),
            "status": row.get("status"),
            "rejection_reason": row.get("rejection_reason"),
            "notes": row.get("admin_notes"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        },
    )


def lambda_handler(event, context):
    method = request_method(event)
    path = request_path(event)

    if method == "OPTIONS":
        return cors(200, {})

    body = parse_json_body(event)
    params = query_params(event)
    ip_address = source_ip(event)

    try:
        if method == "POST" and path == "/driver/otp/send":
            return handle_otp_send(body, ip_address)

        if method == "POST" and path == "/driver/otp/verify":
            return handle_otp_verify(body, ip_address)

        if method == "POST" and path == "/driver/apply":
            return handle_apply(body, ip_address)

        if method == "GET" and path == "/driver/application-status":
            return handle_status(params)

        match = re.match(r"^/driver/applications/([^/]+)/(approve|reject)$", path)
        if method == "POST" and match:
            actor = require_admin_actor(event)
            app_id, action = match.group(1), match.group(2)
            if action == "approve":
                return handle_approve(app_id, body, actor)
            return handle_reject(app_id, body, actor)

        return cors(404, {"message": f"Route not found: {method} {path}"})
    except ValueError as exc:
        return cors(400, {"message": str(exc)})
    except PermissionError as exc:
        message = str(exc)
        status = 401 if message == "Unauthorized" else 403
        return cors(status, {"message": message})
    except Exception as exc:
        print(f"Driver onboarding error: {exc}")
        return cors(500, {"message": "خطأ في النظام", "error": str(exc)})
