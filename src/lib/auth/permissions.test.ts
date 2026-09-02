import { describe, expect, it } from "vitest";
import { canAccessPage } from "./permissions";

describe("canAccessPage", () => {
  it.each([
    ["workspace", "user", true],
    ["workspace", "admin", true],
    ["administration", "admin", true],
    ["administration", "user", false],
    ["workspace", "unknown", false],
  ] as const)("checks %s access for %s", (permission, role, expected) => {
    expect(canAccessPage(permission, role)).toBe(expected);
  });
});
