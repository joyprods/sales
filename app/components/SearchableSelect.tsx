// app/components/SearchableSelect.tsx
'use client';

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
  useTransition,
  useDeferredValue,
  memo
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 8;
const OVERSCAN = 3;
const LIST_HEIGHT = VISIBLE_COUNT * ITEM_HEIGHT; // 320px, fixed — no recompute needed

// ── VirtualRow: memoized so unchanged rows never re-render ───────────────────
const VirtualRow = memo(function VirtualRow({
  option,
  top,
  isSelected,
  onSelect
}: {
  option: string;
  top: number;
  isSelected: boolean;
  onSelect: (val: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT
      }}
      onClick={() => onSelect(option)}
      className={`
        flex items-center cursor-pointer
        mx-1.5 px-3 rounded-lg
        text-sm text-slate-800 dark:text-slate-200
        transition-colors duration-75
        hover:bg-slate-100 dark:hover:bg-slate-800
        ${isSelected ? 'bg-slate-50 dark:bg-slate-800/60 font-medium' : ''}
      `}
    >
      {isSelected ? (
        <CheckIcon className='h-3.5 w-3.5 mr-2.5 text-emerald-600 dark:text-emerald-400 shrink-0' />
      ) : (
        <span className='w-[22px] shrink-0' />
      )}
      <span className='truncate' title={option}>{option}</span>
    </div>
  );
});

// ── Main Component ───────────────────────────────────────────────────────────
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyLabel: string;
  label: string;
  allowCustom?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  disabled = false,
  loading = false,
  emptyLabel,
  label,
  allowCustom = false
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(''); // raw input — always snappy
  const [scrollTop, setScrollTop] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // useTransition: marks filtering as low-priority so typing is never blocked
  const [isPending, startTransition] = useTransition();

  // useDeferredValue: React 18 — filter runs after paint if under load
  const search = useDeferredValue(inputValue);

  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Filtering ──────────────────────────────────────────────────────────────
  // Runs deferred — won't block the input from updating
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lower));
  }, [options, search]);

  // ── Virtual window ─────────────────────────────────────────────────────────
  const totalHeight = filteredOptions.length * ITEM_HEIGHT;
  const visibleListHeight = Math.min(
    filteredOptions.length * ITEM_HEIGHT,
    LIST_HEIGHT
  );

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN
  );
  const endIndex = Math.min(
    filteredOptions.length - 1,
    Math.ceil((scrollTop + visibleListHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  // Stable onSelect so VirtualRow memo isn't busted on every parent render
  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
    },
    [onChange]
  );

  // ── Portal positioning ─────────────────────────────────────────────────────
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward =
      spaceBelow < LIST_HEIGHT + 60 && rect.top > LIST_HEIGHT + 60;

    const alignRight = rect.left + rect.width / 2 > window.innerWidth / 2;

    setDropdownStyle({
      position: 'fixed',
      width: 'max-content',
      minWidth: rect.width,
      maxWidth: alignRight 
        ? Math.min(600, rect.right - 16) 
        : Math.min(600, window.innerWidth - rect.left - 16),
      ...(alignRight
        ? { right: window.innerWidth - rect.right }
        : { left: rect.left }),
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
      zIndex: 9999
    });
  }, []);

  useEffect(() => {
    if (!open) {
      // Defer reset so closing animation isn't janky
      const t = setTimeout(() => {
        setInputValue('');
        setScrollTop(0);
      }, 150);
      return () => clearTimeout(t);
    }

    updatePosition();
    setTimeout(() => inputRef.current?.focus(), 20);

    const handleClose = (e: MouseEvent) => {
      const portal = document.getElementById('ss-portal');
      if (portal?.contains(e.target as Node)) return;
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    // passive: true tells the browser this listener won't call preventDefault
    // allowing it to optimise scroll painting on its own thread
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', updatePosition, {
      passive: true,
      capture: true
    });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  // Reset scroll when deferred search settles
  useEffect(() => {
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [search]);

  // Scroll to selected on open
  useLayoutEffect(() => {
    if (!open || !value) return;
    const idx = options.indexOf(value);
    if (idx !== -1 && listRef.current) {
      const target = Math.max(0, idx * ITEM_HEIGHT - LIST_HEIGHT / 2);
      listRef.current.scrollTop = target;
      setScrollTop(target);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasValue = !!(value && value !== '');

  const dropdown = open
    ? createPortal(
        <div
          id='ss-portal'
          style={dropdownStyle}
          className='
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            rounded-xl shadow-xl overflow-hidden
            animate-in fade-in zoom-in-95 duration-150
          '
        >
          {/* Search */}
          <div className='border-b border-slate-100 dark:border-slate-800 px-3 py-2 flex items-center gap-2'>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                const v = e.target.value;
                setInputValue(v); // instant
                startTransition(() => {}); // nudge React to prioritise this
              }}
              placeholder={placeholder}
              className='
                flex-1 bg-transparent outline-none
                text-sm text-slate-800 dark:text-slate-200
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                py-1.5 px-1
              '
            />
            {/* Subtle pending indicator — only shows under heavy load */}
            {isPending && (
              <span className='h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse shrink-0' />
            )}
          </div>

          {/* Result count */}
          {search && filteredOptions.length > 0 && (
            <div className='px-4 py-1 text-[11px] text-slate-400 border-b border-slate-50 dark:border-slate-800/50'>
              {filteredOptions.length.toLocaleString()} result
              {filteredOptions.length !== 1 ? 's' : ''}
            </div>
          )}

          {allowCustom && inputValue.trim() !== '' && !options.some(opt => opt.toLowerCase() === inputValue.trim().toLowerCase()) && (
            <div
              onClick={() => handleSelect(inputValue.trim().toUpperCase())}
              className='flex items-center cursor-pointer mx-1.5 my-1 px-3 py-2.5 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50'
            >
              <span className='mr-2 font-bold'>+</span> Add &quot;{inputValue.trim().toUpperCase()}&quot;
            </div>
          )}

          {/* Virtual list */}
          {filteredOptions.length === 0 ? (
            allowCustom && inputValue.trim() !== '' ? null : (
              <div className='py-10 text-center text-sm text-slate-400'>
                No results found.
              </div>
            )
          ) : (
            <div
              ref={listRef}
              style={{ height: visibleListHeight, overflowY: 'auto' }}
              onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                {filteredOptions
                  .slice(startIndex, endIndex + 1)
                  .map((option, i) => (
                    <VirtualRow
                      key={option}
                      option={option}
                      top={(startIndex + i) * ITEM_HEIGHT}
                      isSelected={option === value}
                      onSelect={handleSelect}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className='relative w-full'>
      <div
        ref={triggerRef}
        className={`input min-h-[50px] py-2 flex items-center justify-between cursor-pointer transition-all duration-200 border border-slate-200 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
        } ${open ? 'ring-2 ring-primary/20 border-primary bg-white' : 'bg-slate-50/30'}`}
        onClick={() => !disabled && !loading && setOpen((p) => !p)}
      >
        <span
          title={value || placeholder}
          className={`whitespace-normal break-words pr-4 text-[16px] tracking-tight transition-colors ${
            !hasValue || loading ? 'text-slate-400' : 'text-slate-900'
          }`}
        >
          {loading ? `Loading ${label} data...` : value || placeholder}
        </span>
        <ChevronDownIcon
          className={`size-4 transition-all duration-300 ${
            open
              ? 'rotate-180 text-primary opacity-100'
              : 'text-slate-400 opacity-60'
          } ${hasValue && !open ? 'text-slate-600 opacity-80' : ''}`}
        />
      </div>

      {dropdown}
    </div>
  );
}
