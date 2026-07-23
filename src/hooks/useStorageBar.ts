import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
import { useStorageContext } from "../context/storage";

interface UseStorageBarResult {
  loading: boolean;
  hasError: boolean;
  percent: number;
  usedBytes: number;
  quotaBytes: number;
  isCompact: boolean;
}

export function useStorageBar(): UseStorageBarResult {
  const { storage, loading, loadError } = useStorageContext();
  const isCompact = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const quotaBytes = storage?.quota_bytes ?? 0;
  const usedBytes = storage?.used_bytes ?? 0;
  const ratio = quotaBytes > 0 ? Math.min(usedBytes / quotaBytes, 1) : 0;

  return {
    loading,
    hasError: loadError || !storage,
    percent: Math.round(ratio * 100),
    usedBytes,
    quotaBytes,
    isCompact,
  };
}
