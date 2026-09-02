"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TextField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: TextFieldProps) => (
  <div className={`flex flex-col gap-1${className ? ` ${className}` : ""}`}>
    <Label htmlFor={id} className="text-xs">
      {label}
    </Label>
    <Input
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

export const TextAreaField = ({
  id,
  label,
  value,
  onChange,
  className,
}: TextFieldProps) => (
  <div className={`flex flex-col gap-1${className ? ` ${className}` : ""}`}>
    <Label htmlFor={id} className="text-xs">
      {label}
    </Label>
    <Textarea
      id={id}
      className="min-h-[50px] resize-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

interface ListSectionProps {
  title: string;
  onAdd: () => void;
  children: ReactNode;
  emptyMessage?: string;
  empty?: boolean;
}

export const ListSection = ({
  title,
  onAdd,
  children,
  emptyMessage,
  empty = false,
}: ListSectionProps) => (
  <Card>
    <CardContent className="flex flex-col gap-4 pt-4">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 size-3.5" /> Add
        </Button>
      </div>
      {empty && emptyMessage ? (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      ) : null}
      {children}
    </CardContent>
  </Card>
);

interface HighlightsEditorProps {
  items: string[];
  itemLabel: string;
  placeholder: string;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export const HighlightsEditor = ({
  items,
  itemLabel,
  placeholder,
  onUpdate,
  onRemove,
  onAdd,
}: HighlightsEditorProps) => (
  <div className="flex flex-col gap-2">
    <Label className="text-xs">Highlights</Label>
    {items.map((highlight, index) => (
      <div key={index} className="flex gap-2">
        <Input
          value={highlight ?? ""}
          placeholder={placeholder}
          onChange={(event) => onUpdate(index, event.target.value)}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remove ${itemLabel} highlight ${index + 1}`}
          onClick={() => onRemove(index)}
          className="shrink-0"
        >
          <Trash2 className="text-muted-foreground size-3.5" />
        </Button>
      </div>
    ))}
    <Button variant="ghost" size="sm" onClick={onAdd} className="w-fit">
      <Plus className="mr-1 size-3.5" /> Add highlight
    </Button>
  </div>
);

interface TechnologyTagsProps {
  items: string[];
  onRemove: (value: string) => void;
  addInput: ReactNode;
}

export const TechnologyTags = ({
  items,
  onRemove,
  addInput,
}: TechnologyTagsProps) => (
  <div className="flex flex-col gap-2">
    <Label className="text-xs">Technologies</Label>
    <div className="flex flex-wrap gap-1.5">
      {items.map((technology, index) => (
        <Badge
          key={`${technology}-${index}`}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {technology}
          <button
            type="button"
            aria-label={`Remove ${technology}`}
            onClick={() => onRemove(technology)}
            className="hover:bg-muted-foreground/20 ml-0.5 cursor-pointer rounded-full p-0.5"
          >
            <Trash2 className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
    {addInput}
  </div>
);

interface AddTagInputProps {
  placeholder: string;
  onAdd: (value: string) => void;
}

export const AddTagInput = ({ placeholder, onAdd }: AddTagInputProps) => {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const nextValue = value.trim();
    if (!nextValue) return;
    onAdd(nextValue);
    setValue("");
  };

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (!event.nativeEvent.isComposing && event.key === "Enter") {
            event.preventDefault();
            handleAdd();
          }
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleAdd}
        aria-label={placeholder.replace("...", "")}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
};
