import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, CheckSquare, Square, FileText, Sparkles, ShieldAlert } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const InterviewWhiteboardModal: React.FC<Props> = ({ onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({});
  const [notes, setNotes] = useState<string>('## Functional Requirements:\n1. \n\n## Non-Functional Requirements:\n- Latency: < 100ms\n- Scale: 50M DAU\n- Availability: 99.99%\n\n## Back-of-the-Envelope:\n- QPS: \n- Storage: ');

  useEffect(() => {
    let interval: number | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = window.setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const toggleStep = (stepKey: string) => {
    setCompletedSteps(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const STEPS = [
    {
      id: 'step1',
      title: 'Step 1: Understand the Problem & Scope (3-5 min)',
      items: [
        'Ask clarifying questions (Who are users? Mobile or Web?)',
        'Define 3 core Functional Requirements',
        'Define Non-Functional targets (Latency, Availability, Consistency)',
        'Perform Back-of-the-Envelope estimation (DAU, QPS, 5-yr Storage, Cache)'
      ]
    },
    {
      id: 'step2',
      title: 'Step 2: Propose High-Level Design (10-15 min)',
      items: [
        'Define 2-3 Core API Signatures (REST/gRPC endpoints)',
        'Draw high-level block diagram (Client -> LB -> App -> DB/Cache)',
        'Define Database Schema (Tables, Primary Keys, Indexes)',
        'Get interviewer alignment before deep diving'
      ]
    },
    {
      id: 'step3',
      title: 'Step 3: Design Deep Dive (15-20 min)',
      items: [
        'Identify top 2 bottlenecks with interviewer',
        'Deep dive on Concurrency / Locking / Quorum / Rate Limiting',
        'Detail Caching Strategy (Cache-Aside, TTL, Eviction)',
        'Detail Database Sharding / Replication / Failover'
      ]
    },
    {
      id: 'step4',
      title: 'Step 4: Wrap-Up & Failures (3-5 min)',
      items: [
        'Identify single points of failure (SPOF) and disaster recovery',
        'Discuss telemetry, metrics, and alerting (SLIs/SLOs)',
        'Summarize key engineering trade-offs made'
      ]
    }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div className="glass-panel" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-glow)' }}>
        {/* Header & Timer Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--accent-indigo)" />
              System Design 45-Minute Interview Sandbox
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Practice the structured 4-step framework with a live interview timer and interactive rubric.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <Clock size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: secondsLeft < 300 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                {timeStr}
              </span>
            </div>

            <button className="btn btn-secondary" onClick={() => setIsRunning(!isRunning)} style={{ padding: '8px 12px' }}>
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button className="btn btn-secondary" onClick={() => { setIsRunning(false); setSecondsLeft(45 * 60); }} style={{ padding: '8px 12px' }}>
              <RotateCcw size={16} />
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', marginLeft: '10px' }}>
              ✕
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Checklist & Scratchpad */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* 4-Step Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {STEPS.map((step) => (
              <div key={step.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--accent-indigo-light)', marginBottom: '8px' }}>
                  {step.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {step.items.map((item, i) => {
                    const key = `${step.id}-${i}`;
                    const done = !!completedSteps[key];
                    return (
                      <div
                        key={key}
                        onClick={() => toggleStep(key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: done ? 'var(--text-dim)' : 'var(--text-secondary)', cursor: 'pointer', textDecoration: done ? 'line-through' : 'none' }}
                      >
                        {done ? <CheckSquare size={14} color="var(--accent-emerald)" /> : <Square size={14} color="var(--text-muted)" />}
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Candidate Scratchpad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              <FileText size={16} color="var(--accent-cyan)" /> Live Candidate Notes Scratchpad
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                flex: 1,
                minHeight: '340px',
                background: '#080c14',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
