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
  } catch (err) {
    console.warn("[db-migrate] Ostrzezenie podczas synchronizacji schematu:", err.message);
  }
}

run();

