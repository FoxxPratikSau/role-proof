import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/authorization";

export const metadata: Metadata = {
  title: "Master resume — RoleProof",
};

const ResumeLayout = async ({ children }: { children: React.ReactNode }) => {
  await requirePagePermission("workspace");
  return children;
};

export default ResumeLayout;
