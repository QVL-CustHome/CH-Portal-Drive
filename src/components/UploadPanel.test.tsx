import { render, screen, waitFor } from "@testing-library/react";
import { ChI18nProvider, ChThemeProvider } from "canopui";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UploadPanel from "./UploadPanel";
import { UploadContext, type UploadContextValue } from "../context/upload";
import { defaultLocale, messages } from "../i18n/messages";

function file(): UploadContextValue["items"][number] {
  return {
    id: "1",
    label: "a.txt",
    file: new File(["x"], "a.txt"),
    segments: [],
    parentId: "root",
    status: "done",
  };
}

function queue(overrides: Partial<UploadContextValue> = {}): UploadContextValue {
  return {
    items: [file()],
    paused: false,
    running: false,
    total: 1,
    done: 1,
    skipped: 0,
    failed: 0,
    remaining: 0,
    finished: true,
    progression: null,
    lastBatchAt: 1,
    enqueue: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    retryFailed: vi.fn(),
    dismiss: vi.fn(),
    ...overrides,
  };
}

function monter(value: UploadContextValue) {
  return render(
    <ChI18nProvider locale={defaultLocale} messages={messages} storageKey={null}>
      <ChThemeProvider defaultMode="light">
        <UploadContext.Provider value={value}>
          <UploadPanel />
        </UploadContext.Provider>
      </ChThemeProvider>
    </ChI18nProvider>
  );
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("UploadPanel", () => {
  it("s'efface tout seul une fois l'envoi terminé", async () => {
    const value = queue();
    monter(value);

    expect(value.dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4000);
    await waitFor(() => expect(value.dismiss).toHaveBeenCalledTimes(1));
  });

  it("reste affiché tant qu'il y a des échecs, pour laisser réessayer", async () => {
    const value = queue({ done: 0, failed: 1, items: [{ ...file(), status: "error" }] });
    monter(value);

    vi.advanceTimersByTime(20000);
    expect(value.dismiss).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /réessayer/i })).toBeInTheDocument();
  });

  it("ne s'efface pas pendant que l'envoi tourne encore", async () => {
    const value = queue({
      finished: false,
      running: true,
      done: 0,
      remaining: 1,
      items: [{ ...file(), status: "uploading" }],
    });
    monter(value);

    vi.advanceTimersByTime(20000);
    expect(value.dismiss).not.toHaveBeenCalled();
  });
});
