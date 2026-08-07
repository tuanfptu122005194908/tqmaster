import React from 'react';
import { TABLE_SCHEMAS, TableSchema } from '@/lib/excelBackup';
import { Download } from 'lucide-react';

const GROUP_LABELS: Record<string, string> = {
  content: '📚 Nội dung học',
  other: '📰 Tin tức & Khác',
  transaction: '🔒 Giao dịch (chỉ Export)',
};

interface BackupTableSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  mode: 'export' | 'import'; // import hides non-importable tables
}

export default function BackupTableSelector({ selected, onChange, mode }: BackupTableSelectorProps) {
  const schemas = mode === 'import'
    ? TABLE_SCHEMAS.filter((s) => s.importable)
    : TABLE_SCHEMAS;

  const groups = ['content', 'other', 'transaction'] as const;

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const selectGroup = (group: string) => {
    const groupTables = schemas.filter((s) => s.group === group).map((s) => s.name);
    const allSelected = groupTables.every((t) => selected.includes(t));
    if (allSelected) {
      onChange(selected.filter((s) => !groupTables.includes(s)));
    } else {
      const newSelected = [...new Set([...selected, ...groupTables])];
      onChange(newSelected);
    }
  };

  const selectAll = () => {
    if (selected.length === schemas.length) {
      onChange([]);
    } else {
      onChange(schemas.map((s) => s.name));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Global Select All */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
          Chọn bảng dữ liệu ({selected.length}/{schemas.length})
        </span>
        <button
          onClick={selectAll}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#3b82f6',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            padding: '4px 12px',
            cursor: 'pointer',
          }}
        >
          {selected.length === schemas.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>

      {/* Group Sections */}
      {groups.map((group) => {
        const groupSchemas = schemas.filter((s) => s.group === group);
        if (groupSchemas.length === 0) return null;
        const allGroupSelected = groupSchemas.every((s) => selected.includes(s.name));

        return (
          <div key={group} style={{
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Group header */}
            <div
              style={{
                padding: '10px 14px',
                background: group === 'transaction' ? '#fef9ec' : '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (group !== 'transaction' || mode === 'export') selectGroup(group);
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: group === 'transaction' ? '#b45309' : '#475569' }}>
                {GROUP_LABELS[group]}
              </span>
              {(group !== 'transaction' || mode === 'export') && (
                <input
                  type="checkbox"
                  checked={allGroupSelected}
                  onChange={() => selectGroup(group)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 15, height: 15, accentColor: '#3b82f6', cursor: 'pointer' }}
                />
              )}
            </div>

            {/* Table list */}
            <div style={{ padding: '8px 0' }}>
              {groupSchemas.map((schema) => {
                const isSelected = selected.includes(schema.name);
                const isReadOnly = group === 'transaction' && mode === 'import';

                return (
                  <label
                    key={schema.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      cursor: isReadOnly ? 'not-allowed' : 'pointer',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      transition: 'background 0.12s',
                      opacity: isReadOnly ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isReadOnly && !isSelected) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isReadOnly && !isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isReadOnly}
                      onChange={() => !isReadOnly && toggle(schema.name)}
                      style={{ width: 15, height: 15, accentColor: '#3b82f6', cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {schema.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8, fontFamily: 'monospace' }}>
                        {schema.name}
                      </span>
                    </span>
                    {!schema.importable && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#b45309',
                        background: '#fef3c7', border: '1px solid #fde68a',
                        borderRadius: 6, padding: '2px 7px',
                      }}>
                        Read-only
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
