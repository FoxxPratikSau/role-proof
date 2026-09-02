import "server-only";

export const backendApiURL = (path: string): string => {
  const base = process.env.ROLEPROOF_API_URL?.trim() || "http://localhost:8080";
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
};
