import React, { useState } from 'react';
import { Calculator, HardDrive, Cpu, Wifi, Database, Info, Sparkles } from 'lucide-react';

interface SystemPreset {
  name: string;
  dau: number;
  readsPerUser: number;
  writesPerUser: number;
  textKB: number;
  hasMedia: boolean;
  mediaMB: number;
  mediaPct: number;
}

const PRESETS: SystemPreset[] = [
  { name: 'Twitter / X', dau: 300, readsPerUser: 20, writesPerUser: 2, textKB: 0.3, hasMedia: true, mediaMB: 1.5, mediaPct: 15 },
  { name: 'YouTube', dau: 2500, readsPerUser: 5, writesPerUser: 0.05, textKB: 2, hasMedia: true, mediaMB: 250, mediaPct: 100 },
  { name: 'WhatsApp', dau: 2000, readsPerUser: 50, writesPerUser: 50, textKB: 0.5, hasMedia: true, mediaMB: 2.0, mediaPct: 10 },
  { name: 'Uber Rides', dau: 130, readsPerUser: 10, writesPerUser: 1, textKB: 1.0, hasMedia: false, mediaMB: 0, mediaPct: 0 },
  { name: 'Flash Sale (Amazon)', dau: 50, readsPerUser: 60, writesPerUser: 5, textKB: 4.0, hasMedia: true, mediaMB: 0.8, mediaPct: 30 },
];

export const EstimatorCalculator: React.FC = () => {
  const [dau, setDau] = useState<number>(300); // Millions
  const [readsPerUser, setReadsPerUser] = useState<number>(20);
  const [writesPerUser, setWritesPerUser] = useState<number>(2);
  const [textKB, setTextKB] = useState<number>(0.5);
  const [mediaMB, setMediaMB] = useState<number>(1.5);
  const [mediaPct, setMediaPct] = useState<number>(15); // %
  const [peakMultiplier, setPeakMultiplier] = useState<number>(2.5);
  const [retentionYears, setRetentionYears] = useState<number>(5);
  const [replicationFactor, setReplicationFactor] = useState<number>(3);
  const [showFormulas, setShowFormulas] = useState<boolean>(true);

  const applyPreset = (p: SystemPreset) => {
    setDau(p.dau);
    setReadsPerUser(p.readsPerUser);
    setWritesPerUser(p.writesPerUser);
    setTextKB(p.textKB);
    setMediaMB(p.mediaMB);
    setMediaPct(p.mediaPct);
  };

  // Calculations
  const SECONDS_PER_DAY = 100000; // Interview Rule of Thumb (exact 86,400)

  // 1. QPS
  const totalDailyReads = (dau * 1_000_000 * readsPerUser);
  const totalDailyWrites = (dau * 1_000_000 * writesPerUser);

  const readQps = Math.round(totalDailyReads / SECONDS_PER_DAY);
  const writeQps = Math.round(totalDailyWrites / SECONDS_PER_DAY);
  const totalQps = readQps + writeQps;
  const peakQps = Math.round(totalQps * peakMultiplier);

  // 2. Storage
  const textBytesPerWrite = textKB * 1024;
  const mediaBytesPerWrite = (mediaPct / 100) * (mediaMB * 1024 * 1024);
  const avgPayloadPerWrite = textBytesPerWrite + mediaBytesPerWrite;

  const dailyStorageBytes = totalDailyWrites * avgPayloadPerWrite;
  const dailyStorageGB = dailyStorageBytes / (1024 * 1024 * 1024);
  const dailyStorageTB = dailyStorageGB / 1024;

  const multiYearRawTB = dailyStorageTB * 365 * retentionYears;
  const multiYearReplicatedTB = multiYearRawTB * replicationFactor;
  const multiYearPB = multiYearReplicatedTB / 1024;

  // 3. 80/20 RAM Cache Sizing
  const avgReadPayload = (textKB * 1024) + ((mediaPct / 100) * (mediaMB * 1024 * 1024));
  const dailyReadVolumeGB = (totalDailyReads * avgReadPayload) / (1024 * 1024 * 1024);
  const ramCacheGB = Math.round(dailyReadVolumeGB * 0.2);
  const redis64GbNodes = Math.ceil(ramCacheGB / 64);

  // 4. Bandwidth
  const ingressBytesPerSec = writeQps * avgPayloadPerWrite;
  const egressBytesPerSec = readQps * avgReadPayload;
  const ingressGbps = ((ingressBytesPerSec * 8) / 1_000_000_000).toFixed(2);
  const egressGbps = ((egressBytesPerSec * 8) / 1_000_000_000).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Preset Selector */}
      <div className="workbench-panel" style={{ padding: '16px 22px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--signal-amber)" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Load Industry Benchmark:</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              className="btn btn-secondary"
              onClick={() => applyPreset(p)}
              style={{ fontSize: '13px', padding: '7px 14px' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs & Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: '20px' }}>
        {/* Sliders Column */}
        <div className="workbench-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '17px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="var(--signal-cyan)" />
            Interview Scale Inputs
          </h4>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Daily Active Users (DAU):</span>
              <strong style={{ color: 'var(--signal-cyan)', fontFamily: 'var(--font-mono)' }}>{dau} Million</strong>
            </div>
            <input type="range" min="1" max="2500" value={dau} onChange={(e) => setDau(Number(e.target.value))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Reads / User: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{readsPerUser}</strong></div>
              <input type="range" min="1" max="100" value={readsPerUser} onChange={(e) => setReadsPerUser(Number(e.target.value))} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Writes / User: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{writesPerUser}</strong></div>
              <input type="range" min="0.05" step="0.1" max="50" value={writesPerUser} onChange={(e) => setWritesPerUser(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Media Attachments (% writes):</span>
              <strong style={{ color: 'var(--signal-cyan)', fontFamily: 'var(--font-mono)' }}>{mediaPct}% ({mediaMB} MB avg)</strong>
            </div>
            <input type="range" min="0" max="100" value={mediaPct} onChange={(e) => setMediaPct(Number(e.target.value))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Peak Burst: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{peakMultiplier}x</strong></div>
              <input type="range" min="1.5" step="0.5" max="5" value={peakMultiplier} onChange={(e) => setPeakMultiplier(Number(e.target.value))} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Retention: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{retentionYears} Years</strong></div>
              <input type="range" min="1" max="10" value={retentionYears} onChange={(e) => setRetentionYears(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Replication Factor:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3].map(r => (
                <button
                  key={r}
                  onClick={() => setReplicationFactor(r)}
                  className={`btn ${replicationFactor === r ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 12px', fontSize: '12.5px' }}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live KPI Metric Cards & Formulas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
            {/* QPS */}
            <div className="workbench-panel" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--signal-cyan)', fontWeight: 600 }}>
                <Cpu size={15} /> Average QPS
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {totalQps.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Read: {readQps.toLocaleString()} | Write: {writeQps.toLocaleString()}
              </div>
            </div>

            {/* Peak QPS */}
            <div className="workbench-panel" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--signal-rose)', fontWeight: 600 }}>
                <Cpu size={15} /> Peak QPS ({peakMultiplier}x)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--signal-rose)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {peakQps.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Burst capacity needed
              </div>
            </div>

            {/* Multi-Year Storage */}
            <div className="workbench-panel" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--signal-cyan)', fontWeight: 600 }}>
                <HardDrive size={15} /> {retentionYears}-Year Storage
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--signal-cyan)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {multiYearPB >= 1 ? `${multiYearPB.toFixed(1)} PB` : `${Math.round(multiYearReplicatedTB)} TB`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {dailyStorageTB >= 1 ? `${dailyStorageTB.toFixed(1)} TB/day` : `${Math.round(dailyStorageGB)} GB/day`} (w/ {replicationFactor}x)
              </div>
            </div>

            {/* 80/20 RAM Sizing */}
            <div className="workbench-panel" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--signal-emerald)', fontWeight: 600 }}>
                <Database size={15} /> 80/20 RAM Cache
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--signal-emerald)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {ramCacheGB >= 1024 ? `${(ramCacheGB / 1024).toFixed(1)} TB` : `${ramCacheGB} GB`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                ≈ {redis64GbNodes}x 64GB Redis nodes
              </div>
            </div>

            {/* Network Bandwidth */}
            <div className="workbench-panel" style={{ padding: '16px 18px', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--signal-amber)', fontWeight: 600 }}>
                <Wifi size={15} /> Network Bandwidth
              </div>
              <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ingress:</span>{' '}
                  <strong style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{ingressGbps} Gbps</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Egress:</span>{' '}
                  <strong style={{ fontSize: '20px', color: 'var(--signal-amber)', fontFamily: 'var(--font-mono)' }}>{egressGbps} Gbps</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-step Math Explanation */}
          <div className="workbench-panel" style={{ padding: '18px 22px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} color="var(--signal-cyan)" /> Fast Mental Arithmetic Breakdown
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setShowFormulas(!showFormulas)}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                {showFormulas ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {showFormulas && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>1. Daily Requests = ({dau}M DAU × {readsPerUser + writesPerUser} actions) = {((dau * (readsPerUser + writesPerUser))).toFixed(0)}M reqs/day</div>
                <div>2. Average QPS = {((dau * (readsPerUser + writesPerUser))).toFixed(0)}M / 100,000 sec = <span style={{ color: 'var(--signal-cyan)', fontWeight: 700 }}>{totalQps.toLocaleString()} QPS</span></div>
                <div>3. Peak QPS = {totalQps.toLocaleString()} × {peakMultiplier} = <span style={{ color: 'var(--signal-rose)', fontWeight: 700 }}>{peakQps.toLocaleString()} QPS</span></div>
                <div>4. 5-Year Storage = ({dailyStorageTB.toFixed(2)} TB/day × 365 × {retentionYears} × {replicationFactor}) = <span style={{ color: 'var(--signal-cyan)', fontWeight: 700 }}>{multiYearPB >= 1 ? `${multiYearPB.toFixed(1)} PB` : `${Math.round(multiYearReplicatedTB)} TB`}</span></div>
                <div>5. 80/20 RAM Cache = 20% × {Math.round(dailyReadVolumeGB)} GB read volume = <span style={{ color: 'var(--signal-emerald)', fontWeight: 700 }}>{ramCacheGB} GB RAM</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
