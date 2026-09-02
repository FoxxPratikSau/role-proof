if (!Promise.withResolvers) {
  (Promise as unknown as Record<string, unknown>).withResolvers = function () {
    let resolve!: (value: unknown) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<unknown>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

interface PdfLayoutItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
  hasEOL?: boolean;
}

export interface PdfTemplateData {
  text: string;
  firstPageImageDataUrl: string;
  layout: {
    pageCount: number;
    firstPage: {
      width: number;
      height: number;
      items: PdfLayoutItem[];
    };
  };
}

const round = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const extractPdfTemplateData = async (
  file: File,
): Promise<PdfTemplateData> => {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: string[] = [];
  let firstPageImageDataUrl = "";
  let firstPage = { width: 0, height: 0, items: [] as PdfLayoutItem[] };
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const textItems = content.items as Array<{
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
        fontName?: string;
        hasEOL?: boolean;
      }>;
      pages.push(
        textItems
          .filter((item) => typeof item.str === "string")
          .map((item) => item.str!)
          .join(" "),
      );
      if (pageNumber === 1) {
        const baseViewport = page.getViewport({ scale: 1 });
        const renderScale = Math.min(2, 1600 / baseViewport.width);
        const renderViewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);
        const canvasContext = canvas.getContext("2d");
        if (!canvasContext)
          throw new Error("Could not render the PDF preview.");
        await page.render({
          canvas,
          canvasContext,
          viewport: renderViewport,
        }).promise;
        firstPageImageDataUrl = canvas.toDataURL("image/png");
        firstPage = {
          width: round(baseViewport.width),
          height: round(baseViewport.height),
          items: textItems
            .filter(
              (item) =>
                typeof item.str === "string" &&
                item.str.trim().length > 0 &&
                Array.isArray(item.transform),
            )
            .slice(0, 500)
            .map((item) => ({
              text: item.str!,
              x: round(item.transform![4] ?? 0),
              y: round(item.transform![5] ?? 0),
              width: round(item.width ?? 0),
              height: round(item.height ?? Math.abs(item.transform![3] ?? 0)),
              fontName: item.fontName,
              hasEOL: item.hasEOL,
            })),
        };
      }
    }
  } finally {
    await loadingTask.destroy();
  }
  return {
    text: pages.join("\n\n"),
    firstPageImageDataUrl,
    layout: { pageCount, firstPage },
  };
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = (
        content.items as Array<{
          str?: string;
        }>
      )
        .filter((item) => typeof item.str === "string")
        .map((item) => item.str!)
        .join(" ");
      pages.push(text);
    }
  } finally {
    await loadingTask.destroy();
  }
  return pages.join("\n\n");
};
