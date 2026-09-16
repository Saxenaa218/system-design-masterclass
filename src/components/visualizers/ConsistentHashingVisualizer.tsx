import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RefreshCw, Layers, ShieldCheck, Database } from 'lucide-react';

interface ServerNode {
  id: string;
  name: string;
  color: string;
}

interface HashKey {
  id: string;
  label: string;
  hash: number;
}

const SERVER_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const ConsistentHashingVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<ServerNode[]>([
    { id: 'node-A', name: 'Server A', color: SERVER_COLORS[0] },
    { id: 'node-B', name: 'Server B', color: SERVER_COLORS[1] },
    { id: 'node-C', name: 'Server C', color: SERVER_COLORS[2] },
    { id: 'node-D', name: 'Server D', color: SERVER_COLORS[3] },
  ]);

  const [vnodesCount, setVnodesCount] = useState<number>(3);
  const [keys, setKeys] = useState<HashKey[]>([
    { id: 'k1', label: 'user:101', hash: 35 },
    { id: 'k2', label: 'session:auth_9', hash: 110 },
    { id: 'k3', label: 'photo:avatar_2', hash: 195 },
    { id: 'k4', label: 'order:ord_882', hash: 280 },
    { id: 'k5', label: 'cart:cart_99', hash: 330 },
  ]);

  const [newKeyInput, setNewKeyInput] = useState('');

  // Simple deterministic string to degree hash [0, 359]
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  };

  // Compute all virtual node tokens on the 360-degree ring
  const ringTokens = useMemo(() => {
    const tokens: { angle: number; nodeId: string; nodeName: string; color: string; label: string }[] = [];
    nodes.forEach((node) => {
      for (let v = 0; v < vnodesCount; v++) {
        const tokenHash = hashString(`${node.id}#vnode-${v}`);
        tokens.push({
          angle: tokenHash,
          nodeId: node.id,
          nodeName: node.name,
          color: node.color,
          label: `${node.name} [v${v}]`
        });
      }
    });
    return tokens.sort((a, b) => a.angle - b.angle);
  }, [nodes, vnodesCount]);

  // Map key clockwise to the next node token
  const getKeyAssignment = (keyAngle: number) => {
    if (ringTokens.length === 0) return null;
    for (const token of ringTokens) {
      if (token.angle >= keyAngle) {
        return token;
      }
    }
    return ringTokens[0]; // Wrap around to 0
  };

  const handleAddNode = () => {
    if (nodes.length >= 6) return;
    const nextChar = String.fromCharCode(65 + nodes.length);
    const color = SERVER_COLORS[nodes.length % SERVER_COLORS.length];
    setNodes([...nodes, { id: `node-${nextChar}`, name: `Server ${nextChar}`, color }]);
  };

  const handleRemoveNode = (id: string) => {
    if (nodes.length <= 2) return;
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleAddKey = () => {
    if (!newKeyInput.trim()) return;
    const hash = hashString(newKeyInput.trim());
    const newKey: HashKey = {
      id: `k-${Date.now()}`,
      label: newKeyInput.trim(),
      hash
    };
    setKeys(prev => [...prev, newKey]);
    setNewKeyInput('');
  };

  const handleGenerateRandomKeys = () => {
    const prefixes = ['user_id_', 'cart_session_', 'product_meta_', 'img_blob_', 'auth_token_'];
    const newBatch: HashKey[] = Array.from({ length: 5 }, (_, i) => {
      const label = `${prefixes[i % prefixes.length]}${Math.floor(Math.random() * 10000)}`;
      return { id: `k-${Date.now()}-${i}`, label, hash: hashString(label) };
    });
    setKeys(newBatch);
  };

  // Node key count stats
  const stats = useMemo(() => {
    const map: { [nodeId: string]: number } = {};
    nodes.forEach(n => { map[n.id] = 0; });
    keys.forEach(k => {
      const assigned = getKeyAssignment(k.hash);
      if (assigned) {
        map[assigned.nodeId] = (map[assigned.nodeId] || 0) + 1;
      }
    });
    return map;
  }, [nodes, keys, ringTokens]);

  const centerX = 200;
  const centerY = 200;
  const radius = 135;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={handleAddNode} disabled={nodes.length >= 6}>
            <Plus size={16} /> Add Server
          </button>
          <button className="btn btn-secondary" onClick={handleGenerateRandomKeys}>
            <RefreshCw size={16} /> Generate 5 Keys
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Virtual Nodes: {vnodesCount}</span>
          <input
            type="range"
            min="1"
            max="6"
            value={vnodesCount}
            onChange={(e) => setVnodesCount(Number(e.target.value))}
            style={{ width: '100px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. user:5928"
            value={newKeyInput}
            onChange={(e) => setNewKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              width: '140px'
            }}
          />
          <button className="btn btn-primary" onClick={handleAddKey}>
            Hash Key
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '20px' }}>
        {/* Ring SVG Stage */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <span className="badge badge-indigo" style={{ position: 'absolute', top: '15px', left: '15px' }}>
            360° Circular Hash Ring
          </span>

          <svg width="400" height="400" viewBox="0 0 400 400" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#0f172a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {/* Inner Ring Glow */}
            <circle cx={centerX} cy={centerY} r={radius} fill="url(#ringGlow)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" />
            <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1" strokeDasharray="4 4" />

            {/* Center Hub */}
            <circle cx={centerX} cy={centerY} r="35" fill="var(--bg-surface)" stroke="var(--border-glass)" />
            <text x={centerX} y={centerY - 5} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">
              RING
            </text>
            <text x={centerX} y={centerY + 12} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="var(--font-mono)">
              2^32 - 1
            </text>

            {/* Virtual Node Tokens */}
            {ringTokens.map((token, idx) => {
              const rad = (token.angle * Math.PI) / 180;
              const x = centerX + radius * Math.cos(rad);
              const y = centerY + radius * Math.sin(rad);
              const lx = centerX + (radius + 24) * Math.cos(rad);
              const ly = centerY + (radius + 24) * Math.sin(rad);

              return (
                <g key={`token-${idx}`} style={{ transition: 'all 0.3s ease' }}>
                  <line x1={centerX} y1={centerY} x2={x} y2={y} stroke={token.color} strokeWidth="1" strokeOpacity="0.3" />
                  <circle cx={x} cy={y} r="7" fill={token.color} stroke="#07090e" strokeWidth="2" />
                  <text
                    x={lx}
                    y={ly + 4}
                    textAnchor="middle"
                    fill={token.color}
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                  >
                    {token.label}
                  </text>
                </g>
              );
            })}

            {/* Keys on Ring */}
            {keys.map((k) => {
              const assigned = getKeyAssignment(k.hash);
              const rad = (k.hash * Math.PI) / 180;
              const kx = centerX + (radius - 22) * Math.cos(rad);
              const ky = centerY + (radius - 22) * Math.sin(rad);

              return (
                <g key={k.id} style={{ transition: 'all 0.4s ease' }}>
                  <circle cx={kx} cy={ky} r="6" fill="#f8fafc" stroke={assigned ? assigned.color : '#fff'} strokeWidth="2" />
                  <title>{`${k.label} -> ${assigned?.nodeName}`}</title>
                </g>
              );
            })}
          </svg>

          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '15px' }}>
            <span>● White dots = Keys</span>
            <span>● Colored dots = Server Tokens</span>
          </div>
        </div>

        {/* Server Nodes Breakdown & Key Assignments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} color="var(--accent-indigo-light)" />
              Active Physical Servers ({nodes.length})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {nodes.map(node => {
                const count = stats[node.id] || 0;
                const percent = keys.length > 0 ? Math.round((count / keys.length) * 100) : 0;

                return (
                  <div
                    key={node.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${node.color}40`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: node.color }}>
                        {node.name}
                      </span>
                      {nodes.length > 2 && (
                        <button
                          onClick={() => handleRemoveNode(node.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          title="Remove server to simulate failure"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {count} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>keys ({percent}%)</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {vnodesCount} Virtual Nodes on ring
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Mapping Table */}
          <div className="glass-panel" style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', maxHeight: '220px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
              Current Key Distribution ({keys.length} keys total)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {keys.map(k => {
                const assigned = getKeyAssignment(k.hash);
                return (
                  <div
                    key={k.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{k.label}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Angle: {k.hash}°</span>
                    <span
                      style={{
                        color: assigned?.color || '#fff',
                        fontWeight: 600,
                        padding: '2px 8px',
                        background: `${assigned?.color}20`,
                        borderRadius: '4px'
                      }}
                    >
                      ➜ {assigned?.nodeName || 'None'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShieldCheck size={22} color="var(--accent-indigo-light)" />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          <strong>Intuition in Action:</strong> Click <strong style={{ color: 'var(--text-primary)' }}>Add Server</strong> or trash an existing server. Notice how keys assigned to other unaffected nodes do NOT move at all! Only <strong>1/N</strong> keys are reassigned, completely eliminating cache stampede storms.
        </span>
      </div>
    </div>
  );
};
