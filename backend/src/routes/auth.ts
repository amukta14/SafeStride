import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { BehaviorAnalysisService } from '../services/behaviorAnalysis';
import { UserCredentials, BehaviorMetrics } from '../types';

const router = Router();
const userService = UserService.getInstance();
const behaviorService = BehaviorAnalysisService.getInstance();

// Login endpoint with behavior analysis
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { credentials, behaviorMetrics }: {
      credentials: UserCredentials;
      behaviorMetrics: BehaviorMetrics;
    } = req.body;

    if (!credentials || !credentials.username || !credentials.password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Authenticate user
    const user = userService.authenticateUser(credentials);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Analyze behavior
    const analysis = behaviorService.analyzeBehavior(behaviorMetrics, user.behaviorProfile);

    // Create session
    const session = userService.createSession(user.id);

    // Update session with anomaly score
    userService.updateSessionActivity(session.id, analysis.score);

    // Add flag log if anomaly detected
    if (analysis.score > 30) {
      const severity = analysis.score > 70 ? 'high' : analysis.score > 50 ? 'medium' : 'low';
      const action = analysis.recommendation === 'lock' ? 'Session locked' :
                    analysis.recommendation === 'reauthenticate' ? 'Request re-authentication' :
                    'Monitor';

      userService.addFlagLog({
        sessionId: session.id,
        timestamp: new Date(),
        type: 'session',
        severity,
        description: `Anomaly score: ${analysis.score.toFixed(1)} - ${analysis.factors.join(', ')}`,
        action,
        resolved: false
      });
    }

    // Update user's behavior profile with new data
    userService.updateBehaviorProfile(user.id, behaviorMetrics);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      session: {
        id: session.id,
        startTime: session.startTime,
        anomalyScore: analysis.score
      },
      behaviorProfile: user.behaviorProfile,
      analysis: {
        score: analysis.score,
        confidence: analysis.confidence,
        factors: analysis.factors,
        recommendation: analysis.recommendation
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      userService.endSession(sessionId);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile/:username', (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = userService.getUserByUsername(username);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        behaviorProfile: user.behaviorProfile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get active sessions
router.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessions = userService.getActiveSessions();

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        anomalyScore: session.anomalyScore
      }))
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export { router as authRoutes }; 