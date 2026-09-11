import React, { useState, useEffect, useRef } from 'react';
import { Zap, Play, Square, Activity, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

type AlgorithmType = 'token-bucket' | 'leaky-bucket' | 'fixed-window' | 'sliding-window-log' | 'sliding-window-counter';

interface RequestLog {
  id: string;
  time: string;
  allowed: boolean;
  algorithm: string;
  reason: string;
}

export const RateLimiterVisualizer: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('token-bucket');
  const [capacity, setCapacity] = useState<number>(10);
  const [refillRate, setRefillRate] = useState<number>(2); // tokens per sec
  const [tokens, setTokens] = useState<number>(10);

  // Leaky bucket queue
  const [leakyQueue, setLeakyQueue] = useState<number[]>([]);

  // Sliding window log timestamps (ms)
  const [windowLogs, setWindowLogs] = useState<number[]>([]);

  // Fixed window
  const [fixedCount, setFixedCount] = useState<number>(0);
  const [windowStart, setWindowStart] = useState<number>(Date.now());

  // Metrics
  const [totalPassed, setTotalPassed] = useState<number>(0);
  const [totalDropped, setTotalDropped] = useState<number>(0);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(false);

  const autoStreamTimer = useRef<number | null>(null);

  // Token Bucket Refill Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setTokens(prev => Math.min(capacity, prev + (refillRate / 5)));
    }, 200);
    return () => clearInterval(timer);
  }, [capacity, refillRate]);

  // Leaky Bucket Leak Loop
  useEffect(() => {
    const leakTimer = setInterval(() => {
      setLeakyQueue(prev => (prev.length > 0 ? prev.slice(1) : prev));
    }, 1000 / refillRate);
    return () => clearInterval(leakTimer);
  }, [refillRate]);

  // Fixed Window 10-second Reset Loop
  useEffect(() => {
    const fixTimer = setInterval(() => {
      setFixedCount(0);
      setWindowStart(Date.now());
    }, 10000);
    return () => clearInterval(fixTimer);
  }, []);

  const handleFireRequest = () => {
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString();
    let allowed = false;
    let reason = '';

    if (algorithm === 'token-bucket') {
      if (tokens >= 1) {
        setTokens(prev => prev - 1);
        allowed = true;
        reason = `Token consumed. ${Math.floor(tokens - 1)} left.`;
      } else {
        allowed = false;
        reason = 'No tokens in bucket. Rate limited!';
      }
    } else if (algorithm === 'leaky-bucket') {
      if (leakyQueue.length < capacity) {
        setLeakyQueue(prev => [...prev, now]);
        allowed = true;
        reason = `Queued at slot #${leakyQueue.length + 1}. Leaking at ${refillRate}/sec.`;
      } else {
        allowed = false;
        reason = 'Leaky queue buffer overflow (429 Drop).';
      }
    } else if (algorithm === 'fixed-window') {
      if (fixedCount < capacity) {
        setFixedCount(prev => prev + 1);
        allowed = true;
        reason = `Slot ${fixedCount + 1}/${capacity} in current 10s window.`;
      } else {
        allowed = false;
        reason = 'Window limit reached. Wait for window boundary reset.';
      }
    } else if (algorithm === 'sliding-window-log') {
      const windowCutoff = now - 5000; // 5s sliding window
      const validLogs = windowLogs.filter(t => t > windowCutoff);
      if (validLogs.length < capacity) {
        setWindowLogs([...validLogs, now]);
        allowed = true;
        reason = `${validLogs.length + 1}/${capacity} logs in last 5.0s.`;
      } else {
        setWindowLogs(validLogs);
        allowed = false;
        reason = 'Exceeded log density in 5.0s window.';
      }
    } else if (algorithm === 'sliding-window-counter') {
      // Approximation using 70% previous weight + current
      const currentEstimate = fixedCount * 0.8 + 1;
      if (currentEstimate <= capacity) {
        setFixedCount(prev => prev + 1);
        allowed = true;
        reason = `Weighted estimate: ${currentEstimate.toFixed(1)} / ${capacity}.`;
      } else {
        allowed = false;
        reason = 'Sliding counter limit exceeded.';
      }
    }

    if (allowed) {
      setTotalPassed(p => p + 1);
    } else {
      setTotalDropped(d => d + 1);
    }

    const logItem: RequestLog = {
      id: `req-${Date.now()}-${Math.random()}`,
      time: timeStr,
      allowed,
      algorithm,
      reason
    };

    setLogs(prev => [logItem, ...prev.slice(0, 19)]);
  };

  const handleBurst = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => handleFireRequest(), i * 40);
    }
  };

  const toggleAutoStream = () => {
    if (isAutoStreaming) {
      if (autoStreamTimer.current) clearInterval(autoStreamTimer.current);
      setIsAutoStreaming(false);
    } else {
      setIsAutoStreaming(true);
      autoStreamTimer.current = window.setInterval(() => {
        handleFireRequest();
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (autoStreamTimer.current) clearInterval(autoStreamTimer.current);
    };
  }, []);

  const totalReqs = totalPassed + totalDropped;
  const passRate = totalReqs > 0 ? Math.round((totalPassed / totalReqs) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Algorithm Selector Bar */}
      <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'token-bucket', label: 'Token Bucket (AWS/Stripe)' },
            { id: 'leaky-bucket', label: 'Leaky Bucket (FIFO Egress)' },
            { id: 'fixed-window', label: 'Fixed Window Counter' },
            { id: 'sliding-window-log', label: 'Sliding Window Log (Exact)' },
            { id: 'sliding-window-counter', label: 'Sliding Window Counter' },
          ].map(algo => (
            <button
              key={algo.id}
              onClick={() => { setAlgorithm(algo.id as AlgorithmType); setTokens(capacity); }}
              className={`btn ${algorithm === algo.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {algo.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Capacity (C): <strong>{capacity}</strong>
          </div>
          <input
            type="range"
            min="3"
            max="20"
            value={capacity}
            onChange={(e) => {
              setCapacity(Number(e.target.value));
              setTokens(Number(e.target.value));
            }}
            style={{ width: '80px' }}
          />

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Refill (R/s): <strong>{refillRate}</strong>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={refillRate}
            onChange={(e) => setRefillRate(Number(e.target.value))}
            style={{ width: '80px' }}
          />
        </div>
      </div>

      {/* Interactive Stage & Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '20px' }}>
        {/* Visual Animated Bucket Stage */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <span className="badge badge-cyan" style={{ position: 'absolute', top: '15px', left: '15px' }}>
            Live Bucket Chamber
          </span>

          <div
            style={{
              width: '180px',
              height: '240px',
              border: '3px solid rgba(255, 255, 255, 0.15)',
              borderTop: 'none',
              borderRadius: '0 0 24px 24px',
              marginTop: '40px',
              position: 'relative',
              background: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              flexDirection: 'column-reverse',
              padding: '10px',
              gap: '6px',
              overflow: 'hidden'
            }}
          >
            {algorithm === 'token-bucket' && (
              <>
                {/* Visual Tokens in Chamber */}
                {Array.from({ length: Math.floor(tokens) }).map((_, i) => (
                  <div
                    key={`token-${i}`}
                    style={{
                      height: '14px',
                      background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                      borderRadius: '8px',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
                      animation: 'pulseGlow 2s infinite'
                    }}
                  />
                ))}
              </>
            )}

            {algorithm === 'leaky-bucket' && (
              <>
                {leakyQueue.map((_, i) => (
                  <div
                    key={`leak-${i}`}
                    style={{
                      height: '14px',
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                      borderRadius: '8px'
                    }}
                  />
                ))}
              </>
            )}

            {algorithm !== 'token-bucket' && algorithm !== 'leaky-bucket' && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>
                  {fixedCount} / {capacity}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Requests in window
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              {algorithm === 'token-bucket' && `${Math.floor(tokens)} / ${capacity} Tokens`}
              {algorithm === 'leaky-bucket' && `${leakyQueue.length} / ${capacity} In Queue`}
              {algorithm.includes('window') && `${fixedCount} / ${capacity} Window Load`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Refills automatically at +{refillRate} tokens/second
            </div>
          </div>
        </div>

        {/* Action Controls & Live Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Trigger Buttons */}
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleFireRequest}>
              <Zap size={16} /> Fire 1 Request
            </button>
            <button className="btn btn-secondary" onClick={() => handleBurst(5)}>
              💥 Fire Burst (5 Reqs)
            </button>
            <button className="btn btn-secondary" onClick={() => handleBurst(12)}>
              ⚡ Flood Attack (12 Reqs)
            </button>
            <button
              className={`btn ${isAutoStreaming ? 'btn-rose' : 'btn-cyan'}`}
              onClick={toggleAutoStream}
            >
              {isAutoStreaming ? <Square size={16} /> : <Play size={16} />}
              {isAutoStreaming ? 'Stop Traffic Stream' : 'Continuous Stream (10 req/s)'}
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Requests</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{totalReqs}</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-emerald-light)' }}>200 OK Passed</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-emerald)' }}>{totalPassed}</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-rose)' }}>429 Throttled</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-rose)' }}>{totalDropped}</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-cyan-light)' }}>Pass Rate</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{passRate}%</div>
            </div>
          </div>

          {/* Live Stream Logs */}
          <div className="glass-panel" style={{ padding: '16px 20px', flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} /> Incoming Request Packet Stream
            </div>
            {logs.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Click 'Fire 1 Request' or 'Flood Attack' to inspect the rate limiter in action...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {logs.map(l => (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: l.allowed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                      borderLeft: `3px solid ${l.allowed ? '#10b981' : '#f43f5e'}`,
                      padding: '6px 10px',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {l.allowed ? (
                        <CheckCircle2 size={13} color="#10b981" />
                      ) : (
                        <AlertCircle size={13} color="#f43f5e" />
                      )}
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        {l.allowed ? '200 OK' : '429 TOO MANY REQUESTS'}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{l.reason}</span>
                    </div>
                    <span style={{ color: 'var(--text-dim)' }}>{l.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
