import { describe, expect, it } from "vitest";
import {
  getPasswordRequirements,
  safeAppPath,
  validateLoginForm,
  validateSignupForm,
} from "./validation";

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

describe("validateSignupForm", () => {
  it("normalizes valid account details", () => {
    expect(
      validateSignupForm(
        "  Pratik Sau  ",
        " Pratik@Example.com ",
        "RoleProof1!",
        "RoleProof1!",
      ),
    ).toEqual({
      name: "Pratik Sau",
      email: "pratik@example.com",
      fields: {},
    });
  });

  it.each([
    ["roleproof1!", "uppercase"],
    ["ROLEPROOF1!", "lowercase"],
    ["RoleProof!!", "number"],
    ["RoleProof12", "symbol"],
  ])("requires a password with %s", (password, missingRequirement) => {
    const result = validateSignupForm(
      "Pratik Sau",
      "pratik@example.com",
      password,
      password,
    );

    expect(result.fields.password).toBe(
      "Use uppercase, lowercase, a number, and a symbol.",
    );
    expect(
      getPasswordRequirements(password).find(
        (requirement) => requirement.id === missingRequirement,
      )?.met,
    ).toBe(false);
  });

  it("requires matching passwords", () => {
    expect(
      validateSignupForm(
        "Pratik Sau",
        "pratik@example.com",
        "RoleProof1!",
        "Different1!",
      ).fields.confirmPassword,
    ).toBe("Passwords do not match.");
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
