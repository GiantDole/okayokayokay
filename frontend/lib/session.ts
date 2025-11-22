/**
 * Anonymous session management
 * Each browser gets a unique session ID stored in localStorage
 */

const SESSION_KEY = 'x402_session_id';

/**
 * Get or create anonymous session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate temporary ID (will be replaced on client)
    return `temp_${Math.random().toString(36).substring(2, 15)}`;
  }

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Clear session (for testing/logout)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
