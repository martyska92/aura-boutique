# AURA Boutique — Ekskluzywny Butik Odzieżowy

> **Strona na żywo:** [https://aura-boutique-w38e.vercel.app](https://aura-boutique-w38e.vercel.app)

---

## O projekcie

**AURA Boutique** to nowoczesny sklep internetowy z odzieżą damską i akcesoriami w stylu minimalistycznego luksusu (beż, écru, ciepłe złoto, elegancka typografia).

Aplikacja została zbudowana w oparciu o framework **Next.js (App Router)** oraz **Tailwind CSS**, w pełni responsywna (desktop, tablet, smartfon).

### Główne funkcjonalności:
- **Katalog produktów** z podziałem na kategorie (Bluzy, Koszule, Topy, T-shirty, Marynarki), filtrowaniem, sortowaniem i wyszukiwarką.
- **Koszyk i proces składania zamówienia** (dostawa kurierem, paczkomatem, odbiór osobisty, płatność BLIK / przelew).
- **Zintegrowany Panel Właścicielki / Administratora (`/admin`):**
  - **Zarządzanie produktami:** dodawanie, edycja cen, rozmiarów, opisów, stanów magazynowych oraz bezpośrednie wgrywanie zdjęć z telefonu lub aparatu (z automatycznym obracaniem EXIF i kompresją WebP).
  - **Zarządzanie kategoriami (`/admin/kategorie`):** tworzenie nowych rodzajów ubrań, edycja i szybka zmiana zdjęcia głównego wyświetlanego w medalionach na stronie głównej.
  - **Zarządzanie zamówieniami (`/admin/zamowienia`):** podgląd szczegółów zamówień oraz natychmiastowa zmiana statusu (np. Oczekujące, W realizacji, Wysłane, Zrealizowane).
  - **Ustawienia butiku:** dane kontaktowe, godziny otwarcia (pon–pt 10–17, sob 9–13).

---

## Uruchomienie lokalne

1. Zainstaluj zależności:
```bash
npm install
```

2. Uruchom serwer developerski:
```bash
npm run dev
```

3. Otwórz w przeglądarce: [http://localhost:3000](http://localhost:3000)

---

## Wdrożenie

Projekt jest wdrożony i automatycznie aktualizowany na platformie **Vercel** po każdym pushu do gałęzi `main`:
👉 **[https://aura-boutique-w38e.vercel.app](https://aura-boutique-w38e.vercel.app)**
