import { AppSidebar } from "@/components/layout/AppSidebar";
import { requirePagePermission } from "@/lib/auth/authorization";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await requirePagePermission("workspace");
  return (
    <>
      <AppSidebar user={user} />
      <main className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0 md:pl-60">
        {children}
      </main>
    </>
  );
};

export default AppLayout;
