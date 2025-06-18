import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { authRoutes } from './routes/auth';
import { behaviorRoutes } from './routes/behavior';
import { MLService } from './services/mlService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/behavior', behaviorRoutes);

// ML Service endpoints
app.post('/api/ml/analyze', (req, res) => {
  try {
    const { userId, behaviorData } = req.body;
    
    if (!userId || !behaviorData) {
      return res.status(400).json({
        success: false,
        message: 'User ID and behavior data are required'
      });
    }

    const mlService = MLService.getInstance();
    const analysis = mlService.analyzeBehavior(userId, behaviorData);

    res.json({
      success: true,
      analysis: {
        overall_score: analysis.score,
        typing_score: analysis.factors.find(f => f.includes('Typing')) ? 
          parseFloat(analysis.factors.find(f => f.includes('Typing'))!.split(':')[1].split('%')[0]) : 0,
        mouse_score: analysis.factors.find(f => f.includes('Mouse')) ? 
          parseFloat(analysis.factors.find(f => f.includes('Mouse'))!.split(':')[1].split('%')[0]) : 0,
        scroll_score: analysis.factors.find(f => f.includes('Scroll')) ? 
          parseFloat(analysis.factors.find(f => f.includes('Scroll'))!.split(':')[1].split('%')[0]) : 0,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        factors: analysis.factors
      }
    });

  } catch (error) {
    console.error('ML analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/ml/profile/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const mlService = MLService.getInstance();
    const profile = mlService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      profile: {
        user_id: profile.userId,
        data_points: profile.typingIntervals.length,
        last_updated: profile.lastUpdated,
        baseline_stats: {
          typing_intervals: {
            mean: profile.typingIntervals.length > 0 ? 
              profile.typingIntervals.reduce((a, b) => a + b, 0) / profile.typingIntervals.length : 0,
            count: profile.typingIntervals.length
          },
          mouse_movements: {
            mean: profile.mouseMovements.length > 0 ? 
              profile.mouseMovements.reduce((a, b) => a + b, 0) / profile.mouseMovements.length : 0,
            count: profile.mouseMovements.length
          },
          scroll_events: {
            mean: profile.scrollEvents.length > 0 ? 
              profile.scrollEvents.reduce((a, b) => a + b, 0) / profile.scrollEvents.length : 0,
            count: profile.scrollEvents.length
          }
        }
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

app.get('/api/ml/users', (req, res) => {
  try {
    const mlService = MLService.getInstance();
    const profiles = mlService.getAllProfiles();

    res.json({
      success: true,
      users: profiles.map(profile => ({
        user_id: profile.userId,
        data_points: profile.typingIntervals.length,
        last_updated: profile.lastUpdated
      }))
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SafeStride Backend is running',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'running',
      behavior: 'running',
      ml: 'running'
    }
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../public')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SafeStride running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
}); 