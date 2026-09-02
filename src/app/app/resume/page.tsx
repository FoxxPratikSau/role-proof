"use client";

/* eslint-disable react-hooks/set-state-in-effect -- server data and legacy browser data hydrate this controlled editor once */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CloudAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { ResumeInput } from "@/components/resume/ResumeInput";
import { JsonImportExport } from "@/components/resume/JsonImportExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  useDeleteMasterResume,
  useMasterResume,
  useResumeTemplates,
  useSaveMasterResume,
} from "@/hooks/useResumeData";
import { useResumeExtraction } from "@/hooks/useResumeExtraction";
import {
  clearExtractionJson,
  getApiKey,
  getExtractionJson,
} from "@/lib/storage";
import type { MasterResume } from "@/types";

type SaveState = "saved" | "dirty" | "saving" | "error";

const ResumePage = () => {
  const router = useRouter();
  const masterQuery = useMasterResume();
  const templatesQuery = useResumeTemplates();
  const saveMutation = useSaveMasterResume();
  const deleteMutation = useDeleteMasterResume();
  const extraction = useResumeExtraction();
  const [draft, setDraft] = useState<MasterResume | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [replacing, setReplacing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const migrated = useRef(false);
  const version = useRef(0);
  const selectedTemplateID = useRef<string | null>(null);
  const savedJSON = useRef("");
  const saveQueue = useRef(Promise.resolve());
  const deleting = useRef(false);
  const defaultTemplateID =
    templatesQuery.data?.find((template) => template.slug === "ats-minimal")
      ?.id ?? null;
  const persist = useCallback(
    (resume: MasterResume, migration = false) => {
      if (deleting.current) return saveQueue.current;
      const snapshot = JSON.stringify(resume);
      if (snapshot === savedJSON.current && !migration) {
        setSaveState("saved");
        return saveQueue.current;
      }
      setSaveState("saving");
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(async () => {
          const saved = await saveMutation.mutateAsync({
            title: `${resume.name || "My"} master resume`,
            content: resume,
            selected_template_id: selectedTemplateID.current,
            expected_version: version.current,
          });
          version.current = saved.version;
          savedJSON.current = snapshot;
          if (migration) clearExtractionJson();
          setSaveState("saved");
        })
        .catch((error: unknown) => {
          setSaveState("error");
          toast.error(
            error instanceof Error
              ? error.message
              : "Resume could not be saved",
          );
          return undefined;
        });
      return saveQueue.current;
    },
    [saveMutation],
  );
  useEffect(() => {
    if (isInitialized || masterQuery.isLoading || templatesQuery.isLoading)
      return;
    setIsInitialized(true);
    if (masterQuery.data) {
      version.current = masterQuery.data.version;
      selectedTemplateID.current = masterQuery.data.selected_template_id;
      savedJSON.current = JSON.stringify(masterQuery.data.content);
      setDraft(masterQuery.data.content);
      return;
    }
    const legacy = getExtractionJson() as MasterResume | null;
    if (legacy && !migrated.current) {
      migrated.current = true;
      selectedTemplateID.current = defaultTemplateID;
      setDraft(legacy);
      void persist(legacy, true);
    }
  }, [
    defaultTemplateID,
    isInitialized,
    masterQuery.data,
    masterQuery.isLoading,
    persist,
    templatesQuery.isLoading,
  ]);
  useEffect(() => {
    if (!draft || !isInitialized || JSON.stringify(draft) === savedJSON.current)
      return;
    setSaveState("dirty");
    const timer = window.setTimeout(() => void persist(draft), 900);
    return () => window.clearTimeout(timer);
  }, [draft, isInitialized, persist]);
  const handleExtract = async (text: string) => {
    if (!getApiKey()) {
      toast.error("Add an AI provider key in Settings first");
      router.push("/app/settings");
      return;
    }
    const parsed = await extraction.extract(text);
    if (!parsed) return;
    selectedTemplateID.current ||= defaultTemplateID;
    setDraft(parsed);
    setReplacing(false);
    await persist(parsed);
  };
  const handleImport = (resume: MasterResume) => {
    selectedTemplateID.current ||= defaultTemplateID;
    setDraft(resume);
    void persist(resume);
  };
  const handleDelete = async () => {
    deleting.current = true;
    try {
      await saveQueue.current;
      await deleteMutation.mutateAsync();
      setDraft(null);
      version.current = 0;
      savedJSON.current = "";
      selectedTemplateID.current = defaultTemplateID;
      extraction.reset();
      deleting.current = false;
      toast.success("Master resume deleted");
    } catch (error) {
      deleting.current = false;
      toast.error(
        error instanceof Error ? error.message : "Resume could not be deleted",
      );
    }
  };
  if (masterQuery.isLoading || templatesQuery.isLoading || !isInitialized) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" /> Loading your resume…
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-8 sm:py-10">
        <header className="mb-7 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-primary mb-2 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">
              Your source of truth
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Master resume
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
              {draft
                ? "Your career evidence is saved to your account and used for every tailored resume."
                : "Add your full career history once. RoleProof will keep it available on every device."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {draft && <SaveIndicator state={saveState} />}
            <JsonImportExport data={draft} onImport={handleImport} />
          </div>
        </header>

        {(masterQuery.isError || extraction.error) && (
          <div
            className="border-destructive/40 bg-destructive/5 text-destructive mb-6 rounded-lg border p-4 text-sm"
            role="alert"
          >
            {extraction.error ||
              "Your saved resume could not be loaded. Check that the Go API is running."}
          </div>
        )}

        {!draft || replacing ? (
          <Card className="shadow-[0_12px_34px_rgba(23,32,51,0.06)]">
            <CardContent className="pt-2">
              {replacing && (
                <div className="mb-4 flex items-center justify-between border-b pb-4">
                  <p className="text-sm font-medium">
                    Replace from another document
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplacing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <ResumeInput
                onExtract={handleExtract}
                loading={extraction.loading}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <ResumeEditor
              value={draft}
              onChange={setDraft}
              onSaveNow={() => void persist(draft)}
              onReExtract={() => setReplacing(true)}
            />
            <div className="mt-6 flex justify-end">
              <DeleteResumeDialog
                pending={deleteMutation.isPending}
                onDelete={() => void handleDelete()}
              />
              <Button onClick={() => router.push("/app/templates")}>
                Choose a template <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResumePage;

const DeleteResumeDialog = ({
  pending,
  onDelete,
}: {
  pending: boolean;
  onDelete: () => void;
}) => {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" className="text-destructive mr-2" />}
      >
        Delete resume
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your master resume?</DialogTitle>
          <DialogDescription>
            This permanently removes the saved career record from your account.
            Export JSON first if you want a backup.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <DialogClose
            render={
              <Button
                variant="destructive"
                disabled={pending}
                onClick={onDelete}
              />
            }
          >
            {pending ? "Deleting…" : "Delete resume"}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SaveIndicator = ({ state }: { state: SaveState }) => {
  const content = {
    saved: { icon: Check, label: "Saved" },
    dirty: { icon: Loader2, label: "Waiting to save" },
    saving: { icon: Loader2, label: "Saving…" },
    error: { icon: CloudAlert, label: "Save failed" },
  }[state];
  const Icon = content.icon;
  return (
    <span
      className={`bg-muted text-muted-foreground inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 font-mono text-[10px] uppercase ${state === "error" ? "text-destructive" : ""}`}
      aria-live="polite"
    >
      <Icon
        className={`size-3.5 ${state === "saving" ? "animate-spin" : ""}`}
      />
      {content.label}
    </span>
  );
};
