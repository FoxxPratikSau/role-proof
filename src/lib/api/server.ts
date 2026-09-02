import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { backendApiURL } from "@/lib/api/url";

export const forwardAuthenticatedRequest = async (
  path: string,
  request?: Request,
): Promise<Response> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return Response.json({ error: "authentication required" }, { status: 401 });
  }
  const method = request?.method ?? "GET";
  const body =
    method === "GET" || method === "DELETE" ? undefined : await request?.text();
  try {
    const response = await fetch(backendApiURL(path), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return Response.json(
      { error: "resume service unavailable" },
      { status: 503 },
    );
  }
};
