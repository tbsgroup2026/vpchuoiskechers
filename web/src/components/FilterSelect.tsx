'use client';

import { useEffect, useRef, useState } from 'react';

type Option = { id: string; name: string };

const SEARCH_THRESHOLD = 10;

export default function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const baseClass =
    className ?? 'px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:opacity-50';

  if (options.length <= SEARCH_THRESHOLD) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={baseClass}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    );
  }

  const selected = options.find((o) => o.id === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        value={open ? query : (selected?.name ?? '')}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        className={`${baseClass} w-full cursor-text disabled:cursor-not-allowed`}
      />
      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
              setQuery('');
            }}
            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-50"
          >
            {placeholder}
          </button>
          {filtered.length === 0 && <div className="px-3 py-1.5 text-xs text-slate-400">Không tìm thấy</div>}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
                setQuery('');
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-emerald-50 ${
                o.id === value ? 'text-[#006838] bg-emerald-50' : 'text-slate-700'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
