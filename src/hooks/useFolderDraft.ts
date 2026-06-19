import { useRef, useState } from "react";

interface UseFolderDraftParams {
  onCreate: (name: string) => Promise<unknown>;
}

interface UseFolderDraftResult {
  adding: boolean;
  draftName: string;
  setDraftName: (name: string) => void;
  startAdd: () => void;
  commitDraft: () => Promise<void>;
  cancelDraft: () => void;
}

export function useFolderDraft({ onCreate }: UseFolderDraftParams): UseFolderDraftResult {
  const committingRef = useRef(false);
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");

  const startAdd = () => {
    setDraftName("");
    setAdding(true);
  };

  const commitDraft = async () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const name = draftName.trim();
    setAdding(false);
    setDraftName("");
    if (name) await onCreate(name);
    committingRef.current = false;
  };

  const cancelDraft = () => {
    committingRef.current = true;
    setAdding(false);
    setDraftName("");
    window.setTimeout(() => {
      committingRef.current = false;
    }, 0);
  };

  return { adding, draftName, setDraftName, startAdd, commitDraft, cancelDraft };
}
