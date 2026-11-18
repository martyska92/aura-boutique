"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Pin,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Check,
  AlertCircle,
  Tag,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  CalendarDays,
  List,
  RotateCw,
  Bell,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isDone: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventDate: string; // YYYY-MM-DD
  startDate?: string;
  eventTime?: string;
  category: "TAXES" | "DELIVERIES" | "PROMOTIONS" | "BOUTIQUE" | "OTHER" | string;
  priority?: string;
  isCompleted: boolean;
  recurrenceRule?: "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY" | string;
  recurringId?: string | null;
  completedDates?: string[];
  reminderDays?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OccurrenceItem {
  id: string;
  baseId: string;
  title: string;
  description?: string;
  dateStr: string; // YYYY-MM-DD
  eventTime?: string;
  category: string;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrenceRule: string;
  reminderDays?: number | null;
  baseEvent: CalendarEvent;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  TAXES: {
    label: "Podatki i księgowość",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
  },
  DELIVERIES: {
    label: "Dostawa towaru",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  PROMOTIONS: {
    label: "Akcja promocyjna",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  BOUTIQUE: {
    label: "Sprawy butiku",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  OTHER: {
    label: "Inne sprawy",
    bg: "bg-stone-50",
    text: "text-stone-800",
    border: "border-stone-200",
  },
};

const MONTH_NAMES_PL = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

const WEEKDAY_NAMES_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

// Bezpieczne parsowanie daty w strefie Europe/Warsaw
export function parseWarsawDate(dateStr?: string): Date {
  if (!dateStr || typeof dateStr !== "string") {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  const clean = dateStr.slice(0, 10);
  const parts = clean.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatWarsawDisplayDate(dateStr?: string): string {
  const d = parseWarsawDate(dateStr);
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CalendarClient() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Mobilny przełącznik widoku: "calendar" (Miesiąc) vs "list" (Lista terminów)
  const [mobileView, setMobileView] = useState<"calendar" | "list">("list");

  // Notatki
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");

  // Wydarzenia kalendarza
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Modal dodawania nowego terminu
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState("");
  const [newCategory, setNewCategory] = useState("TAXES");
  const [newRecurrence, setNewRecurrence] = useState<"NONE" | "MONTHLY" | "WEEKLY" | "YEARLY">("NONE");
  const [newReminderDays, setNewReminderDays] = useState<number | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Modal edycji terminu
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCategory, setEditCategory] = useState("TAXES");
  const [editRecurrence, setEditRecurrence] = useState<string>("NONE");
  const [editReminderDays, setEditReminderDays] = useState<number | null>(null);
  const [editIsCompleted, setEditIsCompleted] = useState(false);
  const [editScope, setEditScope] = useState<"THIS_ONLY" | "ALL">("THIS_ONLY");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Pobieranie notatek
  const fetchNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const res = await fetch("/api/admin/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Pobieranie wydarzeń
  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const res = await fetch("/api/admin/calendar");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchEvents();
  }, []);

  // Automatyczne wykrywanie kategorii przy wpisywaniu tytułu w dodawaniu
  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const low = val.toLowerCase();
    if (
      low.includes("podatek") ||
      low.includes("vat") ||
      low.includes("zus") ||
      low.includes("urząd") ||
      low.includes("skarbow") ||
      low.includes("księgow")
    ) {
      setNewCategory("TAXES");
    } else if (low.includes("dostaw") || low.includes("kurier") || low.includes("towar") || low.includes("kolekcj")) {
      setNewCategory("DELIVERIES");
    } else if (low.includes("promocj") || low.includes("rabat") || low.includes("wyprzedaż") || low.includes("black")) {
      setNewCategory("PROMOTIONS");
    } else if (low.includes("butik") || low.includes("sklep") || low.includes("ekspozycj")) {
      setNewCategory("BOUTIQUE");
    }
  };

  // Generowanie wystąpień dla danego miesiąca (w tym cyklicznych)
  const monthOccurrences = useMemo(() => {
    const list: OccurrenceItem[] = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    events.forEach((ev) => {
      const baseDate = parseWarsawDate(ev.eventDate || ev.startDate);
      const recurrence = ev.recurrenceRule || "NONE";
      const isRecurring = recurrence !== "NONE";
      const completedDates = ev.completedDates || [];

      if (!isRecurring) {
        // Jednorazowe wydarzenie: sprawdzamy czy wypada w przeglądanym miesiącu
        if (baseDate.getFullYear() === currentYear && baseDate.getMonth() === currentMonth) {
          list.push({
            id: ev.id,
            baseId: ev.id,
            title: ev.title,
            description: ev.description,
            dateStr: ev.eventDate || ev.startDate || "",
            eventTime: ev.eventTime,
            category: ev.category,
            isCompleted: ev.isCompleted,
            isRecurring: false,
            recurrenceRule: "NONE",
            reminderDays: ev.reminderDays,
            baseEvent: ev,
          });
        }
      } else if (recurrence === "MONTHLY") {
        // Cykliczne co miesiąc (np. 20. każdego miesiąca)
        const targetDay = Math.min(baseDate.getDate(), daysInMonth);
        const yStr = currentYear.toString();
        const mStr = (currentMonth + 1).toString().padStart(2, "0");
        const dStr = targetDay.toString().padStart(2, "0");
        const occurrenceDateStr = `${yStr}-${mStr}-${dStr}`;

        const isOccCompleted = ev.isCompleted || completedDates.includes(occurrenceDateStr);

        list.push({
          id: `${ev.id}-${occurrenceDateStr}`,
          baseId: ev.id,
          title: ev.title,
          description: ev.description,
          dateStr: occurrenceDateStr,
          eventTime: ev.eventTime,
          category: ev.category,
          isCompleted: isOccCompleted,
          isRecurring: true,
          recurrenceRule: "MONTHLY",
          reminderDays: ev.reminderDays,
          baseEvent: ev,
        });
      } else if (recurrence === "WEEKLY") {
        // Cykliczne co tydzień
        const targetWeekday = baseDate.getDay();
        for (let d = 1; d <= daysInMonth; d++) {
          const checkDate = new Date(currentYear, currentMonth, d);
          if (checkDate.getDay() === targetWeekday) {
            const yStr = currentYear.toString();
            const mStr = (currentMonth + 1).toString().padStart(2, "0");
            const dStr = d.toString().padStart(2, "0");
            const occurrenceDateStr = `${yStr}-${mStr}-${dStr}`;
            const isOccCompleted = ev.isCompleted || completedDates.includes(occurrenceDateStr);

            list.push({
              id: `${ev.id}-${occurrenceDateStr}`,
              baseId: ev.id,
              title: ev.title,
              description: ev.description,
              dateStr: occurrenceDateStr,
              eventTime: ev.eventTime,
              category: ev.category,
              isCompleted: isOccCompleted,
              isRecurring: true,
              recurrenceRule: "WEEKLY",
              reminderDays: ev.reminderDays,
              baseEvent: ev,
            });
          }
        }
      }
    });

    return list.sort((a, b) => (a.dateStr > b.dateStr ? 1 : -1));
  }, [events, currentYear, currentMonth]);

  // Wszystkie najbliższe terminy (od dziś w przód, na 90 dni) do panelu bocznego
  const upcomingDeadlines = useMemo(() => {
    const list: OccurrenceItem[] = [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const futureLimit = new Date();
    futureLimit.setDate(futureLimit.getDate() + 90);

    events.forEach((ev) => {
      const baseDate = parseWarsawDate(ev.eventDate || ev.startDate);
      const recurrence = ev.recurrenceRule || "NONE";
      const completedDates = ev.completedDates || [];

      if (recurrence === "NONE") {
        const dStr = ev.eventDate || ev.startDate || "";
        if (dStr >= todayStr) {
          list.push({
            id: ev.id,
            baseId: ev.id,
            title: ev.title,
            description: ev.description,
            dateStr: dStr,
            eventTime: ev.eventTime,
            category: ev.category,
            isCompleted: ev.isCompleted,
            isRecurring: false,
            recurrenceRule: "NONE",
            reminderDays: ev.reminderDays,
            baseEvent: ev,
          });
        }
      } else if (recurrence === "MONTHLY") {
        // Najbliższe 3 miesiące
        for (let mOffset = 0; mOffset <= 3; mOffset++) {
          const checkMonth = new Date(today.getFullYear(), today.getMonth() + mOffset, 1);
          const maxDays = new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 0).getDate();
          const targetDay = Math.min(baseDate.getDate(), maxDays);

          const yStr = checkMonth.getFullYear().toString();
          const mStr = (checkMonth.getMonth() + 1).toString().padStart(2, "0");
          const dStr = targetDay.toString().padStart(2, "0");
          const occurrenceDateStr = `${yStr}-${mStr}-${dStr}`;

          if (occurrenceDateStr >= todayStr) {
            const isOccCompleted = ev.isCompleted || completedDates.includes(occurrenceDateStr);
            list.push({
              id: `${ev.id}-${occurrenceDateStr}`,
              baseId: ev.id,
              title: ev.title,
              description: ev.description,
              dateStr: occurrenceDateStr,
              eventTime: ev.eventTime,
              category: ev.category,
              isCompleted: isOccCompleted,
              isRecurring: true,
              recurrenceRule: "MONTHLY",
              reminderDays: ev.reminderDays,
              baseEvent: ev,
            });
          }
        }
      }
    });

    return list.sort((a, b) => (a.dateStr > b.dateStr ? 1 : -1));
  }, [events]);

  // Kalendarz: siatka dni miesiąca
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Dzień tygodnia 0 (Niedz) do 6 (Sob) -> przekształcamy na Pon (0) do Niedz (6)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      items: OccurrenceItem[];
    }> = [];

    // Dni poprzedniego miesiąca
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dStr = `${prevY}-${prevM.toString().padStart(2, "0")}-${dNum.toString().padStart(2, "0")}`;
      days.push({
        dateNumber: dNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: false,
        items: [],
      });
    }

    const todayDateStr = new Date().toISOString().slice(0, 10);

    // Dni bieżącego miesiąca
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = (currentMonth + 1).toString().padStart(2, "0");
      const dStr = `${currentYear}-${mStr}-${d.toString().padStart(2, "0")}`;
      const dayItems = monthOccurrences.filter((it) => it.dateStr === dStr);

      days.push({
        dateNumber: d,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayDateStr,
        items: dayItems,
      });
    }

    // Dni kolejnego miesiąca dopełniające siatkę do wielokrotności 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dStr = `${nextY}-${nextM.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      days.push({
        dateNumber: d,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: false,
        items: [],
      });
    }

    return days;
  }, [currentYear, currentMonth, monthOccurrences]);

  // Nawigacja kalendarza
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Otwarcie dodawania dla konkretnego dnia
  const handleDayClick = (dateStr: string) => {
    setNewDate(dateStr);
    setNewTitle("");
    setNewDesc("");
    setNewTime("");
    setNewCategory("TAXES");
    setNewRecurrence("NONE");
    setNewReminderDays(null);
    setShowAddModal(true);
  };

  // Dodanie nowego terminu
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingAdd(true);
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          eventDate: newDate,
          eventTime: newTime || undefined,
          category: newCategory,
          recurrenceRule: newRecurrence,
          reminderDays: newReminderDays,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewTime("");
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Otwarcie modalu edycji
  const handleOpenEdit = (item: OccurrenceItem) => {
    const ev = item.baseEvent;
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditDesc(ev.description || "");
    setEditDate(item.dateStr || ev.eventDate || ev.startDate || "");
    setEditTime(ev.eventTime || "");
    setEditCategory(ev.category || "TAXES");
    setEditRecurrence(ev.recurrenceRule || "NONE");
    setEditReminderDays(ev.reminderDays !== undefined ? ev.reminderDays : null);
    setEditIsCompleted(item.isCompleted);
    setEditScope("THIS_ONLY");
  };

  // Zapis zmian edycji
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEvent.id,
          title: editTitle.trim(),
          description: editDesc.trim(),
          eventDate: editDate,
          eventTime: editTime || null,
          category: editCategory,
          recurrenceRule: editRecurrence,
          reminderDays: editReminderDays,
          isCompleted: editIsCompleted,
          scope: editScope,
        }),
      });

      if (res.ok) {
        setEditingEvent(null);
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Szybkie oznaczanie pojedynczego wystąpienia jako wykonane
  const handleToggleOccurrence = async (item: OccurrenceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (item.isRecurring) {
        const res = await fetch("/api/admin/calendar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.baseId,
            scope: "TOGGLE_OCCURRENCE",
            occurrenceDate: item.dateStr,
          }),
        });
        if (res.ok) fetchEvents();
      } else {
        const res = await fetch("/api/admin/calendar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.baseId,
            isCompleted: !item.isCompleted,
          }),
        });
        if (res.ok) fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Usunięcie wydarzenia
  const handleDeleteEvent = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Czy na pewno chcesz usunąć to wydarzenie?")) return;
    try {
      const res = await fetch(`/api/admin/calendar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
        if (editingEvent?.id === id) setEditingEvent(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Obsługa notatek
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          isPinned: newNotePinned,
        }),
      });

      if (res.ok) {
        setNewNoteTitle("");
        setNewNoteContent("");
        setNewNotePinned(false);
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNoteDone = async (note: Note) => {
    try {
      const res = await fetch("/api/admin/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, isDone: !note.isDone }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, isDone: !n.isDone } : n))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotePin = async (note: Note) => {
    try {
      const res = await fetch("/api/admin/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }),
      });
      if (res.ok) fetchNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!noteSearch.trim()) return true;
    const q = noteSearch.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* ─── GÓRNY PASEK: Tytuł i przycisk Dodaj termin ─── */}
      <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-7 border border-[#BCAB9B] rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C5A069] text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Harmonogram & Organizacja Butiku</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B] font-semibold">
            Kalendarz & Notatki Właścicielki
          </h1>
          <p className="text-xs text-[#7A6458] mt-1 max-w-2xl leading-relaxed">
            Miesięczny kalendarz dostaw nowości, akcji promocyjnych, terminów urzędowych (podatki, ZUS) oraz szybkie notatki właścicielki (Europe/Warsaw).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setNewDate(new Date().toISOString().slice(0, 10));
              setNewTitle("");
              setNewDesc("");
              setNewTime("");
              setNewCategory("TAXES");
              setNewRecurrence("NONE");
              setNewReminderDays(null);
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-[#241D1B] hover:bg-[#3E3430] text-[#FFF8E7] text-xs uppercase tracking-wider font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C5A069]" />
            <span>Dodaj termin</span>
          </button>
        </div>
      </div>

      {/* ─── PRZEŁĄCZNIK WIDOKU MOBILNEGO (Tylko na małych ekranach) ─── */}
      <div className="block lg:hidden bg-white p-1 border border-[#BCAB9B] rounded-xl shadow-2xs">
        <div className="grid grid-cols-2 gap-1 text-center">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileView === "list"
                ? "bg-[#241D1B] text-white shadow-xs"
                : "text-[#7A6458] hover:bg-[#FAF6F1]"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Najbliższe terminy ({upcomingDeadlines.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("calendar")}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileView === "calendar"
                ? "bg-[#241D1B] text-white shadow-xs"
                : "text-[#7A6458] hover:bg-[#FAF6F1]"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Miesiąc</span>
          </button>
        </div>
      </div>

      {/* ─── GŁÓWNY UKŁAD: KALENDARZ MIESIĘCZNY (LEWA) + NAJBLIŻSZE TERMINY (PRAWA) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEWA KOLUMNA: KALENDARZ MIESIĘCZNY (8/12 na komputerze) */}
        <div
          className={`lg:col-span-8 bg-white/95 backdrop-blur-sm border border-[#BCAB9B] rounded-xl shadow-sm p-4 sm:p-6 space-y-4 ${
            mobileView === "list" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Nagłówek miesiąca z przyciskami Poprzedni / Następny / Dzisiaj */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EADFD5]">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl sm:text-2xl text-[#241D1B] font-semibold">
                {MONTH_NAMES_PL[currentMonth]} {currentYear}
              </h2>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#FAF6F1] hover:bg-[#EADFD5] text-[#241D1B] border border-[#BCAB9B] rounded transition-colors"
              >
                Dzisiaj
              </button>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Poprzedni miesiąc"
                className="p-2 border border-[#BCAB9B] rounded-lg hover:bg-[#FAF6F1] text-[#241D1B] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Następny miesiąc"
                className="p-2 border border-[#BCAB9B] rounded-lg hover:bg-[#FAF6F1] text-[#241D1B] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dni tygodnia (Pon - Niedz) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-[#7A6458] py-1 border-b border-[#FAF6F1]">
            {WEEKDAY_NAMES_PL.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          {/* Siatka dni */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarGrid.map((day, idx) => (
              <div
                key={`${day.dateStr}-${idx}`}
                onClick={() => handleDayClick(day.dateStr)}
                className={`min-h-[78px] sm:min-h-[96px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  !day.isCurrentMonth
                    ? "bg-[#FAF8F5]/40 border-stone-100 text-stone-400 opacity-50"
                    : day.isToday
                    ? "bg-[#FFF9EE] border-[#C5A069] ring-2 ring-[#C5A069]/30 text-[#241D1B]"
                    : "bg-white border-[#EADFD5] hover:border-[#C5A069] text-[#241D1B]"
                }`}
              >
                {/* Numer dnia */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      day.isToday ? "bg-[#C5A069] text-white" : ""
                    }`}
                  >
                    {day.dateNumber}
                  </span>
                  {day.items.length > 0 && (
                    <span className="text-[10px] font-mono font-bold text-[#8C7248]">
                      {day.items.length}
                    </span>
                  )}
                </div>

                {/* Znaczniki wydarzeń w komórce */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {day.items.slice(0, 2).map((it) => {
                    const catStyle = CATEGORY_MAP[it.category] || CATEGORY_MAP.OTHER;
                    return (
                      <div
                        key={it.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(it);
                        }}
                        title={`${it.title}${it.eventTime ? ` (${it.eventTime})` : ""}`}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium flex items-center gap-1 ${
                          it.isCompleted
                            ? "bg-stone-100 text-stone-500 line-through border-stone-200"
                            : `${catStyle.bg} ${catStyle.text} ${catStyle.border}`
                        }`}
                      >
                        {it.isRecurring && <RotateCw className="w-2.5 h-2.5 shrink-0 opacity-70" />}
                        <span className="truncate">{it.title}</span>
                      </div>
                    );
                  })}
                  {day.items.length > 2 && (
                    <span className="text-[9px] text-[#7A6458] pl-1 font-semibold block">
                      +{day.items.length - 2} więcej
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-[#7A6458] border-t border-[#EADFD5]">
            <span>Kliknij dowolną datę w kalendarzu, aby dodać termin.</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A069]" />
              <span>Bieżący dzień</span>
            </span>
          </div>
        </div>

        {/* PRAWA KOLUMNA: NAJBLIŻSZE TERMINY (4/12 na komputerze) */}
        <div
          className={`lg:col-span-4 bg-white/95 backdrop-blur-sm border border-[#BCAB9B] rounded-xl shadow-sm p-5 space-y-4 ${
            mobileView === "calendar" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EADFD5]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C5A069]" />
              <h3 className="font-serif text-sm uppercase tracking-wider font-semibold text-[#241D1B]">
                Najbliższe terminy ({upcomingDeadlines.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewDate(new Date().toISOString().slice(0, 10));
                setShowAddModal(true);
              }}
              className="text-xs text-[#C5A069] hover:text-[#8C7248] font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nowy</span>
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#7A6458] bg-[#FAF6F1] rounded-lg border border-[#EADFD5]">
              Brak nadchodzących terminów w najbliższym czasie. Kliknij „+ Dodaj termin”, aby zaplanować zadanie!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {upcomingDeadlines.map((it) => {
                const catStyle = CATEGORY_MAP[it.category] || CATEGORY_MAP.OTHER;
                return (
                  <div
                    key={it.id}
                    className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                      it.isCompleted
                        ? "bg-[#FAF8F5]/80 border-[#EADFD5] opacity-60"
                        : "bg-white border-[#BCAB9B]/60 hover:border-[#C5A069] shadow-2xs"
                    }`}
                  >
                    {/* Checkbox wykonania */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleOccurrence(it, e)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        it.isCompleted
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-[#BCAB9B] bg-white hover:border-[#C5A069]"
                      }`}
                      title={it.isCompleted ? "Oznacz jako niewykonane" : "Oznacz jako wykonane"}
                    >
                      {it.isCompleted && <Check className="w-3 h-3" />}
                    </button>

                    {/* Treść wydarzenia */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(it)}
                          className={`text-xs font-semibold text-left hover:text-[#C5A069] transition-colors truncate ${
                            it.isCompleted ? "line-through text-[#7A6458]" : "text-[#241D1B]"
                          }`}
                        >
                          {it.title}
                        </button>
                        {it.isRecurring && (
                          <span
                            className="text-[10px] text-[#8C7248] flex items-center gap-0.5"
                            title="Wydarzenie cykliczne co miesiąc"
                          >
                            <RotateCw className="w-2.5 h-2.5" />
                            <span>Co m-c</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#7A6458] flex-wrap">
                        <span className="font-medium text-[#241D1B]">
                          {formatWarsawDisplayDate(it.dateStr)}
                        </span>
                        {it.eventTime && (
                          <span className="text-[#8C7248] font-mono">godz. {it.eventTime}</span>
                        )}
                      </div>

                      <div className="pt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {catStyle.label}
                        </span>
                      </div>

                      {it.description && (
                        <p className="text-[11px] text-[#7A6458] line-clamp-2 pt-0.5">
                          {it.description}
                        </p>
                      )}
                    </div>

                    {/* Akcje: Edytuj (Ołówek) i Usuń */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(it)}
                        className="p-1 text-[#7A6458] hover:text-[#241D1B] transition-colors rounded"
                        title="Edytuj termin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEvent(it.baseId, e)}
                        className="p-1 text-[#7A6458] hover:text-rose-600 transition-colors rounded"
                        title="Usuń termin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── DOLNA SEKCJA: NOTATKI & SZYBKIE ZADANIA WŁAŚCICIELKI ─── */}
      <div className="bg-white/95 backdrop-blur-sm border border-[#BCAB9B] rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADFD5]">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#C5A069]" />
            <div>
              <h3 className="font-serif text-lg text-[#241D1B] font-semibold">
                Notatki & Szybkie Zadania
              </h3>
              <p className="text-xs text-[#7A6458]">
                Bieżące zapiski, kontakty do hurtowni, pomysły na posty i przypomnienia.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8C7248] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Szukaj w notatkach..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="w-full bg-[#FAF6F1] border border-[#BCAB9B] pl-8 pr-3 py-1.5 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
            />
          </div>
        </div>

        {/* Formularz szybkiego dodawania notatki */}
        <form onSubmit={handleAddNote} className="bg-[#FAF6F1] border border-[#EADFD5] p-4 rounded-xl space-y-3">
          <input
            type="text"
            required
            placeholder="Tytuł notatki lub zadania (np. Zadzwonić do hurtowni we Włoszech o nowe beżowe swetry)..."
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            className="w-full bg-white border border-[#BCAB9B] px-3 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
          />
          <textarea
            rows={2}
            placeholder="Szczegóły, numery telefonów, wymiary (opcjonalnie)..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="w-full bg-white border border-[#BCAB9B] px-3 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
          />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-[#5A483D] cursor-pointer">
              <input
                type="checkbox"
                checked={newNotePinned}
                onChange={(e) => setNewNotePinned(e.target.checked)}
                className="rounded border-[#BCAB9B] text-[#C5A069] focus:ring-[#C5A069]"
              />
              <span>Przypnij na górze (Ważne)</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A069]" />
              <span>Dodaj notatkę</span>
            </button>
          </div>
        </form>

        {/* Lista notatek */}
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7A6458] bg-[#FAF6F1] rounded-lg border border-[#EADFD5]">
            Brak notatek. Dodaj pierwszą notatkę powyżej!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  n.isDone
                    ? "bg-[#FAF8F5]/60 border-[#EADFD5] opacity-60"
                    : n.isPinned
                    ? "bg-amber-50/40 border-amber-300 shadow-xs"
                    : "bg-white border-[#BCAB9B] shadow-2xs"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleNoteDone(n)}
                      className="flex items-start gap-2 text-left flex-1"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          n.isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-[#BCAB9B] bg-white"
                        }`}
                      >
                        {n.isDone && <Check className="w-3 h-3" />}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          n.isDone ? "line-through text-[#7A6458]" : "text-[#241D1B]"
                        }`}
                      >
                        {n.title}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleNotePin(n)}
                      title={n.isPinned ? "Odepnij" : "Przypnij"}
                      className={`p-1 rounded hover:bg-[#FAF6F1] transition-colors ${
                        n.isPinned ? "text-[#C5A069]" : "text-[#BCAB9B]"
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {n.content && (
                    <p className="text-xs text-[#5A483D] whitespace-pre-wrap pl-6 leading-relaxed">
                      {n.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EADFD5] text-[10px] text-[#7A6458]">
                  <span>{new Date(n.createdAt).toLocaleDateString("pl-PL")}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(n.id)}
                    className="hover:text-rose-600 transition-colors p-1"
                    title="Usuń notatkę"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── MODAL: DODAJ TERMIN ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#BCAB9B] overflow-hidden my-auto">
            <div className="p-5 border-b border-[#EADFD5] flex items-center justify-between bg-[#FAF6F1]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#C5A069]" />
                <h3 className="font-serif text-base font-semibold text-[#241D1B]">
                  Nowy termin w kalendarzu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[#EADFD5] flex items-center justify-center text-[#7A6458]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#241D1B] block mb-1">
                  Tytuł wydarzenia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Zapłacić podatek dochodowy / VAT, Dostawa wiosenna trenczy..."
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">
                    Godzina (opcjonalnie)
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">Kategoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  >
                    <option value="TAXES">Podatki i księgowość</option>
                    <option value="DELIVERIES">Dostawa towaru</option>
                    <option value="PROMOTIONS">Akcja promocyjna</option>
                    <option value="BOUTIQUE">Sprawy butiku</option>
                    <option value="OTHER">Inne</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">Powtarzalność</label>
                  <select
                    value={newRecurrence}
                    onChange={(e) => setNewRecurrence(e.target.value as any)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  >
                    <option value="NONE">Jednorazowe</option>
                    <option value="MONTHLY">Co miesiąc (np. 20. dnia)</option>
                    <option value="WEEKLY">Co tydzień</option>
                    <option value="YEARLY">Co rok</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#241D1B] block mb-1">
                  Opis i szczegóły (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  placeholder="np. Kwota podatku, kontakt do kuriera DPD, 4 kartony swetrów..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EADFD5]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#BCAB9B] rounded-lg text-xs text-[#5A483D] hover:bg-[#FAF6F1]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider font-semibold rounded-lg disabled:opacity-50"
                >
                  {isSubmittingAdd ? "Zapisywanie..." : "Dodaj termin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDYTUJ TERMIN (Z PEŁNYM FORMULARZEM I ZAKRESEM ZMIANY) ─── */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#BCAB9B] overflow-hidden my-auto">
            <div className="p-5 border-b border-[#EADFD5] flex items-center justify-between bg-[#FAF6F1]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#C5A069]" />
                <h3 className="font-serif text-base font-semibold text-[#241D1B]">
                  Edytuj termin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="w-8 h-8 rounded-full hover:bg-[#EADFD5] flex items-center justify-center text-[#7A6458]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#241D1B] block mb-1">
                  Tytuł wydarzenia *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">Godzina</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">Kategoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  >
                    <option value="TAXES">Podatki i księgowość</option>
                    <option value="DELIVERIES">Dostawa towaru</option>
                    <option value="PROMOTIONS">Akcja promocyjna</option>
                    <option value="BOUTIQUE">Sprawy butiku</option>
                    <option value="OTHER">Inne</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#241D1B] block mb-1">Powtarzalność</label>
                  <select
                    value={editRecurrence}
                    onChange={(e) => setEditRecurrence(e.target.value)}
                    className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                  >
                    <option value="NONE">Jednorazowe</option>
                    <option value="MONTHLY">Co miesiąc</option>
                    <option value="WEEKLY">Co tydzień</option>
                    <option value="YEARLY">Co rok</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#241D1B] block mb-1">Opis</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[#FAF6F1] border border-[#BCAB9B] px-3.5 py-2 rounded-lg text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              {/* Status wykonania */}
              <div className="p-3 bg-[#FAF6F1] rounded-lg border border-[#EADFD5] flex items-center justify-between">
                <label className="font-semibold text-[#241D1B] cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editIsCompleted}
                    onChange={(e) => setEditIsCompleted(e.target.checked)}
                    className="w-4 h-4 rounded border-[#BCAB9B] text-emerald-600 focus:ring-emerald-600"
                  />
                  <span>Oznacz jako wykonane</span>
                </label>
              </div>

              {/* Wybór zakresu zmiany dla wydarzeń cyklicznych */}
              {editRecurrence !== "NONE" && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1.5">
                  <span className="font-semibold text-amber-900 block">Zakres zmiany terminu:</span>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[#241D1B]">
                      <input
                        type="radio"
                        name="editScope"
                        value="THIS_ONLY"
                        checked={editScope === "THIS_ONLY"}
                        onChange={() => setEditScope("THIS_ONLY")}
                        className="text-[#C5A069] focus:ring-[#C5A069]"
                      />
                      <span>Tylko to wystąpienie</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#241D1B]">
                      <input
                        type="radio"
                        name="editScope"
                        value="ALL"
                        checked={editScope === "ALL"}
                        onChange={() => setEditScope("ALL")}
                        className="text-[#C5A069] focus:ring-[#C5A069]"
                      />
                      <span>To i wszystkie przyszłe wystąpienia</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EADFD5]">
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Usuń</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 border border-[#BCAB9B] rounded-lg text-xs text-[#5A483D] hover:bg-[#FAF6F1]"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2 bg-[#241D1B] hover:bg-[#3E3430] text-white text-xs uppercase tracking-wider font-semibold rounded-lg disabled:opacity-50"
                  >
                    {isSubmittingEdit ? "Zapisywanie..." : "Zapisz zmiany"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
