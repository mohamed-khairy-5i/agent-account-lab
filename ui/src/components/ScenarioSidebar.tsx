import React, { useState } from 'react';
import type { Scenario } from '../../../src/types.ts';
import { SearchIcon } from './Icons.tsx';
import { useLanguage } from '../i18n.tsx';

interface ScenarioSidebarProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const ScenarioSidebar: React.FC<ScenarioSidebarProps> = ({ scenarios, activeId, onSelect }) => {
  const { t, getScenarioTitle } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'explicit' | 'ambiguous'>('all');

  const filtered = scenarios.filter(s => {
    const title = getScenarioTitle(s.id, s.title_ar);
    const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase()) ||
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
          placeholder={t.search_placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="search-icon-pos">
          <SearchIcon size={14} />
        </div>
      </div>

      <div className="filter-segmented-control">
        <button
          className={`filter-tab-btn ${filterType === 'all' ? 'active-all' : ''}`}
          onClick={() => setFilterType('all')}
          title={t.filter_all}
        >
          <span className="filter-tab-label">{t.filter_all}</span>
          <span className="filter-tab-count">{scenarios.length}</span>
        </button>
        <button
          className={`filter-tab-btn ${filterType === 'explicit' ? 'active-explicit' : ''}`}
          onClick={() => setFilterType('explicit')}
          title={t.filter_explicit}
        >
          <span className="filter-tab-label">{t.filter_explicit}</span>
          <span className="filter-tab-count">{explicitCount}</span>
        </button>
        <button
          className={`filter-tab-btn ${filterType === 'ambiguous' ? 'active-ambiguous' : ''}`}
          onClick={() => setFilterType('ambiguous')}
          title={t.filter_ambiguous}
        >
          <span className="filter-tab-label">{t.filter_ambiguous}</span>
          <span className="filter-tab-count">{ambiguousCount}</span>
        </button>
      </div>

      <div className="scenario-list">
        {filtered.map(s => {
          const isSelected = s.id === activeId;
          const isClarification = s.oracle.require_clarification;
          const title = getScenarioTitle(s.id, s.title_ar);

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
                    {t.filter_ambiguous}
                  </span>
                ) : (
                  <span className="pill pill-neutral" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    {t.filter_explicit}
                  </span>
                )}
              </div>
              <div className="scenario-name">{title}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
