import { requirePagePermission } from "@/lib/auth/authorization";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  await requirePagePermission("administration");
  return children;
};

export default AdminLayout;
