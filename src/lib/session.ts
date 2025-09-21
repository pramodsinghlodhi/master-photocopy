import { UserPayload } from './auth';

// In-memory session store (use Redis or database in production)
interface Session {
  id: string;
  userId: string;
  email: string;
  role?: string;
  name?: string;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a new session
   */
  createSession(sessionId: string, user: UserPayload): Session {
    const now = new Date();
    const session: Session = {
      id: sessionId,
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: now,
      lastAccessed: now,
      expiresAt: new Date(now.getTime() + this.SESSION_DURATION)
    };

    this.sessions.set(sessionId, session);
    this.cleanExpiredSessions();
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessed = new Date();
    return session;
  }

  /**
   * Update session with new user data
   */
  updateSession(sessionId: string, userData: Partial<UserPayload>): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    // Update session data
    if (userData.email) session.email = userData.email;
    if (userData.role) session.role = userData.role;
    if (userData.name) session.name = userData.name;
    
    session.lastAccessed = new Date();
    return true;
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Extend session expiration
   */
  extendSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    session.expiresAt = new Date(Date.now() + this.SESSION_DURATION);
    session.lastAccessed = new Date();
    return true;
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const userSessions: Session[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.expiresAt > new Date()) {
        userSessions.push(session);
      }
    }
    
    return userSessions;
  }

  /**
   * Clean up expired sessions
   */
  private cleanExpiredSessions(): void {
    const now = new Date();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    this.cleanExpiredSessions();
    return this.sessions.size;
  }

  /**
   * Get active session count for a user
   */
  getUserSessionCount(userId: string): number {
    return this.getUserSessions(userId).length;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Clean up expired sessions every 30 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    const beforeCount = sessionManager.getSessionCount();
    // The cleanup happens automatically in getSessionCount()
    console.log(`Session cleanup completed. Active sessions: ${sessionManager.getSessionCount()}`);
  }, 30 * 60 * 1000);
}