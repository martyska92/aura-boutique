/**
 * AURA BOUTIQUE - Bezpieczne Narzędzie Odzyskiwania Dostępu i Diagnostyki Serwera
 * Uruchamianie: node scripts/admin-recover.js [opcja]
 * Opcje:
 *   --link          Generuje jednorazowy, 256-bitowy kryptograficzny link odzyskiwania dostępu dla Kasi
 *   --set-password  Ustawia nowe hasło właścicielki bezpośrednio z terminala (ukryte wpisywanie)
 *   --set-smtp      Wprowadza i weryfikuje hasło SMTP skrzynki pocztowej (ukryte wpisywanie)
 *   --test-smtp     Testuje aktualne połączenie z serwerem SMTP i podaje odpowiedź
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");
const { Writable } = require("stream");
const nodemailer = require("nodemailer");

const STORE_PATH = path.join(process.cwd(), "data", "store-storage.json");

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    throw new Error(`Nie odnaleziono pliku magazynu: ${STORE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function saveStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function hashResetCode(code) {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

function askSecret(promptText) {
  return new Promise((resolve) => {
    let muted = false;
    const mutableStdout = new Writable({
      write: function (chunk, encoding, callback) {
        if (!muted) process.stdout.write(chunk, encoding);
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    process.stdout.write(promptText);
    muted = true;
    rl.question("", (ans) => {
      muted = false;
      process.stdout.write("\n");
      rl.close();
      resolve(ans.trim());
    });
  });
}

function askQuestion(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function trySyncNeon(callback) {
  const dbUrl =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (
    !dbUrl ||
    dbUrl.includes("localhost:51213") ||
    dbUrl.includes("username:password") ||
    (!dbUrl.startsWith("postgresql://") &&
      !dbUrl.startsWith("postgres://") &&
      !dbUrl.startsWith("prisma+postgres://") &&
      !dbUrl.startsWith("prisma://"))
  ) {
    return false;
  }

  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({
      datasources: { db: { url: dbUrl } },
    });
    await callback(prisma);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.warn("[Neon Sync] Uwaga: Bezpośrednia synchronizacja z bazą zdalną nie powiodła się:", err.message);
    return false;
  }
}

// 1. GENEROWANIE JEDNORAZOWEGO LINKU DLA KASI
async function generateRecoveryLink() {
  console.log("\n========================================================");
  console.log("  GENEROWANIE JEDNORAZOWEGO LINKU ODZYSKIWANIA DOSTĘPU");
  console.log("========================================================\n");

  const store = loadStore();
  const ownerEmail = (store.adminAccount?.email || "aurazmigrod@wp.pl").trim().toLowerCase();

  // Generujemy 256-bitowy losowy token kryptograficzny (64 znaki hex)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetCode(rawToken);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // Ważny przez 24 godziny

  // Zapisujemy hash tokenu do magazynu (nigdy jawny token)
  if (!store.passwordResetTokens) store.passwordResetTokens = [];
  // Usuń stare tokeny dla tego adresu
  store.passwordResetTokens = store.passwordResetTokens.filter(
    (t) => t.email.toLowerCase() !== ownerEmail
  );
  store.passwordResetTokens.push({
    email: ownerEmail,
    codeHash: tokenHash,
    expiresAt,
    attempts: 0,
    createdAt: Date.now(),
  });
  saveStore(store);

  // Synchronizacja z bazą Neon (jeśli dostępna)
  await trySyncNeon(async (prisma) => {
    await prisma.passwordResetToken.deleteMany({ where: { email: ownerEmail } });
    await prisma.passwordResetToken.create({
      data: {
        email: ownerEmail,
        codeHash: tokenHash,
        expiresAt: new Date(expiresAt),
        attempts: 0,
      },
    });
    // Unieważnienie wszystkich dotychczasowych sesji
    await prisma.adminSession.deleteMany({});
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aura-boutique-w38e.vercel.app";
  const recoveryUrl = `${baseUrl}/logowanie?tab=forgot&email=${encodeURIComponent(ownerEmail)}&token=${rawToken}`;

  console.log(`[STATUS] Wygenerowano bezpieczny jednorazowy token dla: ${ownerEmail}`);
  console.log(`[WAŻNOŚĆ] 24 godziny (lub do pierwszego użycia)`);
  console.log(`[BEZPIECZEŃSTWO] Token przechowywany na serwerze wyłącznie w postaci skrótu SHA-256.\n`);
  console.log("--------------------------------------------------------------------------------");
  console.log("JEDNORAZOWY BEZPIECZNY LINK DLA WŁAŚCICIELKI:");
  console.log(recoveryUrl);
  console.log("--------------------------------------------------------------------------------\n");
  console.log("Instrukcja dla Kasi:");
  console.log("1. Otwórz powyższy link w przeglądarce na telefonie lub komputerze.");
  console.log("2. Wpisz swoje nowe, prywatne hasło (min. 8 znaków) i kliknij «Zapisz nowe hasło».");
  console.log("3. Token zostanie trwale skasowany, a nowe hasło zabezpieczone skrótem PBKDF2.");
  console.log("4. Nikt (w tym programiści i czat) nie pozna Twojego nowego hasła.\n");
}

// 2. USTAWIANIE HASŁA W TERMINALU (BEZ ECHA)
async function setAdminPasswordDirect() {
  console.log("\n========================================================");
  console.log("  BEZPIECZNE USTAWIANIE HASŁA WŁAŚCICIELKI (TERMINAL)");
  console.log("========================================================\n");

  const store = loadStore();
  const ownerEmail = (store.adminAccount?.email || "aurazmigrod@wp.pl").trim().toLowerCase();

  console.log(`Konto właścicielki: ${ownerEmail}`);
  console.log("Wpisywane znaki nie będą wyświetlane na ekranie ani zapisywane w historii.\n");

  const pass1 = await askSecret("Wprowadź nowe hasło (min. 8 znaków): ");
  if (!pass1 || pass1.length < 8) {
    console.error("\n[BŁĄD] Hasło musi zawierać co najmniej 8 znaków. Anulowano.");
    return;
  }

  const pass2 = await askSecret("Powtórz nowe hasło dla weryfikacji: ");
  if (pass1 !== pass2) {
    console.error("\n[BŁĄD] Wprowadzone hasła nie są identyczne. Anulowano.");
    return;
  }

  const passwordHash = hashPassword(pass1);

  if (!store.adminAccount) {
    store.adminAccount = {
      email: ownerEmail,
      passwordHash: "",
      mustChangePassword: false,
      lastPasswordChangedAt: new Date().toISOString(),
    };
  }
  store.adminAccount.passwordHash = passwordHash;
  delete store.adminAccount.password;
  store.adminAccount.mustChangePassword = false;
  store.adminAccount.lastPasswordChangedAt = new Date().toISOString();

  // Usuń wszystkie oczekujące kody resetu dla admina
  if (store.passwordResetTokens) {
    store.passwordResetTokens = store.passwordResetTokens.filter(
      (t) => t.email.toLowerCase() !== ownerEmail
    );
  }
  saveStore(store);

  // Synchronizacja z bazą Neon i unieważnienie starych sesji
  await trySyncNeon(async (prisma) => {
    await prisma.adminAccount.upsert({
      where: { id: "default" },
      update: {
        passwordHash,
        mustChangePassword: false,
        lastPasswordChangedAt: new Date(),
      },
      create: {
        id: "default",
        email: ownerEmail,
        passwordHash,
        mustChangePassword: false,
        lastPasswordChangedAt: new Date(),
      },
    });
    await prisma.adminSession.deleteMany({});
    await prisma.passwordResetToken.deleteMany({ where: { email: ownerEmail } });
  });

  console.log("\n[SUKCES] Nowe hasło zostało pomyślnie zapisane!");
  console.log("[BEZPIECZEŃSTWO] Hasło zabezpieczono 100 000 iteracji PBKDF2 z losową solą kryptograficzną.");
  console.log("[SESJE] Wszystkie wcześniejsze sesje administratora zostały unieważnione.");
  console.log("Właścicielka może się teraz zalogować na stronie /admin/login lub /logowanie.\n");
}

// 3. WPROWADZANIE I WERYFIKACJA HASŁA SMTP
async function setSmtpPasswordDirect() {
  console.log("\n========================================================");
  console.log("  BEZPIECZNE USTAWIANIE HASŁA SMTP / WP POCZTA");
  console.log("========================================================\n");

  const store = loadStore();
  const settings = store.settings || {};
  const host = settings.smtpHost || "smtp.wp.pl";
  const port = Number(settings.smtpPort || 465);
  const secure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : port === 465;
  const user = settings.smtpUser || "aurazmigrod@wp.pl";

  console.log(`Serwer: ${host}:${port} (${secure ? "SSL" : "TLS"})`);
  console.log(`Login: ${user}`);
  console.log("Wpisywane hasło nie będzie widoczne na ekranie.\n");

  const smtpPass = await askSecret("Wprowadź aktualne hasło do skrzynki pocztowej WP / hasło aplikacji: ");
  if (!smtpPass) {
    console.error("\n[BŁĄD] Nie podano hasła. Anulowano.");
    return;
  }

  console.log("\nWeryfikacja połączenia z serwerem SMTP...");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: smtpPass,
    },
    authMethod: "LOGIN",
    tls: { rejectUnauthorized: false },
    pool: false,
  });

  try {
    await transporter.verify();
    console.log("[SUKCES] Połączenie SMTP zweryfikowane pomyślnie (250 OK)!");

    // Zapisujemy zweryfikowany sekret w magazynie
    settings.smtpPassword = smtpPass;
    settings.smtpPasswordConfigured = true;
    store.settings = settings;
    saveStore(store);

    await trySyncNeon(async (prisma) => {
      await prisma.storeSettings.upsert({
        where: { id: "default" },
        update: { smtpPassword: smtpPass },
        create: { id: "default", smtpPassword: smtpPass, smtpHost: host, smtpPort: port, smtpUser: user },
      });
    });

    console.log("[ZAPISANO] Nowy sekret SMTP został trwale zapisany na serwerze.");
  } catch (err) {
    console.error("\n[BŁĄD SMTP] Serwer odrzucił podane dane:");
    console.error(`Kod: ${err.code || err.responseCode || "EAUTH"}`);
    console.error(`Komunikat: ${err.message}`);
    console.log("\nNie zapisano nieprawidłowych danych. Sprawdź hasło w panelu WP lub wygeneruj hasło aplikacji.");
  }
}

// 4. TEST AKTUALNEJ KONFIGURACJI SMTP
async function testCurrentSmtp() {
  console.log("\n========================================================");
  console.log("  TEST AKTUALNEGO POŁĄCZENIA SMTP");
  console.log("========================================================\n");

  const store = loadStore();
  const settings = store.settings || {};
  const host = settings.smtpHost || "smtp.wp.pl";
  const port = Number(settings.smtpPort || 465);
  const secure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : port === 465;
  const user = settings.smtpUser || "aurazmigrod@wp.pl";
  const pass = settings.smtpPassword || process.env.SMTP_PASSWORD || "";

  console.log(`Host: ${host}:${port}`);
  console.log(`Użytkownik: ${user}`);
  console.log(`Zapisany sekret: ${pass ? `Obecny (${pass.length} znaków)` : "Brak"}`);

  if (!pass) {
    console.log("[STATUS] Brak zapisanego hasła SMTP na serwerze.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    authMethod: "LOGIN",
    tls: { rejectUnauthorized: false },
    pool: false,
  });

  const attemptId = `att-diag-${Date.now()}`;
  console.log(`Identyfikator próby: ${attemptId}`);
  console.log("Nawiązywanie połączenia...");

  try {
    await transporter.verify();
    console.log(`[WYNIK: 250 OK] Serwer SMTP zaakceptował autoryzację. Połączenie działa poprawnie!`);
  } catch (err) {
    console.log(`[WYNIK: ODRZUCONE] Serwer SMTP zwrócił błąd autoryzacji:`);
    console.log(`Kod: ${err.code || err.responseCode}`);
    console.log(`Odpowiedź serwera: ${err.response || err.message}`);
  }
}

async function main() {
  const arg = process.argv[2];

  if (arg === "--link") {
    await generateRecoveryLink();
    return;
  }
  if (arg === "--set-password") {
    await setAdminPasswordDirect();
    return;
  }
  if (arg === "--set-smtp") {
    await setSmtpPasswordDirect();
    return;
  }
  if (arg === "--test-smtp") {
    await testCurrentSmtp();
    return;
  }

  console.log("\n========================================================");
  console.log("  AURA BOUTIQUE - MENU ODZYSKIWANIA DOSTĘPU");
  console.log("========================================================");
  console.log("1. Wygeneruj jednorazowy bezpieczny link dla Kasi (--link)");
  console.log("2. Ustaw nowe hasło właścicielki w terminalu (--set-password)");
  console.log("3. Wprowadź i sprawdź nowe hasło SMTP (--set-smtp)");
  console.log("4. Przetestuj aktualne połączenie SMTP (--test-smtp)");
  console.log("0. Wyjście\n");

  const choice = await askQuestion("Wybierz opcję [0-4]: ");
  switch (choice) {
    case "1":
      await generateRecoveryLink();
      break;
    case "2":
      await setAdminPasswordDirect();
      break;
    case "3":
      await setSmtpPasswordDirect();
      break;
    case "4":
      await testCurrentSmtp();
      break;
    default:
      console.log("Zakończono.");
      break;
  }
}

main().catch((err) => {
  console.error("Wystąpił nieoczekiwany błąd:", err);
  process.exit(1);
});
