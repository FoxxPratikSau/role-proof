import type {
  MasterResume,
  MasterResumeRecord,
  ResumeTemplate,
  TemplateSpecification,
} from "@/types";

class ResumeAPIError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResumeAPIError";
  }
}

const requestJSON = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as
    | {
        error?: string;
      }
    | T
    | null;
  if (!response.ok) {
    throw new ResumeAPIError(
      response.status,
      (
        body as {
          error?: string;
        } | null
      )?.error || "The request could not be completed.",
    );
  }
  return body as T;
};

export const getMasterResume = async (): Promise<MasterResumeRecord | null> => {
  try {
    return await requestJSON<MasterResumeRecord>("/api/master-resume");
  } catch (error) {
    if (error instanceof ResumeAPIError && error.status === 404) return null;
    throw error;
  }
};

export const saveMasterResume = (input: {
  title: string;
  content: MasterResume;
  selected_template_id: string | null;
  expected_version: number;
}) => {
  return requestJSON<MasterResumeRecord>("/api/master-resume", {
    method: "PUT",
    body: JSON.stringify(input),
  });
};

export const deleteMasterResume = () => {
  return requestJSON<void>("/api/master-resume", { method: "DELETE" });
};

export const listResumeTemplates = async (): Promise<ResumeTemplate[]> => {
  const response = await requestJSON<{
    templates: ResumeTemplate[];
  }>("/api/resume-templates");
  return response.templates;
};

export const createResumeTemplate = (input: {
  name: string;
  description: string;
  source_filename: string;
  specification: TemplateSpecification;
}) => {
  return requestJSON<ResumeTemplate>("/api/resume-templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const deleteResumeTemplate = (id: string) => {
  return requestJSON<void>(`/api/resume-templates/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};
