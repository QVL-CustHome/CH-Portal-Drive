import { CurrentUserProvider } from "canopui";
import { describe, expect, it, vi } from "vitest";
import DriveLayout from "./DriveLayout";
import { renderWithProviders, storageStub } from "../test/harness";
import type { Me } from "../api/auth";

vi.mock("../hooks/useStorage", () => ({
  useStorage: () => storageStub,
}));

const me: Me = {
  user_id: "u1",
  name: "Martin",
  email: "martin@example.com",
  roles: ["drive"],
  whitelist_only: false,
  created_at: "2026-01-01T00:00:00Z",
};

function renderLayout(mode: "light" | "dark") {
  const { container } = renderWithProviders(
    <CurrentUserProvider value={me}>
      <DriveLayout />
    </CurrentUserProvider>,
    mode,
  );
  return container;
}

function canopySources(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("video source")).map(
    (source) => source.getAttribute("src") ?? "",
  );
}

describe("DriveLayout — fond canopée", () => {
  it.each([
    ["light", "canopy-light"],
    ["dark", "canopy-dark"],
  ] as const)("affiche la vidéo canopée du thème %s servie sous /canopui/video", (mode, scene) => {
    const container = renderLayout(mode);

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("poster", `/canopui/video/${scene}-poster.jpg`);
    expect(canopySources(container)).toEqual([
      `/canopui/video/${scene}.webm`,
      `/canopui/video/${scene}.mp4`,
    ]);
  });

  it("n'affiche pas la scène de l'autre thème", () => {
    const container = renderLayout("dark");

    expect(canopySources(container).some((src) => src.includes("canopy-light"))).toBe(false);
  });
});
