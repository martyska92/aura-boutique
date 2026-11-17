/**
 * Moduł ciepłych, spersonalizowanych powitań dla zalogowanych klientek AURA Boutique.
 * 
 * Zasady:
 * 1. Zapis „Witaj [imię]!” bez przecinka po słowie „Witaj”.
 * 2. Brak imienia -> „Witaj! Miło Cię widzieć w AURA 💛”.
 * 3. Ponad 25 naturalnych wariantów dopasowanych do pory dnia (Europe/Warsaw).
 * 4. Wybór raz na sesję logowania (sessionStorage) bez zmian podczas nawigacji i odświeżania.
 * 5. Rotacja wariantów przy kolejnym logowaniu (localStorage).
 * 6. Maksymalnie jedna emotikona na komunikat. Brak presji na zakupy i brak ocen wyglądu.
 */

export interface GreetingVariant {
  id: string;
  timeBucket: "morning" | "afternoon" | "evening" | "any";
  template: (name: string) => string;
}

// Kolekcja ponad 25 ciepłych, kobiecych wariantów
export const CUSTOMER_GREETING_VARIANTS: GreetingVariant[] = [
  // --- PORANEK (5:00 - 11:59) ---
  {
    id: "morn_1",
    timeBucket: "morning",
    template: (n) => `Witaj ${n}! Pięknego i spokojnego poranka ☀️`,
  },
  {
    id: "morn_2",
    timeBucket: "morning",
    template: (n) => `Witaj ${n}! Niech to będzie piękny dzień!`,
  },
  {
    id: "morn_3",
    timeBucket: "morning",
    template: (n) => `Witaj ${n}! Życzymy Ci energii i uśmiechu na cały dzień ✨`,
  },
  {
    id: "morn_4",
    timeBucket: "morning",
    template: (n) => `Witaj ${n}! Poranna chwila wytchnienia jest tylko dla Ciebie ☕`,
  },
  {
    id: "morn_5",
    timeBucket: "morning",
    template: (n) => `Witaj ${n}! Niech dzisiaj spotka Cię coś miłego 🌸`,
  },
  {
    id: "morn_6",
    timeBucket: "morning",
    template: (n) => `Witaj ${n}! Dobrego początku dnia i samych miłych chwil 💛`,
  },
  {
    id: "morn_7",
    timeBucket: "morning",
    template: (n) => `Witaj ${n}! Życzymy Ci wielu powodów do uśmiechu.`,
  },

  // --- POPOŁUDNIE (12:00 - 17:59) ---
  {
    id: "aft_1",
    timeBucket: "afternoon",
    template: (n) => `Witaj ${n}! Miło Cię widzieć w AURA 💛`,
  },
  {
    id: "aft_2",
    timeBucket: "afternoon",
    template: (n) => `Witaj ${n}! Chwila dla siebie w środku dnia zawsze jest dobrym pomysłem ✨`,
  },
  {
    id: "aft_3",
    timeBucket: "afternoon",
    template: (n) => `Witaj ${n}! Mamy nadzieję, że Twój dzień mija wspaniale 🌸`,
  },
  {
    id: "aft_4",
    timeBucket: "afternoon",
    template: (n) => `Witaj ${n}! Znajdź dziś coś, w czym poczujesz się sobą.`,
  },
  {
    id: "aft_5",
    timeBucket: "afternoon",
    template: (n) => `Witaj ${n}! Zrób sobie krótką przerwę i rozgość się u nas 🌿`,
  },
  {
    id: "aft_6",
    timeBucket: "afternoon",
    template: (n) => `Witaj ${n}! Niech to popołudnie przyniesie Ci spokój i radość 💛`,
  },
  {
    id: "aft_7",
    timeBucket: "afternoon",
    template: (n) => `Witaj ${n}! Dobrze, że jesteś ✨`,
  },

  // --- WIECZÓR (18:00 - 4:59) ---
  {
    id: "eve_1",
    timeBucket: "evening",
    template: (n) => `Witaj ${n}! Spokojnego i przytulnego wieczoru 🌙`,
  },
  {
    id: "eve_2",
    timeBucket: "evening",
    template: (n) => `Witaj ${n}! Czas na relaks i zasłużony odpoczynek ✨`,
  },
  {
    id: "eve_3",
    timeBucket: "evening",
    template: (n) => `Witaj ${n}! Niech ten wieczór upłynie Ci w ciepłej atmosferze 💛`,
  },
  {
    id: "eve_4",
    timeBucket: "evening",
    template: (n) => `Witaj ${n}! Rozgość się wygodnie i odetchnij po całym dniu 🕯️`,
  },
  {
    id: "eve_5",
    timeBucket: "evening",
    template: (n) => `Witaj ${n}! Życzymy Ci wyciszenia i pięknego wieczoru 🌸`,
  },
  {
    id: "eve_6",
    timeBucket: "evening",
    template: (n) => `Witaj ${n}! Chwila dla siebie zawsze jest dobrym pomysłem.`,
  },
  {
    id: "eve_7",
    timeBucket: "evening",
    template: (n) => `Witaj ${n}! Rozgość się i poczuj się jak u siebie.`,
  },

  // --- UNIWERSALNE (o każdej porze dnia) ---
  {
    id: "uni_1",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Miło Cię widzieć w AURA 💛`,
  },
  {
    id: "uni_2",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Dobrze, że jesteś ✨`,
  },
  {
    id: "uni_3",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Znajdź dziś coś, w czym poczujesz się sobą.`,
  },
  {
    id: "uni_4",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Życzymy Ci wielu powodów do uśmiechu.`,
  },
  {
    id: "uni_5",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Chwila dla siebie zawsze jest dobrym pomysłem.`,
  },
  {
    id: "uni_6",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Rozgość się i poczuj się jak u siebie.`,
  },
  {
    id: "uni_7",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Niech dzisiaj spotka Cię coś miłego 🌸`,
  },
  {
    id: "uni_8",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Cieszymy się, że odwiedzasz nasz butik 💛`,
  },
  {
    id: "uni_9",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Każda chwila poświęcona sobie ma znaczenie ✨`,
  },
  {
    id: "uni_10",
    timeBucket: "any",
    template: (n) => `Witaj ${n}! Życzymy Ci spokoju, harmonii i dobrego nastroju 🌿`,
  },
];

/**
 * Zwraca aktualną godzinę w strefie czasowej Europe/Warsaw
 */
export function getWarsawHour(): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Warsaw",
      hour: "numeric",
      hour12: false,
    });
    const hourStr = formatter.format(new Date());
    const parsed = parseInt(hourStr, 10);
    return isNaN(parsed) ? new Date().getHours() : parsed;
  } catch {
    return new Date().getHours();
  }
}

/**
 * Ustala porę dnia na podstawie godziny w Warszawie
 */
export function getWarsawTimeBucket(): "morning" | "afternoon" | "evening" {
  const hour = getWarsawHour();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

const SESSION_KEY = "aura_customer_greeting_session";
const LAST_VARIANT_KEY_PREFIX = "aura_customer_last_greeting_";

/**
 * Wybiera i zwraca spersonalizowane powitanie dla klientki.
 * - Zachowuje ten sam wariant w ramach sesji (sessionStorage).
 * - Rotuje wariant przy kolejnych sesjach (localStorage).
 * - Czyści stan przy zmianie użytkownika.
 */
export function resolveCustomerGreeting(
  rawFirstName?: string | null,
  customerEmail?: string | null
): string {
  const cleanName = (rawFirstName || "").trim();
  const normalizedEmail = (customerEmail || "").trim().toLowerCase();

  // Wymóg 3: Jeśli imienia brakuje, pokaż dokładnie:
  if (!cleanName) {
    return "Witaj! Miło Cię widzieć w AURA 💛";
  }

  // Wymóg 8: Imię traktujemy bezpiecznie jako zwykły tekst
  const safeName = cleanName.replace(/[<>]/g, "");

  if (typeof window === "undefined") {
    // SSR fallback: bezpieczny wariant bez przecinka
    return `Witaj ${safeName}! Miło Cię widzieć w AURA 💛`;
  }

  try {
    // Sprawdzamy, czy w bieżącej sesji zostało już wybrane powitanie dla tego konta
    const storedSessionJson = sessionStorage.getItem(SESSION_KEY);
    if (storedSessionJson) {
      const stored = JSON.parse(storedSessionJson);
      // Jeśli powitanie w sesji należy do tego samego e-maila i imienia, zachowaj je bez zmian
      if (
        stored &&
        stored.email === normalizedEmail &&
        stored.name === safeName &&
        typeof stored.text === "string"
      ) {
        return stored.text;
      }
    }
  } catch {
    // sessionStorage zablokowany lub błąd parsowania
  }

  // Określamy porę dnia w Warszawie
  const timeBucket = getWarsawTimeBucket();

  // Pobieramy kandydatów dla danej pory dnia oraz warianty uniwersalne
  const candidates = CUSTOMER_GREETING_VARIANTS.filter(
    (v) => v.timeBucket === timeBucket || v.timeBucket === "any"
  );

  // Wymóg 5: Sprawdź ID poprzedniego wariantu z poprzedniej sesji, aby go nie powtórzyć
  let lastVariantId: string | null = null;
  const storageKey = `${LAST_VARIANT_KEY_PREFIX}${normalizedEmail || "guest"}`;
  try {
    lastVariantId = localStorage.getItem(storageKey);
  } catch {}

  let available = candidates;
  if (lastVariantId && candidates.length > 1) {
    const withoutLast = candidates.filter((c) => c.id !== lastVariantId);
    if (withoutLast.length > 0) {
      available = withoutLast;
    }
  }

  // Losujemy wariant spośród dostępnych
  const randomIndex = Math.floor(Math.random() * available.length);
  const selectedVariant = available[randomIndex] || candidates[0];

  const generatedText = selectedVariant.template(safeName);

  // Zapisujemy w bieżącej sesji (Wymóg 4) oraz zapamiętujemy ID do rotacji (Wymóg 5)
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        email: normalizedEmail,
        name: safeName,
        text: generatedText,
        variantId: selectedVariant.id,
      })
    );
    localStorage.setItem(storageKey, selectedVariant.id);
  } catch {}

  return generatedText;
}

/**
 * Usuwa stan powitania po wylogowaniu klientki (Wymóg 6).
 */
export function clearCustomerGreetingSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}
