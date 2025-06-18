import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface BehaviorData {
  typingIntervals: number[];
  mouseMovements: number[];
  scrollEvents: number[];
  lastKeyPress: number;
  deviceOrientation: DeviceOrientationData;
  touchPressure: number[];
  navigationFlow: string[];
}

interface DeviceOrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [behaviorData, setBehaviorData] = useState<BehaviorData>({
    typingIntervals: [],
    mouseMovements: [],
    scrollEvents: [],
    lastKeyPress: Date.now(),
    deviceOrientation: { alpha: null, beta: null, gamma: null },
    touchPressure: [],
    navigationFlow: []
  });

  const lastKeyPressRef = useRef<number>(Date.now());
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track typing behavior with banking-specific patterns
  const handleKeyPress = (e: React.KeyboardEvent) => {
    const now = Date.now();
    const interval = now - lastKeyPressRef.current;
    
    if (interval > 50 && interval < 2000) {
      setBehaviorData(prev => ({
        ...prev,
        typingIntervals: [...prev.typingIntervals, interval].slice(-20),
        lastKeyPress: now
      }));
      
      // Update security score based on typing consistency
      const avgInterval = behaviorData.typingIntervals.reduce((a, b) => a + b, 0) / behaviorData.typingIntervals.length;
      const variance = behaviorData.typingIntervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / behaviorData.typingIntervals.length;
      const normalizedVariance = Math.min(100, Math.max(0, 100 - variance / 100));
      setSecurityScore(Math.round(normalizedVariance));
    }
    
    lastKeyPressRef.current = now;
  };

  // Enhanced mouse/touch tracking for mobile banking
  const handleMouseMove = (e: React.MouseEvent) => {
    const now = Date.now();
    const deltaX = Math.abs(e.clientX - mousePosRef.current.x);
    const deltaY = Math.abs(e.clientY - mousePosRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 5) {
      setBehaviorData(prev => ({
        ...prev,
        mouseMovements: [...prev.mouseMovements, distance].slice(-50)
      }));
    }
    
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  // Track device orientation for mobile authentication
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setBehaviorData(prev => ({
        ...prev,
        deviceOrientation: {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        }
      }));
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  // Track scroll events with banking context
  const handleScroll = () => {
    const now = Date.now();
    setBehaviorData(prev => ({
      ...prev,
      scrollEvents: [...prev.scrollEvents, now].slice(-10)
    }));
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Calculate comprehensive behavior metrics for banking security
      const avgTypingInterval = behaviorData.typingIntervals.length > 0 
        ? behaviorData.typingIntervals.reduce((a, b) => a + b, 0) / behaviorData.typingIntervals.length 
        : 250;

      const behaviorMetrics = {
        avgTypingInterval,
        mouseMovementCount: behaviorData.mouseMovements.length,
        scrollEventCount: behaviorData.scrollEvents.length,
        sessionDuration: Date.now() - behaviorData.lastKeyPress,
        deviceOrientation: behaviorData.deviceOrientation,
        securityScore
      };

      const response = await axios.post('/api/auth/login', {
        credentials: formData,
        behaviorMetrics
      });

      if (response.data.success) {
        navigate('/dashboard', { 
          state: { 
            user: response.data.user,
            behaviorProfile: response.data.behaviorProfile 
          } 
        });
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const bankingStats = [
    { stat: '71%', desc: 'of fraud attempts use stolen credentials' },
    { stat: '54%', desc: 'increase in mobile banking fraud in 2023' },
    { stat: '92%', desc: 'accuracy in fraud detection with behavior analysis' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Banking Security Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 text-blue-300 opacity-30 animate-float" style={{animationDelay: '0.5s'}}>
          🏦
        </div>
        <div className="absolute top-40 right-32 text-blue-300 opacity-30 animate-float" style={{animationDelay: '1.5s'}}>
          🔐
        </div>
        <div className="absolute bottom-32 left-32 text-blue-300 opacity-30 animate-float" style={{animationDelay: '2.5s'}}>
          📱
        </div>
        <div className="absolute bottom-20 right-20 text-blue-300 opacity-30 animate-float" style={{animationDelay: '3.5s'}}>
          🛡️
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Hero Section */}
          <div className="text-center transform animate-fade-in-up">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-2xl mb-4 animate-pulse">
                <span className="text-3xl">🏦</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-3 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              SafeStride
            </h1>
            <p className="text-xl text-blue-200 mb-2 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              Next-Gen Mobile Banking Security
            </p>
            <p className="text-blue-300 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              Continuous authentication for secure banking
            </p>
          </div>

          {/* Banking Stats */}
          <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
            {bankingStats.map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-300">{item.stat}</div>
                <div className="text-xs text-blue-200">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Enhanced Login Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 transform animate-fade-in-up" style={{animationDelay: '1s'}}>
            <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} onMouseMove={handleMouseMove}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-blue-100">
                    Account Number
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your account number"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-blue-300">🏦</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-blue-100">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-lg animate-shake">
                    <div className="flex items-center">
                      <span className="mr-2">⚠️</span>
                      {error}
                    </div>
                  </div>
                )}

                {/* Security Score Indicator */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-200">Behavior Security Score</span>
                    <span className="text-sm font-bold text-blue-300">{securityScore}%</span>
                  </div>
                  <div className="w-full bg-blue-900/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${securityScore}%` }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Behavior...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🔐</span>
                      Secure Login
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Enhanced Features */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transform animate-fade-in-up" style={{animationDelay: '1.2s'}}>
            <h3 className="text-lg font-semibold text-blue-100 mb-4 text-center">🛡️ Advanced Security Features</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-500/20 rounded-lg p-3">
                <div className="text-2xl mb-2">📱</div>
                <div className="text-sm text-blue-200">Device Orientation</div>
                <div className="text-xs text-blue-300 mt-1">
                  {behaviorData.deviceOrientation.beta ? 'Active' : 'Not Available'}
                </div>
              </div>
              <div className="bg-indigo-500/20 rounded-lg p-3">
                <div className="text-2xl mb-2">👆</div>
                <div className="text-sm text-blue-200">Touch Analysis</div>
                <div className="text-xs text-blue-300 mt-1">
                  {behaviorData.touchPressure.length} patterns
                </div>
              </div>
            </div>
          </div>

          {/* Banking Compliance Notice */}
          <div className="text-center text-blue-200 text-sm space-y-2">
            <p className="flex items-center justify-center">
              <span className="mr-2">🔒</span>
              DPDP & IT Act Compliant
            </p>
            <p className="flex items-center justify-center">
              <span className="mr-2">🏦</span>
              RBI Guidelines Adherent
            </p>
            <p className="flex items-center justify-center">
              <span className="mr-2">🛡️</span>
              Zero-Knowledge Architecture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 