import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { BehaviorAnalysisService } from '../services/behaviorAnalysis';
import { BehaviorMetrics } from '../types';

const router = Router();
const userService = UserService.getInstance();
const behaviorService = BehaviorAnalysisService.getInstance();

// Analyze behavior in real-time
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { userId, behaviorMetrics, sessionId }: {
      userId: string;
      behaviorMetrics: BehaviorMetrics;
      sessionId?: string;
    } = req.body;

    if (!userId || !behaviorMetrics) {
      return res.status(400).json({
        success: false,
        message: 'User ID and behavior metrics are required'
      });
    }

    // Get user and their behavior profile
    const users = userService.getAllUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Analyze behavior
    const analysis = behaviorService.analyzeBehavior(behaviorMetrics, user.behaviorProfile);

    // Update session if provided
    if (sessionId) {
      userService.updateSessionActivity(sessionId, analysis.score);
    }

    // Add flag log if anomaly detected
    if (analysis.score > 30) {
      const severity = analysis.score > 70 ? 'high' : analysis.score > 50 ? 'medium' : 'low';
      const action = analysis.recommendation === 'lock' ? 'Session locked' :
                    analysis.recommendation === 'reauthenticate' ? 'Request re-authentication' :
                    'Monitor';

      userService.addFlagLog({
        sessionId: sessionId || 'unknown',
        timestamp: new Date(),
        type: 'session',
        severity,
        description: `Real-time anomaly: ${analysis.score.toFixed(1)} - ${analysis.factors.join(', ')}`,
        action,
        resolved: false
      });
    }

    // Update user's behavior profile
    userService.updateBehaviorProfile(user.id, behaviorMetrics);

    res.json({
      success: true,
      analysis: {
        score: analysis.score,
        confidence: analysis.confidence,
        factors: analysis.factors,
        recommendation: analysis.recommendation
      },
      updatedProfile: user.behaviorProfile
    });

  } catch (error) {
    console.error('Behavior analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get flag logs
router.get('/flags', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    const flagLogs = userService.getFlagLogs(sessionId as string);

    res.json({
      success: true,
      flagLogs: flagLogs.map(log => ({
        id: log.id,
        sessionId: log.sessionId,
        timestamp: log.timestamp,
        type: log.type,
        severity: log.severity,
        description: log.description,
        action: log.action,
        resolved: log.resolved
      }))
    });

  } catch (error) {
    console.error('Get flag logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resolve flag log
router.post('/flags/:flagId/resolve', (req: Request, res: Response) => {
  try {
    const { flagId } = req.params;
    const resolved = userService.resolveFlagLog(flagId);

    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: 'Flag log not found'
      });
    }

    res.json({
      success: true,
      message: 'Flag log resolved successfully'
    });

  } catch (error) {
    console.error('Resolve flag log error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get behavior statistics
router.get('/stats/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const users = userService.getAllUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const sessions = userService.getActiveSessions();
    const userSessions = sessions.filter(s => s.userId === userId);
    const flagLogs = userService.getFlagLogs().filter(log => 
      userSessions.some(s => s.id === log.sessionId)
    );

    const stats = {
      totalSessions: userSessions.length,
      activeSessions: userSessions.filter(s => s.isActive).length,
      averageAnomalyScore: userSessions.length > 0 
        ? userSessions.reduce((sum, s) => sum + s.anomalyScore, 0) / userSessions.length 
        : 0,
      totalFlags: flagLogs.length,
      resolvedFlags: flagLogs.filter(f => f.resolved).length,
      behaviorProfile: user.behaviorProfile
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update behavior profile manually
router.put('/profile/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { baselineTypingInterval, baselineMouseActivity, baselineScrollPattern, anomalyThreshold } = req.body;

    const users = userService.getAllUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile with new values
    if (baselineTypingInterval !== undefined) {
      user.behaviorProfile.baselineTypingInterval = baselineTypingInterval;
    }
    if (baselineMouseActivity !== undefined) {
      user.behaviorProfile.baselineMouseActivity = baselineMouseActivity;
    }
    if (baselineScrollPattern !== undefined) {
      user.behaviorProfile.baselineScrollPattern = baselineScrollPattern;
    }
    if (anomalyThreshold !== undefined) {
      user.behaviorProfile.anomalyThreshold = anomalyThreshold;
    }

    user.behaviorProfile.lastUpdated = new Date();

    res.json({
      success: true,
      behaviorProfile: user.behaviorProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as behaviorRoutes }; 