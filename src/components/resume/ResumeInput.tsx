"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { extractTextFromPdf } from "@/lib/parse/pdf";
import { extractTextFromDocx } from "@/lib/parse/docx";

interface ResumeInputProps {
  onExtract: (text: string) => void;
  loading: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const ResumeInput = ({ onExtract, loading }: ResumeInputProps) => {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx", "txt"].includes(extension)) {
      setFileError("Choose a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size === 0) {
      setFileError(
        "This file is empty. Choose a file that contains your resume.",
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Choose a file smaller than 5 MB.");
      return;
    }
    setFileError(null);
    setFileLoading(true);
    setFileName(file.name);
    try {
      let extracted: string;
      if (file.name.endsWith(".pdf")) {
        extracted = await extractTextFromPdf(file);
      } else if (file.name.endsWith(".docx")) {
        extracted = await extractTextFromDocx(file);
      } else {
        extracted = await file.text();
      }
      setText(extracted);
    } catch (err) {
      console.error("Failed to read PDF/DOCX file:", err);
      setFileError(
        err instanceof Error ? err.message : "The file could not be read.",
      );
    } finally {
      setFileLoading(false);
    }
  };
  const handleExtract = () => {
    if (text.trim()) onExtract(text.trim());
  };
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="upload">
        <TabsList className="w-full">
          <TabsTrigger value="paste" className="flex-1">
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1">
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-5">
          <div className="mx-auto max-w-2xl">
            <Textarea
              placeholder="Paste your full resume text here..."
              className="min-h-[280px] resize-none font-mono text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-5">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              className={`focus-visible:ring-ring/20 flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-10 text-center transition-colors focus-visible:ring-3 focus-visible:outline-none ${isDragOver ? "border-primary bg-primary/5" : "border-input bg-background hover:border-primary/60 hover:bg-primary/[0.025]"}`}
              aria-label="Choose a resume file"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragOver(false);
                const file = event.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
            >
              {fileLoading ? (
                <Loader2 className="text-muted-foreground size-8 animate-spin" />
              ) : (
                <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
                  {text && fileName ? (
                    <CheckCircle2 className="size-6" />
                  ) : (
                    <Upload className="size-6" />
                  )}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold">
                  {fileName ?? "Drop your resume here"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  PDF, DOCX, or TXT · up to 5 MB
                </p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            {fileError && (
              <p
                className="text-destructive mt-3 flex items-center gap-2 text-sm"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" /> {fileError}
              </p>
            )}
            {text && (
              <Textarea
                aria-label="Extracted resume text"
                className="mt-4 max-h-[180px] min-h-[100px] resize-none overflow-y-auto font-mono text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mx-auto flex w-full max-w-2xl justify-end border-t pt-4">
        <Button
          onClick={handleExtract}
          disabled={loading || !text.trim()}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Extracting resume…
            </>
          ) : (
            <>
              <FileText className="mr-2 size-4" />
              Extract resume details
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
