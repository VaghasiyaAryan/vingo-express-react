import { prisma } from "./prisma.js";
import { clean } from "./util.js";

/**
 * An uploaded catalogue PDF that replaces the auto-generated one.
 *
 * The file's bytes live in the Image table (the same binary store product
 * photos use — it is a generic content-type + bytes record); a SiteSetting row
 * points at it and remembers the details shown in the admin panel. With no
 * pointer, /api/catalog generates the PDF from the live product list as before.
 *
 * Uploaded PDFs are only ever served through /api/catalog — the image route
 * refuses anything that isn't an image.
 */

const KEY = "catalogPdf";
export const PDF_TYPE = "application/pdf";
export const MAX_CATALOG_BYTES = 15 * 1024 * 1024;

/** True when the bytes really are a PDF: "%PDF-" within the first 1 KB (the PDF spec allows a short preamble). */
export function looksLikePdf(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 64) return false;
  return buf.subarray(0, 1024).includes(Buffer.from("%PDF-"));
}

/** Details of the uploaded catalogue, or null when the auto-generated one is in use. */
export async function getUploadedCatalog() {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
  const v = row?.value;
  if (!v?.fileId) return null;
  // The pointer is only trusted while its file still exists.
  const exists = await prisma.image.count({ where: { id: v.fileId, contentType: PDF_TYPE } });
  return exists ? v : null;
}

/** The uploaded PDF's bytes, or null. */
export async function getUploadedCatalogBytes() {
  const info = await getUploadedCatalog();
  if (!info) return null;
  const file = await prisma.image.findUnique({ where: { id: info.fileId }, select: { data: true } });
  return file ? Buffer.from(file.data) : null;
}

/**
 * Stores a new catalogue PDF, points the catalogue at it, then deletes the
 * previous upload. The new file is saved before the old one is removed, so the
 * catalogue link never points at nothing.
 */
export async function saveUploadedCatalog(buf, { fileName, uploadedBy }) {
  const previous = await getUploadedCatalog();
  const file = await prisma.image.create({
    data: { contentType: PDF_TYPE, sizeBytes: buf.length, data: buf },
    select: { id: true },
  });
  const value = {
    fileId: file.id,
    fileName: clean(fileName, 160).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_") || "catalogue.pdf",
    sizeBytes: buf.length,
    uploadedAt: new Date().toISOString(),
    uploadedBy: clean(uploadedBy, 200) || null,
  };
  await prisma.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  if (previous?.fileId && previous.fileId !== file.id) {
    await prisma.image.deleteMany({ where: { id: previous.fileId, contentType: PDF_TYPE } });
  }
  return value;
}

/** Deletes the uploaded PDF; the catalogue link goes back to the auto-generated one. */
export async function removeUploadedCatalog() {
  const previous = await getUploadedCatalog();
  await prisma.siteSetting.deleteMany({ where: { key: KEY } });
  if (previous?.fileId) await prisma.image.deleteMany({ where: { id: previous.fileId, contentType: PDF_TYPE } });
  return Boolean(previous);
}
