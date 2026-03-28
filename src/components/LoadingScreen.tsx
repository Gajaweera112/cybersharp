import { useEffect, useState, useRef } from 'react';
import '../styles/loading.css';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const TASKS = [
  'BOOTING NEURAL INTERFACE...',
  'CALIBRATING OPTICAL IMPLANTS...',
  'LOADING CITY SECTOR DATA...',
  'ESTABLISHING NETRUNNER LINK...',
  'SYNCING CYBERNETIC ENHANCEMENTS...',
  'LOADING WEAPON MATRICES...',
  'PATCHING ARASAKA FIREWALL...',
  'CONNECTING TO NIGHT CITY GRID...',
  'JACK IN SEQUENCE COMPLETE.',
];

export function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(TASKS[0]);
  const [log, setLog] = useState<string[]>([]);
  const [glitchActive, setGlitchActive] = useState(false);
  const [time, setTime] = useState('');
  const completedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 12 + 3;
        const next = Math.min(prev + increment, 100);

        const taskIndex = Math.min(
          Math.floor((next / 100) * TASKS.length),
          TASKS.length - 1
        );
        const task = TASKS[taskIndex];

        setCurrentTask(task);
        setLog((prevLog) => {
          const last = prevLog[prevLog.length - 1];
          if (last !== task) return [...prevLog.slice(-3), task];
          return prevLog;
        });

        if (next >= 100 && !completedRef.current) {
          completedRef.current = true;
          clearInterval(interval);
          setTimeout(onLoadComplete, 600);
        }

        return next;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [onLoadComplete]);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.72) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 120);
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ls-root">
      <div className="ls-scanline" />
      <div className="ls-grid" />

      <div className="ls-top-label">NIGHT CITY · 2077</div>

      <div className="ls-center">
        <div className={`ls-title-wrap${glitchActive ? ' ls-glitch' : ''}`}>
          <h1 className="ls-title" data-text="CYBERSHARP">CYBERSHARP</h1>
        </div>
        <div className="ls-subtitle">PRIME EDITION</div>
        <div className="ls-tagline">v1.0.0 &nbsp;|&nbsp; ARASAKA BUILD &nbsp;|&nbsp; CLASS-S SYSTEM</div>
        <div className="ls-dots">
          <span className="ls-dot" />
          <span className="ls-dot ls-dot-active" />
          <span className="ls-dot" />
        </div>
      </div>

      <div className="ls-bottom">
        <div className="ls-status-line">
          <span className="ls-prompt">&gt;</span>
          <span className="ls-status-text">{currentTask}</span>
        </div>

        <div className="ls-bar-row">
          <div className="ls-bar-track">
            <div className="ls-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="ls-pct">{Math.floor(progress)}%</span>
        </div>

        <div className="ls-log">
          {log.slice(0, -1).map((entry, i) => (
            <div key={i} className="ls-log-line">
              <span className="ls-prompt">&gt;</span>
              {entry}
            </div>
          ))}
        </div>
      </div>

      <div className="ls-footer">
        <span className="ls-footer-left">SYS://CYBERSHARP.PRIME/BOOT</span>
        <span className="ls-footer-center">{time}</span>
        <span className="ls-footer-right">NIGHT CITY NEURAL NET v4.2</span>
      </div>

      <div className="ls-corner ls-tl" />
      <div className="ls-corner ls-tr" />
      <div className="ls-corner ls-bl" />
      <div className="ls-corner ls-br" />
    </div>
  );
}
