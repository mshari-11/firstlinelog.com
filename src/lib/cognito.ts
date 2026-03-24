/**
 * Cognito Authentication Module
 * Replaces Supabase auth with AWS Cognito
 * Supports EMAIL_OTP MFA via Lambda API
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { API_BASE } from "@/lib/api";

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

if (!USER_POOL_ID || !CLIENT_ID) {
  throw new Error("VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID must be set in environment variables");
}

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
        resolve({ session });
      },
      onFailure: (err) => {
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
 * Sign out current user
 */
export function cognitoSignOut(): void {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}

// ─── Cognito MFA via Lambda API ─────────────────────────────────────────────

export interface MfaChallengeResult {
  challenge: string;
  session: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  user: { email: string; name: string; groups: string[]; sub: string };
}

/**
 * Login via Lambda API (supports EMAIL_OTP MFA challenge)
 */
export async function loginViaApi(
  email: string,
  password: string
): Promise<{ tokens?: AuthTokens; mfaChallenge?: MfaChallengeResult; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { error: data.message || "فشل تسجيل الدخول" };
    }

    if (data.challenge) {
      return {
        mfaChallenge: {
          challenge: data.challenge,
          session: data.session,
          message: data.message,
        },
      };
    }

    return {
      tokens: {
        accessToken: data.token,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    };
  } catch {
    return { error: "تعذر الاتصال بالخادم" };
  }
}

/**
 * Respond to MFA challenge via Lambda API
 */
export async function respondMfaViaApi(
  email: string,
  session: string,
  code: string,
  challenge = "EMAIL_OTP"
): Promise<{ tokens?: AuthTokens; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/respond-mfa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, session, code, challenge }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.token) {
      return { error: data.message || "رمز التحقق غير صحيح" };
    }

    return {
      tokens: {
        accessToken: data.token,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        user: data.user,
      },
    };
  } catch {
    return { error: "تعذر الاتصال بالخادم" };
  }
}

/**
 * Store tokens in localStorage so getCognitoSession() picks them up
 */
export function setSessionFromTokens(username: string, tokens: AuthTokens): void {
  const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}`;
  localStorage.setItem(`${prefix}.${username}.idToken`, tokens.idToken);
  localStorage.setItem(`${prefix}.${username}.accessToken`, tokens.accessToken);
  localStorage.setItem(`${prefix}.${username}.refreshToken`, tokens.refreshToken);
  localStorage.setItem(`${prefix}.${username}.clockDrift`, "0");
  localStorage.setItem(`${prefix}.LastAuthUser`, username);
}
