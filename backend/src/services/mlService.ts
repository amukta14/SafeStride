import { BehaviorMetrics, AnomalyAnalysis, BehaviorProfile } from '../types';

interface MLUserProfile {
  userId: string;
  typingIntervals: number[];
  mouseMovements: number[];
  scrollEvents: number[];
  baselineTypingInterval: number;
  baselineMouseActivity: number;
  baselineScrollPattern: number;
  lastUpdated: Date;
}

export class MLService {
  private static instance: MLService;
  private userProfiles: Map<string, MLUserProfile> = new Map();

  private constructor() {
    this.initializeMockProfiles();
  }

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  private initializeMockProfiles() {
    // Create mock user profiles with baseline data
    const mockProfiles: MLUserProfile[] = [
      {
        userId: '1',
        typingIntervals: Array.from({ length: 50 }, () => 240 + Math.random() * 60),
        mouseMovements: Array.from({ length: 50 }, () => 45 + Math.random() * 20),
        scrollEvents: Array.from({ length: 50 }, () => 8 + Math.random() * 8),
        baselineTypingInterval: 240,
        baselineMouseActivity: 45,
        baselineScrollPattern: 8,
        lastUpdated: new Date()
      },
      {
        userId: '2',
        typingIntervals: Array.from({ length: 50 }, () => 280 + Math.random() * 80),
        mouseMovements: Array.from({ length: 50 }, () => 35 + Math.random() * 15),
        scrollEvents: Array.from({ length: 50 }, () => 12 + Math.random() * 10),
        baselineTypingInterval: 280,
        baselineMouseActivity: 35,
        baselineScrollPattern: 12,
        lastUpdated: new Date()
      },
      {
        userId: '3',
        typingIntervals: Array.from({ length: 50 }, () => 200 + Math.random() * 40),
        mouseMovements: Array.from({ length: 50 }, () => 60 + Math.random() * 25),
        scrollEvents: Array.from({ length: 50 }, () => 15 + Math.random() * 12),
        baselineTypingInterval: 200,
        baselineMouseActivity: 60,
        baselineScrollPattern: 15,
        lastUpdated: new Date()
      }
    ];

    mockProfiles.forEach(profile => {
      this.userProfiles.set(profile.userId, profile);
    });
  }

  public analyzeBehavior(
    userId: string,
    behaviorMetrics: BehaviorMetrics
  ): AnomalyAnalysis {
    const profile = this.getOrCreateProfile(userId);
    
    // Update profile with new data
    this.updateProfile(profile, behaviorMetrics);
    
    // Calculate anomaly scores using statistical methods
    const typingScore = this.calculateTypingAnomaly(behaviorMetrics.avgTypingInterval, profile);
    const mouseScore = this.calculateMouseAnomaly(behaviorMetrics.mouseMovementCount, profile);
    const scrollScore = this.calculateScrollAnomaly(behaviorMetrics.scrollEventCount, profile);
    
    // Weighted overall score
    const overallScore = (typingScore * 0.4 + mouseScore * 0.3 + scrollScore * 0.3);
    
    // Determine recommendation
    let recommendation: 'pass' | 'reauthenticate' | 'lock';
    if (overallScore < 30) {
      recommendation = 'pass';
    } else if (overallScore < 70) {
      recommendation = 'reauthenticate';
    } else {
      recommendation = 'lock';
    }
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(profile);
    
    // Generate factors
    const factors: string[] = [];
    if (typingScore > 30) factors.push(`Typing anomaly: ${typingScore.toFixed(1)}%`);
    if (mouseScore > 30) factors.push(`Mouse activity anomaly: ${mouseScore.toFixed(1)}%`);
    if (scrollScore > 30) factors.push(`Scroll pattern anomaly: ${scrollScore.toFixed(1)}%`);
    
    return {
      score: Math.min(100, Math.max(0, overallScore)),
      confidence,
      factors,
      recommendation
    };
  }

  private getOrCreateProfile(userId: string): MLUserProfile {
    if (!this.userProfiles.has(userId)) {
      const newProfile: MLUserProfile = {
        userId,
        typingIntervals: [],
        mouseMovements: [],
        scrollEvents: [],
        baselineTypingInterval: 250,
        baselineMouseActivity: 50,
        baselineScrollPattern: 10,
        lastUpdated: new Date()
      };
      this.userProfiles.set(userId, newProfile);
    }
    return this.userProfiles.get(userId)!;
  }

  private updateProfile(profile: MLUserProfile, metrics: BehaviorMetrics) {
    // Add new data points
    profile.typingIntervals.push(metrics.avgTypingInterval);
    profile.mouseMovements.push(metrics.mouseMovementCount);
    profile.scrollEvents.push(metrics.scrollEventCount);
    
    // Keep only last 100 data points
    profile.typingIntervals = profile.typingIntervals.slice(-100);
    profile.mouseMovements = profile.mouseMovements.slice(-100);
    profile.scrollEvents = profile.scrollEvents.slice(-100);
    
    // Update baselines using exponential moving average
    const alpha = 0.1; // Learning rate
    profile.baselineTypingInterval = this.updateBaseline(
      profile.baselineTypingInterval,
      metrics.avgTypingInterval,
      alpha
    );
    profile.baselineMouseActivity = this.updateBaseline(
      profile.baselineMouseActivity,
      metrics.mouseMovementCount,
      alpha
    );
    profile.baselineScrollPattern = this.updateBaseline(
      profile.baselineScrollPattern,
      metrics.scrollEventCount,
      alpha
    );
    
    profile.lastUpdated = new Date();
  }

  private updateBaseline(current: number, newValue: number, alpha: number): number {
    return current * (1 - alpha) + newValue * alpha;
  }

  private calculateTypingAnomaly(currentInterval: number, profile: MLUserProfile): number {
    if (profile.typingIntervals.length < 5) return 0;
    
    const mean = profile.typingIntervals.reduce((a, b) => a + b, 0) / profile.typingIntervals.length;
    const std = Math.sqrt(
      profile.typingIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.typingIntervals.length
    );
    
    if (std === 0) return 0;
    
    const zScore = Math.abs(currentInterval - mean) / std;
    return Math.min(100, zScore * 20); // Scale z-score to 0-100
  }

  private calculateMouseAnomaly(currentMovements: number, profile: MLUserProfile): number {
    if (profile.mouseMovements.length < 5) return 0;
    
    const mean = profile.mouseMovements.reduce((a, b) => a + b, 0) / profile.mouseMovements.length;
    const std = Math.sqrt(
      profile.mouseMovements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.mouseMovements.length
    );
    
    if (std === 0) return 0;
    
    const zScore = Math.abs(currentMovements - mean) / std;
    return Math.min(100, zScore * 20);
  }

  private calculateScrollAnomaly(currentScrolls: number, profile: MLUserProfile): number {
    if (profile.scrollEvents.length < 5) return 0;
    
    const mean = profile.scrollEvents.reduce((a, b) => a + b, 0) / profile.scrollEvents.length;
    const std = Math.sqrt(
      profile.scrollEvents.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / profile.scrollEvents.length
    );
    
    if (std === 0) return 0;
    
    const zScore = Math.abs(currentScrolls - mean) / std;
    return Math.min(100, zScore * 20);
  }

  private calculateConfidence(profile: MLUserProfile): number {
    const dataPoints = Math.min(
      profile.typingIntervals.length,
      profile.mouseMovements.length,
      profile.scrollEvents.length
    );
    
    if (dataPoints < 5) return 0.3;
    if (dataPoints < 20) return 0.6;
    if (dataPoints < 50) return 0.8;
    return 0.95;
  }

  public getProfile(userId: string): MLUserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  public getAllProfiles(): MLUserProfile[] {
    return Array.from(this.userProfiles.values());
  }

  public deleteProfile(userId: string): boolean {
    return this.userProfiles.delete(userId);
  }
} 