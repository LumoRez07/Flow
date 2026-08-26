/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export const PDF_TEXT_TYPES = new Set(["application/pdf"]);
export const DOCX_TEXT_TYPES = new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
export const DIRECT_TEXT_EXTENSIONS = new Set(["txt", "text", "md", "markdown", "csv", "tsv", "json", "xml", "html", "htm"]);

let pdfModulePromise = null;
let mammothModulePromise = null;

export function getFileExtension(fileName = "") {
  const parts = String(fileName).toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

export function getFileNameFromPath(filePath = "") {
  const normalizedPath = String(filePath || "").replace(/\\+/g, "/");
  return normalizedPath.split("/").pop() || "import.txt";
}

export function mimeTypeFromFileName(fileName = "") {
  const extension = getFileExtension(fileName);

  if (extension === "pdf") {
    return "application/pdf";
  }

  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (extension === "md" || extension === "markdown") {
    return "text/markdown";
  }

  if (extension === "csv") {
    return "text/csv";
  }

  if (extension === "tsv") {
    return "text/tab-separated-values";
  }

  if (extension === "json") {
    return "application/json";
  }

  if (extension === "xml") {
    return "application/xml";
  }

  if (extension === "html" || extension === "htm") {
    return "text/html";
  }

  return "text/plain";
}

export function classifyImportFile(file) {
  const extension = getFileExtension(file?.name);
  const mimeType = String(file?.type || "").toLowerCase();

  if (PDF_TEXT_TYPES.has(mimeType) || extension === "pdf") {
    return "pdf";
  }

  if (DOCX_TEXT_TYPES.has(mimeType) || extension === "docx") {
    return "docx";
  }

  if (mimeType.startsWith("text/") || DIRECT_TEXT_EXTENSIONS.has(extension)) {
    return "text";
  }

  return "unsupported";
}

export async function loadPdfModule() {
  if (!pdfModulePromise) {
    pdfModulePromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs").then((module) => {
      module.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      return module;
    });
  }

  return pdfModulePromise;
}

export async function loadMammothModule() {
  if (!mammothModulePromise) {
    mammothModulePromise = import("https://cdn.jsdelivr.net/npm/mammoth@1.9.1/+esm");
  }

  return mammothModulePromise;
}

export function detectTextEncoding(bytes) {
  if (!bytes?.length) {
    return "utf-8";
  }

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8-bom";
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "utf-16le-bom";
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return "utf-16be-bom";
  }

  const sampleSize = Math.min(bytes.length, 512);
  let evenNulls = 0;
  let oddNulls = 0;

  for (let index = 0; index < sampleSize; index += 1) {
    if (bytes[index] !== 0x00) {
      continue;
    }

    if (index % 2 === 0) {
      evenNulls += 1;
    } else {
      oddNulls += 1;
    }
  }

  if (oddNulls >= 8 && oddNulls > evenNulls * 3) {
    return "utf-16le";
  }

  if (evenNulls >= 8 && evenNulls > oddNulls * 3) {
    return "utf-16be";
  }

  return "utf-8";
}

export function decodeTextBytes(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  const encoding = detectTextEncoding(bytes);

  if (encoding === "utf-8-bom") {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }

  if (encoding === "utf-16le-bom") {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }

  if (encoding === "utf-16be-bom") {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }

  const decoded = new TextDecoder(encoding).decode(bytes).replace(/^\uFEFF/, "");
  const replacementCount = (decoded.match(/\uFFFD/g) || []).length;

  if (encoding === "utf-8" && replacementCount > Math.max(2, Math.floor(decoded.length * 0.02))) {
    try {
      return new TextDecoder("windows-1252").decode(bytes).replace(/^\uFEFF/, "");
    } catch {
      return decoded;
    }
  }

  return decoded;
}

export async function extractPdfText(file) {
  const pdfjs = await loadPdfModule();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = [];
    let currentLine = [];
    let lastY = null;

    content.items.forEach((item) => {
      const text = item?.str || "";
      const currentY = item?.transform?.[5] ?? null;

      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
        lines.push(currentLine.join(" ").trim());
        currentLine = [];
      }

      if (text.trim()) {
        currentLine.push(text.trim());
      }

      lastY = currentY;
    });

    if (currentLine.length > 0) {
      lines.push(currentLine.join(" ").trim());
    }

    pages.push(lines.filter(Boolean).join("\n"));
  }

  return pages.filter(Boolean).join("\n\n");
}

export async function extractDocxText(file) {
  const mammoth = await loadMammothModule();
  const bytes = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: bytes });
  return result.value || "";
}

export async function extractImportedText(file) {
  const fileKind = classifyImportFile(file);

  if (fileKind === "unsupported") {
    throw new Error("unsupported");
  }

  if (fileKind === "pdf") {
    return extractPdfText(file);
  }

  if (fileKind === "docx") {
    return extractDocxText(file);
  }

  return decodeTextBytes(await file.arrayBuffer());
}

export async function readImportedText(file) {
  const text = (await extractImportedText(file)).trim();

  if (!text) {
    throw new Error("empty");
  }

  return text;
}
