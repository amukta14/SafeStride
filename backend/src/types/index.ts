export interface BehaviorMetrics {
  avgTypingInterval: number;
  mouseMovementCount: number;
  scrollEventCount: number;
  sessionDuration: number;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  behaviorProfile: BehaviorProfile;
  createdAt: Date;
  lastLogin: Date;
}

export interface BehaviorProfile {
  userId: string;
  baselineTypingInterval: number;
  baselineMouseActivity: number;
  baselineScrollPattern: number;
  anomalyThreshold: number;
  lastUpdated: Date;
}

export interface AnomalyAnalysis {
  score: number;
  confidence: number;
  factors: string[];
  recommendation: 'pass' | 'reauthenticate' | 'lock';
}

export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  anomalyScore: number;
}

export interface FlagLog {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: 'typing' | 'mouse' | 'scroll' | 'session';
  severity: 'low' | 'medium' | 'high';
  description: string;
  action: string;
  resolved: boolean;
} 