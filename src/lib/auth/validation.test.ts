import { describe, expect, it } from "vitest";
import { safeAppPath, validateLoginForm } from "./validation";

describe("validateLoginForm", () => {
  it("normalizes valid credentials", () => {
    expect(validateLoginForm(" Test@Example.com ", "password123")).toEqual({
      email: "test@example.com",
      fields: {},
    });
  });

  it("returns field-level errors", () => {
    expect(validateLoginForm("not-an-email", "short").fields).toEqual({
      email: "Enter a valid email address.",
      password: "Password must be at least 8 characters.",
    });
  });
});

describe("safeAppPath", () => {
  it.each([
    ["/app", "/app"],
    ["/app/settings?tab=models", "/app/settings?tab=models"],
    ["/app/builder#result", "/app/builder#result"],
  ])("allows an internal app path", (value, expected) => {
    expect(safeAppPath(value)).toBe(expected);
  });

  it.each([
    "https://example.com/app",
    "//example.com/app",
    "/about",
    "/app\\example",
    "javascript:alert(1)",
  ])("rejects an unsafe callback path", (value) => {
    expect(safeAppPath(value)).toBe("/app");
  });
});
