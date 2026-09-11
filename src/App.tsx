import React, { useState, useEffect, useMemo } from 'react';
import { CHAPTERS } from './data/chaptersData';
import { QUIZZES } from './data/quizzesData';
import { Chapter, CategoryType } from './types';
import { InteractiveArchitectureDiagram } from './components/diagrams/InteractiveArchitectureDiagram';
import { ConsistentHashingVisualizer } from './components/visualizers/ConsistentHashingVisualizer';
import { RateLimiterVisualizer } from './components/visualizers/RateLimiterVisualizer';
import { SnowflakeVisualizer } from './components/visualizers/SnowflakeVisualizer';
import { TrieVisualizer } from './components/visualizers/TrieVisualizer';
import { QuorumVisualizer } from './components/visualizers/QuorumVisualizer';
import { EstimatorCalculator } from './components/visualizers/EstimatorCalculator';
import { NewsfeedFanoutVisualizer } from './components/visualizers/NewsfeedFanoutVisualizer';
import { OrderBookVisualizer } from './components/visualizers/OrderBookVisualizer';
import { QuizModal } from './components/quiz/QuizModal';
import { InterviewWhiteboardModal } from './components/interview/InterviewWhiteboardModal';

import {
  Layers,
  Search,
  BookOpen,
  Zap,
  Award,
  Clock,
  CheckCircle2,
  Calculator,
  Compass,
  Code2,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

const CATEGORIES: CategoryType[] = [
  'Foundations',
  'Core Distributed Systems',
  'Storage & Data',
  'Real-World Scale Systems',
  'Advanced Infrastructure'
];

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('system_design_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'architecture' | 'lab' | 'deepdive' | 'tradeoffs'>('architecture');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [masteredChapters, setMasteredChapters] = useState<{ [id: number]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('mastered_chapters');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);
  const [showInterviewModal, setShowInterviewModal] = useState<boolean>(false);
  const [showEstimatorModal, setShowEstimatorModal] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Sync theme with document root & local storage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('system_design_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeChapter = useMemo(() => {
    return CHAPTERS.find(c => c.id === selectedChapterId) || CHAPTERS[0];
  }, [selectedChapterId]);

  const activeChapterQuizzes = useMemo(() => {
    return QUIZZES.filter(q => q.chapterId === activeChapter.id);
  }, [activeChapter]);

  // Filtered Chapters for Sidebar
  const filteredChapters = useMemo(() => {
    return CHAPTERS.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.number.includes(searchQuery);
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleMastery = (id: number) => {
    const updated = { ...masteredChapters, [id]: !masteredChapters[id] };
    setMasteredChapters(updated);
    try {
      localStorage.setItem('mastered_chapters', JSON.stringify(updated));
    } catch {}
  };

  const masteredCount = Object.values(masteredChapters).filter(Boolean).length;
  const progressPercent = Math.round((masteredCount / CHAPTERS.length) * 100);

  const getDifficultyBadge = (diff: Chapter['difficulty']) => {
    switch (diff) {
      case 'Beginner': return 'badge-emerald';
      case 'Intermediate': return 'badge-cyan';
      case 'Advanced': return 'badge-rose';
      default: return 'badge-indigo';
    }
  };

  const renderActiveLab = () => {
    switch (activeChapter.labType) {
      case 'consistent-hashing':
        return <ConsistentHashingVisualizer />;
      case 'rate-limiter':
        return <RateLimiterVisualizer />;
      case 'unique-id':
        return <SnowflakeVisualizer />;
      case 'trie-autocomplete':
        return <TrieVisualizer />;
      case 'key-value-store':
        return <QuorumVisualizer />;
      case 'estimator':
        return <EstimatorCalculator />;
      case 'newsfeed':
        return <NewsfeedFanoutVisualizer />;
      case 'orderbook':
        return <OrderBookVisualizer />;
      case 'scaling':
        return <EstimatorCalculator />;
      default:
        return (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
            <Zap size={36} color="var(--accent-indigo)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Interactive Flow Simulation Active</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '8px auto 16px' }}>
              Interact with the live animated topology graph in the "Visual Architecture & Flow" tab to trace packets and inspect component metrics.
            </p>
            <button className="btn btn-primary" onClick={() => setActiveTab('architecture')}>
              Go to Architecture Flow
            </button>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Top Universal HUD Header */}
      <header
        style={{
          height: '68px',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-indigo)' }}>
              <Layers size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                System Design Masterclass
              </h1>
              <div style={{ fontSize: '11px', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                28 Interactive Chapters
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Progress Tracker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>
            <Award size={16} color="var(--accent-amber)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {masteredCount} / {CHAPTERS.length} Mastered ({progressPercent}%)
            </span>
            <div style={{ width: '60px', height: '6px', background: 'rgba(128,128,128,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setShowEstimatorModal(true)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Calculator size={14} color="var(--accent-cyan)" /> Estimation Sizer
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowInterviewModal(true)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Clock size={14} /> 45-Min Interview Sandbox
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
            <span style={{ fontSize: '12px' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout (Sidebar + Main Learning Stage) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Left Navigation Sidebar */}
        {sidebarOpen && (
          <aside
            style={{
              width: 'var(--sidebar-width)',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 68px)',
              position: 'sticky',
              top: '68px',
              zIndex: 40
            }}
          >
            {/* Search and Filters */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search chapters (e.g. rate limiter, Kafka)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', width: '100%' }}
                />
              </div>

              {/* Category Filter Scroll */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['All', ...CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: selectedCategory === cat ? 'var(--accent-indigo)' : 'var(--bg-card)',
                      border: '1px solid var(--border-glass)',
                      color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredChapters.map((ch) => {
                const isSelected = ch.id === activeChapter.id;
                const isMastered = !!masteredChapters[ch.id];

                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>
                        CH {ch.number}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${getDifficultyBadge(ch.difficulty)}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {ch.difficulty}
                        </span>
                        {isMastered && (
                          <CheckCircle2 size={13} color="var(--accent-emerald)" />
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {ch.title}
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {ch.readTimeMin} min read • {ch.category}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Content Stage */}
        <main style={{ flex: 1, padding: '28px 36px', maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chapter Header Banner */}
          <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className="badge badge-indigo">Chapter {activeChapter.number}</span>
                  <span className={`badge ${getDifficultyBadge(activeChapter.difficulty)}`}>{activeChapter.difficulty}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {activeChapter.readTimeMin} min read
                  </span>
                </div>

                <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {activeChapter.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '800px' }}>
                  {activeChapter.summary}
                </p>
              </div>

              {/* Mark Mastered & Quiz Action */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className={`btn ${masteredChapters[activeChapter.id] ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleMastery(activeChapter.id)}
                >
                  <CheckCircle2 size={16} />
                  {masteredChapters[activeChapter.id] ? 'Mastered ✓' : 'Mark as Mastered'}
                </button>

                <button
                  className="btn btn-cyan"
                  onClick={() => setShowQuizModal(true)}
                >
                  <Award size={16} /> Knowledge Quiz ({activeChapterQuizzes.length})
                </button>
              </div>
            </div>

            {/* Intuition Callout Card */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-indigo)', fontWeight: 700, fontSize: '13px' }}>
                <Sparkles size={16} /> Intuitive Analogy & Core Breakthrough
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {activeChapter.intuition.analogy}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px', fontSize: '12px' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', borderLeft: '3px solid var(--accent-rose)', padding: '8px 12px', borderRadius: '0 6px 6px 0', color: 'var(--accent-rose)' }}>
                  <strong>Why Naive Fails:</strong> {activeChapter.intuition.whyNaiveFails}
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--accent-emerald)', padding: '8px 12px', borderRadius: '0 6px 6px 0', color: 'var(--accent-emerald)' }}>
                  <strong>Core Insight:</strong> {activeChapter.intuition.coreInsight}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            {[
              { id: 'architecture', label: '📐 Visual Architecture & Flow', icon: Compass },
              { id: 'lab', label: '🧪 Interactive Simulation Lab', icon: Zap },
              { id: 'deepdive', label: '💡 Deep Dive & Schemas', icon: Code2 },
              { id: 'tradeoffs', label: '⚖️ Trade-off Matrix', icon: BookOpen },
            ].map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Visual Architecture Diagram */}
          {activeTab === 'architecture' && (
            <InteractiveArchitectureDiagram
              nodes={activeChapter.architectureNodes}
              edges={activeChapter.architectureEdges}
              flowSteps={activeChapter.flowSteps}
            />
          )}

          {/* Tab 2: Interactive Simulation Lab */}
          {activeTab === 'lab' && (
            <div>{renderActiveLab()}</div>
          )}

          {/* Tab 3: Deep Dive Topics */}
          {activeTab === 'deepdive' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {activeChapter.deepDiveTopics.map((topic, i) => (
                <div key={i} className="glass-panel" style={{ padding: '22px' }}>
                  <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    {topic.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {topic.content}
                  </p>

                  {topic.codeSnippet && (
                    <div style={{ marginTop: '14px' }}>
                      {topic.codeSnippet.caption && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          {topic.codeSnippet.caption}
                        </div>
                      )}
                      <pre className="code-block">
                        <code>{topic.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {topic.callout && (
                    <div style={{ marginTop: '14px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid var(--accent-amber)', padding: '10px 14px', borderRadius: '0 6px 6px 0', fontSize: '12px', color: 'var(--accent-amber)' }}>
                      <strong>⚠️ Callout:</strong> {topic.callout.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Trade-off Matrix */}
          {activeTab === 'tradeoffs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {activeChapter.tradeoffs.map((t, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '22px' }}>
                  <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '14px' }}>
                    {t.approachA} vs {t.approachB}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                        {t.approachA}
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {t.prosA.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                      </ul>
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: '8px' }}>
                        {t.approachB}
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {t.prosB.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--accent-emerald)', padding: '10px 14px', borderRadius: '0 6px 6px 0', fontSize: '12px', color: 'var(--accent-emerald)' }}>
                    <strong>Senior Engineer Verdict:</strong> {t.verdict}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next / Previous Chapter Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
            <button
              className="btn btn-secondary"
              disabled={activeChapter.id <= 1}
              onClick={() => setSelectedChapterId(prev => Math.max(1, prev - 1))}
            >
              ← Previous Chapter
            </button>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Chapter {activeChapter.id} of {CHAPTERS.length}
            </span>

            <button
              className="btn btn-primary"
              disabled={activeChapter.id >= CHAPTERS.length}
              onClick={() => setSelectedChapterId(prev => Math.min(CHAPTERS.length, prev + 1))}
            >
              Next Chapter ({activeChapter.id + 1}) →
            </button>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showQuizModal && (
        <QuizModal
          questions={activeChapterQuizzes}
          chapterTitle={activeChapter.title}
          onClose={() => setShowQuizModal(false)}
          onMastered={() => toggleMastery(activeChapter.id)}
        />
      )}

      {showInterviewModal && (
        <InterviewWhiteboardModal onClose={() => setShowInterviewModal(false)} />
      )}

      {showEstimatorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => setShowEstimatorModal(false)}
              style={{ position: 'absolute', top: '16px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} color="var(--accent-cyan)" />
              Universal Back-of-the-Envelope Estimation Sizer
            </h3>
            <EstimatorCalculator />
          </div>
        </div>
      )}
    </div>
  );
};
