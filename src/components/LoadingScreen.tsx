import { useEffect, useState } from 'react';
import '../styles/loading.css';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

export function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [glitchText, setGlitchText] = useState('CYBERSHARP');

  const loadingTasks = [
    'INITIALIZING NEURAL INTERFACE',
    'CONNECTING TO NIGHT CITY GRID',
    'LOADING WEAPON SYSTEMS',
    'ESTABLISHING NETRUNNER PROTOCOLS',
    'SYNCING CYBERNETIC ENHANCEMENTS',
    'CALIBRATING OPTICS',
    'LOADING STREET DATA',
    'ESTABLISHING SECURE CONNECTION',
    'READY TO JACK IN',
  ];

  useEffect(() => {
    const taskInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(taskInterval);
          setTimeout(onLoadComplete, 500);
          return 100;
        }
        return next;
      });
    }, 300);

    return () => clearInterval(taskInterval);
  }, [onLoadComplete]);

  useEffect(() => {
    const taskIndex = Math.floor((progress / 100) * loadingTasks.length);
    setCurrentTask(loadingTasks[Math.min(taskIndex, loadingTasks.length - 1)]);
  }, [progress]);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const glitchChars = 'CYBERSHARP'.split('');
        const randomIndex = Math.floor(Math.random() * glitchChars.length);
        glitchChars[randomIndex] = String.fromCharCode(33 + Math.floor(Math.random() * 94));
        setGlitchText(glitchChars.join(''));
        setTimeout(() => setGlitchText('CYBERSHARP'), 100);
      }
    }, 200);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-bg">
        <div className="grid-overlay"></div>
        <div className="scan-line"></div>
      </div>

      <div className="loading-content">
        <div className="logo-container">
          <div className="logo-glitch">
            <h1 className="logo-text">{glitchText}</h1>
            <h1 className="logo-text logo-text-shadow">{glitchText}</h1>
            <h1 className="logo-text logo-text-shadow2">{glitchText}</h1>
          </div>
          <div className="subtitle">PRIME EDITION</div>
          <div className="tagline">NEURAL INTERFACE v2.077</div>
        </div>

        <div className="loading-bar-container">
          <div className="loading-bar-outer">
            <div
              className="loading-bar-inner"
              style={{ width: `${progress}%` }}
            >
              <div className="loading-bar-glow"></div>
            </div>
            <div className="loading-bar-segments">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="segment"></div>
              ))}
            </div>
          </div>
          <div className="loading-percentage">{Math.floor(progress)}%</div>
        </div>

        <div className="loading-status">
          <div className="status-indicator">
            <span className="pulse-dot"></span>
            <span className="status-text">{currentTask}</span>
          </div>
        </div>

        <div className="loading-details">
          <div className="detail-line">
            <span className="detail-label">SYSTEM:</span>
            <span className="detail-value">WEBGPU RENDERER</span>
          </div>
          <div className="detail-line">
            <span className="detail-label">LOCATION:</span>
            <span className="detail-value">NIGHT CITY SECTOR 7</span>
          </div>
          <div className="detail-line">
            <span className="detail-label">STATUS:</span>
            <span className="detail-value status-online">ONLINE</span>
          </div>
        </div>

        <div className="corner-ornaments">
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
        </div>
      </div>

      <div className="loading-footer">
        <div className="warning-text">
          WARNING: UNAUTHORIZED ACCESS DETECTED - SECURITY PROTOCOLS ACTIVE
        </div>
      </div>
    </div>
  );
}
