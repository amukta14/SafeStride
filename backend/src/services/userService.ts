import { User, UserCredentials, BehaviorProfile, Session, FlagLog } from '../types';
import { BehaviorAnalysisService } from './behaviorAnalysis';

export class UserService {
  private static instance: UserService;
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private flagLogs: FlagLog[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private initializeMockData() {
    // Create mock users with behavior profiles
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'john_doe',
        email: 'john@example.com',
        behaviorProfile: {
          userId: '1',
          baselineTypingInterval: 240,
          baselineMouseActivity: 45,
          baselineScrollPattern: 8,
          anomalyThreshold: 30,
          lastUpdated: new Date()
        },
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date()
      },
      {
        id: '2',
        username: 'jane_smith',
        email: 'jane@example.com',
        behaviorProfile: {
          userId: '2',
          baselineTypingInterval: 280,
          baselineMouseActivity: 35,
          baselineScrollPattern: 12,
          anomalyThreshold: 25,
          lastUpdated: new Date()
        },
        createdAt: new Date('2024-01-02'),
        lastLogin: new Date()
      },
      {
        id: '3',
        username: 'admin',
        email: 'admin@safestride.com',
        behaviorProfile: {
          userId: '3',
          baselineTypingInterval: 200,
          baselineMouseActivity: 60,
          baselineScrollPattern: 15,
          anomalyThreshold: 20,
          lastUpdated: new Date()
        },
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date()
      }
    ];

    mockUsers.forEach(user => {
      this.users.set(user.username, user);
    });

    // Add some mock flag logs
    this.flagLogs = [
      {
        id: '1',
        sessionId: 'session-1',
        timestamp: new Date('2024-01-15T14:30:22Z'),
        type: 'typing',
        severity: 'low',
        description: 'Typing speed 20% faster than usual',
        action: 'Monitor',
        resolved: false
      },
      {
        id: '2',
        sessionId: 'session-2',
        timestamp: new Date('2024-01-15T14:25:15Z'),
        type: 'mouse',
        severity: 'medium',
        description: 'Unusual mouse movement pattern detected',
        action: 'Request re-authentication',
        resolved: true
      }
    ];
  }

  public authenticateUser(credentials: UserCredentials): User | null {
    const user = this.users.get(credentials.username);
    
    // For demo purposes, accept any username with any password
    // In a real application, you would verify against a database
    if (user) {
      user.lastLogin = new Date();
      return user;
    }

    // Create a new user if they don't exist (demo behavior)
    const newUser: User = {
      id: Date.now().toString(),
      username: credentials.username,
      email: `${credentials.username}@example.com`,
      behaviorProfile: {
        userId: Date.now().toString(),
        baselineTypingInterval: 250,
        baselineMouseActivity: 50,
        baselineScrollPattern: 10,
        anomalyThreshold: 30,
        lastUpdated: new Date()
      },
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.users.set(credentials.username, newUser);
    return newUser;
  }

  public getUserByUsername(username: string): User | null {
    return this.users.get(username) || null;
  }

  public createSession(userId: string): Session {
    const session: Session = {
      id: `session-${Date.now()}`,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      anomalyScore: 0
    };

    this.sessions.set(session.id, session);
    return session;
  }

  public getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  public updateSessionActivity(sessionId: string, anomalyScore: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.anomalyScore = anomalyScore;
    }
  }

  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  public getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  public addFlagLog(flagLog: Omit<FlagLog, 'id'>): FlagLog {
    const newFlagLog: FlagLog = {
      ...flagLog,
      id: Date.now().toString()
    };
    this.flagLogs.push(newFlagLog);
    return newFlagLog;
  }

  public getFlagLogs(sessionId?: string): FlagLog[] {
    if (sessionId) {
      return this.flagLogs.filter(log => log.sessionId === sessionId);
    }
    return this.flagLogs;
  }

  public resolveFlagLog(flagLogId: string): boolean {
    const flagLog = this.flagLogs.find(log => log.id === flagLogId);
    if (flagLog) {
      flagLog.resolved = true;
      return true;
    }
    return false;
  }

  public updateBehaviorProfile(
    userId: string,
    newMetrics: any,
    learningRate: number = 0.1
  ): BehaviorProfile | null {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    if (!user) return null;

    const behaviorService = BehaviorAnalysisService.getInstance();
    const updatedProfile = behaviorService.updateProfile(
      user.behaviorProfile,
      newMetrics,
      learningRate
    );

    user.behaviorProfile = updatedProfile;
    return updatedProfile;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  public deleteUser(userId: string): boolean {
    const userToDelete = Array.from(this.users.values()).find(u => u.id === userId);
    if (userToDelete) {
      this.users.delete(userToDelete.username);
      return true;
    }
    return false;
  }
} 