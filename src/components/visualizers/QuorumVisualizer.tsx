import React, { useState } from 'react';
import { Database, ShieldCheck, AlertTriangle, ArrowRight, RefreshCw, Power } from 'lucide-react';

interface ReplicaState {
  id: string;
  name: string;
  value: string;
  version: number;
  isOnline: boolean;
  status: 'idle' | 'writing' | 'reading' | 'repaired';
}

export const QuorumVisualizer: React.FC = () => {
  const [n, setN] = useState<number>(3); // Total replicas
  const [w, setW] = useState<number>(2); // Write quorum
  const [r, setR] = useState<number>(2); // Read quorum
  const [inputVal, setInputVal] = useState<string>('user_name: Alice');

  const [replicas, setReplicas] = useState<ReplicaState[]>([
    { id: 'rep-1', name: 'Node 1 (US-East)', value: 'user_name: Alice', version: 1, isOnline: true, status: 'idle' },
    { id: 'rep-2', name: 'Node 2 (US-West)', value: 'user_name: Alice', version: 1, isOnline: true, status: 'idle' },
    { id: 'rep-3', name: 'Node 3 (EU-Central)', value: 'user_name: Alice', version: 1, isOnline: true, status: 'idle' },
  ]);

  const [log, setLog] = useState<string>('Cluster initialized with N=3, W=2, R=2. Strong consistency guaranteed (W + R > N).');

  const isStrongConsistency = (w + r) > n;
  const onlineCount = replicas.filter(rep => rep.isOnline).length;

  const toggleNodePower = (id: string) => {
    setReplicas(prev => prev.map(rep => rep.id === id ? { ...rep, isOnline: !rep.isOnline } : rep));
  };

  const handleWrite = () => {
    const availableNodes = replicas.filter(rep => rep.isOnline);
    if (availableNodes.length < w) {
      setLog(`❌ Write REJECTED: Only ${availableNodes.length} nodes online, but Write Quorum W=${w} required!`);
      return;
    }

    const nextVer = Math.max(...replicas.map(rep => rep.version)) + 1;
    // Write to first W available nodes
    let written = 0;
    setReplicas(prev => prev.map(rep => {
      if (rep.isOnline && written < w) {
        written++;
        return { ...rep, value: inputVal, version: nextVer, status: 'writing' };
      }
      return rep;
    }));

    setLog(`✅ Write SUCCESS: Wrote "${inputVal}" (v${nextVer}) to ${w} replicas.`);
    setTimeout(() => {
      setReplicas(prev => prev.map(rep => ({ ...rep, status: 'idle' })));
    }, 1200);
  };

  const handleRead = () => {
    const availableNodes = replicas.filter(rep => rep.isOnline);
    if (availableNodes.length < r) {
      setLog(`❌ Read REJECTED: Only ${availableNodes.length} nodes online, but Read Quorum R=${r} required!`);
      return;
    }

    // Read from top R online nodes
    const readNodes = availableNodes.slice(0, r);
    const maxVersionNode = readNodes.reduce((max, node) => node.version > max.version ? node : max, readNodes[0]);

    // Check if any read node had a stale version
    const staleNodes = readNodes.filter(node => node.version < maxVersionNode.version);

    if (staleNodes.length > 0) {
      setLog(`⚡ Read SUCCESS: Returned latest "${maxVersionNode.value}" (v${maxVersionNode.version}). Read Repair triggered on stale nodes.`);
      // Trigger Read Repair
      setTimeout(() => {
        setReplicas(prev => prev.map(rep => {
          if (rep.isOnline && rep.version < maxVersionNode.version) {
            return { ...rep, value: maxVersionNode.value, version: maxVersionNode.version, status: 'repaired' };
          }
          return rep;
        }));
      }, 800);
    } else {
      setLog(`✅ Read SUCCESS: All ${r} polled replicas agree on latest value: "${maxVersionNode.value}" (v${maxVersionNode.version}).`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Replicas (N): <strong>{n}</strong></div>
            <input type="range" min="3" max="3" value={n} onChange={() => {}} style={{ width: '70px' }} />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Write Quorum (W): <strong>{w}</strong></div>
            <input type="range" min="1" max={n} value={w} onChange={(e) => setW(Number(e.target.value))} style={{ width: '80px' }} />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Read Quorum (R): <strong>{r}</strong></div>
            <input type="range" min="1" max={n} value={r} onChange={(e) => setR(Number(e.target.value))} style={{ width: '80px' }} />
          </div>
        </div>

        {/* Consistency Formula Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            W ({w}) + R ({r}) = <strong>{w + r}</strong> {isStrongConsistency ? '>' : '≤'} N ({n})
          </div>
          <span className={`badge ${isStrongConsistency ? 'badge-emerald' : 'badge-amber'}`}>
            {isStrongConsistency ? 'Strong Consistency' : 'Eventual Consistency'}
          </span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px' }}>
        {/* Actions Column */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Coordinator Operations</h4>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Value to write:</label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handleWrite} style={{ flex: 1 }}>
              Write (W={w})
            </button>
            <button className="btn btn-cyan" onClick={handleRead} style={{ flex: 1 }}>
              Read (R={r})
            </button>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-muted)' }}>
            💡 <strong>Interactive Experiment:</strong> Click the power button on Node 3 to kill it, then perform a Write and a Read to test fault tolerance!
          </div>
        </div>

        {/* Replica Nodes Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {replicas.map(rep => (
              <div
                key={rep.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  border: rep.status === 'writing'
                    ? '2px solid var(--accent-indigo)'
                    : rep.status === 'repaired'
                    ? '2px solid var(--accent-emerald)'
                    : !rep.isOnline
                    ? '1px dashed var(--accent-rose)'
                    : '1px solid var(--border-glass)',
                  opacity: rep.isOnline ? 1 : 0.45,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{rep.name}</span>
                  <button
                    onClick={() => toggleNodePower(rep.id)}
                    style={{
                      background: rep.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      padding: '5px',
                      cursor: 'pointer',
                      color: rep.isOnline ? '#10b981' : '#f43f5e'
                    }}
                    title={rep.isOnline ? 'Simulate Server Failure' : 'Restart Server'}
                  >
                    <Power size={13} />
                  </button>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>Stored Data:</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{rep.value}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vector Version:</span>
                  <strong style={{ color: 'var(--accent-amber)' }}>v{rep.version}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Execution Log */}
          <div className="glass-panel" style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: log.startsWith('❌') ? '#f43f5e' : '#cbd5e1' }}>
            {log}
          </div>
        </div>
      </div>
    </div>
  );
};
