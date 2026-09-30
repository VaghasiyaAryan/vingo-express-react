import { Router } from "express";
import { businessCard, businessCardName, company } from "../../../shared/content.js";

export const vcardRouter = Router();

/**
 * vCard escaping. Backslash, comma, semicolon and newline are structural
 * characters in the format, so they have to be escaped inside every value.
 */
function esc(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildVcf() {
  const { firstName, lastName, role, organization, phoneHref, phoneDisplay, email, websiteUrl, address, photo } =
    businessCard;

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    // N is a structured field — Last;First;Middle;Prefix;Suffix — so those
    // semicolons are separators and must stay outside esc().
    `N:${esc(lastName)};${esc(firstName)};;;`,
    `FN:${esc(businessCardName)}`,
    `ORG:${esc(organization)}`,
    `TITLE:${esc(role)}`,
    `TEL;TYPE=CELL,VOICE:${esc(phoneHref || phoneDisplay)}`,
    `EMAIL;TYPE=INTERNET,WORK:${esc(email)}`,
    `URL:${esc(websiteUrl)}`,
    // ADR is structured too: PO;Extended;Street;City;Region;PostalCode;Country
    `ADR;TYPE=WORK:;;${esc(address)};;;;`,
    `NOTE:${esc(company.tagline)}`,
  ];

  if (photo) {
    lines.push(`PHOTO;VALUE=URI:${esc(new URL(photo, company.websiteUrl).toString())}`);
  }

  lines.push(`REV:${new Date().toISOString()}`, "END:VCARD");

  // vCard mandates CRLF line endings — LF-only files fail to import on some
  // Android contact apps.
  return lines.join("\r\n") + "\r\n";
}

/**
 * Deliberately public: this is the "Add to contacts" button on /card. It only
 * serves details that are already printed on the card itself.
 */
vcardRouter.get("/", (req, res) => {
  const filename = `${businessCardName.replace(/\s+/g, "-")}-${company.shortName.replace(/\s+/g, "-")}.vcf`;

  res.set({
    "Content-Type": "text/vcard; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "public, max-age=0, must-revalidate",
  });
  res.send(buildVcf());
});
