import React, { useState } from 'react';
import { Send, Users, Zap, Database, Layers, CheckCircle } from 'lucide-react';

interface PostEvent {
  author: string;
  isCelebrity: boolean;
  content: string;
  followersCount: number;
  time: string;
}

export const NewsfeedFanoutVisualizer: React.FC = () => {
  const [model, setModel] = useState<'push' | 'pull' | 'hybrid'>('hybrid');
  const [authorType, setAuthorType] = useState<'regular' | 'celebrity'>('regular');
  const [followerCount, setFollowerCount] = useState<number>(150);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [fanoutProgress, setFanoutProgress] = useState<number>(0);
  const [feedLogs, setFeedLogs] = useState<string[]>([]);

  const handlePublish = () => {
    setIsPublishing(true);
    setFanoutProgress(0);
    const isCeleb = authorType === 'celebrity';
    const count = isCeleb ? 50_000_000 : followerCount;

    if (model === 'push' || (model === 'hybrid' && !isCeleb)) {
      // Fanout on Write (Push to all follower timelines in Redis)
      let current = 0;
      const interval = setInterval(() => {
        current += 20;
        setFanoutProgress(current);
        if (current >= 100) {
          clearInterval(interval);
          setIsPublishing(false);
          setFeedLogs(prev => [
            `✅ [Fanout-on-Write] Post pushed into ${count.toLocaleString()} Redis follower timelines in 12ms. Feed reads will be O(1) instant!`,
            ...prev.slice(0, 5)
          ]);
        }
      }, 50);
    } else if (model === 'pull' || (model === 'hybrid' && isCeleb)) {
      // Fanout on Read (Zero write fanout, pulled on read)
      setTimeout(() => {
        setIsPublishing(false);
        setFanoutProgress(100);
        setFeedLogs(prev => [
          `⚡ [Fanout-on-Read] Post written ONLY to Author DB. Zero Redis write multiplication for ${count.toLocaleString()} followers! Pulled dynamically when followers open app.`,
          ...prev.slice(0, 5)
        ]);
      }, 200);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Paradigm Selector Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'hybrid', label: 'Hybrid Architecture (Industry Standard)' },
            { id: 'push', label: 'Pure Fanout-on-Write (Push)' },
            { id: 'pull', label: 'Pure Fanout-on-Read (Pull)' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setModel(m.id as any)}
              className={`btn ${model === m.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setAuthorType('regular')}
            className={`btn ${authorType === 'regular' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Regular User (150 Followers)
          </button>
          <button
            onClick={() => setAuthorType('celebrity')}
            className={`btn ${authorType === 'celebrity' ? 'btn-rose' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Celebrity (50M Followers)
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px' }}>
        {/* Author Post Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: authorType === 'celebrity' ? '#f43f5e' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>
              {authorType === 'celebrity' ? '★' : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {authorType === 'celebrity' ? 'Taylor Swift (Celebrity)' : 'John Doe (Regular)'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {authorType === 'celebrity' ? '50,000,000 Followers' : '150 Followers'}
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-primary)' }}>
            "Designing distributed systems with interactive visual simulations! 🚀 #SystemDesign"
          </div>

          <button
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            <Send size={16} /> {isPublishing ? 'Disseminating...' : 'Publish Post'}
          </button>

          {isPublishing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fanout Queue Progress: {fanoutProgress}%</div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${fanoutProgress}%`, height: '100%', background: 'var(--accent-indigo)', transition: 'width 0.1s linear' }} />
              </div>
            </div>
          )}
        </div>

        {/* Feed Dissemination Flow & Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Active Routing Strategy: <span style={{ color: 'var(--accent-cyan)' }}>
                {model === 'hybrid'
                  ? (authorType === 'celebrity' ? 'Fanout-on-Read (Pull Mode)' : 'Fanout-on-Write (Push Mode)')
                  : (model === 'push' ? 'Fanout-on-Write (Push)' : 'Fanout-on-Read (Pull)')}
              </span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Write Amplification</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: authorType === 'celebrity' && model === 'push' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  {authorType === 'celebrity' && model === 'push' ? '50,000,000 writes' : (authorType === 'celebrity' ? '1 write (0 amplification)' : '150 writes')}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Follower Feed Read Latency</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {authorType === 'celebrity' && model === 'pull' ? '≈ 8ms (On-the-fly merge)' : '≈ 1.5ms (O(1) Redis ZSET)'}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-panel" style={{ padding: '16px 20px', flex: 1, maxHeight: '180px', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Pipeline Telemetry Logs:
            </div>
            {feedLogs.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Publish a post above to observe real-time fanout routing...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {feedLogs.map((log, i) => (
                  <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                    {log}
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
