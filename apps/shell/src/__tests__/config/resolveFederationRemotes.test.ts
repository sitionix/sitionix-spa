import { describe, expect, it } from "vitest";
import { resolveFederationRemotes } from "../../../resolveFederationRemotes";

describe("resolveFederationRemotes", () => {
  it("Given dev mode When resolving remotes Then uses development remote entry paths", () => {
    // Given
    const env = {
      VITE_AUTH_REMOTE_ORIGIN: "https://auth.dev.sitionix.com",
      VITE_WORKSPACE_REMOTE_ORIGIN: "https://workspace.dev.sitionix.com",
      VITE_BUILDER_REMOTE_ORIGIN: "https://builder.dev.sitionix.com",
    };

    // When
    const result = resolveFederationRemotes({ isDev: true, env });

    // Then
    expect(result).toEqual({
      auth: "https://auth.dev.sitionix.com/remoteEntry.js",
      workspace: "https://workspace.dev.sitionix.com/remoteEntry.js",
      builder: "https://builder.dev.sitionix.com/remoteEntry.js",
    });
  });

  it("Given build mode When resolving remotes Then uses static asset remote entry paths", () => {
    // Given
    const env = {
      VITE_AUTH_REMOTE_ORIGIN: "https://auth.dev.sitionix.com/",
      VITE_WORKSPACE_REMOTE_ORIGIN: "https://workspace.dev.sitionix.com/",
      VITE_BUILDER_REMOTE_ORIGIN: "https://builder.dev.sitionix.com/",
    };

    // When
    const result = resolveFederationRemotes({ isDev: false, env });

    // Then
    expect(result).toEqual({
      auth: "https://auth.dev.sitionix.com/assets/remoteEntry.js",
      workspace: "https://workspace.dev.sitionix.com/assets/remoteEntry.js",
      builder: "https://builder.dev.sitionix.com/assets/remoteEntry.js",
    });
  });

  it("Given missing remote origin When resolving remotes Then throws explicit error", () => {
    // Given
    const env = {
      VITE_AUTH_REMOTE_ORIGIN: "https://auth.dev.sitionix.com",
      VITE_WORKSPACE_REMOTE_ORIGIN: "https://workspace.dev.sitionix.com",
    };

    // When
    const act = () => resolveFederationRemotes({ isDev: false, env });

    // Then
    expect(act).toThrow("Missing required env variable: VITE_BUILDER_REMOTE_ORIGIN");
  });
});
