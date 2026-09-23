import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Admin from "./Admin";
import * as drive from "../api/drive";
import { renderWithProviders } from "../test/harness";

vi.mock("../api/drive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/drive")>();
  return { ...actual, listDriveUsers: vi.fn() };
});

const listDriveUsers = vi.mocked(drive.listDriveUsers);

beforeEach(() => {
  listDriveUsers.mockResolvedValue([
    {
      user_id: "u1",
      quota_bytes: 10 * 1024 ** 3,
      used_bytes: 1024 ** 3,
      created_at: "2026-01-01T00:00:00Z",
      name: "Martin",
      email: "martin@example.com",
    },
  ]);
});

describe("Admin", () => {
  it.each(["Recalculer l'utilisation", "Modifier le quota"])(
    "expose l'action %s avec son aria-label",
    async (label) => {
      renderWithProviders(<Admin />);

      const button = await screen.findByRole("button", { name: label });

      expect(button).toHaveAttribute("aria-label", label);
    },
  );
});
