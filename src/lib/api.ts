/**
 * Shared API configuration
 * All API calls should use these constants instead of hardcoding URLs
 */

export const API_BASE = import.meta.env.VITE_API_BASE || "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com";
export const AUTH_API_BASE = `${API_BASE}/auth`;
export const CHAT_API_URL = `${API_BASE}/ai/chat`;
