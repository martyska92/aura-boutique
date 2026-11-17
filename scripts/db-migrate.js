const { execSync } = require("child_process");

function getCleanUrl() {
  const raw =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!raw) return null;
  const clean = raw.trim().replace(/^["']|["']$/g, "");
  if (
    clean &&
    !clean.includes("localhost:51213") &&
    !clean.includes("username:password") &&
    !clean.includes("twoja_baza") &&
    (clean.startsWith("postgresql://") ||
      clean.startsWith("postgres://") ||
      clean.startsWith("prisma+postgres://") ||
      clean.startsWith("prisma://"))
  ) {
    return clean;
  }
  return null;
}

async function run() {
  const dbUrl = getCleanUrl();
  if (!dbUrl) {
    console.log(
      "[db-migrate] Brak skonfigurowanej zdalnej bazy PostgreSQL (lokalne srodowisko lub brak zmiennych). Pomijanie migracji w chmurze."
    );
    return;
  }

  console.log(
    "[db-migrate] Wykryto polaczenie z PostgreSQL / Neon. Rozpoczynanie synchronizacji schematu bez kasowania danych..."
  );
  try {
    execSync("npx prisma db push --skip-generate --accept-data-loss=false", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || dbUrl,
        DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || dbUrl,
      },
    });
    console.log("[db-migrate] Schemat bazy danych zostal pomyslnie zaktualizowany!");

    // Bezpieczna archiwizacja produktów testowych i uzupełnienie kategorii
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL || dbUrl } },
      });

      // 1. Archiwizacja produktów testowych (ads, vfggh, test, niespodzianka)
      const archiveResult = await prisma.product.updateMany({
        where: {
          OR: [
            { name: { contains: "ads", mode: "insensitive" } },
            { name: { contains: "vfggh", mode: "insensitive" } },
            { name: { contains: "test", mode: "insensitive" } },
            { name: { contains: "niespodzianka", mode: "insensitive" } },
            { slug: { in: ["ads", "vfggh", "test", "niespodzianka"] } },
          ],
        },
        data: {
          isArchived: true,
          isPublished: false,
        },
      });
      if (archiveResult.count > 0) {
        console.log(`[db-migrate] Zarchiwizowano ${archiveResult.count} produktow testowych bez usuwania danych.`);
      }

      // 2. Kategoria Legginsy
      const existingLegginsy = await prisma.category.findUnique({
        where: { id: "cat-legginsy" },
      });
      if (!existingLegginsy) {
        await prisma.category.create({
          data: {
            id: "cat-legginsy",
            name: "Legginsy",
            slug: "legginsy",
            description: "Stylowe, wygodne i modelujące legginsy damskie na każdą okazję.",
            orderIndex: 8,
            isActive: true,
          },
        });
        console.log("[db-migrate] Dodano kategorie 'Legginsy' do bazy danych.");
      }

      // 3. Inicjalizacja konta właścicielki i synchronizacja tokenów odzyskiwania dostępu
      try {
        const fs = require("fs");
        const path = require("path");
        const storeFile = path.join(__dirname, "..", "data", "store-storage.json");
        let localStore = null;
        if (fs.existsSync(storeFile)) {
          try {
            localStore = JSON.parse(fs.readFileSync(storeFile, "utf8"));
          } catch (_) {}
        }

        const existingAdmin = await prisma.adminAccount.findUnique({
          where: { id: "default" },
        });

        const initialHash = localStore?.adminAccount?.passwordHash || null;
        const initialMustChange = localStore?.adminAccount?.mustChangePassword ?? true;

        if (!existingAdmin) {
          await prisma.adminAccount.create({
            data: {
              id: "default",
              email: "aurazmigrod@wp.pl",
              passwordHash: initialHash,
              mustChangePassword: initialMustChange,
            },
          });
          console.log("[db-migrate] Zainicjalizowano konto wlascicielki w PostgreSQL.");
        } else if (!existingAdmin.passwordHash && initialHash) {
          await prisma.adminAccount.update({
            where: { id: "default" },
            data: {
              passwordHash: initialHash,
              mustChangePassword: initialMustChange,
            },
          });
          console.log("[db-migrate] Zsynchronizowano bezpieczny hash konta wlascicielki.");
        }

        // Synchronizacja aktywnych tokenów odzyskiwania dostępu z magazynu lokalnego
        if (localStore?.passwordResetTokens && Array.isArray(localStore.passwordResetTokens)) {
          const now = new Date();
          for (const tok of localStore.passwordResetTokens) {
            const exp = new Date(tok.expiresAt);
            if (exp > now && tok.codeHash) {
              const existingTok = await prisma.passwordResetToken.findFirst({
                where: { codeHash: tok.codeHash },
              });
              if (!existingTok) {
                await prisma.passwordResetToken.create({
                  data: {
                    email: tok.email.toLowerCase(),
                    codeHash: tok.codeHash,
                    expiresAt: exp,
                    attempts: tok.attempts || 0,
                  },
                });
                console.log(`[db-migrate] Zsynchronizowano bezpieczny token odzyskiwania dla: ${tok.email}`);
              }
            }
          }
        }
      } catch (adminErr) {
        console.warn("[db-migrate] Ostrzezenie inicjalizacji adminAccount / tokenow:", adminErr.message);
      }

      await prisma.$disconnect();
    } catch (dataErr) {
      console.warn("[db-migrate] Ostrzezenie podczas aktualizacji danych pomocniczych:", dataErr.message);
    }
  } catch (err) {
    console.warn("[db-migrate] Ostrzezenie podczas synchronizacji schematu:", err.message);
  }
}

run();

