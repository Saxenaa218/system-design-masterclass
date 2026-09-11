import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, Database, Layers } from 'lucide-react';

interface TrieWord {
  word: string;
  frequency: number;
}

interface TrieNodeDisplay {
  char: string;
  path: string;
  isEnd: boolean;
  topSuggestions: { word: string; freq: number }[];
  children: { [char: string]: TrieNodeDisplay };
}

const INITIAL_DICTIONARY: TrieWord[] = [
  { word: 'system', frequency: 9500 },
  { word: 'system design', frequency: 18400 },
  { word: 'syntax', frequency: 4200 },
  { word: 'synonym', frequency: 3100 },
  { word: 'scale', frequency: 8900 },
  { word: 'scaling', frequency: 7600 },
  { word: 'server', frequency: 6200 },
  { word: 'database', frequency: 12000 },
  { word: 'data', frequency: 8000 },
  { word: 'distributed', frequency: 11500 },
];

export const TrieVisualizer: React.FC = () => {
  const [dictionary, setDictionary] = useState<TrieWord[]>(INITIAL_DICTIONARY);
  const [searchPrefix, setSearchPrefix] = useState<string>('sys');
  const [newWord, setNewWord] = useState<string>('');
  const [newFreq, setNewFreq] = useState<number>(5000);

  // Build Trie in-memory with precomputed top-5 suggestions
  const trieRoot = useMemo(() => {
    const root: TrieNodeDisplay = { char: 'ROOT', path: '', isEnd: false, topSuggestions: [], children: {} };

    // Insert all dictionary items
    dictionary.forEach(({ word, frequency }) => {
      let current = root;
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (!current.children[ch]) {
          current.children[ch] = {
            char: ch,
            path: word.slice(0, i + 1),
            isEnd: false,
            topSuggestions: [],
            children: {}
          };
        }
        current = current.children[ch];
      }
      current.isEnd = true;
    });

    // Offline Precomputation Pass: populate topSuggestions at each node
    const computeTopSuggestions = (node: TrieNodeDisplay) => {
      const allMatches: { word: string; freq: number }[] = [];
      const dfs = (curr: TrieNodeDisplay) => {
        if (curr.isEnd) {
          const dictEntry = dictionary.find(d => d.word === curr.path);
          if (dictEntry) allMatches.push({ word: dictEntry.word, freq: dictEntry.frequency });
        }
        Object.values(curr.children).forEach(child => dfs(child));
      };

      dfs(node);
      allMatches.sort((a, b) => b.freq - a.freq);
      node.topSuggestions = allMatches.slice(0, 5);

      Object.values(node.children).forEach(child => computeTopSuggestions(child));
    };

    computeTopSuggestions(root);
    return root;
  }, [dictionary]);

  // Find active node matching searchPrefix
  const activeNode = useMemo(() => {
    let current: TrieNodeDisplay | null = trieRoot;
    const cleanPrefix = searchPrefix.toLowerCase();
    for (let i = 0; i < cleanPrefix.length; i++) {
      const ch = cleanPrefix[i];
      if (!current || !current.children[ch]) {
        return null;
      }
      current = current.children[ch];
    }
    return current;
  }, [trieRoot, searchPrefix]);

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    const clean = newWord.trim().toLowerCase();
    setDictionary(prev => {
      const existing = prev.filter(w => w.word !== clean);
      return [...existing, { word: clean, frequency: newFreq }];
    });
    setNewWord('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search Input Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={20} color="var(--accent-cyan)" />
          <input
            type="text"
            placeholder="Type query prefix (e.g. sys, sc, dat)..."
            value={searchPrefix}
            onChange={(e) => setSearchPrefix(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              width: '100%',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>

        {/* Add Word Form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Add new word"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              color: '#fff',
              fontSize: '12px',
              width: '130px'
            }}
          />
          <input
            type="number"
            placeholder="Freq"
            value={newFreq}
            onChange={(e) => setNewFreq(Number(e.target.value))}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              color: '#fff',
              fontSize: '12px',
              width: '70px'
            }}
          />
          <button className="btn btn-secondary" onClick={handleAddWord} style={{ padding: '6px 12px', fontSize: '12px' }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(280px, 340px)', gap: '20px' }}>
        {/* Interactive Trie Path Visualization */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="badge badge-cyan">In-Memory Trie Traversal Path</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Lookup Time: O(p) = O({searchPrefix.length})
            </span>
          </div>

          {/* Breadcrumb Path Nodes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ padding: '8px 14px', background: '#1e293b', borderRadius: '8px', border: '1px solid var(--border-glass)', color: '#94a3b8', fontWeight: 700, fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              ROOT
            </div>

            {searchPrefix.split('').map((char, index) => {
              const subPath = searchPrefix.slice(0, index + 1);
              return (
                <React.Fragment key={index}>
                  <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
                  <div
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid var(--accent-cyan)',
                      borderRadius: '8px',
                      boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)',
                      color: '#22d3ee',
                      fontWeight: 800,
                      fontSize: '15px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    '{char}' <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>({subPath})</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Visual Trie Tree Branches */}
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Subtree Child Branches at Current Prefix:
            </span>

            {activeNode ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.keys(activeNode.children).length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Leaf node — no further sub-branches.
                  </div>
                ) : (
                  Object.values(activeNode.children).map(child => (
                    <div
                      key={child.char}
                      onClick={() => setSearchPrefix(searchPrefix + child.char)}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        +{child.char} ({child.path})
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {child.topSuggestions.length} cached suggestions
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>
                No Trie node matches prefix "{searchPrefix}".
              </div>
            )}
          </div>
        </div>

        {/* Precomputed Top-K Autocomplete Results Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--accent-amber)" />
              Precomputed Top-5
            </h4>
            <span className="badge badge-indigo">O(1) Instant</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeNode && activeNode.topSuggestions.length > 0 ? (
              activeNode.topSuggestions.map((s, idx) => (
                <div
                  key={s.word}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)' }}>#{idx + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{searchPrefix}</strong>
                      {s.word.slice(searchPrefix.length)}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                    {s.freq.toLocaleString()} searches
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                No autocomplete suggestions for "{searchPrefix}".
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto' }}>
            <strong>Why this is blazing fast:</strong> Because top 5 queries are precomputed offline inside each Trie node, no subtree DFS search is executed at query time!
          </div>
        </div>
      </div>
    </div>
  );
};
