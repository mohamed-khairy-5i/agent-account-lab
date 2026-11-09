import React, { useState } from 'react';
import type { Scenario } from '../../../src/types.ts';
import { SearchIcon } from './Icons.tsx';

interface ScenarioSidebarProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const ScenarioSidebar: React.FC<ScenarioSidebarProps> = ({ scenarios, activeId, onSelect }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'explicit' | 'ambiguous'>('all');

  const filtered = scenarios.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.title_ar.toLowerCase().includes(search.toLowerCase()) ||
      s.messages[0]?.content.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'explicit') return !s.oracle.require_clarification;
    if (filterType === 'ambiguous') return s.oracle.require_clarification;
    return true;
  });

  const explicitCount = scenarios.filter(s => !s.oracle.require_clarification).length;
  const ambiguousCount = scenarios.filter(s => s.oracle.require_clarification).length;

  return (
    <aside className="sidebar">
      <div className="sidebar-search-box">
        <input
          type="text"
          className="search-field"
          placeholder="بحث في السيناريوهات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="search-icon-pos">
          <SearchIcon size={14} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', padding: '0 12px 10px 12px' }}>
        <button
          className={`pill ${filterType === 'all' ? 'pill-indigo' : 'pill-neutral'}`}
          onClick={() => setFilterType('all')}
          style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
        >
          الكل ({scenarios.length})
        </button>
        <button
          className={`pill ${filterType === 'explicit' ? 'pill-indigo' : 'pill-neutral'}`}
          onClick={() => setFilterType('explicit')}
          style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
        >
          أهداف صريحة ({explicitCount})
        </button>
        <button
          className={`pill ${filterType === 'ambiguous' ? 'pill-amber' : 'pill-neutral'}`}
          onClick={() => setFilterType('ambiguous')}
          style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
        >
          حالات غموض ({ambiguousCount})
        </button>
      </div>

      <div className="scenario-list">
        {filtered.map(s => {
          const isSelected = s.id === activeId;
          const isClarification = s.oracle.require_clarification;

          return (
            <button
              key={s.id}
              className={`scenario-item-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(s.id)}
            >
              <div className="scenario-row-top">
                <span className="scenario-id-tag">{s.id}</span>
                {isClarification ? (
                  <span className="pill pill-amber" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    غموض يتطلب سؤالاً
                  </span>
                ) : (
                  <span className="pill pill-neutral" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    هدف صريح
                  </span>
                )}
              </div>
              <div className="scenario-name">{s.title_ar}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
