"use client";

import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MasterResume } from "@/types";

interface JsonImportExportProps {
  data: MasterResume | null;
  onImport: (resume: MasterResume) => void;
}

export const JsonImportExport = ({ data, onImport }: JsonImportExportProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleExport = () => {
    if (!data) {
      toast.error("No resume to export");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roleproof-master-resume.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resume exported as JSON");
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as MasterResume;
        if (
          !parsed ||
          typeof parsed.name !== "string" ||
          typeof parsed.email !== "string" ||
          !Array.isArray(parsed.experience) ||
          !Array.isArray(parsed.education) ||
          !(Array.isArray(parsed.skills) || typeof parsed.skills === "object")
        ) {
          throw new Error("invalid master resume shape");
        }
        onImport(parsed);
        toast.success("Resume imported successfully");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-1.5 size-3.5" />
        Export JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mr-1.5 size-3.5" />
        Import JSON
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
};
