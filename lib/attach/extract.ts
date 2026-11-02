"use client";

export const maxWords = 4_000;

export class AttachError extends Error {}

const unreadable = "I can't read that one. A PDF or plain text works.";
const scanned = "Looks like a scan, I can't read it. Want to just tell me about your experience?";

async function pdfText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const { items } = await page.getTextContent();
    pages.push(items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n");
}

const isPdf = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);
const isText = (file: File) => file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);

// Reads a file in the browser and trims it to the limit. Throws AttachError with her line.
export async function extractText(file: File) {
  if (!isPdf(file) && !isText(file)) throw new AttachError(unreadable);

  let text: string;
  try {
    text = isPdf(file) ? await pdfText(file) : await file.text();
  } catch {
    throw new AttachError(unreadable);
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new AttachError(isPdf(file) ? scanned : unreadable);
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") : text.trim();
}
