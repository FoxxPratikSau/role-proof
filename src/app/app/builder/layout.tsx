import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/authorization";

export const metadata: Metadata = {
  title: "Tailor resume — RoleProof",
};

const BuilderLayout = async ({ children }: { children: React.ReactNode }) => {
  await requirePagePermission("workspace");
  return children;
};

export default BuilderLayout;
