import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/authorization";

export const metadata: Metadata = {
  title: "Settings — RoleProof",
};

const SettingsLayout = async ({ children }: { children: React.ReactNode }) => {
  await requirePagePermission("workspace");
  return children;
};

export default SettingsLayout;
