"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "amazonw_recent_searches";
const MAX_RECENT_SEARCHES = 5;

function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(terms: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — the
    // dropdown just won't have anything to show next time. Search itself
    // (a normal form submit) is unaffected either way.
  }
}

function recordSearch(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = readRecentSearches();
  const deduped = existing.filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
  writeRecentSearches([trimmed, ...deduped].slice(0, MAX_RECENT_SEARCHES));
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function openDropdown() {
    setRecent(readRecentSearches());
    setOpen(true);
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Only close once focus has genuinely left the whole widget (input +
    // dropdown buttons) — otherwise clicking a suggestion would blur the
    // input and hide the dropdown before the click is registered.
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  function handleSubmit() {
    recordSearch(query);
  }

  function selectRecent(term: string) {
    setQuery(term);
    setOpen(false);
    recordSearch(term);
    window.location.assign(`/s?k=${encodeURIComponent(term)}`);
  }

  function clearRecent(e: React.MouseEvent) {
    e.preventDefault();
    writeRecentSearches([]);
    setRecent([]);
  }

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="relative order-last w-full flex min-w-0 sm:order-none sm:w-auto sm:flex-1"
    >
      <form action="/s" method="GET" onSubmit={handleSubmit} className="flex w-full min-w-0">
        <input
          type="text"
          name="k"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={openDropdown}
          placeholder="Search amazonw"
          aria-label="Search products"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-l-md px-3 py-2 text-gray-900 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="shrink-0 rounded-r-md bg-amber-400 px-4 py-2 hover:bg-amber-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-900" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
          </svg>
        </button>
      </form>

      {open && recent.length > 0 && (
        <div className="absolute left-0 right-12 top-full z-40 mt-1 rounded-md border border-gray-200 bg-white shadow-lg text-gray-900">
          <ul className="py-1">
            {recent.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  onClick={() => selectRecent(term)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gray-400" fill="currentColor">
                    <path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1zm1 11.41 5.29 5.3-1.41 1.41-5.88-5.88V6h2z" />
                  </svg>
                  <span className="truncate">{term}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clearRecent}
            className="w-full border-t border-gray-200 px-3 py-1.5 text-left text-xs text-blue-700 hover:underline"
          >
            Clear recent searches
          </button>
        </div>
      )}
    </div>
  );
}
