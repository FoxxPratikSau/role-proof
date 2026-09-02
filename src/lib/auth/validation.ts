export interface LoginFormState {
  attempt: number;
  email: string;
  error?: string;
  fields?: {
    email?: string;
    password?: string;
  };
}

export const INITIAL_LOGIN_STATE: LoginFormState = {
  attempt: 0,
  email: "",
};

export const validateLoginForm = (email: string, password: string) => {
  const fields: NonNullable<LoginFormState["fields"]> = {};
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    fields.email = "Enter your email address.";
  } else if (
    normalizedEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    fields.email = "Enter a valid email address.";
  }
  if (!password) {
    fields.password = "Enter your password.";
  } else if (password.length < 8) {
    fields.password = "Password must be at least 8 characters.";
  } else if (new TextEncoder().encode(password).length > 72) {
    fields.password = "Password must be at most 72 bytes.";
  }
  return { email: normalizedEmail, fields };
};

export const safeAppPath = (value: string | null | undefined): string => {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/app";
  }
  try {
    const parsed = new URL(value, "https://roleproof.local");
    const isAppPath =
      parsed.pathname === "/app" || parsed.pathname.startsWith("/app/");
    if (parsed.origin !== "https://roleproof.local" || !isAppPath) {
      return "/app";
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/app";
  }
};
