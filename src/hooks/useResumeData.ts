"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createResumeTemplate,
  deleteMasterResume,
  deleteResumeTemplate,
  getMasterResume,
  listResumeTemplates,
  saveMasterResume,
} from "@/lib/api/resumes";

const resumeKeys = {
  master: ["master-resume"] as const,
  templates: ["resume-templates"] as const,
};

export const useMasterResume = () => {
  return useQuery({ queryKey: resumeKeys.master, queryFn: getMasterResume });
};

export const useSaveMasterResume = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveMasterResume,
    onSuccess: (record) => client.setQueryData(resumeKeys.master, record),
  });
};

export const useDeleteMasterResume = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteMasterResume,
    onSuccess: () => client.setQueryData(resumeKeys.master, null),
  });
};

export const useResumeTemplates = () => {
  return useQuery({
    queryKey: resumeKeys.templates,
    queryFn: listResumeTemplates,
  });
};

export const useCreateResumeTemplate = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createResumeTemplate,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: resumeKeys.templates }),
  });
};

export const useDeleteResumeTemplate = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteResumeTemplate,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: resumeKeys.templates });
      void client.invalidateQueries({ queryKey: resumeKeys.master });
    },
  });
};
