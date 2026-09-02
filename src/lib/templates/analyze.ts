import {
  createChatCompletion,
  extractJsonFromLLMResponse,
  RESUME_TEMPLATE_ANALYSIS_PROMPT,
} from "@/lib/ai";
import { getActiveAIConfig } from "@/lib/storage";
import type { TemplateDocumentData } from "@/lib/parse/document";
import type { TemplateSpecification } from "@/types";

const DEEPSEEK_TEMPLATE_VISION_MODEL = "deepseek-v4-flash-vision-exp";

export interface AnalyzedTemplate {
  name: string;
  description: string;
  specification: TemplateSpecification;
}

export const analyzeTemplate = async (
  documentData: TemplateDocumentData,
): Promise<AnalyzedTemplate> => {
  const { apiKey, model, provider } = getActiveAIConfig();
  if (!apiKey) throw new Error("Add an AI provider key in Settings first.");
  const useDeepSeekVision =
    provider === "deepseek" && Boolean(documentData.firstPageImageDataUrl);
  const layoutContext = documentData.layout
    ? `\n\nFIRST-PAGE PDF LAYOUT METADATA (coordinates are PDF points measured from the bottom-left):\n${JSON.stringify(documentData.layout, null, 2)}`
    : "";
  const requestText = `Analyze the reusable template characteristics of this document. Use the rendered page as the primary source for visual hierarchy and the extracted text/layout metadata to verify reading order, spacing, and typography.\n\nEXTRACTED DOCUMENT TEXT:\n${documentData.text}${layoutContext}`;
  const response = await createChatCompletion({
    provider,
    model: useDeepSeekVision ? DEEPSEEK_TEMPLATE_VISION_MODEL : model,
    apiKey,
    messages: [
      { role: "system", content: RESUME_TEMPLATE_ANALYSIS_PROMPT },
      {
        role: "user",
        content: useDeepSeekVision
          ? [
              { type: "text", text: requestText },
              {
                type: "image_url",
                image_url: {
                  url: documentData.firstPageImageDataUrl!,
                  detail: "original",
                },
              },
            ]
          : requestText,
      },
    ],
    temperature: 0.1,
    maxTokens: 4096,
  });
  const value = extractJsonFromLLMResponse(
    response.content,
  ) as unknown as AnalyzedTemplate;
  const spec = value?.specification;
  if (
    !value ||
    typeof value.name !== "string" ||
    typeof value.description !== "string" ||
    spec?.schemaVersion !== 1 ||
    typeof spec.style !== "string" ||
    typeof spec.tone !== "string" ||
    !Array.isArray(spec.sectionOrder) ||
    !Array.isArray(spec.contentRules) ||
    !Array.isArray(spec.formattingRules) ||
    typeof spec.promptInstructions !== "string"
  ) {
    throw new Error(
      "The AI response did not contain a valid template specification.",
    );
  }
  const canonicalSections = new Set([
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "optional",
  ]);
  spec.sectionOrder = spec.sectionOrder
    .map((section) =>
      canonicalSections.has(section.toLowerCase())
        ? section.toLowerCase()
        : "optional",
    )
    .filter((section, index, sections) => sections.indexOf(section) === index);
  if (
    useDeepSeekVision &&
    (!spec.visualLayout ||
      ![1, 2].includes(spec.visualLayout.columns) ||
      !["left", "center", "right"].includes(
        spec.visualLayout.headerAlignment,
      ) ||
      !spec.visualLayout.marginsInches ||
      !spec.visualLayout.colors)
  ) {
    throw new Error(
      "The vision model did not return a usable visual layout. Try uploading the PDF again.",
    );
  }
  return value;
};
