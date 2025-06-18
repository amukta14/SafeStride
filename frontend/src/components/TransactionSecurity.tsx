import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TransactionDetails {
  amount: number;
  recipient: string;
  type: 'transfer' | 'payment' | 'bill';
  timestamp: number;
}

interface BehaviorScore {
  typing: number;
  device: number;
  location: number;
  overall: number;
}

const TransactionSecurity: React.FC = () => {
  const [transaction, setTransaction] = useState<TransactionDetails>({
    amount: 0,
    recipient: '',
    type: 'transfer',
    timestamp: Date.now()
  });

  const [behaviorScore, setBehaviorScore] = useState<BehaviorScore>({
    typing: 0,
    device: 0,
    location: 0,
    overall: 0
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'verification' | 'confirmation'>('details');
  const [error, setError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState({
    isKnown: false,
    lastUsed: '',
    riskLevel: 'unknown'
  });

  useEffect(() => {
    // Check device trust score
    const checkDevice = async () => {
      try {
        const response = await axios.get('/api/security/device-check');
        setDeviceInfo(response.data);
      } catch (err) {
        console.error('Device check failed:', err);
      }
    };

    checkDevice();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTransaction(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const updateBehaviorScore = async () => {
    try {
      const response = await axios.post('/api/security/behavior-score', {
        transactionDetails: transaction
      });
      setBehaviorScore(response.data);
    } catch (err) {
      console.error('Failed to update behavior score:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, get final behavior score
      await updateBehaviorScore();

      // Proceed based on risk level
      if (behaviorScore.overall < 70) {
        setError('Additional verification required due to unusual behavior patterns');
        setStep('verification');
        return;
      }

      // Submit transaction with behavior data
      const response = await axios.post('/api/transactions/submit', {
        transaction,
        behaviorMetrics: behaviorScore
      });

      if (response.data.success) {
        setStep('confirmation');
      } else {
        setError(response.data.message || 'Transaction failed');
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Secure Transaction</h1>
          <p className="text-blue-300">Protected by behavioral authentication</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8">
          {['details', 'verification', 'confirmation'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === s ? 'bg-blue-500' : 
                index < ['details', 'verification', 'confirmation'].indexOf(step) ? 'bg-green-500' : 
                'bg-white/20'
              }`}>
                {index + 1}
              </div>
              {index < 2 && (
                <div className={`h-1 w-16 mx-2 ${
                  index < ['details', 'verification', 'confirmation'].indexOf(step) ? 'bg-green-500' : 'bg-white/20'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Transaction Details Form */}
        {step === 'details' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Transaction Type
                </label>
                <select
                  name="type"
                  value={transaction.type}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-blue-200"
                  required
                >
                  <option value="transfer">Bank Transfer</option>
                  <option value="payment">Payment</option>
                  <option value="bill">Bill Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={transaction.amount}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-blue-200"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Recipient
                </label>
                <input
                  type="text"
                  name="recipient"
                  value={transaction.recipient}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-blue-200"
                  placeholder="Enter recipient details"
                  required
                />
              </div>

              {/* Security Score */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Security Assessment</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Typing Pattern Match</span>
                      <span>{behaviorScore.typing}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${behaviorScore.typing}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Device Trust Score</span>
                      <span>{behaviorScore.device}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${behaviorScore.device}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Location Verification</span>
                      <span>{behaviorScore.location}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${behaviorScore.location}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Overall Security Score</span>
                    <span className={`font-bold ${
                      behaviorScore.overall >= 80 ? 'text-green-400' :
                      behaviorScore.overall >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {behaviorScore.overall}%
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Processing...
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Additional Verification */}
        {step === 'verification' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold mb-2">Additional Verification Required</h2>
              <p className="text-blue-300">
                Due to unusual behavior patterns, we need additional verification
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Why is this happening?</h3>
                <ul className="text-sm text-blue-200 space-y-2">
                  <li>• Transaction amount higher than usual</li>
                  <li>• New recipient detected</li>
                  <li>• Behavior pattern deviation detected</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Verification Options</h3>
                <div className="space-y-3">
                  <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-left transition-colors">
                    📱 Use Mobile App Authentication
                  </button>
                  <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-left transition-colors">
                    📨 Send OTP via SMS
                  </button>
                  <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-left transition-colors">
                    📧 Send Email Verification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {step === 'confirmation' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Transaction Successful</h2>
            <p className="text-blue-300 mb-6">
              Your transaction has been processed securely
            </p>

            <div className="bg-white/5 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p className="text-blue-300">Amount</p>
                  <p className="font-bold">${transaction.amount}</p>
                </div>
                <div className="text-left">
                  <p className="text-blue-300">Recipient</p>
                  <p className="font-bold">{transaction.recipient}</p>
                </div>
                <div className="text-left">
                  <p className="text-blue-300">Security Score</p>
                  <p className="font-bold text-green-400">{behaviorScore.overall}%</p>
                </div>
                <div className="text-left">
                  <p className="text-blue-300">Transaction ID</p>
                  <p className="font-bold">{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('details')}
              className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              New Transaction
            </button>
          </div>
        )}

        {/* Device Trust Info */}
        <div className="mt-8 bg-white/5 rounded-xl p-4 text-sm text-blue-200">
          <div className="flex items-center space-x-2">
            <span>🔒</span>
            <span>
              {deviceInfo.isKnown
                ? `Trusted device - Last used ${deviceInfo.lastUsed}`
                : 'New device detected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSecurity; 