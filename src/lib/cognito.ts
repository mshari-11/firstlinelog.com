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
