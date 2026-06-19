import { useEffect, useState } from "react";

interface UseDebouncedSearchParams {
  enabled: boolean;
  onSearch: (query: string) => void;
  delay?: number;
}

interface UseDebouncedSearchResult {
  searchInput: string;
  setSearchInput: (value: string) => void;
}

export function useDebouncedSearch({
  enabled,
  onSearch,
  delay = 300,
}: UseDebouncedSearchParams): UseDebouncedSearchResult {
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const handle = window.setTimeout(() => onSearch(searchInput), delay);
    return () => window.clearTimeout(handle);
  }, [searchInput, enabled, onSearch, delay]);

  return { searchInput, setSearchInput };
}
