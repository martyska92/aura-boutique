/**
 * Ciepłe, eleganckie i zróżnicowane powitania dla Kasi w panelu właścicielki AURA BOUTIQUE
 * Dobierane według pory dnia (Europe/Warsaw), zachowywane w trakcie trwania sesji
 * i unikające powtórzenia z poprzedniej sesji.
 */

export interface GreetingVariant {
  id: string;
  text: string;
  slot: "morning" | "afternoon" | "evening" | "any";
}

export const KASIA_GREETINGS: GreetingVariant[] = [
  // ─── PORANEK (5:00 - 11:59) ───
  { id: "m1", text: "Dzień dobry, Kasiu! Niech dziś wszystko idzie po Twojej myśli.", slot: "morning" },
  { id: "m2", text: "Witaj, Kasiu! Miłego i spokojnego dnia 💛", slot: "morning" },
  { id: "m3", text: "Kasiu, dobrego dnia i samych miłych klientek!", slot: "morning" },
  { id: "m4", text: "Dzień dobry, Kasiu! Dobra kawa i zaczynamy piękny dzień ☕", slot: "morning" },
  { id: "m5", text: "Cześć, Kasiu! Przed Tobą kolejny wspaniały dzień w butiku ✨", slot: "morning" },
  { id: "m6", text: "Kasiu, niech to będzie dobry dzień dla Ciebie i AURY 💛", slot: "morning" },
  { id: "m7", text: "Dzień dobry, Kasiu! Uśmiech na twarzy i krok po kroku 🌸", slot: "morning" },
  { id: "m8", text: "Witaj o poranku, Kasiu! Dobrej energii na cały dzień ✨", slot: "morning" },
  { id: "m9", text: "Dzień dobry, Kasiu! Niech ten poranek przyniesie Ci spokój i radość 💛", slot: "morning" },

  // ─── POPOŁUDNIE (12:00 - 17:59) ───
  { id: "a1", text: "Miło Cię widzieć, Kasiu ✨", slot: "afternoon" },
  { id: "a2", text: "Cześć, Kasiu! Dziś też tworzysz coś pięknego 💛", slot: "afternoon" },
  { id: "a3", text: "Dobrego popołudnia, Kasiu! Spokojnie, wszystko po kolei 🌸", slot: "afternoon" },
  { id: "a4", text: "Witaj ponownie, Kasiu! Piękny dzień w butiku ✨", slot: "afternoon" },
  { id: "a5", text: "Witaj, Kasiu! Miło widzieć Cię w panelu AURY ✨", slot: "afternoon" },
  { id: "a6", text: "Cześć, Kasiu! Spokojnie, wszystko masz pod kontrolą 💛", slot: "afternoon" },
  { id: "a7", text: "Dobrego dnia, Kasiu! Pamiętaj też o chwili wytchnienia ☕", slot: "afternoon" },
  { id: "a8", text: "Kasiu, samych udanych chwil w butiku i online 🌸", slot: "afternoon" },
  { id: "a9", text: "Witaj, Kasiu! Zawsze z klasą i kobiecym wdziękiem 💛", slot: "afternoon" },

  // ─── WIECZÓR I NOC (18:00 - 4:59) ───
  { id: "e1", text: "Dobry wieczór, Kasiu! Pamiętaj też o chwili dla siebie 💛", slot: "evening" },
  { id: "e2", text: "Miłego wieczoru, Kasiu! Czas na relaks i spokój ✨", slot: "evening" },
  { id: "e3", text: "Dobry wieczór, Kasiu! Dziękuję za Twoje zaangażowanie dzisiaj 🌸", slot: "evening" },
  { id: "e4", text: "Kasiu, spokojnego wieczoru i odpoczynku po pracowitym dniu 🌙", slot: "evening" },
  { id: "e5", text: "Witaj, Kasiu! Jeszcze chwila i czas na zasłużony relaks 💛", slot: "evening" },
  { id: "e6", text: "Dobry wieczór, Kasiu! Zrobiłaś dziś kawał pięknej pracy ✨", slot: "evening" },
  { id: "e7", text: "Kasiu, miłego i kojącego wieczoru 🌙", slot: "evening" },
  { id: "e8", text: "Dobry wieczór, Kasiu! Spokojnego odpoczynku 💛", slot: "evening" },

  // ─── UNIWERSALNE (DOWOLNA PORA DNIA) ───
  { id: "u1", text: "Witaj, Kasiu! Miłego dnia 💛", slot: "any" },
  { id: "u2", text: "Cześć, Kasiu! Dziś też tworzysz coś pięknego ✨", slot: "any" },
  { id: "u3", text: "Witaj ponownie, Kasiu! Spokojnie, wszystko po kolei 🌸", slot: "any" },
  { id: "u4", text: "Kasiu, niech to będzie dobry czas dla Ciebie i AURY 💛", slot: "any" },
  { id: "u5", text: "Wspaniale, że jesteś, Kasiu! Dobrego czasu w panelu 🌸", slot: "any" },
];

/**
 * Zwraca aktualną godzinę w strefie czasowej Europe/Warsaw
 */
export function getWarsawHour(): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Warsaw",
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    const parsed = parseInt(formatted, 10);
    return isNaN(parsed) ? new Date().getHours() : parsed;
  } catch {
    return new Date().getHours();
  }
}

/**
 * Zwraca segment pory dnia na podstawie godziny w Warszawie
 */
export function getWarsawTimeSlot(hour: number = getWarsawHour()): "morning" | "afternoon" | "evening" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

const SESSION_KEY = "aura_admin_session_greeting";
const LAST_GREETING_KEY = "aura_admin_last_greeting_id";

/**
 * Pobiera powitanie dla Kasi:
 * - Jeśli w bieżącej sesji przeglądarki wybrano już powitanie, zwraca je (bez zmian przy kliknięciach / odświeżaniu).
 * - Przy nowej sesji losuje wariant pasujący do pory dnia w Warszawie, unikając powtórzenia wariantu z poprzedniej sesji.
 */
export function resolveKasiaGreeting(): string {
  if (typeof window === "undefined") {
    // SSR fallback: dopasowane do pory dnia
    const slot = getWarsawTimeSlot();
    const candidate = KASIA_GREETINGS.find((g) => g.slot === slot) || KASIA_GREETINGS[0];
    return candidate.text;
  }

  try {
    const currentSessionGreeting = sessionStorage.getItem(SESSION_KEY);
    if (currentSessionGreeting) {
      return currentSessionGreeting;
    }

    const currentSlot = getWarsawTimeSlot();
    const lastGreetingId = localStorage.getItem(LAST_GREETING_KEY);

    // Wybieramy kandydatów pasujących do obecnego slotu lub uniwersalnych
    let eligible = KASIA_GREETINGS.filter(
      (g) => g.slot === currentSlot || g.slot === "any"
    );

    // Unikamy powtórzenia wariantu z poprzedniej sesji (jeśli jest wybór)
    if (lastGreetingId && eligible.length > 1) {
      const filtered = eligible.filter((g) => g.id !== lastGreetingId);
      if (filtered.length > 0) {
        eligible = filtered;
      }
    }

    // Losujemy wariant
    const chosenIndex = Math.floor(Math.random() * eligible.length);
    const chosen = eligible[chosenIndex] || KASIA_GREETINGS[0];

    sessionStorage.setItem(SESSION_KEY, chosen.text);
    localStorage.setItem(LAST_GREETING_KEY, chosen.id);

    return chosen.text;
  } catch {
    return "Witaj, Kasiu! Miłego dnia 💛";
  }
}

/**
 * Resetuje powitanie sesyjne (np. przy wylogowaniu)
 */
export function clearGreetingSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}
