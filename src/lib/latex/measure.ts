"use client";

export interface PageFitResult {
  fits: boolean;
  /** Total content height in CSS pixels */
  scrollHeight: number;
  /** Full page height in CSS pixels (letter 11in at 96dpi) */
  pageHeight: number;
  /** Positive = overflow amount in pixels, 0 or negative = fits */
  overflowPx: number;
  /** Estimated page count at current sizing */
  estPages: number;
}

const LETTER_HEIGHT_IN = 11;
const PX_PER_IN = 96;

/**
 * Measure whether an HTML resume fits on a single letter-size page.
 * Renders the HTML in a hidden iframe with the same CSS engine as the preview.
 * Waits for web fonts (Libre Baskerville, Inter) to load before measuring.
 */
export const measureHtmlPageFit = (html: string): Promise<PageFitResult> => {
  return new Promise((resolve, reject) => {
    // The rendered body's height already includes its top and bottom padding,
    // so compare it with the full physical page height. Subtracting margins
    // here would count the same space twice.
    const pageHeight = Math.round(LETTER_HEIGHT_IN * PX_PER_IN);
    // Create hidden iframe to isolate resume CSS from host page
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:8.5in;height:1px;border:0;visibility:hidden;z-index:-1;";
    document.body.appendChild(iframe);
    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {
        // already removed
      }
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while measuring resume page fit"));
    }, 8000);
    iframe.onload = () => {
      try {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow!.document;
        // Wait for web fonts before measuring
        const doMeasure = () => {
          clearTimeout(timeout);
          const body = iframeDoc.body;
          // The iframe is intentionally 1px tall, preventing its viewport
          // height from being mistaken for content height. The body includes
          // the resume's page padding, matching what is printed.
          const contentHeight = Math.ceil(
            Math.max(body.getBoundingClientRect().height, body.scrollHeight, 0),
          );
          const overflowPx = contentHeight - pageHeight;
          const fits = overflowPx <= 1; // 1px tolerance for rounding
          const estPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
          cleanup();
          resolve({
            fits,
            scrollHeight: contentHeight,
            pageHeight,
            overflowPx: Math.max(0, overflowPx),
            estPages,
          });
        };
        if (iframeDoc.fonts && iframeDoc.fonts.status === "loading") {
          iframeDoc.fonts.ready.then(doMeasure).catch(doMeasure);
        } else {
          // Small delay to let layout settle
          setTimeout(doMeasure, 100);
        }
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        reject(err);
      }
    };
    iframe.onerror = (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    };
    // Write HTML into iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
  });
};

/**
 * Measure with explicit width constraint. Use for testing or custom page widths.
 */
export const measureAtWidth = (
  html: string,
  widthIn: number,
  heightIn: number,
): Promise<PageFitResult> => {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${widthIn}in;height:1px;border:0;visibility:hidden;z-index:-1;`;
    document.body.appendChild(iframe);
    const pageHeight = Math.round(heightIn * PX_PER_IN);
    iframe.onload = () => {
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow!.document;
      const doMeasure = () => {
        const body = iframeDoc.body;
        const contentHeight = Math.ceil(
          Math.max(body.getBoundingClientRect().height, body.scrollHeight),
        );
        document.body.removeChild(iframe);
        resolve({
          fits: contentHeight <= pageHeight,
          scrollHeight: contentHeight,
          pageHeight,
          overflowPx: Math.max(0, contentHeight - pageHeight),
          estPages: Math.ceil(contentHeight / pageHeight),
        });
      };
      if (iframeDoc.fonts?.status === "loading") {
        iframeDoc.fonts.ready.then(doMeasure);
      } else {
        setTimeout(doMeasure, 50);
      }
    };
    const idoc = iframe.contentDocument || iframe.contentWindow!.document;
    idoc.open();
    idoc.write(html);
    idoc.close();
  });
};
