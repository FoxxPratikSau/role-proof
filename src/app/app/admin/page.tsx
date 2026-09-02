import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Administration — RoleProof",
};

const AdminPage = () => {
  return (
    <div className="flex flex-1 flex-col px-4 py-7 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-7 border-b pb-6">
          <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.16em] text-primary uppercase">
            Restricted area
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Administration
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            This page is available only to accounts with the administrator role.
          </p>
        </div>
        <Card className="shadow-[0_12px_34px_rgba(23,32,51,0.06)]">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Admin workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 text-sm leading-6 text-muted-foreground">
            No administrative tools are configured yet. Add user management or
            operational controls here when the backend exposes them.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
