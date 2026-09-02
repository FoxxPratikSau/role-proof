export interface LoginFormState {
  attempt: number;
  email: string;
  error?: string;
  fields?: {
    email?: string;
    password?: string;
  };
}

export interface SignupFormState {
  attempt: number;
  name: string;
  email: string;
  error?: string;
  fields?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

export interface PasswordRequirement {
  id: "length" | "uppercase" | "lowercase" | "number" | "symbol";
  label: string;
  met: boolean;
}

export const INITIAL_LOGIN_STATE: LoginFormState = {
  attempt: 0,
  email: "",
};

export const INITIAL_SIGNUP_STATE: SignupFormState = {
  attempt: 0,
  name: "",
  email: "",
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const validateEmail = (email: string): string | undefined => {
  if (!email) return "Enter your email address.";
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return undefined;
};

export const getPasswordRequirements = (
  password: string,
): PasswordRequirement[] => [
  {
    id: "length",
    label: "8 or more characters",
    met:
      [...password].length >= 8 &&
      new TextEncoder().encode(password).length <= 72,
  },
  {
    id: "uppercase",
    label: "Uppercase letter",
    met: /\p{Lu}/u.test(password),
  },
  {
    id: "lowercase",
    label: "Lowercase letter",
    met: /\p{Ll}/u.test(password),
  },
  { id: "number", label: "Number", met: /\p{N}/u.test(password) },
  {
    id: "symbol",
    label: "Symbol",
    met: /[\p{P}\p{S}]/u.test(password),
  },
];

export const validateLoginForm = (email: string, password: string) => {
  const fields: NonNullable<LoginFormState["fields"]> = {};
  const normalizedEmail = normalizeEmail(email);
  const emailError = validateEmail(normalizedEmail);
  if (emailError) fields.email = emailError;
  if (!password) {
    fields.password = "Enter your password.";
  } else if (password.length < 8) {
    fields.password = "Password must be at least 8 characters.";
  } else if (new TextEncoder().encode(password).length > 72) {
    fields.password = "Password must be at most 72 bytes.";
  }
  return { email: normalizedEmail, fields };
};

export const validateSignupForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
) => {
  const fields: NonNullable<SignupFormState["fields"]> = {};
  const normalizedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName) {
    fields.name = "Enter your name.";
  } else if ([...normalizedName].length > 120) {
    fields.name = "Name must be at most 120 characters.";
  }

  const emailError = validateEmail(normalizedEmail);
  if (emailError) fields.email = emailError;

  const passwordBytes = new TextEncoder().encode(password).length;
  const requirements = getPasswordRequirements(password);
  if (!password) {
    fields.password = "Create a password.";
  } else if ([...password].length < 8) {
    fields.password = "Password must be at least 8 characters.";
  } else if (passwordBytes > 72) {
    fields.password = "Password must be at most 72 bytes.";
  } else if (requirements.some((requirement) => !requirement.met)) {
    fields.password = "Use uppercase, lowercase, a number, and a symbol.";
  }

  if (!confirmPassword) {
    fields.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    fields.confirmPassword = "Passwords do not match.";
  }

  return { name: normalizedName, email: normalizedEmail, fields };
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
