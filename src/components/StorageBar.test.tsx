import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StorageBar from "./StorageBar";
import { StorageContext } from "../context/storage";
import { renderWithProviders, storageStub } from "../test/harness";

describe("StorageBar", () => {
  it("nomme le spinner Chargement du stockage pendant le chargement", () => {
    renderWithProviders(
      <StorageContext.Provider value={{ ...storageStub, storage: null, loading: true }}>
        <StorageBar />
      </StorageContext.Provider>,
    );

    expect(screen.getByLabelText("Chargement du stockage")).toHaveAttribute(
      "aria-label",
      "Chargement du stockage",
    );
  });
});
