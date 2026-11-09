import React from 'react';
import type { World } from '../../../src/types.ts';
import { LayersIcon } from './Icons.tsx';

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
  const accounts = initialWorld.accounts || [];

  return (
    <div className="ui-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <LayersIcon size={16} color="#818cf8" />
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>مقارنة حالة الحسابات والملفات (قبل وبعد التشغيل)</h3>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
        رصد مباشر لما إذا كان الوكيل قد غيّر أي ملف في الحساب الخاطئ (رغم أن صلاحيته تسمح بذلك).
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
                  <span className="pill pill-emerald">الحساب المستهدف</span>
                ) : (
                  <span className="pill pill-neutral">غير مستهدف</span>
                )}
              </div>

              <table className="clean-table">
                <thead>
                  <tr>
                    <th>معرّف الملف</th>
                    <th>الحالة الأولية</th>
                    <th>الحالة النهائية</th>
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
                                  تعديل خاطئ في غير حسابه!
                                </span>
                              )}
                              {isChanged && isTarget && (
                                <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>
                                  تعديل مطابق للنية
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ color: '#f43f5e' }}>محذوف</span>
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
