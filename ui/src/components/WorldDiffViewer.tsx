import React from 'react';
import type { World } from '../../../src/types.ts';
import { LayersIcon } from './Icons.tsx';
import { useLanguage } from '../i18n.tsx';

interface WorldDiffViewerProps {
  initialWorld: World;
  finalWorld: World;
  targetAccountId: string;
}

export const WorldDiffViewer: React.FC<WorldDiffViewerProps> = ({
  initialWorld,
  finalWorld,
  targetAccountId
}) => {
  const { lang, t } = useLanguage();
  const accounts = initialWorld.accounts || [];

  return (
    <div className="ui-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <LayersIcon size={16} color="#818cf8" />
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{t.diff_title}</h3>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
        {t.diff_sub}
      </p>

      <div className="diff-container-grid">
        {accounts.map(acc => {
          const isTarget = acc.account_id === targetAccountId;
          const initialFiles = initialWorld.files.filter(f => f.account_id === acc.account_id);
          const finalFiles = finalWorld.files.filter(f => f.account_id === acc.account_id);

          return (
            <div key={acc.account_id} className="account-card">
              <div className="account-card-header">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{acc.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {acc.email} · {acc.account_id}
                  </div>
                </div>

                {isTarget ? (
                  <span className="pill pill-emerald">{lang === 'ar' ? 'الحساب المستهدف' : 'Target Account'}</span>
                ) : (
                  <span className="pill pill-neutral">{lang === 'ar' ? 'غير مستهدف' : 'Non-Target'}</span>
                )}
              </div>

              <table className="clean-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'معرّف الملف' : 'File ID'}</th>
                    <th>{t.state_before}</th>
                    <th>{t.state_after}</th>
                  </tr>
                </thead>
                <tbody>
                  {initialFiles.map(initFile => {
                    const finalFile = finalFiles.find(f => f.file_id === initFile.file_id);
                    const nameChanged = finalFile && finalFile.name !== initFile.name;
                    const folderChanged = finalFile && finalFile.folder_id !== initFile.folder_id;
                    const isChanged = nameChanged || folderChanged;

                    let rowClass = '';
                    if (isChanged) {
                      rowClass = isTarget ? 'table-row-target-mutated' : 'table-row-fault';
                    }

                    return (
                      <tr key={initFile.file_id} className={rowClass}>
                        <td className="font-mono" style={{ fontSize: '0.72rem' }}>{initFile.file_id}</td>
                        <td>
                          <div>{initFile.name}</div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            [{initFile.folder_id}]
                          </span>
                        </td>
                        <td>
                          {finalFile ? (
                            <>
                              <div>{finalFile.name}</div>
                              {isChanged && !isTarget && (
                                <span style={{ color: '#f43f5e', fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>
                                  {lang === 'ar' ? 'تعديل خاطئ في غير حسابه!' : 'Wrong-Account Mutation!'}
                                </span>
                              )}
                              {isChanged && isTarget && (
                                <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>
                                  {lang === 'ar' ? 'تعديل مطابق للنية' : 'Intended Mutation Observed'}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ color: '#f43f5e' }}>{lang === 'ar' ? 'محذوف' : 'Deleted'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};
