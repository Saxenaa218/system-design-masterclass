import React, { useState, useEffect, useRef } from 'react';
import { Zap, Play, Square, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const [refillRate, setRefillRate] = useState<number>(2);
  const [tokens, setTokens] = useState<number>(10);

  const [leakyQueue, setLeakyQueue] = useState<number[]>([]);
  const [windowLogs, setWindowLogs] = useState<number[]>([]);
  const [fixedCount, setFixedCount] = useState<number>(0);

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
        reason = `Token consumed. ${Math.floor(tokens - 1)} left in bucket.`;
      } else {
        allowed = false;
        reason = 'No tokens in bucket (429 Rate limited).';
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
      const windowCutoff = now - 5000;
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
      <div className="workbench-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'token-bucket', label: 'Token Bucket' },
            { id: 'leaky-bucket', label: 'Leaky Bucket' },
            { id: 'fixed-window', label: 'Fixed Window' },
            { id: 'sliding-window-log', label: 'Sliding Window Log' },
            { id: 'sliding-window-counter', label: 'Sliding Window Counter' },
          ].map(algo => (
            <button
              key={algo.id}
              onClick={() => { setAlgorithm(algo.id as AlgorithmType); setTokens(capacity); }}
              className={`btn ${algorithm === algo.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '7px 14px' }}
            >
              {algo.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Capacity: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{capacity}</strong>
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
            style={{ width: '90px' }}
          />

          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Refill (R/s): <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{refillRate}</strong>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={refillRate}
            onChange={(e) => setRefillRate(Number(e.target.value))}
            style={{ width: '90px' }}
          />
        </div>
      </div>

      {/* Interactive Stage & Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 390px) 1fr', gap: '20px' }}>
        {/* Visual Animated Bucket Stage */}
        <div className="workbench-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <span className="badge badge-cyan" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '12px' }}>
            Live Bucket Chamber
          </span>

          <div
            style={{
              width: '190px',
              height: '240px',
              border: '3px solid var(--border-glass)',
              borderTop: 'none',
              borderRadius: '0 0 20px 20px',
              marginTop: '42px',
              position: 'relative',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column-reverse',
              padding: '12px',
              gap: '6px',
              overflow: 'hidden'
            }}
          >
            {algorithm === 'token-bucket' && (
              <>
                {Array.from({ length: Math.floor(tokens) }).map((_, i) => (
                  <div
                    key={`token-${i}`}
                    style={{
                      height: '14px',
                      background: 'linear-gradient(90deg, var(--signal-cyan), var(--signal-cyan-light))',
                      borderRadius: '4px'
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
                      background: 'linear-gradient(90deg, var(--signal-emerald), var(--signal-emerald-light))',
                      borderRadius: '4px'
                    }}
                  />
                ))}
              </>
            )}

            {algorithm !== 'token-bucket' && algorithm !== 'leaky-bucket' && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {fixedCount} / {capacity}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Requests in window
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {algorithm === 'token-bucket' && `${Math.floor(tokens)} / ${capacity} Tokens`}
              {algorithm === 'leaky-bucket' && `${leakyQueue.length} / ${capacity} In Queue`}
              {algorithm.includes('window') && `${fixedCount} / ${capacity} Window Load`}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Refills automatically at +{refillRate} tokens/second
            </div>
          </div>
        </div>

        {/* Action Controls & Live Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Trigger Buttons */}
          <div className="workbench-panel" style={{ padding: '18px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleFireRequest} style={{ fontSize: '13.5px' }}>
              <Zap size={16} /> Fire 1 Request
            </button>
            <button className="btn btn-secondary" onClick={() => handleBurst(5)} style={{ fontSize: '13.5px' }}>
              Burst (5 Reqs)
            </button>
            <button className="btn btn-secondary" onClick={() => handleBurst(12)} style={{ fontSize: '13.5px' }}>
              Flood Attack (12 Reqs)
            </button>
            <button
              className={`btn ${isAutoStreaming ? 'btn-rose' : 'btn-cyan'}`}
              onClick={toggleAutoStream}
              style={{ fontSize: '13.5px' }}
            >
              {isAutoStreaming ? <Square size={16} /> : <Play size={16} />}
              {isAutoStreaming ? 'Stop Traffic Stream' : 'Continuous Stream (10 req/s)'}
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div className="workbench-panel" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Requests</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalReqs}</div>
            </div>
            <div className="workbench-panel" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--signal-emerald-light)' }}>200 OK Passed</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--signal-emerald)', fontFamily: 'var(--font-mono)' }}>{totalPassed}</div>
            </div>
            <div className="workbench-panel" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--signal-rose)' }}>429 Throttled</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--signal-rose)', fontFamily: 'var(--font-mono)' }}>{totalDropped}</div>
            </div>
            <div className="workbench-panel" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--signal-cyan-light)' }}>Pass Rate</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--signal-cyan)', fontFamily: 'var(--font-mono)' }}>{passRate}%</div>
            </div>
          </div>

          {/* Live Stream Logs */}
          <div className="workbench-panel" style={{ padding: '18px 20px', flex: 1, maxHeight: '210px', overflowY: 'auto' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--signal-cyan)" /> Incoming Request Packet Stream
            </div>
            {logs.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Click 'Fire 1 Request' or 'Flood Attack' to inspect the rate limiter in action...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {logs.map(l => (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: l.allowed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                      borderLeft: `3px solid ${l.allowed ? 'var(--signal-emerald)' : 'var(--signal-rose)'}`,
                      padding: '8px 12px',
                      borderRadius: '0 4px 4px 0',
                      fontSize: '12.5px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {l.allowed ? (
                        <CheckCircle2 size={15} color="var(--signal-emerald)" />
                      ) : (
                        <AlertCircle size={15} color="var(--signal-rose)" />
                      )}
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {l.allowed ? '200 OK' : '429 THROTTLED'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{l.reason}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>{l.time}</span>
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
