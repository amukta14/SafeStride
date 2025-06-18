import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface BehaviorMetrics {
  typingPatterns: number[];
  deviceOrientation: number[];
  touchPressure: number[];
  locationTrends: { lat: number; lng: number; timestamp: number }[];
  riskScore: number;
  anomalyCount: number;
  sessionDuration: number;
  transactionAttempts: number;
}

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<BehaviorMetrics>({
    typingPatterns: [],
    deviceOrientation: [],
    touchPressure: [],
    locationTrends: [],
    riskScore: 0,
    anomalyCount: 0,
    sessionDuration: 0,
    transactionAttempts: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('/api/metrics', {
          params: { timeframe: selectedTimeframe }
        });
        setMetrics(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Handle unauthorized access
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchMetrics();
    // Polling for real-time updates
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeframe, navigate]);

  const riskLevelData = [
    { name: 'Low Risk', value: 100 - metrics.riskScore },
    { name: 'High Risk', value: metrics.riskScore }
  ];

  const anomalyData = [
    { name: 'Unusual Location', count: 3 },
    { name: 'Abnormal Typing', count: 2 },
    { name: 'Device Change', count: 1 },
    { name: 'Time Anomaly', count: 1 }
  ];

  const securityMetrics = [
    {
      title: "Risk Score",
      value: `${metrics.riskScore}%`,
      trend: "↓ 5%",
      status: metrics.riskScore < 30 ? "success" : metrics.riskScore < 70 ? "warning" : "danger"
    },
    {
      title: "Anomalies Detected",
      value: metrics.anomalyCount,
      trend: "↑ 2",
      status: metrics.anomalyCount < 3 ? "success" : "warning"
    },
    {
      title: "Session Duration",
      value: `${Math.round(metrics.sessionDuration / 60)} min`,
      trend: "→",
      status: "info"
    },
    {
      title: "Transaction Attempts",
      value: metrics.transactionAttempts,
      trend: "↑ 1",
      status: metrics.transactionAttempts < 5 ? "success" : "warning"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Banking Security Dashboard</h1>
            <p className="text-blue-300">Real-time behavioral authentication monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={() => navigate('/login')}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Score Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Security Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              {securityMetrics.map((metric, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-blue-300">{metric.title}</div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className={`text-sm ${
                      metric.trend.startsWith('↑') ? 'text-green-400' :
                      metric.trend.startsWith('↓') ? 'text-red-400' :
                      'text-blue-400'
                    }`}>
                      {metric.trend}
                    </div>
                  </div>
                  <div className={`mt-2 h-1 rounded-full ${
                    metric.status === 'success' ? 'bg-green-500' :
                    metric.status === 'warning' ? 'bg-yellow-500' :
                    metric.status === 'danger' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Risk Analysis</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskLevelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-sm text-blue-300">Risk Level</div>
                <div className="text-2xl font-bold">
                  {metrics.riskScore < 30 ? 'Low' :
                   metrics.riskScore < 70 ? 'Medium' : 'High'}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-sm text-blue-300">Next Assessment</div>
                <div className="text-2xl font-bold">5m</div>
              </div>
            </div>
          </div>

          {/* Anomaly Detection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Anomaly Detection</h2>
              <button
                onClick={() => setShowAnomalyDetails(!showAnomalyDetails)}
                className="text-blue-300 hover:text-blue-200"
              >
                {showAnomalyDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anomalyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                  <Bar dataKey="count" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {showAnomalyDetails && (
              <div className="mt-4 space-y-2">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-300">⚠️ Unusual Location</span>
                    <span className="text-sm text-blue-300">2 min ago</span>
                  </div>
                  <p className="text-sm text-blue-200 mt-1">Login attempt from new location (Mumbai, IN)</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-300">⚠️ Abnormal Typing Pattern</span>
                    <span className="text-sm text-blue-300">15 min ago</span>
                  </div>
                  <p className="text-sm text-blue-200 mt-1">Significant deviation from usual typing behavior</p>
                </div>
              </div>
            )}
          </div>

          {/* Behavior Trends */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Behavior Trends</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.typingPatterns.map((value, index) => ({ time: index, value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Banking Security Features */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold">Multi-Factor Security</h3>
                <p className="text-sm text-blue-300">Behavior + Device + Location</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <span className="text-2xl">🏦</span>
              </div>
              <div>
                <h3 className="font-semibold">RBI Compliant</h3>
                <p className="text-sm text-blue-300">Meets all banking standards</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <h3 className="font-semibold">Fraud Prevention</h3>
                <p className="text-sm text-blue-300">AI-powered anomaly detection</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Footer */}
        <div className="mt-8 text-center text-sm text-blue-300">
          <p>SafeStride Banking Security System v1.0</p>
          <p className="mt-1">Compliant with RBI Guidelines, DPDP Act, and IT Act regulations</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 