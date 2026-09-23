import { screen, waitFor } from "@testing-library/react";
import { CanopApiError } from "canopui";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RequireDrive from "./RequireDrive";
import { ApiError } from "../api/client";
import * as auth from "../api/auth";
import * as navigation from "../lib/navigation";
import { renderWithProviders } from "../test/harness";

vi.mock("../api/auth", () => ({ getMe: vi.fn() }));
vi.mock("../lib/navigation", () => ({ navigateTo: vi.fn() }));

const getMe = vi.mocked(auth.getMe);
const navigateTo = vi.mocked(navigation.navigateTo);

function renderGuard() {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireDrive />}>
        <Route path="*" element={<p>Contenu protégé</p>} />
      </Route>
      <Route path="/forbidden" element={<p>Accès refusé</p>} />
    </Routes>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApiError", () => {
  it("reste importable depuis api/client comme alias de CanopApiError", () => {
    expect(ApiError).toBe(CanopApiError);
    expect(new ApiError(409, "conflit")).toMatchObject({ status: 409, message: "conflit" });
  });
});

describe("RequireDrive", () => {
  it("redirige vers la page de connexion sur un ApiError 401", async () => {
    getMe.mockRejectedValue(new ApiError(401, "non authentifié"));

    renderGuard();

    await waitFor(() => expect(navigateTo).toHaveBeenCalledTimes(1));
    expect(navigateTo.mock.calls[0]![0]).toContain("/login");
    expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
  });

  it("affiche l'erreur de session sans rediriger sur une autre erreur d'API", async () => {
    getMe.mockRejectedValue(new ApiError(500, "panne"));

    renderGuard();

    expect(await screen.findByText(/Impossible de vérifier votre session/)).toBeInTheDocument();
    expect(navigateTo).not.toHaveBeenCalled();
    expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
  });
});
