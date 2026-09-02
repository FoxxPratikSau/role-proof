import { extractTextFromDocx } from "./docx";
import { extractPdfTemplateData, extractTextFromPdf } from "./pdf";

export interface TemplateDocumentData {
  text: string;
  firstPageImageDataUrl?: string;
  layout?: {
    pageCount: number;
    firstPage: {
      width: number;
      height: number;
      items: Array<{
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontName?: string;
        hasEOL?: boolean;
      }>;
    };
  };
}

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

const extractDocumentText = async (file: File): Promise<string> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "docx", "txt"].includes(extension)) {
    throw new Error("Choose a PDF, DOCX, or TXT file.");
  }
  if (file.size === 0) throw new Error("This file is empty.");
  if (file.size > MAX_DOCUMENT_BYTES)
    throw new Error("Choose a file smaller than 5 MB.");
  if (extension === "pdf") return extractTextFromPdf(file);
  if (extension === "docx") return extractTextFromDocx(file);
  return file.text();
};

export const extractTemplateDocument = async (
  file: File,
): Promise<TemplateDocumentData> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return extractPdfTemplateData(file);
  return { text: await extractDocumentText(file) };
};
