import React, { useState } from 'react';
import { ArchitectureNode, ArchitectureEdge, FlowStep } from '../../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Props {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  flowSteps: FlowStep[];
}

export const InteractiveArchitectureDiagram: React.FC<Props> = ({ nodes, edges, flowSteps }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);

  const currentStep = flowSteps[currentStepIdx] || flowSteps[0];

  const handleNext = () => {
    setCurrentStepIdx(prev => (prev + 1) % flowSteps.length);
  };

  const handlePrev = () => {
    setCurrentStepIdx(prev => (prev - 1 + flowSteps.length) % flowSteps.length);
  };

  const getNodeColor = (type: ArchitectureNode['type']) => {
    switch (type) {
      case 'client': return '#38bdf8';
      case 'gateway': return '#818cf8';
      case 'service': return '#c084fc';
      case 'cache': return '#f43f5e';
      case 'database': return '#10b981';
      case 'queue': return '#f59e0b';
      case 'worker': return '#06b6d4';
      case 'storage': return '#a855f7';
      case 'cdn': return '#ec4899';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Flow Step Header Controller */}
      <div className="workbench-panel" style={{ padding: '18px 22px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className="badge badge-indigo" style={{ fontSize: '12px' }}>
            Step {currentStep.stepNumber} of {flowSteps.length}
          </span>
          <h4 style={{ fontSize: '17px', color: 'var(--text-primary)' }}>
            {currentStep.title}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handlePrev} style={{ padding: '7px 12px' }}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-secondary" onClick={handleNext} style={{ padding: '7px 12px' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Step Description & Tip Callout */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '14.5px', color: 'var(--text-secondary)', flex: 1, minWidth: '260px', lineHeight: 1.6 }}>
          {currentStep.description}
        </div>
        {currentStep.highlightTip && (
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '3px solid var(--accent-indigo)', padding: '8px 14px', borderRadius: '0 6px 6px 0', fontSize: '13px', color: 'var(--text-primary)', minWidth: '280px', lineHeight: 1.5 }}>
            💡 <strong>Pro Tip:</strong> {currentStep.highlightTip}
          </div>
        )}
      </div>

      {/* Interactive SVG Diagram Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 320px' : '1fr', gap: '16px' }}>
        <div className="workbench-panel" style={{ padding: '22px', minHeight: '390px', position: 'relative', overflowX: 'auto' }}>
          <svg width="900" height="360" viewBox="0 0 900 360" style={{ width: '100%', height: 'auto' }}>
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render Edges */}
            {edges.map((edge, idx) => {
              const source = nodes.find(n => n.id === edge.from);
              const target = nodes.find(n => n.id === edge.to);
              if (!source || !target) return null;

              const isSourceActive = currentStep.activeNodeIds.includes(source.id);
              const isTargetActive = currentStep.activeNodeIds.includes(target.id);
              const isEdgeActive = isSourceActive && isTargetActive;

              const midX = (source.x + target.x) / 2 + 50;
              const midY = (source.y + target.y) / 2 + 25;

              return (
                <g key={`edge-${idx}`}>
                  <path
                    d={`M ${source.x + 60} ${source.y + 30} Q ${midX} ${midY - 20} ${target.x + 60} ${target.y + 30}`}
                    fill="none"
                    stroke={isEdgeActive ? 'url(#edgeGrad)' : 'rgba(128, 128, 128, 0.25)'}
                    strokeWidth={isEdgeActive ? 3 : 1.5}
                    strokeDasharray={isEdgeActive ? '6 4' : 'none'}
                    style={{
                      animation: isEdgeActive ? 'packetFlow 1.2s linear infinite' : 'none',
                      transition: 'stroke 0.3s ease'
                    }}
                  />
                  {edge.label && (
                    <text
                      x={midX}
                      y={midY - 8}
                      fill={isEdgeActive ? 'var(--signal-cyan)' : 'var(--text-muted)'}
                      fontSize="11.5"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isActive = currentStep.activeNodeIds.includes(node.id);
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                  {/* Active Pulse Aura */}
                  {isActive && (
                    <rect
                      x="-6"
                      y="-6"
                      width="132"
                      height="72"
                      rx="14"
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeOpacity="0.6"
                      filter="url(#glowFilter)"
                    />
                  )}

                  {/* Node Box */}
                  <rect
                    x="0"
                    y="0"
                    width="120"
                    height="60"
                    rx="10"
                    fill={isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)'}
                    stroke={isActive ? color : isSelected ? 'var(--border-active)' : 'var(--border-glass)'}
                    strokeWidth={isActive || isSelected ? 2 : 1}
                  />

                  {/* Node Type Top Accent Bar */}
                  <path
                    d="M 2 8 Q 2 2 8 2 L 112 2 Q 118 2 118 8 L 118 10 L 2 10 Z"
                    fill={color}
                    opacity="0.8"
                  />

                  {/* Node Label */}
                  <text
                    x="60"
                    y="32"
                    fill="var(--text-primary)"
                    fontSize="12.5"
                    fontWeight="700"
                    fontFamily="var(--font-sans)"
                    textAnchor="middle"
                  >
                    {node.label.length > 15 ? node.label.slice(0, 14) + '...' : node.label}
                  </text>

                  {/* Node Subtitle / Type */}
                  <text
                    x="60"
                    y="48"
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    [{node.type.toUpperCase()}]
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspection Drawer */}
        {selectedNode && (
          <div className="workbench-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-indigo">Component Detail</span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <h4 style={{ fontSize: '17px', color: 'var(--text-primary)' }}>{selectedNode.label}</h4>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {selectedNode.description}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Architectural Role:</div>
              <strong>Type:</strong> {selectedNode.type.toUpperCase()}<br />
              <strong>Placement:</strong> Coordinate ({selectedNode.x}, {selectedNode.y})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
