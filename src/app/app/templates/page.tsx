"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, FileUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCreateResumeTemplate,
  useDeleteResumeTemplate,
  useMasterResume,
  useResumeTemplates,
  useSaveMasterResume,
} from "@/hooks/useResumeData";
import { extractTemplateDocument } from "@/lib/parse/document";
import { analyzeTemplate } from "@/lib/templates/analyze";
import { templateNeedsReanalysis } from "@/lib/templates/presentation";
import type { ResumeTemplate } from "@/types";

const TemplatesPage = () => {
  const templates = useResumeTemplates();
  const master = useMasterResume();
  const saveMaster = useSaveMasterResume();
  const createTemplate = useCreateResumeTemplate();
  const deleteTemplate = useDeleteResumeTemplate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "reading" | "analyzing" | "saving"
  >("idle");
  const selectTemplate = async (template: ResumeTemplate) => {
    if (!master.data) {
      toast.error("Add your master resume before selecting a template.");
      return;
    }
    try {
      await saveMaster.mutateAsync({
        title: master.data.title,
        content: master.data.content,
        selected_template_id: template.id,
        expected_version: master.data.version,
      });
      toast.success(`${template.name} selected`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Template could not be selected",
      );
    }
  };
  const uploadTemplate = async (file: File) => {
    try {
      setUploadState("reading");
      const documentData = await extractTemplateDocument(file);
      if (!documentData.text.trim())
        throw new Error("No readable text was found in this file.");
      setUploadState("analyzing");
      const analyzed = await analyzeTemplate(documentData);
      setUploadState("saving");
      const created = await createTemplate.mutateAsync({
        ...analyzed,
        source_filename: file.name,
      });
      toast.success(`${created.name} added to your templates`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Template upload failed",
      );
    } finally {
      setUploadState("idle");
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">
        <header className="mb-7 border-b pb-6">
          <p className="text-primary mb-2 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">
            Presentation system
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Resume templates
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Choose how RoleProof structures and writes your tailored resume.
            Uploaded files are analyzed in your browser; only reusable style
            guidance is saved, never their candidate data.
          </p>
        </header>

        {!master.data && !master.isLoading && (
          <div className="border-primary/25 bg-primary/5 mb-6 flex flex-col gap-3 rounded-lg border p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>Add a master resume before choosing a template.</span>
            <Link
              href="/app/resume"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Add resume
            </Link>
          </div>
        )}

        <section aria-labelledby="curated-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="curated-heading" className="font-semibold">
                Curated foundations
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                ATS-safe defaults for different roles and seniority.
              </p>
            </div>
            <Badge variant="secondary">
              {templates.data?.filter((item) => item.source_type === "curated")
                .length ?? 0}{" "}
              included
            </Badge>
          </div>
          {templates.isLoading ? (
            <div className="text-muted-foreground flex min-h-48 items-center justify-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Loading templates…
            </div>
          ) : templates.isError ? (
            <div
              className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm"
              role="alert"
            >
              Templates could not be loaded. Check that the Go API is running.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {templates.data
                ?.filter((item) => item.source_type === "curated")
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={master.data?.selected_template_id === template.id}
                    disabled={!master.data || saveMaster.isPending}
                    onSelect={() => void selectTemplate(template)}
                  />
                ))}
            </div>
          )}
        </section>

        <section
          className="mt-10 border-t pt-8"
          aria-labelledby="custom-heading"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="custom-heading" className="font-semibold">
                Your templates
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Teach the AI a reusable structure from a PDF, DOCX, or TXT file.
              </p>
            </div>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploadState !== "idle"}
            >
              {uploadState === "idle" ? (
                <Plus className="mr-1.5 size-4" />
              ) : (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {uploadState === "reading"
                ? "Reading…"
                : uploadState === "analyzing"
                  ? "Analyzing…"
                  : uploadState === "saving"
                    ? "Saving…"
                    : "Upload template"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadTemplate(file);
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.data
              ?.filter((item) => item.source_type === "uploaded")
              .map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={master.data?.selected_template_id === template.id}
                  disabled={!master.data || saveMaster.isPending}
                  onSelect={() => void selectTemplate(template)}
                  onDelete={() =>
                    void deleteTemplate
                      .mutateAsync(template.id)
                      .then(() => toast.success("Template removed"))
                      .catch((error: unknown) =>
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Template could not be removed",
                        ),
                      )
                  }
                />
              ))}
            {!templates.data?.some(
              (item) => item.source_type === "uploaded",
            ) && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="border-border text-muted-foreground hover:border-primary/45 hover:bg-primary/[0.025] flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors focus-visible:ring-3 focus-visible:outline-none"
              >
                <span className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-lg">
                  <FileUp className="size-5" />
                </span>
                <span className="text-foreground font-medium">
                  Upload your first template
                </span>
                <span className="mt-1 max-w-xs text-xs leading-5">
                  We extract layout and writing rules—not personal content.
                </span>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TemplatesPage;

const TemplateCard = ({
  template,
  selected,
  disabled,
  onSelect,
  onDelete,
}: {
  template: ResumeTemplate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) => {
  const needsReanalysis =
    template.source_type === "uploaded" &&
    templateNeedsReanalysis(template.specification);
  return (
    <Card
      className={
        selected
          ? "border-primary shadow-[0_10px_28px_rgba(19,88,86,0.10)]"
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {needsReanalysis ? (
            <Badge variant="destructive" className="shrink-0">
              Re-upload
            </Badge>
          ) : selected ? (
            <Badge className="shrink-0">
              <Check className="mr-1 size-3" /> Active
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <TemplatePreview template={template} />
        <p className="text-muted-foreground mt-3 font-mono text-[10px] uppercase tracking-wide">
          {template.specification.tone}
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          size="sm"
          className="flex-1"
          variant={selected ? "secondary" : "default"}
          disabled={disabled || selected || needsReanalysis}
          onClick={onSelect}
        >
          {needsReanalysis
            ? "Re-upload required"
            : selected
              ? "Selected"
              : "Use template"}
        </Button>
        {onDelete && (
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Remove ${template.name}`}
                />
              }
            >
              <Trash2 className="size-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove {template.name}?</DialogTitle>
                <DialogDescription>
                  This removes the saved template guidance. The original
                  uploaded file is not stored.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <DialogClose
                  render={<Button variant="destructive" onClick={onDelete} />}
                >
                  Remove
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
};

const TemplatePreview = ({ template }: { template: ResumeTemplate }) => {
  const modern = template.slug === "modern";
  const technical = template.slug === "technical";
  const executive = template.slug === "executive";
  return (
    <div
      className={`bg-background aspect-[8.5/11] overflow-hidden rounded-md border p-4 shadow-inner ${modern ? "border-l-primary border-l-4" : ""}`}
      aria-hidden="true"
    >
      <div
        className={`h-2 rounded-sm bg-foreground ${executive ? "w-2/3" : "w-1/2"}`}
      />
      <div className="bg-muted-foreground/30 mt-2 h-1 w-3/4 rounded-sm" />
      <div
        className={`mt-5 h-1.5 w-1/3 rounded-sm ${technical ? "bg-primary" : "bg-foreground/70"}`}
      />
      <div className="mt-2 space-y-1.5">
        <div className="bg-muted h-1 rounded-sm" />
        <div className="bg-muted h-1 rounded-sm" />
        <div className="bg-muted h-1 w-5/6 rounded-sm" />
      </div>
      <div
        className={`mt-5 h-1.5 w-1/4 rounded-sm ${modern ? "bg-primary" : "bg-foreground/70"}`}
      />
      <div className="mt-2 space-y-2">
        <div>
          <div className="bg-muted-foreground/40 h-1 w-2/5 rounded-sm" />
          <div className="bg-muted mt-1 h-1 rounded-sm" />
          <div className="bg-muted mt-1 h-1 w-11/12 rounded-sm" />
        </div>
        <div>
          <div className="bg-muted-foreground/40 h-1 w-1/3 rounded-sm" />
          <div className="bg-muted mt-1 h-1 rounded-sm" />
        </div>
      </div>
    </div>
  );
};
