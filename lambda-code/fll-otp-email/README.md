# FLL OTP Email Service
## نظام رمز التحقق عبر البريد الإلكتروني

### المتطلبات

#### 1. AWS SES Setup
```bash
# Verify domain identity (required for no-reply@fll.sa)
aws ses verify-domain-identity --domain fll.sa --region me-south-1

# Add DNS records returned by verify-domain-identity:
# - TXT record for DKIM
# - MX record (if receiving email)
# - SPF record: "v=spf1 include:amazonses.com ~all"
# - DMARC record: "v=DMARC1; p=quarantine; rua=mailto:admin@fll.sa"

# Request production access (SES sandbox limits sending)
aws ses put-account-sending-attributes \
  --sending-enabled \
  --region me-south-1

# Verify sender email
aws ses verify-email-identity --email-address no-reply@fll.sa --region me-south-1
```

#### 2. DynamoDB Tables
```bash
# OTP codes table
aws dynamodb create-table \
  --table-name fll-verification-codes \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region me-south-1

# Enable TTL
aws dynamodb update-time-to-live \
  --table-name fll-verification-codes \
  --time-to-live-specification Enabled=true,AttributeName=ttl \
  --region me-south-1
```

#### 3. Lambda Deployment
```bash
# Create deployment package
cd lambda-code/fll-otp-email
zip -r fll-otp-email.zip lambda_function.py

# Deploy
aws lambda create-function \
  --function-name fll-otp-email \
  --runtime python3.12 \
  --handler lambda_function.lambda_handler \
  --role arn:aws:iam::ACCOUNT_ID:role/fll-lambda-role \
  --environment Variables='{
    "SENDER_EMAIL": "no-reply@fll.sa",
    "OTP_TABLE": "fll-verification-codes",
    "RATE_LIMIT_TABLE": "fll-rate-limits",
    "REGION": "me-south-1",
    "OTP_EXPIRY_MINUTES": "5",
    "ALLOWED_ORIGIN": "https://fll.sa"
  }' \
  --timeout 15 \
  --memory-size 256 \
  --region me-south-1
```

#### 4. API Gateway Integration
Add these routes to your API Gateway:
```
POST /otp/send     → fll-otp-email Lambda
POST /otp/verify   → fll-otp-email Lambda
POST /otp/resend   → fll-otp-email Lambda
GET  /otp/health   → fll-otp-email Lambda
```

#### 5. IAM Permissions
Lambda role needs:
```json
{
  "Effect": "Allow",
  "Action": [
    "ses:SendEmail",
    "ses:SendRawEmail"
  ],
  "Resource": "arn:aws:ses:me-south-1:*:identity/fll.sa"
},
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:Scan"
  ],
  "Resource": [
    "arn:aws:dynamodb:me-south-1:*:table/fll-verification-codes",
    "arn:aws:dynamodb:me-south-1:*:table/fll-rate-limits"
  ]
}
```

### API Usage

#### Send OTP
```bash
POST /otp/send
{
  "email": "driver@example.com",
  "purpose": "login"  # login | register | forgot_password | complaint
}
```

#### Verify OTP
```bash
POST /otp/verify
{
  "otp_id": "otp-driver@example.com-login-1234567890",
  "code": "123456"
}
```

#### Resend OTP
```bash
POST /otp/resend
{
  "email": "driver@example.com",
  "purpose": "login"
}
```

### Security Features
- OTP stored as SHA-256 hash (never plain text)
- Rate limiting: max 5 OTPs per 15 minutes per email
- Max 3 verification attempts per OTP
- Auto-expiry via DynamoDB TTL
- Single-use: OTP invalidated after successful verification
