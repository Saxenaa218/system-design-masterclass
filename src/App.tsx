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
  Moon,
  ArrowRight,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  BookmarkCheck
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
  const [filterMasteredOnly, setFilterMasteredOnly] = useState<boolean>(false);
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
      const matchesMastered = !filterMasteredOnly || !!masteredChapters[c.id];
      return matchesSearch && matchesCategory && matchesMastered;
    });
  }, [searchQuery, selectedCategory, filterMasteredOnly, masteredChapters]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { All: CHAPTERS.length };
    CATEGORIES.forEach(cat => {
      counts[cat] = CHAPTERS.filter(c => c.category === cat).length;
    });
    return counts;
  }, []);

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
          <div className="workbench-panel" style={{ padding: '36px', textAlign: 'center' }}>
            <Zap size={36} color="var(--signal-cyan)" style={{ margin: '0 auto 14px' }} />
            <h4 style={{ color: 'var(--text-primary)', fontSize: '18px' }}>Interactive Flow Simulation Active</h4>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '10px auto 18px' }}>
              Interact with the live animated topology graph in the "Visual Architecture & Flow" tab to trace packets and inspect component metrics.
            </p>
            <button className="btn btn-primary" onClick={() => setActiveTab('architecture')} style={{ fontSize: '14px', padding: '10px 18px' }}>
              Go to Architecture Flow
            </button>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Precision Top Utility Bar */}
      <header
        style={{
          height: '66px',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Enhanced Workbench Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-secondary"
            style={{
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: sidebarOpen ? '1px solid var(--border-active)' : '1px solid var(--border-glass)',
              background: sidebarOpen ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)'
            }}
            title={sidebarOpen ? "Hide Navigator" : "Show Navigator"}
          >
            {sidebarOpen ? <X size={16} color="var(--signal-cyan)" /> : <Menu size={16} />}
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {sidebarOpen ? 'Collapse' : 'Modules'}
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="var(--signal-cyan)" />
            </div>
            <div>
              <h1 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                System Design Blueprint
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Interactive Curriculum • 28 Modules
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '6px 14px', borderRadius: 'var(--radius-sm)' }}>
            <Award size={17} color="var(--signal-amber)" />
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {masteredCount}/{CHAPTERS.length} Mastered ({progressPercent}%)
            </span>
            <div style={{ width: '60px', height: '6px', background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--signal-emerald)' }} />
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setShowEstimatorModal(true)}
            style={{ fontSize: '13.5px', padding: '8px 14px' }}
          >
            <Calculator size={15} color="var(--signal-cyan)" /> Capacity Sizer
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowInterviewModal(true)}
            style={{ fontSize: '13.5px', padding: '8px 14px' }}
          >
            <Clock size={15} /> 45-Min Interview Board
          </button>

          {/* Theme Toggle */}
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '8px 14px' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
            <span style={{ fontSize: '13px', marginLeft: '5px' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Left Chapter Navigator Sidebar */}
        {sidebarOpen && (
          <aside
            style={{
              width: 'var(--sidebar-width)',
              background: 'var(--bg-deep)',
              borderRight: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 66px)',
              position: 'sticky',
              top: '66px',
              zIndex: 40
            }}
          >
            {/* Redesigned Sidebar Controls & Filter Bar */}
            <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              {/* Search Box with Clear Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search 28 topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none', width: '100%', fontFamily: 'var(--font-sans)' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: '0 2px' }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Curriculum Track
                  </span>
                  {/* Mastered Quick Filter Toggle */}
                  <button
                    onClick={() => setFilterMasteredOnly(!filterMasteredOnly)}
                    style={{
                      background: filterMasteredOnly ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: filterMasteredOnly ? '1px solid var(--signal-emerald)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '3px 7px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: filterMasteredOnly ? 'var(--signal-emerald)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Toggle mastered modules only"
                  >
                    <BookmarkCheck size={12} />
                    {filterMasteredOnly ? 'Mastered only' : 'All status'}
                  </button>
                </div>

                {/* Tactile Category Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['All', ...CATEGORIES].map(cat => {
                    const isCatSelected = selectedCategory === cat;
                    const count = categoryCounts[cat] || 0;

                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-xs)',
                          background: isCatSelected ? 'var(--signal-cyan)' : 'var(--bg-card)',
                          border: isCatSelected ? '1px solid var(--signal-cyan)' : '1px solid var(--border-glass)',
                          color: isCatSelected ? '#ffffff' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <span>{cat === 'Core Distributed Systems' ? 'Core Systems' : cat === 'Advanced Infrastructure' ? 'Adv. Infra' : cat}</span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontFamily: 'var(--font-mono)',
                            background: isCatSelected ? 'rgba(0,0,0,0.25)' : 'var(--border-subtle)',
                            color: isCatSelected ? '#ffffff' : 'var(--text-muted)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 700
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {filteredChapters.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No modules match your current search or filter.
                </div>
              ) : (
                filteredChapters.map((ch) => {
                  const isSelected = ch.id === activeChapter.id;
                  const isMastered = !!masteredChapters[ch.id];

                  return (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChapterId(ch.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--signal-cyan)' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--signal-cyan)' : 'var(--text-muted)' }}>
                          CH {ch.number}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${getDifficultyBadge(ch.difficulty)}`} style={{ fontSize: '10px', padding: '2px 7px' }}>
                            {ch.difficulty}
                          </span>
                          {isMastered && (
                            <CheckCircle2 size={14} color="var(--signal-emerald)" />
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {ch.title}
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} /> {ch.readTimeMin} min • {ch.category}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Main Content Blueprint Stage */}
        <main style={{ flex: 1, padding: '28px 36px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Chapter Header Banner */}
          <div className="workbench-panel" style={{ padding: '26px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className="badge badge-indigo" style={{ fontSize: '12px' }}>Chapter {activeChapter.number}</span>
                  <span className={`badge ${getDifficultyBadge(activeChapter.difficulty)}`} style={{ fontSize: '12px' }}>{activeChapter.difficulty}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {activeChapter.readTimeMin} min read
                  </span>
                </div>

                <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {activeChapter.title}
                </h2>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {activeChapter.summary}
                </p>
              </div>

              {/* Mark Mastered & Quiz Action */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className={`btn ${masteredChapters[activeChapter.id] ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleMastery(activeChapter.id)}
                  style={{ fontSize: '13.5px', padding: '9px 16px' }}
                >
                  <CheckCircle2 size={15} />
                  {masteredChapters[activeChapter.id] ? 'Mastered' : 'Mark as Mastered'}
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => setShowQuizModal(true)}
                  style={{ fontSize: '13.5px', padding: '9px 16px' }}
                >
                  <Award size={15} /> Knowledge Quiz ({activeChapterQuizzes.length})
                </button>
              </div>
            </div>

            {/* Intuition Callout Card */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--signal-cyan)', fontWeight: 700, fontSize: '13.5px' }}>
                <Sparkles size={16} /> Intuitive Analogy & Core Breakthrough
              </div>
              <p style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                {activeChapter.intuition.analogy}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px', fontSize: '13px' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.06)', borderLeft: '3px solid var(--signal-rose)', padding: '9px 13px', borderRadius: '0 4px 4px 0', color: 'var(--signal-rose)', lineHeight: 1.5 }}>
                  <strong>Why Naive Fails:</strong> {activeChapter.intuition.whyNaiveFails}
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.06)', borderLeft: '3px solid var(--signal-emerald)', padding: '9px 13px', borderRadius: '0 4px 4px 0', color: 'var(--signal-emerald)', lineHeight: 1.5 }}>
                  <strong>Core Insight:</strong> {activeChapter.intuition.coreInsight}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            {[
              { id: 'architecture', label: 'Visual Architecture & Flow', icon: Compass },
              { id: 'lab', label: 'Interactive Simulation Lab', icon: Zap },
              { id: 'deepdive', label: 'Deep Dive & Schemas', icon: Code2 },
              { id: 'tradeoffs', label: 'Trade-off Matrix', icon: BookOpen },
            ].map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '13.5px', padding: '8px 16px' }}
                >
                  <Icon size={15} /> {t.label}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeChapter.deepDiveTopics.map((topic, i) => (
                <div key={i} className="workbench-panel" style={{ padding: '22px 26px' }}>
                  <h4 style={{ fontSize: '17px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    {topic.title}
                  </h4>
                  <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {topic.content}
                  </p>

                  {topic.codeSnippet && (
                    <div style={{ marginTop: '14px' }}>
                      {topic.codeSnippet.caption && (
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                          {topic.codeSnippet.caption}
                        </div>
                      )}
                      <pre className="code-block">
                        <code>{topic.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}

                  {topic.callout && (
                    <div style={{ marginTop: '14px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid var(--signal-amber)', padding: '10px 14px', borderRadius: '0 4px 4px 0', fontSize: '13px', color: 'var(--signal-amber)' }}>
                      <strong>Note:</strong> {topic.callout.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Trade-off Matrix */}
          {activeTab === 'tradeoffs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeChapter.tradeoffs.map((t, idx) => (
                <div key={idx} className="workbench-panel" style={{ padding: '22px 26px' }}>
                  <h4 style={{ fontSize: '17px', color: 'var(--text-primary)', marginBottom: '14px' }}>
                    {t.approachA} vs {t.approachB}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--signal-cyan)', marginBottom: '8px' }}>
                        {t.approachA}
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '13.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.6 }}>
                        {t.prosA.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                      </ul>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--signal-indigo)', marginBottom: '8px' }}>
                        {t.approachB}
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '13.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.6 }}>
                        {t.prosB.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--signal-emerald)', padding: '10px 14px', borderRadius: '0 4px 4px 0', fontSize: '13.5px', color: 'var(--signal-emerald)' }}>
                    <strong>Senior Engineer Verdict:</strong> {t.verdict}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Module Pagination Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
            <button
              className="btn btn-secondary"
              disabled={activeChapter.id <= 1}
              onClick={() => setSelectedChapterId(prev => Math.max(1, prev - 1))}
              style={{ fontSize: '13.5px', padding: '8px 16px' }}
            >
              <ArrowLeft size={15} /> Previous Module
            </button>

            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Module {activeChapter.id} of {CHAPTERS.length}
            </span>

            <button
              className="btn btn-primary"
              disabled={activeChapter.id >= CHAPTERS.length}
              onClick={() => setSelectedChapterId(prev => Math.min(CHAPTERS.length, prev + 1))}
              style={{ fontSize: '13.5px', padding: '8px 16px' }}
            >
              Next Module ({activeChapter.id + 1}) <ArrowRight size={15} />
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
          <div className="workbench-panel" style={{ maxWidth: '980px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => setShowEstimatorModal(false)}
              style={{ position: 'absolute', top: '16px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '19px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} color="var(--signal-cyan)" />
              Universal Back-of-the-Envelope Estimation Workbench
            </h3>
            <EstimatorCalculator />
          </div>
        </div>
      )}
    </div>
  );
};
