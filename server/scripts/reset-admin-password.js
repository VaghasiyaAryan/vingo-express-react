// Locked out of the admin panel? Run on the server:
//
//   npm run admin:reset-password --prefix server -- someone@example.com
//     Gives that admin a new random password, prints it, and signs them out
//     everywhere. They should change it on the Security page after signing in.
//
//   npm run admin:reset-password --prefix server
//     With no email: lists the admin accounts. If there are none yet, removes
//     the shared password set from the panel, so ADMIN_PASSWORD from the .env
//     file works again (within 30 seconds, or after a server restart).
import { randomBytes } from "node:crypto";
import { prisma } from "../src/prisma.js";
import { normalizeEmail, setAccountPassword } from "../src/auth.js";

const email = normalizeEmail(process.argv[2] ?? "");

if (email) {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    console.error(`No admin with the email ${email}. Run without an email to list them.`);
    process.exitCode = 1;
  } else {
    const password = randomBytes(9).toString("base64url");
    await setAccountPassword(user.id, password);
    console.log(`New password for ${user.name} <${user.email}>:\n\n    ${password}\n\nSign in with it, then change it under Admin → Security.`);
  }
} else {
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  if (admins.length) {
    console.log("Admin accounts:");
    for (const a of admins) console.log(`  ${a.role.padEnd(6)}  ${a.email}  (${a.name})`);
    console.log("\nTo reset one:  npm run admin:reset-password --prefix server -- <email>");
  } else {
    const { count } = await prisma.siteSetting.deleteMany({ where: { key: "adminPassword" } });
    console.log(
      count
        ? "Shared password reset. Within 30 seconds (or after restarting the server), sign in with ADMIN_PASSWORD from your .env file."
        : "No admin accounts yet, and the shared password is already ADMIN_PASSWORD from your .env file."
    );
  }
}
await prisma.$disconnect();
