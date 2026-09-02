import { forwardAuthenticatedRequest } from "@/lib/api/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  return forwardAuthenticatedRequest(
    `resume-templates/${encodeURIComponent(id)}`,
  );
};

export const DELETE = async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  return forwardAuthenticatedRequest(
    `resume-templates/${encodeURIComponent(id)}`,
    request,
  );
};
