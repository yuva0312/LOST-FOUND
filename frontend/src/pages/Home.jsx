import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        if (response.status === 200 && response.data?.success) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="hero-section">
      <div className="badge">
        <span className="badge-dot"></span>
        AI-Powered Smart Campus Recovery
      </div>
      
      <h1 className="hero-title">AI-Based Campus Lost & Found</h1>
      <p className="hero-subtitle">Find what you lost. Return what you found.</p>

      {/* Backend Connection Status */}
      <div style={{ margin: '1rem 0', fontWeight: '600', fontSize: '1rem' }}>
        {backendStatus === 'connected' && (
          <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            Backend Status: Connected
          </span>
        )}
        {backendStatus === 'disconnected' && (
          <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
            Backend Status: Disconnected
          </span>
        )}
        {backendStatus === null && (
          <span style={{ color: '#6b7280' }}>Checking backend status...</span>
        )}
      </div>

      <div className="hero-actions">
        <Link to="/dashboard" className="btn btn-main">
          Explore Dashboard
        </Link>
        <Link to="/login" className="btn btn-outline">
          Report an Item
        </Link>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3 className="feature-title">AI Image Recognition</h3>
          <p className="feature-desc">
            Instantly match found items using computer vision and deep feature extraction.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3 className="feature-title">Smart Campus Alerts</h3>
          <p className="feature-desc">
            Receive real-time notifications when an item matching your report is turned in.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3 className="feature-title">Verified Student Claims</h3>
          <p className="feature-desc">
            Secure claim verification process ensuring lost belongings return to rightful owners.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

