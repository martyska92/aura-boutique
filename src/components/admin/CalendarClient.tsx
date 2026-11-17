"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isDone: boolean;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  category: string;
  color?: string;
}

export function CalendarClient() {
  const [activeTab, setActiveTab] = useState<"notes" | "calendar">("notes");

  // Notatki
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");

  // Kalendarz
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEventCategory, setNewEventCategory] = useState("DOSTAWA");
  const [showAddEventModal, setShowAddEventModal] = useState(false);

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

  // Dodawanie notatki
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

  // Zmiana stanu notatki (isDone)
  const handleToggleDone = async (note: Note) => {
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

  // Przypinanie notatki
  const handleTogglePin = async (note: Note) => {
    try {
      const res = await fetch("/api/admin/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }),
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Usuwanie notatki
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

  // Dodawanie wydarzenia
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          description: newEventDesc.trim(),
          startDate: new Date(newEventDate).toISOString(),
          category: newEventCategory,
        }),
      });

      if (res.ok) {
        setNewEventTitle("");
        setNewEventDesc("");
        setShowAddEventModal(false);
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Usuwanie wydarzenia
  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/calendar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
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
    <div className="space-y-6">
      {/* Nagłówek i przełącznik zakładek */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADFD5]">
        <div>
          <div className="flex items-center gap-2 text-[#C5A069] text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Organizacja Pracy Butiku</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241D1B]">
            Notatki Właścicielki & Kalendarz
          </h1>
          <p className="text-xs text-[#6E6259] mt-1 max-w-2xl">
            Prywatne notatki, listy zadań, zaplanowane dostawy nowej kolekcji oraz przypomnienia (strefa czasowa Warszawa/Europe).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 border border-[#EADFD5] rounded-lg shadow-2xs">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "notes"
                ? "bg-[#241D1B] text-white"
                : "text-[#6E6259] hover:bg-[#FAF8F5]"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Notatki & Zadania ({notes.filter((n) => !n.isDone).length})</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "calendar"
                ? "bg-[#241D1B] text-white"
                : "text-[#6E6259] hover:bg-[#FAF8F5]"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Kalendarz & Dostawy ({events.length})</span>
          </button>
        </div>
      </div>

      {/* =======================================================================
          ZAKŁADKA 1: NOTATKI KASI
         ======================================================================= */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          {/* Formularz szybkiego dodawania notatki */}
          <div className="bg-white border border-[#EADFD5] rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="font-serif text-sm uppercase tracking-wider text-[#241D1B] font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C5A069]" />
              <span>Dodaj nową notatkę lub zadanie</span>
            </h2>

            <form onSubmit={handleAddNote} className="space-y-3">
              <input
                type="text"
                placeholder="Tytuł zadania (np. Zadzwonić do hurtowni we Włoszech, Sprawdzić dostawę beżowych swetrów)..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none focus:border-[#C5A069]"
                required
              />

              <textarea
                rows={2}
                placeholder="Dodatkowe szczegóły, wymiary, numer kontaktowy (opcjonalnie)..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EADFD5] p-2.5 text-xs text-[#241D1B] rounded focus:outline-none focus:border-[#C5A069]"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-[#6E6259] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNotePinned}
                    onChange={(e) => setNewNotePinned(e.target.checked)}
                    className="rounded border-[#EADFD5] text-[#C5A069] focus:ring-[#C5A069]"
                  />
                  <span>Przypnij na górze listy (Ważne)</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A069] hover:bg-[#AF884F] text-white rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zapisz notatkę</span>
                </button>
              </div>
            </form>
          </div>

          {/* Lista notatek */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#8C6B38] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Szukaj w notatkach..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full bg-white border border-[#EADFD5] pl-8 pr-3 py-1.5 rounded text-xs text-[#241D1B] focus:outline-none focus:border-[#C5A069]"
                />
              </div>

              <span className="text-[11px] text-[#6E6259]">
                Łącznie: {filteredNotes.length} notatek
              </span>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#6E6259] bg-white border border-[#EADFD5] rounded-xl">
                Brak notatek. Dodaj swoje pierwsze zadanie powyżej!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      note.isDone
                        ? "bg-[#FAF8F5]/60 border-[#EADFD5] opacity-60"
                        : note.isPinned
                        ? "bg-amber-50/40 border-amber-300 shadow-xs"
                        : "bg-white border-[#EADFD5] shadow-xs"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDone(note)}
                          className="flex items-start gap-2 text-left"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              note.isDone
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-[#C5A069] bg-white"
                            }`}
                          >
                            {note.isDone && <Check className="w-3 h-3" />}
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              note.isDone
                                ? "line-through text-[#8C6B38]"
                                : "text-[#241D1B]"
                            }`}
                          >
                            {note.title}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePin(note)}
                          title={note.isPinned ? "Odepnij" : "Przypnij"}
                          className={`p-1 rounded hover:bg-[#FAF6F1] transition-colors ${
                            note.isPinned ? "text-[#C5A069]" : "text-[#B8A699]"
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {note.content && (
                        <p className="text-xs text-[#6E6259] whitespace-pre-wrap pl-6 leading-relaxed">
                          {note.content}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#EADFD5]/60 text-[10px] text-[#8C6B38]">
                      <span>{new Date(note.createdAt).toLocaleDateString("pl-PL")}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="hover:text-red-700 transition-colors p-1"
                        title="Usuń notatkę"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          ZAKŁADKA 2: KALENDARZ WYDARZEŃ
         ======================================================================= */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EADFD5] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-base uppercase tracking-wider text-[#241D1B] font-semibold">
                Wydarzenia i Dostawy Towaru
              </h2>
              <p className="text-xs text-[#6E6259] mt-0.5">
                Harmonogram dostaw nowości, akcji promocyjnych oraz spraw urzędowych butiku.
              </p>
            </div>

            <button
              onClick={() => setShowAddEventModal(true)}
              className="px-4 py-2 bg-[#C5A069] hover:bg-[#AF884F] text-white rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj wydarzenie do kalendarza</span>
            </button>
          </div>

          {/* Modal dodawania wydarzenia */}
          {showAddEventModal && (
            <div className="p-5 bg-white border border-[#C5A069] rounded-xl shadow-md space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
                <span className="text-xs font-serif uppercase tracking-wider font-semibold text-[#241D1B]">
                  Nowe Wydarzenie w Kalendarzu
                </span>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="text-xs text-[#8C6B38] hover:text-[#241D1B]"
                >
                  Zamknij
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Nazwa wydarzenia *
                  </label>
                  <input
                    type="text"
                    placeholder="np. Dostawa wiosennych trenczy, Wymiana ekspozycji..."
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EADFD5] p-2 rounded text-xs text-[#241D1B]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Kategoria
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EADFD5] p-2 rounded text-xs text-[#241D1B]"
                  >
                    <option value="DOSTAWA">Dostawa towaru</option>
                    <option value="PROMOCJA">Akcja promocyjna</option>
                    <option value="ROZLICZENIE">Rozliczenia / Urząd</option>
                    <option value="BUTIK">Sprawy butiku</option>
                    <option value="INNE">Inne</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EADFD5] p-2 rounded text-xs text-[#241D1B]"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#241D1B] block mb-1">
                    Opis (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    placeholder="np. Godzina 11:00, kurier DPD, około 4 kartony..."
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EADFD5] p-2 rounded text-xs text-[#241D1B]"
                  />
                </div>

                <div className="sm:col-span-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#241D1B] hover:bg-[#3E3835] text-white rounded text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-[#C5A069]" />
                    <span>Zapisz w kalendarzu</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista zaplanowanych wydarzeń */}
          <div className="bg-white border border-[#EADFD5] rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#EADFD5] flex items-center justify-between">
              <span className="text-xs font-serif uppercase tracking-wider text-[#241D1B] font-semibold">
                Nadchodzące Terminy ({events.length})
              </span>
            </div>

            {events.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#6E6259]">
                Brak zaplanowanych wydarzeń. Dodaj termin dostawy lub ważną datę!
              </div>
            ) : (
              <div className="divide-y divide-[#EADFD5]">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF8F5]/60 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FAF6F1] border border-[#EADFD5] flex flex-col items-center justify-center text-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-[#C5A069]">
                          {new Date(ev.startDate).toLocaleString("pl-PL", { month: "short" })}
                        </span>
                        <span className="text-xs font-bold text-[#241D1B] leading-none">
                          {new Date(ev.startDate).getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#241D1B]">
                            {ev.title}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF6F1] text-[#7A5B20] border border-[#EADFD5]">
                            {ev.category}
                          </span>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-[#6E6259] mt-0.5">{ev.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-[#8C6B38] hover:text-red-700 transition-colors p-1"
                      title="Usuń wydarzenie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
