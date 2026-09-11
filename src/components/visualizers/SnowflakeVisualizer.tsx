import React, { useState } from 'react';
import { Sparkles, Hash, Cpu, Calendar, Clock, Terminal } from 'lucide-react';

export const SnowflakeVisualizer: React.FC = () => {
  const [datacenterId, setDatacenterId] = useState<number>(1);
  const [workerId, setWorkerId] = useState<number>(3);
  const [sequence, setSequence] = useState<number>(0);
  const [generatedId, setGeneratedId] = useState<bigint | null>(null);
  const [history, setHistory] = useState<{ id: bigint; time: string; binary: string; seq: number }[]>([]);

  // Custom epoch: 2024-01-01T00:00:00Z (1704067200000)
  const CUSTOM_EPOCH = 1704067200000n;

  const generateNextId = () => {
    const now = BigInt(Date.now());
    const timeDelta = now - CUSTOM_EPOCH;
    const nextSeq = (sequence + 1) % 4096;
    setSequence(nextSeq);

    // 64-bit bitshift math:
    // (timeDelta << 22) | (dc << 17) | (worker << 12) | seq
    const id = (timeDelta << 22n) |
               (BigInt(datacenterId) << 17n) |
               (BigInt(workerId) << 12n) |
               BigInt(nextSeq);

    setGeneratedId(id);

    const binaryStr = id.toString(2).padStart(64, '0');
    setHistory(prev => [
      { id, time: new Date().toLocaleTimeString(), binary: binaryStr, seq: nextSeq },
      ...prev.slice(0, 7)
    ]);
  };

  const handleSimulateBurst = () => {
    const batch: { id: bigint; time: string; binary: string; seq: number }[] = [];
    const now = BigInt(Date.now());
    const timeDelta = now - CUSTOM_EPOCH;

    for (let s = 0; s < 5; s++) {
      const id = (timeDelta << 22n) |
                 (BigInt(datacenterId) << 17n) |
                 (BigInt(workerId) << 12n) |
                 BigInt(s);
      batch.push({
        id,
        time: new Date().toLocaleTimeString(),
        binary: id.toString(2).padStart(64, '0'),
        seq: s
      });
    }
    setHistory(batch);
    setGeneratedId(batch[0].id);
    setSequence(4);
  };

  const binaryString = generatedId ? generatedId.toString(2).padStart(64, '0') : '0'.repeat(64);
  const signBit = binaryString.slice(0, 1);
  const timestampBits = binaryString.slice(1, 42);
  const dcBits = binaryString.slice(42, 47);
  const workerBits = binaryString.slice(47, 52);
  const seqBits = binaryString.slice(52, 64);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Bitfield Header Visual Map */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={18} color="var(--accent-indigo)" />
              Twitter Snowflake 64-Bit Structure Dissection
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Generates up to 4,096 unique, time-sortable 64-bit IDs per millisecond per machine.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={generateNextId}>
              <Sparkles size={16} /> Generate 1 ID
            </button>
            <button className="btn btn-secondary" onClick={handleSimulateBurst}>
              ⚡ Rapid 5-ID Burst
            </button>
          </div>
        </div>

        {/* 64-Bit Visual Ribbon */}
        <div style={{ display: 'flex', width: '100%', height: '38px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
          {/* Sign Bit */}
          <div style={{ width: '2%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700 }} title="Sign Bit (1 bit, always 0)">
            0
          </div>
          {/* Timestamp Bits */}
          <div style={{ width: '64%', background: 'linear-gradient(90deg, #4338ca, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, gap: '6px' }} title="Epoch Milliseconds (41 bits = 69.7 Years)">
            <Clock size={12} /> 41 Bits Timestamp ({timestampBits.slice(0, 8)}...)
          </div>
          {/* Datacenter Bits */}
          <div style={{ width: '8%', background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }} title="Datacenter ID (5 bits = 32 Datacenters)">
            DC (5b)
          </div>
          {/* Worker Bits */}
          <div style={{ width: '8%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }} title="Worker ID (5 bits = 32 Machines per DC)">
            W (5b)
          </div>
          {/* Sequence Bits */}
          <div style={{ width: '18%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }} title="Sequence Counter (12 bits = 4,096 IDs/ms)">
            Seq (12b)
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', background: '#475569', borderRadius: '2px' }} /> 1b Sign (0)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '2px' }} /> 41b Timestamp (69 Years)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', background: '#0891b2', borderRadius: '2px' }} /> 5b Datacenter ID (0-31)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', background: '#059669', borderRadius: '2px' }} /> 5b Worker Node ID (0-31)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', background: '#d97706', borderRadius: '2px' }} /> 12b Sequence Counter (0-4095)
          </span>
        </div>
      </div>

      {/* Generator Controls & Live Output */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px' }}>
        {/* Controls */}
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--accent-cyan)" /> Node Hardware Parameters
          </h4>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Datacenter ID:</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{datacenterId} (5-bit: {datacenterId.toString(2).padStart(5, '0')})</strong>
            </div>
            <input
              type="range"
              min="0"
              max="31"
              value={datacenterId}
              onChange={(e) => setDatacenterId(Number(e.target.value))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Worker Node ID:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{workerId} (5-bit: {workerId.toString(2).padStart(5, '0')})</strong>
            </div>
            <input
              type="range"
              min="0"
              max="31"
              value={workerId}
              onChange={(e) => setWorkerId(Number(e.target.value))}
            />
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Bitshift Formula:<br />
            (timeDelta &lt;&lt; 22n) | (dc &lt;&lt; 17n) | (worker &lt;&lt; 12n) | seq
          </div>
        </div>

        {/* Live Dissected Output */}
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Active Generated 64-Bit Integer (BigInt)
            </span>
            <span className="badge badge-emerald">64-Bit BigInt</span>
          </div>

          <div style={{ background: '#050811', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-indigo-light)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              {generatedId ? generatedId.toString() : 'Click "Generate 1 ID" above'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Hex: {generatedId ? `0x${generatedId.toString(16).toUpperCase()}` : '0x0000000000000000'}
            </div>
          </div>

          {/* Color-Coded Bit Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Binary Bitfield Representation:</span>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '11px', wordBreak: 'break-all', lineHeight: 1.8 }}>
              <span style={{ color: '#94a3b8', background: '#47556940', padding: '2px 4px', borderRadius: '2px' }}>{signBit}</span>
              <span style={{ color: '#818cf8', background: '#4338ca30', padding: '2px 4px', borderRadius: '2px', marginLeft: '3px' }}>{timestampBits}</span>
              <span style={{ color: '#22d3ee', background: '#0891b230', padding: '2px 4px', borderRadius: '2px', marginLeft: '3px' }}>{dcBits}</span>
              <span style={{ color: '#34d399', background: '#05966930', padding: '2px 4px', borderRadius: '2px', marginLeft: '3px' }}>{workerBits}</span>
              <span style={{ color: '#fbbf24', background: '#d9770630', padding: '2px 4px', borderRadius: '2px', marginLeft: '3px' }}>{seqBits}</span>
            </div>
          </div>

          {/* Generation History Table */}
          <div style={{ marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recent ID Stream:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', maxHeight: '110px', overflowY: 'auto' }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#fff' }}>{h.id.toString()}</span>
                  <span style={{ color: 'var(--accent-amber)' }}>Seq: #{h.seq}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
