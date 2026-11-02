import React, { ReactNode } from 'react';
import { dsTokens } from '../tokens';

export interface DSTableColumn<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (item: T) => ReactNode;
}

export interface DSTableProps<T> {
  columns: DSTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DSTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No se encontraron registros.',
  emptyAction,
  onRowClick,
  className = '',
}: DSTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 animate-pulse">
        Cargando datos...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center">
        <p className="text-sm text-slate-500 mb-3">{emptyMessage}</p>
        {emptyAction && <div>{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : ''
              } ${dsTokens.transitions.default}`}
            >
              {columns.map((col) => {
                const content = col.render
                  ? col.render(item)
                  : (item as any)[col.key];

                return (
                  <td
                    key={col.key}
                    className={`py-3 px-4 text-slate-700 ${
                      col.align === 'right'
                        ? `text-right ${dsTokens.typography.fontNumeric}`
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
