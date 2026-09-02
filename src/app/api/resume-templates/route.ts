import { forwardAuthenticatedRequest } from "@/lib/api/server";

export const GET = async () => {
  return forwardAuthenticatedRequest("resume-templates");
};

export const POST = async (request: Request) => {
  return forwardAuthenticatedRequest("resume-templates", request);
};
