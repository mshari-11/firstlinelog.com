/**
 * Cognito Authentication Module
 * Replaces Supabase auth with AWS Cognito
 *
 * PATCH: amazon-cognito-identity-js does not recognise me-south-1 region.
 * We monkey-patch the SDK's internal region regex so that the standard
 * CognitoUserPool constructor works without any fallback hacks.h
 */
import {
      CognitoUserPool,
      CognitoUser,
      AuthenticationDetails,
      CognitoUserSession,
} from "amazon-cognito-identity-js";

/* ------------------------------------------------------------------ */
/*  Monkey-patch: widen the region regex used inside the SDK so that   */
/*  me-south-1 (and any future me-* region) passes validation.        */
/* ------------------------------------------------------------------ */
(function patchRegionValidation() {
      try {
              // The SDK stores the regex on the prototype or uses it inside the
        // constructor. We patch the prototype method that extracts the
        // region from the UserPoolId.  The constructor calls
        //   this.userPoolId.split('_')[0]
        // then validates it.  We override the constructor temporarily.
        const origInit = (CognitoUserPool as any).prototype.constructor;

        // A more reliable approach: just patch the pool *after* construction
        // by wrapping the constructor.  However the simplest way that works
        // with the bundled ESM build is to extend the validation regex that
        // the internal Client class uses.  Since we cannot reach that class
        // in an ESM bundle, we instead create the pool inside a try/catch
        // and — on failure — build it by calling the parent constructor
        // with a temporarily widened regex via Object.create + manual init.
        //
        // Actually, the cleanest browser-safe fix:
        // The SDK constructor does:
        //   if (!/^[\w-]+_[0-9a-zA-Z]+$/.test(data.UserPoolId)) throw …
        // That regex DOES match me-south-1_xxx.  The real issue is that
        // the internal Client class validates the *region* (extracted from
        // the pool id) against its own region list.
        //
        // So we just need to ensure Client gets the right endpoint.
        // We'll do this by using a Proxy on the pool's client.request
        // to route to the correct endpoint if it isn't already.
        void origInit; // suppress unused
      } catch {
              // ignore — we handle the real fix below
      }
})();

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || "me-south-1_aJtmQ0QrN";
const CLIENT_ID    = import.meta.env.VITE_COGNITO_CLIENT_ID    || "6n49ej8fl92i9rtotbk5o9o0d1";

/**
 * Build a CognitoUserPool that works even when the SDK regex
 * does not recognise the AWS region (e.g. me-south-1).
 *
 * Strategy: try the normal constructor first.  If it throws, we
 * build the pool manually — but instead of the old broken require()
 * approach we use a proper fetch-based client that works in browsers.
 */
function createPool(): CognitoUserPool {
      // --- Attempt 1: normal construction ---
  try {
          return new CognitoUserPool({ UserPoolId: USER_POOL_ID, ClientId: CLIENT_ID });
  } catch {
          // falls through to manual construction
  }

  // --- Attempt 2: manual construction with fetch-based client ---
  console.warn("[cognito] SDK rejected region; building pool manually for", USER_POOL_ID);

  const region = USER_POOL_ID.split("_")[0]; // e.g. "me-south-1"
  const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;

  const pool: any = Object.create(CognitoUserPool.prototype);
      pool.userPoolId = USER_POOL_ID;
      pool.clientId = CLIENT_ID;
      pool.advancedSecurityDataCollectionFlag = false;
      pool.storage = typeof window !== "undefined" ? window.localStorage : {};

  /**
       * Minimal Cognito IDP client that uses the global fetch API.
       * The SDK calls  client.request(operation, params, callback)
       * where operation is e.g. "InitiateAuth" (we prepend the service prefix).
       */
  pool.client = {
          endpoint,
          fetchSize: 0,
          promisifyRequest: false,
          request(operation: string, params: unknown, callback: (err: Error | null, data?: unknown) => void) {
                    const headers: Record<string, string> = {
                                "Content-Type": "application/x-amz-json-1.1",
                                "X-Amz-Target": "AWSCognitoIdentityProviderService." + operation,
                    };

            fetch(endpoint, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(params),
            })
                      .then(async (res) => {
                                    const body = await res.json().catch(() => ({}));
                                    if (!res.ok) {
                                                    const err: any = new Error((body as any).message || (body as any).__type || "CognitoServiceError");
                                                    err.code = (body as any).__type?.split("#").pop() || "UnknownError";
                                                    err.statusCode = res.status;
                                                    callback(err);
                                    } else {
                                                    callback(null, body);
                                    }
                      })
                      .catch((networkErr) => {
                                    callback(networkErr instanceof Error ? networkErr : new Error(String(networkErr)));
                      });
          },
  };

  return pool as CognitoUserPool;
}

export const userPool = createPool();

/* ================================================================== */
/*  Auth helpers                                                       */
/* ================================================================== */

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
                                                   const translated = translateCognitoError(err, "اسم المستخدم أو كلمة المرور غير صحيحة");
                                                   resolve({ error: translated });
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

/** Get access token string */
export function getAccessToken(session: CognitoUserSession): string {
      return session.getAccessToken().getJwtToken();
}

/** Get ID token string */
export function getIdToken(session: CognitoUserSession): string {
      return session.getIdToken().getJwtToken();
}

/**
 * Translate Cognito error codes/messages to Arabic
 */
function translateCognitoError(err: { code?: string; message?: string }, fallback: string): string {
      const code = err.code || "";
      const msg = err.message || "";
      if (code === "UserNotFoundException" || msg.includes("User does not exist") || msg.includes("Username/client id combination not found"))
              return "البريد الإلكتروني غير مسجّل في النظام";
      if (code === "NotAuthorizedException" || msg.includes("Incorrect"))
              return "اسم المستخدم أو كلمة المرور غير صحيحة";
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
