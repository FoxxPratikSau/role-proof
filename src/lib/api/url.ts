import "server-only";

export const backendApiURL = (path: string): string => {
  const configuredBase = process.env.ROLEPROOF_API_URL?.trim();
  const base = configuredBase
    ? /^https?:\/\//i.test(configuredBase)
      ? configuredBase
      : `http://${configuredBase}`
    : "http://localhost:8080";
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
};
