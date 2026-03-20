'use client';

import { useState, FormEvent } from 'react';
import { useAPI } from '@/lib/useAPI';
import { useAppStore } from '@/lib/store';
import { Search, Loader2, Star, ChevronRight } from 'lucide-react';
import type { SearchResponseItem } from '@/types';

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [page, setPage] = useState(1);
  const searchResults = useAppStore((s) => s.searchResults);
  const setSearchResults = useAppStore((s) => s.setSearchResults);
  const isSearching = useAppStore((s) => s.isSearching);
  const setIsSearching = useAppStore((s) => s.setIsSearching);
  const setSelectedSeries = useAppStore((s) => s.setSelectedSeries);
  const setEpisodes = useAppStore((s) => s.setEpisodes);
  const addNotification = useAppStore((s) => s.addNotification);
  const service = useAppStore((s) => s.service);
  const { search } = useAPI();

  const handleSearch = async (e?: FormEvent, pageNum = 1) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setPage(pageNum);
    try {
      const result = await search({
        search: query,
        page: pageNum,
        ...(searchType ? { 'search-type': searchType } : {}),
      });
      if (result.isOk) {
        setSearchResults(result.value);
      } else {
        addNotification(`Search failed: ${result.reason.message}`, 'error');
      }
    } catch {
      addNotification('Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSeries = (item: SearchResponseItem) => {
    setSelectedSeries(item);
    setEpisodes([]);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime..."
              className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {service === 'crunchy' && (
          <div className="flex gap-2 flex-wrap">
            {['', 'series', 'movie_listing', 'episode'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSearchType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  searchType === type
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-muted hover:text-foreground hover:border-primary/30'
                }`}
              >
                {type || 'All'}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Results */}
      <div className="space-y-2">
        {searchResults.map((item) => (
          <SearchResultCard
            key={item.id}
            item={item}
            onSelect={handleSelectSeries}
          />
        ))}

        {searchResults.length > 0 && (
          <div className="flex justify-center gap-2 pt-2">
            {page > 1 && (
              <button
                onClick={() => handleSearch(undefined, page - 1)}
                className="px-4 py-1.5 text-sm border border-border rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
              >
                Previous
              </button>
            )}
            <span className="px-4 py-1.5 text-sm text-muted">Page {page}</span>
            <button
              onClick={() => handleSearch(undefined, page + 1)}
              className="px-4 py-1.5 text-sm border border-border rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
            >
              Next
            </button>
          </div>
        )}

        {!isSearching && searchResults.length === 0 && query && (
          <div className="text-center py-12 text-muted">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No results found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({
  item,
  onSelect,
}: {
  item: SearchResponseItem;
  onSelect: (item: SearchResponseItem) => void;
}) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="w-full flex gap-4 bg-surface border border-border rounded-xl p-3 text-left hover:border-primary/30 hover:bg-surface-hover transition-all group"
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-14 aspect-[2/3] rounded-lg object-cover flex-shrink-0 bg-background"
          loading="lazy"
        />
      ) : (
        <div className="w-14 aspect-[2/3] rounded-lg bg-background flex-shrink-0 flex items-center justify-center text-muted/30 text-xs">
          N/A
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        {item.desc && (
          <p className="text-sm text-muted line-clamp-2 mt-1">{item.desc}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {item.rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Star className="w-3 h-3 fill-current" />
              {(item.rating / 20).toFixed(1)}
            </span>
          )}
          {item.lang && item.lang.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {item.lang.slice(0, 5).map((l) => (
                <span
                  key={l}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted uppercase"
                >
                  {l}
                </span>
              ))}
              {item.lang.length > 5 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted">
                  +{item.lang.length - 5}
                </span>
              )}
            </div>
          )}
          <span className="text-[10px] text-muted font-mono">{item.id}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted/30 group-hover:text-primary self-center transition-colors" />
    </button>
  );
}
