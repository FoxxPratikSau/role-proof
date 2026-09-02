import { forwardAuthenticatedRequest } from "@/lib/api/server";

export const GET = async () => {
  return forwardAuthenticatedRequest("master-resume");
};

export const PUT = async (request: Request) => {
  return forwardAuthenticatedRequest("master-resume", request);
};

export const DELETE = async (request: Request) => {
  return forwardAuthenticatedRequest("master-resume", request);
};
