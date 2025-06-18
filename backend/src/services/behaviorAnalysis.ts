import { BehaviorMetrics, AnomalyAnalysis, BehaviorProfile } from '../types';

export class BehaviorAnalysisService {
  private static instance: BehaviorAnalysisService;

  private constructor() {}

  public static getInstance(): BehaviorAnalysisService {
    if (!BehaviorAnalysisService.instance) {
      BehaviorAnalysisService.instance = new BehaviorAnalysisService();
    }
    return BehaviorAnalysisService.instance;
  }

  /**
   * Analyze behavior metrics and return anomaly score
   */
  public analyzeBehavior(
    currentMetrics: BehaviorMetrics,
    userProfile: BehaviorProfile
  ): AnomalyAnalysis {
    const factors: string[] = [];
    let totalScore = 0;
    let confidence = 0.8;

    // Analyze typing behavior
    const typingDeviation = this.analyzeTypingBehavior(
      currentMetrics.avgTypingInterval,
      userProfile.baselineTypingInterval
    );
    if (typingDeviation.score > 0) {
      factors.push(`Typing speed deviation: ${typingDeviation.score.toFixed(1)}%`);
      totalScore += typingDeviation.score * 0.4; // 40% weight
    }

    // Analyze mouse activity
    const mouseDeviation = this.analyzeMouseBehavior(
      currentMetrics.mouseMovementCount,
      userProfile.baselineMouseActivity
    );
    if (mouseDeviation.score > 0) {
      factors.push(`Mouse activity deviation: ${mouseDeviation.score.toFixed(1)}%`);
      totalScore += mouseDeviation.score * 0.3; // 30% weight
    }

    // Analyze scroll behavior
    const scrollDeviation = this.analyzeScrollBehavior(
      currentMetrics.scrollEventCount,
      userProfile.baselineScrollPattern
    );
    if (scrollDeviation.score > 0) {
      factors.push(`Scroll pattern deviation: ${scrollDeviation.score.toFixed(1)}%`);
      totalScore += scrollDeviation.score * 0.2; // 20% weight
    }

    // Analyze session duration
    const sessionDeviation = this.analyzeSessionBehavior(
      currentMetrics.sessionDuration
    );
    if (sessionDeviation.score > 0) {
      factors.push(`Session duration anomaly: ${sessionDeviation.score.toFixed(1)}%`);
      totalScore += sessionDeviation.score * 0.1; // 10% weight
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.min(100, Math.max(0, totalScore));

    // Determine recommendation based on score
    let recommendation: 'pass' | 'reauthenticate' | 'lock';
    if (normalizedScore < 30) {
      recommendation = 'pass';
    } else if (normalizedScore < 70) {
      recommendation = 'reauthenticate';
    } else {
      recommendation = 'lock';
    }

    // Adjust confidence based on data quality
    if (currentMetrics.avgTypingInterval === 0) {
      confidence *= 0.7; // Lower confidence if no typing data
    }
    if (currentMetrics.mouseMovementCount === 0) {
      confidence *= 0.8; // Lower confidence if no mouse data
    }

    return {
      score: normalizedScore,
      confidence: Math.max(0.5, confidence),
      factors,
      recommendation
    };
  }

  private analyzeTypingBehavior(
    currentInterval: number,
    baselineInterval: number
  ): { score: number } {
    if (baselineInterval === 0) return { score: 0 };

    const deviation = Math.abs(currentInterval - baselineInterval) / baselineInterval;
    const score = Math.min(100, deviation * 100);
    
    return { score };
  }

  private analyzeMouseBehavior(
    currentActivity: number,
    baselineActivity: number
  ): { score: number } {
    if (baselineActivity === 0) return { score: 0 };

    const deviation = Math.abs(currentActivity - baselineActivity) / baselineActivity;
    const score = Math.min(100, deviation * 100);
    
    return { score };
  }

  private analyzeScrollBehavior(
    currentScrolls: number,
    baselineScrolls: number
  ): { score: number } {
    if (baselineScrolls === 0) return { score: 0 };

    const deviation = Math.abs(currentScrolls - baselineScrolls) / baselineScrolls;
    const score = Math.min(100, deviation * 100);
    
    return { score };
  }

  private analyzeSessionBehavior(sessionDuration: number): { score: number } {
    // Simple heuristic: very short sessions might be suspicious
    const suspiciousThreshold = 5000; // 5 seconds
    if (sessionDuration < suspiciousThreshold) {
      return { score: 30 };
    }
    return { score: 0 };
  }

  /**
   * Create a baseline behavior profile for a new user
   */
  public createBaselineProfile(initialMetrics: BehaviorMetrics): BehaviorProfile {
    return {
      userId: 'temp',
      baselineTypingInterval: initialMetrics.avgTypingInterval || 250,
      baselineMouseActivity: initialMetrics.mouseMovementCount || 50,
      baselineScrollPattern: initialMetrics.scrollEventCount || 5,
      anomalyThreshold: 30,
      lastUpdated: new Date()
    };
  }

  /**
   * Update existing behavior profile with new data
   */
  public updateProfile(
    currentProfile: BehaviorProfile,
    newMetrics: BehaviorMetrics,
    learningRate: number = 0.1
  ): BehaviorProfile {
    return {
      ...currentProfile,
      baselineTypingInterval: this.updateBaseline(
        currentProfile.baselineTypingInterval,
        newMetrics.avgTypingInterval,
        learningRate
      ),
      baselineMouseActivity: this.updateBaseline(
        currentProfile.baselineMouseActivity,
        newMetrics.mouseMovementCount,
        learningRate
      ),
      baselineScrollPattern: this.updateBaseline(
        currentProfile.baselineScrollPattern,
        newMetrics.scrollEventCount,
        learningRate
      ),
      lastUpdated: new Date()
    };
  }

  private updateBaseline(
    currentBaseline: number,
    newValue: number,
    learningRate: number
  ): number {
    return currentBaseline * (1 - learningRate) + newValue * learningRate;
  }
} 