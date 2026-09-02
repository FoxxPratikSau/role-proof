"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Undo2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HighlightsEditor,
  ListSection,
} from "@/components/resume/editor/ResumeEditorFields";
import {
  OpenSourceEditor,
  ProjectEditor,
} from "@/components/resume/editor/PortfolioEditors";
import {
  Select as AuthoredSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useListField,
  createNestedStringHelpers,
  createTagHelpers,
} from "@/hooks/useListField";
import type {
  MasterResume,
  Experience,
  Education,
  Project,
  OpenSource,
  OtherWork,
} from "@/types";

const OTHER_WORK_TYPES = [
  "publication",
  "speaking",
  "patent",
  "award",
  "volunteering",
  "language",
  "other",
] as const;

interface ResumeEditorProps {
  value: MasterResume;
  onChange: (resume: MasterResume) => void;
  onSaveNow: () => void;
  onReExtract: () => void;
}

const emptyExperience = (): Experience => {
  return { company: "", role: "", duration: "", highlights: [""] };
};

const emptyEducation = (): Education => {
  return { institution: "", degree: "", field: "", year: "" };
};

const emptyProject = (): Project => {
  return { name: "", description: "" };
};

const emptyOpenSource = (): OpenSource => {
  return { name: "", description: "" };
};

const emptyOtherWork = (): OtherWork => {
  return { title: "", type: "other", description: "" };
};

const migrateProjects = (
  projects: unknown | undefined,
): Project[] | undefined => {
  if (!Array.isArray(projects)) return undefined;
  if (projects.length === 0) return undefined;
  if (typeof projects[0] === "string") {
    return (projects as string[]).map((s) => ({ name: s, description: "" }));
  }
  return projects as Project[];
};

export const ResumeEditor = ({
  value,
  onChange,
  onSaveNow,
  onReExtract,
}: ResumeEditorProps) => {
  const resume: MasterResume = {
    ...value,
    projects: migrateProjects(value.projects),
  };
  const [skillInput, setSkillInput] = useState("");
  const update = (field: keyof MasterResume, value: unknown) => {
    onChange({ ...resume, [field]: value });
  };
  const addSkill = () => {
    const skill = skillInput.trim();
    const skillsList = Array.isArray(resume.skills)
      ? resume.skills
      : Object.values(resume.skills).flat();
    if (skill && !skillsList.includes(skill)) {
      update("skills", [...skillsList, skill]);
      setSkillInput("");
    }
  };
  const removeSkill = (skill: string) => {
    if (!Array.isArray(resume.skills)) return;
    update(
      "skills",
      resume.skills.filter((s) => s !== skill),
    );
  };
  // ─── Generic list field CRUD ───
  const exp = useListField(resume, "experience", update, emptyExperience, true);
  const edu = useListField(resume, "education", update, emptyEducation, true);
  const proj = useListField(resume, "projects", update, emptyProject, false);
  const oss = useListField(
    resume,
    "openSource",
    update,
    emptyOpenSource,
    false,
  );
  const other = useListField(
    resume,
    "otherWorks",
    update,
    emptyOtherWork,
    false,
  );
  const expHL = createNestedStringHelpers(
    () => resume.experience,
    "highlights",
    "experience",
    update,
  );
  const projHL = createNestedStringHelpers(
    () => resume.projects ?? [],
    "highlights",
    "projects",
    update,
  );
  const ossHL = createNestedStringHelpers(
    () => resume.openSource ?? [],
    "highlights",
    "openSource",
    update,
  );
  const projTags = createTagHelpers(
    () => resume.projects ?? [],
    "projects",
    update,
  );
  const ossTags = createTagHelpers(
    () => resume.openSource ?? [],
    "openSource",
    update,
  );
  return (
    <div className="flex flex-col gap-6">
      {/* Basic Info */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-name">Name</Label>
            <Input
              id="resume-name"
              value={resume.name ?? ""}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-email">Email</Label>
            <Input
              id="resume-email"
              type="email"
              value={resume.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-phone">Phone</Label>
            <Input
              id="resume-phone"
              value={resume.phone ?? ""}
              onChange={(e) => update("phone", e.target.value || null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-linkedin">LinkedIn</Label>
            <Input
              id="resume-linkedin"
              value={resume.linkedin ?? ""}
              onChange={(e) => update("linkedin", e.target.value || null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-github">GitHub</Label>
            <Input
              id="resume-github"
              value={resume.github ?? ""}
              onChange={(e) => update("github", e.target.value || null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-twitter">Twitter / X</Label>
            <Input
              id="resume-twitter"
              value={resume.twitter ?? ""}
              onChange={(e) => update("twitter", e.target.value || null)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="resume-portfolio">Portfolio</Label>
            <Input
              id="resume-portfolio"
              value={resume.portfolio ?? ""}
              onChange={(e) => update("portfolio", e.target.value || null)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="resume-summary">Summary</Label>
            <Textarea
              id="resume-summary"
              className="min-h-[80px] resize-none"
              value={resume.summary ?? ""}
              onChange={(e) => update("summary", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(resume.skills)
              ? resume.skills
              : Object.entries(resume.skills).flatMap(([cat, items]) =>
                  items.map((item) => `${cat}: ${item}`),
                )
            ).map((skill, i) => (
              <Badge
                key={`${skill}-${i}`}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() => removeSkill(skill)}
                  className="hover:bg-muted-foreground/20 ml-0.5 rounded-full p-0.5"
                >
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              aria-label="Add a skill"
              placeholder="Add a skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) =>
                !e.nativeEvent.isComposing && e.key === "Enter" && addSkill()
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addSkill}
              aria-label="Add skill"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <ListSection title="Experience" onAdd={exp.addItem}>
        {exp.items.map((item, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`experience-${i}-company`} className="text-xs">
                  Company
                </Label>
                <Input
                  id={`experience-${i}-company`}
                  value={item.company ?? ""}
                  onChange={(e) =>
                    exp.updateItem(i, { ...item, company: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`experience-${i}-role`} className="text-xs">
                  Role
                </Label>
                <Input
                  id={`experience-${i}-role`}
                  value={item.role ?? ""}
                  onChange={(e) =>
                    exp.updateItem(i, { ...item, role: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`experience-${i}-duration`} className="text-xs">
                  Duration
                </Label>
                <Input
                  id={`experience-${i}-duration`}
                  value={item.duration ?? ""}
                  onChange={(e) =>
                    exp.updateItem(i, { ...item, duration: e.target.value })
                  }
                />
              </div>
            </div>
            <HighlightsEditor
              items={item.highlights}
              itemLabel="experience"
              placeholder="Achievement or responsibility..."
              onUpdate={(index, value) => expHL.updateAt(i, index, value)}
              onRemove={(index) => expHL.removeAt(i, index)}
              onAdd={() => expHL.addAt(i)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exp.removeItem(i)}
              className="text-destructive mt-2"
            >
              <Trash2 className="mr-1 size-3.5" /> Remove
            </Button>
          </div>
        ))}
      </ListSection>

      {/* Education */}
      <ListSection title="Education" onAdd={edu.addItem}>
        {edu.items.map((item, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`education-${i}-institution`}
                  className="text-xs"
                >
                  Institution
                </Label>
                <Input
                  id={`education-${i}-institution`}
                  value={item.institution ?? ""}
                  onChange={(e) =>
                    edu.updateItem(i, {
                      ...item,
                      institution: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`education-${i}-degree`} className="text-xs">
                  Degree
                </Label>
                <Input
                  id={`education-${i}-degree`}
                  value={item.degree ?? ""}
                  onChange={(e) =>
                    edu.updateItem(i, { ...item, degree: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`education-${i}-field`} className="text-xs">
                  Field
                </Label>
                <Input
                  id={`education-${i}-field`}
                  value={item.field ?? ""}
                  onChange={(e) =>
                    edu.updateItem(i, { ...item, field: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`education-${i}-year`} className="text-xs">
                  Year
                </Label>
                <Input
                  id={`education-${i}-year`}
                  value={item.year ?? ""}
                  onChange={(e) =>
                    edu.updateItem(i, { ...item, year: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => edu.removeItem(i)}
              className="text-destructive mt-2"
            >
              <Trash2 className="mr-1 size-3.5" /> Remove
            </Button>
          </div>
        ))}
      </ListSection>

      {/* Certifications */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-certifications">
              Certifications (one per line)
            </Label>
            <Textarea
              id="resume-certifications"
              className="min-h-[60px] resize-none"
              value={resume.certifications?.join("\n") ?? ""}
              onChange={(e) =>
                update(
                  "certifications",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <ListSection
        title="Projects"
        onAdd={proj.addItem}
        empty={proj.items.length === 0}
        emptyMessage="No projects yet. Add personal projects, hackathons, freelance work, or side projects."
      >
        {proj.items.map((item, index) => (
          <ProjectEditor
            key={index}
            item={item}
            index={index}
            onChange={(value) => proj.updateItem(index, value)}
            onRemove={() => proj.removeItem(index)}
            onTechnologyAdd={(value) => projTags.add(index, value)}
            onTechnologyRemove={(value) => projTags.remove(index, value)}
            onHighlightAdd={() => projHL.addAt(index)}
            onHighlightUpdate={(highlightIndex, value) =>
              projHL.updateAt(index, highlightIndex, value)
            }
            onHighlightRemove={(highlightIndex) =>
              projHL.removeAt(index, highlightIndex)
            }
          />
        ))}
      </ListSection>

      {/* Open Source */}
      <ListSection
        title="Open Source"
        onAdd={oss.addItem}
        empty={oss.items.length === 0}
        emptyMessage="No open source contributions yet. Add repositories you maintain, contribute to, or significant PRs."
      >
        {oss.items.map((item, index) => (
          <OpenSourceEditor
            key={index}
            item={item}
            index={index}
            onChange={(value) => oss.updateItem(index, value)}
            onRemove={() => oss.removeItem(index)}
            onTechnologyAdd={(value) => ossTags.add(index, value)}
            onTechnologyRemove={(value) => ossTags.remove(index, value)}
            onHighlightAdd={() => ossHL.addAt(index)}
            onHighlightUpdate={(highlightIndex, value) =>
              ossHL.updateAt(index, highlightIndex, value)
            }
            onHighlightRemove={(highlightIndex) =>
              ossHL.removeAt(index, highlightIndex)
            }
          />
        ))}
      </ListSection>

      {/* Other Works */}
      <ListSection
        title="Other Works"
        onAdd={other.addItem}
        empty={other.items.length === 0}
        emptyMessage="No other works yet. Add publications, speaking engagements, patents, awards, volunteering, or languages."
      >
        {other.items.map((item, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`other-work-${i}-title`} className="text-xs">
                  Title
                </Label>
                <Input
                  id={`other-work-${i}-title`}
                  value={item.title ?? ""}
                  onChange={(e) =>
                    other.updateItem(i, { ...item, title: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`other-work-${i}-type`} className="text-xs">
                  Type
                </Label>
                <AuthoredSelect
                  value={item.type ?? "other"}
                  onValueChange={(value) =>
                    other.updateItem(i, { ...item, type: value ?? "other" })
                  }
                >
                  <SelectTrigger id={`other-work-${i}-type`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OTHER_WORK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </AuthoredSelect>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`other-work-${i}-url`} className="text-xs">
                  URL
                </Label>
                <Input
                  id={`other-work-${i}-url`}
                  value={item.url ?? ""}
                  placeholder="https://..."
                  onChange={(e) =>
                    other.updateItem(i, {
                      ...item,
                      url: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`other-work-${i}-date`} className="text-xs">
                  Date
                </Label>
                <Input
                  id={`other-work-${i}-date`}
                  value={item.date ?? ""}
                  placeholder="e.g. 2024 or Mar 2024"
                  onChange={(e) =>
                    other.updateItem(i, {
                      ...item,
                      date: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <Label
                  htmlFor={`other-work-${i}-description`}
                  className="text-xs"
                >
                  Description
                </Label>
                <Textarea
                  id={`other-work-${i}-description`}
                  className="min-h-[50px] resize-none"
                  value={item.description ?? ""}
                  onChange={(e) =>
                    other.updateItem(i, {
                      ...item,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => other.removeItem(i)}
              className="text-destructive mt-2"
            >
              <Trash2 className="mr-1 size-3.5" /> Remove
            </Button>
          </div>
        ))}
      </ListSection>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onSaveNow} className="flex-1">
          <Save className="mr-2 size-4" />
          Save now
        </Button>
        <Button variant="outline" onClick={onReExtract}>
          <Undo2 className="mr-2 size-4" />
          Re-extract
        </Button>
      </div>
    </div>
  );
};
