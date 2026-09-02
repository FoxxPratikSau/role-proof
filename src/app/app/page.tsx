"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleIcon } from "lucide-react";
import { useMasterResume } from "@/hooks/useResumeData";

const AppPage = () => {
  const router = useRouter();
  const master = useMasterResume();
  useEffect(() => {
    if (master.isLoading) return;
    if (master.data) {
      router.replace("/app/builder");
    } else {
      router.replace("/app/resume");
    }
  }, [master.data, master.isLoading, router]);
  return (
    <div className="flex flex-1 items-center justify-center">
      <CircleIcon className="size-6 animate-pulse text-muted-foreground/40" />
    </div>
  );
};

export default AppPage;
