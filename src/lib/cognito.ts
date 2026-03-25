/**
 * Cognito Authentication Module
 * Replaces Supabase auth with AWS Cognito
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || "me-south-1_aJtmQ0QrN";
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "6n49ej8fl92i9rtotbk5o9o0d1";

const poolData = {
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
};

export const userPool = new CognitoUserPool(poolData);

/**
 * Sign in with email and password via Cognito
 */
export function cognitoSignIn(
  email: string,
  password: string
): Promise<{ session?: CognitoUserSession; error?: string }> {
  console.log("cognitoSignIn: pool=", USER_POOL_ID, "client=", CLIENT_ID);
  return new Promise((resolve) => {
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        console.log("cognitoSignIn success");
        resolve({ session });
      },
      onFailure: (err) => {
        console.error("cognitoSignIn error:", err);
        resolve({ error: err.message || "فشل تسجيل الدخول" });
      },
    });
  });
}

/**
 * Get current authenticated session
 */
export function getCognitoSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          resolve(null);
          return;
        }
        resolve(session);
      }
    );
  });
}

/**
 * Get current Cognito user attributes
 */
export function getCognitoUserAttributes(): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      currentUser.getUserAttributes((err2, attributes) => {
        if (err2 || !attributes) {
          resolve(null);
          return;
        }
        const attrs: Record<string, string> = {};
        attributes.forEach((attr) => {
          attrs[attr.getName()] = attr.getValue();
        });
        resolve(attrs);
      });
    });
  });
}

/**
 * Get Cognito user groups from token
 */
export function getCognitoGroups(session: CognitoUserSession): string[] {
  try {
    const payload = session.getAccessToken().decodePayload();
    return (payload["cognito:groups"] as string[]) || [];
  } catch {
    return [];
  }
}

/**
 * Get access token string
 */
export function getAccessToken(session: CognitoUserSession): string {
  return session.getAccessToken().getJwtToken();
}

/**
 * Get ID token string
 */
export function getIdToken(session: CognitoUserSession): string {
  return session.getIdToken().getJwtToken();
}

/**
 * Translate Cognito error codes/messages to Arabic
 */
function translateCognitoError(err: { code?: string; message?: string }, fallback: string): string {
  const code = err.code || "";
  const msg  = err.message || "";
  if (code === "UserNotFoundException" || msg.includes("User does not exist") || msg.includes("Username/client id combination not found"))
    return "البريد الإلكتروني غير مسجّل في النظام";
  if (code === "NotAuthorizedException")
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (code === "LimitExceededException" || msg.includes("Attempt limit exceeded"))
    return "تجاوزت الحد المسموح به من المحاولات. انتظر قليلاً وحاول مجدداً";
  if (code === "InvalidParameterException" || msg.includes("Invalid parameter"))
    return "البريد الإلكتروني غير صالح";
  if (code === "CodeMismatchException" || msg.includes("Invalid verification code"))
    return "رمز التحقق غير صحيح";
  if (code === "ExpiredCodeException" || msg.includes("Invalid code provided") || msg.includes("expired"))
    return "انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً";
  if (code === "InvalidPasswordException" || msg.includes("Password did not conform"))
    return "كلمة المرور لا تستوفي متطلبات الأمان (8 أحرف على الأقل، حرف كبير، رقم)";
  if (code === "TooManyRequestsException")
    return "طلبات كثيرة. انتظر دقيقة وحاول مجدداً";
  return msg || fallback;
}

/**
 * Forgot password — sends OTP code via Cognito (SES email)
 */
export function cognitoForgotPassword(email: string): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.forgotPassword({
        onSuccess: (data) => {
          console.log("forgotPassword onSuccess:", data);
          resolve({});
        },
        onFailure: (err) => {
          console.error("forgotPassword onFailure — code:", err.code, "msg:", err.message);
          resolve({ error: translateCognitoError(err, "تعذّر إرسال رمز التحقق") });
        },
        inputVerificationCode: (data) => {
          console.log("forgotPassword inputVerificationCode:", data);
          resolve({});
        },
      });
    } catch (e) {
      console.error("forgotPassword exception:", e);
      resolve({ error: "تعذّر الاتصال بخدمة المصادقة" });
    }
  });
}

/**
 * Confirm new password with OTP code
 */
export function cognitoConfirmPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => resolve({}),
      onFailure: (err) => {
        console.error("confirmPassword onFailure — code:", err.code, "msg:", err.message);
        resolve({ error: translateCognitoError(err, "فشل تغيير كلمة المرور") });
      },
    });
  });
}

/**
 * Sign out current user
 */
export function cognitoSignOut(): void {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}
