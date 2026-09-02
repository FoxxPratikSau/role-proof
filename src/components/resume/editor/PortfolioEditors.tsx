"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AddTagInput,
  HighlightsEditor,
  TechnologyTags,
  TextAreaField,
  TextField,
} from "@/components/resume/editor/ResumeEditorFields";
import type { OpenSource, Project } from "@/types";

interface PortfolioEditorActions<T> {
  item: T;
  index: number;
  onChange: (item: T) => void;
  onRemove: () => void;
  onTechnologyAdd: (value: string) => void;
  onTechnologyRemove: (value: string) => void;
  onHighlightAdd: () => void;
  onHighlightUpdate: (index: number, value: string) => void;
  onHighlightRemove: (index: number) => void;
}

const RemoveItemButton = ({ onRemove }: { onRemove: () => void }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onRemove}
    className="text-destructive mt-2"
  >
    <Trash2 className="mr-1 size-3.5" /> Remove
  </Button>
);

export const ProjectEditor = ({
  item,
  index,
  onChange,
  onRemove,
  onTechnologyAdd,
  onTechnologyRemove,
  onHighlightAdd,
  onHighlightUpdate,
  onHighlightRemove,
}: PortfolioEditorActions<Project>) => (
  <div className="rounded-lg border p-4">
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TextField
        id={`project-${index}-name`}
        label="Project Name"
        value={item.name ?? ""}
        onChange={(value) => onChange({ ...item, name: value })}
      />
      <TextField
        id={`project-${index}-url`}
        label="URL"
        value={item.url ?? ""}
        placeholder="https://..."
        onChange={(value) => onChange({ ...item, url: value || undefined })}
      />
      <TextAreaField
        id={`project-${index}-description`}
        label="Description"
        value={item.description ?? ""}
        className="sm:col-span-2"
        onChange={(value) => onChange({ ...item, description: value })}
      />
      <TextField
        id={`project-${index}-duration`}
        label="Duration"
        value={item.duration ?? ""}
        placeholder="e.g. Jan 2023 - Mar 2023"
        onChange={(value) =>
          onChange({ ...item, duration: value || undefined })
        }
      />
    </div>
    <TechnologyTags
      items={item.technologies ?? []}
      onRemove={onTechnologyRemove}
      addInput={
        <AddTagInput placeholder="Add technology..." onAdd={onTechnologyAdd} />
      }
    />
    <Separator className="my-3" />
    <HighlightsEditor
      items={item.highlights ?? []}
      itemLabel="project"
      placeholder="Key achievement or contribution..."
      onUpdate={onHighlightUpdate}
      onRemove={onHighlightRemove}
      onAdd={onHighlightAdd}
    />
    <RemoveItemButton onRemove={onRemove} />
  </div>
);

export const OpenSourceEditor = ({
  item,
  index,
  onChange,
  onRemove,
  onTechnologyAdd,
  onTechnologyRemove,
  onHighlightAdd,
  onHighlightUpdate,
  onHighlightRemove,
}: PortfolioEditorActions<OpenSource>) => (
  <div className="rounded-lg border p-4">
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TextField
        id={`open-source-${index}-name`}
        label="Name"
        value={item.name ?? ""}
        onChange={(value) => onChange({ ...item, name: value })}
      />
      <TextField
        id={`open-source-${index}-url`}
        label="URL"
        value={item.url ?? ""}
        placeholder="https://..."
        onChange={(value) => onChange({ ...item, url: value || undefined })}
      />
      <TextField
        id={`open-source-${index}-role`}
        label="Role"
        value={item.role ?? ""}
        placeholder="e.g. maintainer, contributor"
        onChange={(value) => onChange({ ...item, role: value || undefined })}
      />
      <TextAreaField
        id={`open-source-${index}-description`}
        label="Description"
        value={item.description ?? ""}
        className="sm:col-span-2"
        onChange={(value) => onChange({ ...item, description: value })}
      />
    </div>
    <TechnologyTags
      items={item.technologies ?? []}
      onRemove={onTechnologyRemove}
      addInput={
        <AddTagInput placeholder="Add technology..." onAdd={onTechnologyAdd} />
      }
    />
    <Separator className="my-3" />
    <HighlightsEditor
      items={item.highlights ?? []}
      itemLabel="open-source"
      placeholder="Key contribution or impact..."
      onUpdate={onHighlightUpdate}
      onRemove={onHighlightRemove}
      onAdd={onHighlightAdd}
    />
    <RemoveItemButton onRemove={onRemove} />
  </div>
);
