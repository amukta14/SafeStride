from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Global variables for ML models
models = {}
scalers = {}
user_profiles = {}

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            contamination=0.1,  # Expected proportion of anomalies
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def train(self, data):
        """Train the anomaly detection model"""
        if len(data) < 10:
            return False  # Need at least 10 samples
            
        # Convert to numpy array and reshape
        X = np.array(data).reshape(-1, 1)
        
        # Scale the data
        X_scaled = self.scaler.fit_transform(X)
        
        # Train the model
        self.model.fit(X_scaled)
        self.is_trained = True
        return True
        
    def predict(self, data):
        """Predict anomaly score for new data"""
        if not self.is_trained:
            return 0.5  # Default score if not trained
            
        X = np.array(data).reshape(-1, 1)
        X_scaled = self.scaler.transform(X)
        
        # Get anomaly scores (lower = more anomalous)
        scores = self.model.score_samples(X_scaled)
        
        # Convert to 0-100 scale where higher = more anomalous
        normalized_scores = 100 * (1 - (scores - scores.min()) / (scores.max() - scores.min() + 1e-8))
        return float(normalized_scores[0])

def create_user_profile(user_id):
    """Create a new user profile with default behavior patterns"""
    profile = {
        'user_id': user_id,
        'typing_detector': AnomalyDetector(),
        'mouse_detector': AnomalyDetector(),
        'scroll_detector': AnomalyDetector(),
        'baseline_data': {
            'typing_intervals': [],
            'mouse_movements': [],
            'scroll_events': []
        },
        'created_at': datetime.now().isoformat(),
        'last_updated': datetime.now().isoformat()
    }
    user_profiles[user_id] = profile
    return profile

def get_or_create_profile(user_id):
    """Get existing profile or create new one"""
    if user_id not in user_profiles:
        return create_user_profile(user_id)
    return user_profiles[user_id]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'SafeStride ML Service',
        'timestamp': datetime.now().isoformat(),
        'active_users': len(user_profiles)
    })

@app.route('/analyze', methods=['POST'])
def analyze_behavior():
    """Analyze behavior and return anomaly scores"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        behavior_data = data.get('behavior_data', {})
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
            
        # Get or create user profile
        profile = get_or_create_profile(user_id)
        
        # Extract behavior metrics
        typing_interval = behavior_data.get('avgTypingInterval', 250)
        mouse_movements = behavior_data.get('mouseMovementCount', 0)
        scroll_events = behavior_data.get('scrollEventCount', 0)
        
        # Update baseline data
        profile['baseline_data']['typing_intervals'].append(typing_interval)
        profile['baseline_data']['mouse_movements'].append(mouse_movements)
        profile['baseline_data']['scroll_events'].append(scroll_events)
        
        # Keep only last 100 samples
        profile['baseline_data']['typing_intervals'] = profile['baseline_data']['typing_intervals'][-100:]
        profile['baseline_data']['mouse_movements'] = profile['baseline_data']['mouse_movements'][-100:]
        profile['baseline_data']['scroll_events'] = profile['baseline_data']['scroll_events'][-100:]
        
        # Train models if we have enough data
        if len(profile['baseline_data']['typing_intervals']) >= 10:
            profile['typing_detector'].train(profile['baseline_data']['typing_intervals'])
            
        if len(profile['baseline_data']['mouse_movements']) >= 10:
            profile['mouse_detector'].train(profile['baseline_data']['mouse_movements'])
            
        if len(profile['baseline_data']['scroll_events']) >= 10:
            profile['scroll_detector'].train(profile['baseline_data']['scroll_events'])
        
        # Get anomaly scores
        typing_score = profile['typing_detector'].predict([typing_interval])
        mouse_score = profile['mouse_detector'].predict([mouse_movements])
        scroll_score = profile['scroll_detector'].predict([scroll_events])
        
        # Calculate weighted overall score
        overall_score = (typing_score * 0.4 + mouse_score * 0.3 + scroll_score * 0.3)
        
        # Determine recommendation
        if overall_score < 30:
            recommendation = 'pass'
        elif overall_score < 70:
            recommendation = 'reauthenticate'
        else:
            recommendation = 'lock'
        
        # Update profile timestamp
        profile['last_updated'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'analysis': {
                'overall_score': round(overall_score, 2),
                'typing_score': round(typing_score, 2),
                'mouse_score': round(mouse_score, 2),
                'scroll_score': round(scroll_score, 2),
                'recommendation': recommendation,
                'confidence': 0.85 if len(profile['baseline_data']['typing_intervals']) >= 20 else 0.6,
                'factors': [
                    f"Typing anomaly: {round(typing_score, 1)}%" if typing_score > 30 else None,
                    f"Mouse activity anomaly: {round(mouse_score, 1)}%" if mouse_score > 30 else None,
                    f"Scroll pattern anomaly: {round(scroll_score, 1)}%" if scroll_score > 30 else None
                ]
            },
            'profile': {
                'user_id': profile['user_id'],
                'data_points': len(profile['baseline_data']['typing_intervals']),
                'last_updated': profile['last_updated']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    """Get user behavior profile"""
    if user_id not in user_profiles:
        return jsonify({'error': 'User profile not found'}), 404
        
    profile = user_profiles[user_id]
    
    return jsonify({
        'success': True,
        'profile': {
            'user_id': profile['user_id'],
            'created_at': profile['created_at'],
            'last_updated': profile['last_updated'],
            'data_points': len(profile['baseline_data']['typing_intervals']),
            'baseline_stats': {
                'typing_intervals': {
                    'mean': np.mean(profile['baseline_data']['typing_intervals']) if profile['baseline_data']['typing_intervals'] else 0,
                    'std': np.std(profile['baseline_data']['typing_intervals']) if profile['baseline_data']['typing_intervals'] else 0,
                    'count': len(profile['baseline_data']['typing_intervals'])
                },
                'mouse_movements': {
                    'mean': np.mean(profile['baseline_data']['mouse_movements']) if profile['baseline_data']['mouse_movements'] else 0,
                    'std': np.std(profile['baseline_data']['mouse_movements']) if profile['baseline_data']['mouse_movements'] else 0,
                    'count': len(profile['baseline_data']['mouse_movements'])
                },
                'scroll_events': {
                    'mean': np.mean(profile['baseline_data']['scroll_events']) if profile['baseline_data']['scroll_events'] else 0,
                    'std': np.std(profile['baseline_data']['scroll_events']) if profile['baseline_data']['scroll_events'] else 0,
                    'count': len(profile['baseline_data']['scroll_events'])
                }
            }
        }
    })

@app.route('/profile/<user_id>', methods=['DELETE'])
def delete_profile(user_id):
    """Delete user behavior profile"""
    if user_id in user_profiles:
        del user_profiles[user_id]
        return jsonify({'success': True, 'message': 'Profile deleted'})
    else:
        return jsonify({'error': 'User profile not found'}), 404

@app.route('/users', methods=['GET'])
def list_users():
    """List all user profiles"""
    return jsonify({
        'success': True,
        'users': [
            {
                'user_id': profile['user_id'],
                'created_at': profile['created_at'],
                'last_updated': profile['last_updated'],
                'data_points': len(profile['baseline_data']['typing_intervals'])
            }
            for profile in user_profiles.values()
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 