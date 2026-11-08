import { describe, expect, it } from "vitest";

import { githubPagesBasePath } from "@/lib/github-pages";

describe("GitHub Pages configuration", () => {
  it("uses the repository project-site path", () => {
    expect(githubPagesBasePath).toBe("/raspberry-3D-experience-");
  });
});