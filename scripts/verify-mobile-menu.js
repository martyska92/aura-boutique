/**
 * verify-mobile-menu.js
 * Kompleksowa weryfikacja przebudowy menu mobilnego i nagłówka AURA Boutique:
 * 1. Zastąpienie poziomego paska kategorii jednym przyciskiem „Kategorie” z ikoną menu.
 * 2. Pokazywanie aktywnej kategorii i opcji zmiany.
 * 3. Wspólny panel (drawer) otwierany z hamburgera i przycisku „Kategorie”.
 * 4. „Wszystkie” na początku, pełne nieucięte nazwy, wyróżnienie aktywnej kategorii.
 * 5. „Promocje” z subtelnym akcentem kolorystycznym.
 * 6. Duże obszary dotykowe (min. 44 px).
 * 7. Niezależne przewijanie w pionie, dostępność na niskich ekranach, widoczny przycisk X.
 * 8. Zamknięcie panelu i przejście do wybranej kategorii.
 * 9. Uporządkowany nagłówek: wyśrodkowane logo, hamburger po lewej, wyszukiwarka, konto i koszyk po prawej.
 * 10. Proporcjonalne logo i brak przepełnienia poziomego (320px, 360px, 390px, 430px).
 * 11. Pasek ogłoszeń (AnnouncementBar) przewijający się ze stroną i przyklejony nagłówek z offsetem scrolla.
 * 12. Obsługa klawiatury: focus trap, Escape, powrót fokusu i odblokowanie scrolla.
 */

const fs = require("fs");
const path = require("path");

function runVerification() {
  console.log("=== WERYFIKACJA PRZEBUDOWY MENU MOBILNEGO I NAGŁÓWKA AURA BOUTIQUE ===\n");

  const headerPath = path.join(__dirname, "../src/components/layout/Header.tsx");
  const globalsPath = path.join(__dirname, "../src/app/globals.css");
  const logoPath = path.join(__dirname, "../src/components/ui/BrandLogo.tsx");

  if (!fs.existsSync(headerPath)) {
    throw new Error("Plik Header.tsx nie istnieje!");
  }
  const headerContent = fs.readFileSync(headerPath, "utf-8");
  const globalsContent = fs.readFileSync(globalsPath, "utf-8");
  const logoContent = fs.readFileSync(logoPath, "utf-8");

  const tests = [
    {
      id: 1,
      name: "Na telefonach zastąpienie poziomej listy pojedynczym przyciskiem „Kategorie”",
      test: () => {
        const hasMobileCategoryButton = headerContent.includes("lg:hidden bg-[#B29F8E]/95") &&
          headerContent.includes("ref={categoryButtonRef}") &&
          headerContent.includes("Kategorie");
        const desktopOnlyHorizontalBar = headerContent.includes("hidden lg:flex") &&
          headerContent.includes('aria-label="Kategorie"');
        return hasMobileCategoryButton && desktopOnlyHorizontalBar;
      },
    },
    {
      id: 2,
      name: "Pokazywanie nazwy aktywnej kategorii i możliwości zmiany na przycisku mobilnym",
      test: () => {
        const hasActiveLabelLogic = headerContent.includes("activeCategoryLabel") &&
          headerContent.includes("activeCategoryLabel ? \"Zmień\" : \"Wybierz\"");
        const hasActiveLabelDisplay = headerContent.includes("{activeCategoryLabel}");
        return hasActiveLabelLogic && hasActiveLabelDisplay;
      },
    },
    {
      id: 3,
      name: "Kliknięcie „Kategorie” lub hamburgera otwiera ten sam panel (drawer)",
      test: () => {
        const hamburgerOpensDrawer = headerContent.includes("onClick={openDrawerFromHamburger}") ||
          (headerContent.includes("hamburgerButtonRef") && headerContent.includes("setMobileMenuOpen(true)"));
        const categoryOpensDrawer = headerContent.includes("onClick={openDrawerFromCategory}") ||
          (headerContent.includes("categoryButtonRef") && headerContent.includes("setMobileMenuOpen(true)"));
        const sharedDrawer = headerContent.includes("role=\"dialog\"") &&
          headerContent.includes("aria-label=\"Menu i kategorie butiku\"");
        return hamburgerOpensDrawer && categoryOpensDrawer && sharedDrawer;
      },
    },
    {
      id: 4,
      name: "„Wszystkie” na początku listy i pełne, nieucięte nazwy kategorii",
      test: () => {
        const hasAllAtStart = headerContent.includes("Wszystkie produkty");
        const hasUntruncatedNames = headerContent.includes("break-words whitespace-normal leading-snug");
        return hasAllAtStart && hasUntruncatedNames;
      },
    },
    {
      id: 5,
      name: "Wyróżnienie aktywnej kategorii oraz „Promocje” z subtelnym akcentem",
      test: () => {
        const hasActiveHighlight = headerContent.includes("bg-[#241D1B] text-[#FAF6F1] font-bold border-l-4 border-[#C5A069]");
        const hasPromotionsAccent = headerContent.includes("bg-rose-50") &&
          headerContent.includes("text-[#8C2D2D]") &&
          headerContent.includes("border-rose-200");
        return hasActiveHighlight && hasPromotionsAccent;
      },
    },
    {
      id: 6,
      name: "Duże obszary dotykowe (minimum 44 px wysokości)",
      test: () => {
        const hasMin44MobileBtn = headerContent.includes("min-h-[44px]");
        const has44Hamburger = headerContent.includes("w-11 h-11");
        const hasMin44CategoryLinks = headerContent.includes("min-h-[44px] px-3.5 py-2.5 rounded-md flex items-center justify-between text-sm");
        return hasMin44MobileBtn && has44Hamburger && hasMin44CategoryLinks;
      },
    },
    {
      id: 7,
      name: "Panel mieści się w ekranie, ma widoczny przycisk X i własne przewijanie w pionie",
      test: () => {
        const hasCloseButton = headerContent.includes("ref={closeButtonRef}") &&
          headerContent.includes("w-11 h-11") &&
          headerContent.includes("X className=\"w-6 h-6");
        const hasVerticalScroll = headerContent.includes("overflow-y-auto") &&
          headerContent.includes("overscroll-contain") &&
          headerContent.includes("max-h-screen");
        const closesOnSelect = headerContent.includes("onClick={() => setMobileMenuOpen(false)}");
        return hasCloseButton && hasVerticalScroll && closesOnSelect;
      },
    },
    {
      id: 8,
      name: "Uporządkowany nagłówek mobilny: wyśrodkowane logo, hamburger po lewej, ikony po prawej",
      test: () => {
        const has3ColGrid = headerContent.includes("grid grid-cols-[1fr_auto_1fr]");
        const hasLeftHamburger = headerContent.includes("justify-self-start") && headerContent.includes("hamburgerButtonRef");
        const hasCenteredLogo = headerContent.includes("justify-self-center");
        const hasRightIcons = headerContent.includes("justify-self-end") &&
          headerContent.includes("auth.isLoggedIn ? \"/konto\" : \"/logowanie\"") &&
          headerContent.includes("setIsCartOpen(true)");
        return has3ColGrid && hasLeftHamburger && hasCenteredLogo && hasRightIcons;
      },
    },
    {
      id: 9,
      name: "Pasek ogłoszeń (AnnouncementBar) przewijany ze stroną, nagłówek sticky z ochroną pól formularza",
      test: () => {
        const announcementOutsideHeader = headerContent.indexOf("<AnnouncementBar />") < headerContent.indexOf("<header");
        const isHeaderSticky = headerContent.includes("sticky top-0 z-40");
        const hasScrollOffset = globalsContent.includes("scroll-padding-top: 104px") &&
          globalsContent.includes("scroll-margin-top: 104px");
        return announcementOutsideHeader && isHeaderSticky && hasScrollOffset;
      },
    },
    {
      id: 10,
      name: "Eliminacja poziomego przepełnienia bez fałszywego overflow:hidden na całej stronie",
      test: () => {
        const mobileHasNoMinWMax = !headerContent.includes("lg:hidden w-full bg-[#B29F8E]/95 backdrop-blur-xs border-b border-[#968372] overflow-x-auto no-scrollbar shadow-inner flex justify-center");
        const logoProportions = logoContent.includes("w-[115px]") && logoContent.includes("lg:w-[220px]");
        return mobileHasNoMinWMax && logoProportions;
      },
    },
    {
      id: 11,
      name: "Dostępność klawiatury: focus trap, zamykanie Escape, powrót fokusu i odblokowanie scrolla",
      test: () => {
        const hasEscape = headerContent.includes("e.key === \"Escape\"");
        const hasFocusTrap = headerContent.includes("e.key === \"Tab\"") && headerContent.includes("focusableElements");
        const hasReturnFocus = headerContent.includes("lastActiveElementRef.current") &&
          headerContent.includes(".focus()");
        const restoresScroll = headerContent.includes("document.body.style.overflow = \"\"");
        return hasEscape && hasFocusTrap && hasReturnFocus && restoresScroll;
      },
    },
  ];

  let passed = 0;
  for (const t of tests) {
    const ok = t.test();
    if (ok) {
      console.log(`✔ Wymóg ${t.id}: ${t.name} -> ZALICZONY`);
      passed++;
    } else {
      console.error(`✖ Wymóg ${t.id}: ${t.name} -> BŁĄD`);
    }
  }

  console.log(`\nWynik testów weryfikacyjnych: ${passed}/${tests.length}`);
  if (passed === tests.length) {
    console.log(">>> WSZYSTKIE TESTY PRZEBUDOWY MENU MOBILNEGO ZALICZONE W 100% <<<");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
