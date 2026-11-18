import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma, isNeonConfigured } from "@/lib/prisma";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";

export const dynamic = "force-dynamic";

function detectCategory(title: string, userCat?: string): string {
  if (userCat && userCat !== "INNE" && userCat !== "OTHER") return userCat;
  const t = (title || "").toLowerCase();
  if (
    t.includes("podatek") ||
    t.includes("vat") ||
    t.includes("zus") ||
    t.includes("urząd") ||
    t.includes("skarbow") ||
    t.includes("księgow")
  ) {
    return "TAXES";
  }
  if (t.includes("dostaw") || t.includes("kurier") || t.includes("towar") || t.includes("kolekcj")) {
    return "DELIVERIES";
  }
  if (t.includes("promocj") || t.includes("rabat") || t.includes("wyprzedaż") || t.includes("black")) {
    return "PROMOTIONS";
  }
  if (t.includes("butik") || t.includes("sklep") || t.includes("ekspozycj") || t.includes("witryn")) {
    return "BOUTIQUE";
  }
  return userCat || "OTHER";
}

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  let dbEvents: any[] = [];
  if (isNeonConfigured()) {
    try {
      dbEvents = await prisma.calendarEvent.findMany({
        orderBy: { eventDate: "asc" },
      });
    } catch (e) {
      console.warn("Błąd odczytu bazy calendar:", e);
    }
  }

  const store = loadLocalStore();
  const localEvents = (store as any).calendarEvents || [];

  const map = new Map<string, any>();
  for (const ev of dbEvents) {
    let parsedCompletedDates: string[] = [];
    try {
      if (ev.completedDates) parsedCompletedDates = JSON.parse(ev.completedDates);
    } catch (_) {}

    map.set(ev.id, {
      id: ev.id,
      title: ev.title,
      description: ev.description || "",
      eventDate: ev.eventDate,
      startDate: ev.eventDate, // Zapewnia wsteczną kompatybilność, zapobiega INVALID DATE / NaN
      eventTime: ev.eventTime || "",
      category: detectCategory(ev.title, ev.category),
      priority: ev.priority || "NORMAL",
      isCompleted: Boolean(ev.isCompleted),
      recurrenceRule: ev.recurrenceRule || "NONE",
      recurringId: ev.recurringId || null,
      completedDates: parsedCompletedDates,
      reminderDays: ev.reminderDays !== undefined && ev.reminderDays !== null ? Number(ev.reminderDays) : null,
      createdAt: ev.createdAt instanceof Date ? ev.createdAt.toISOString() : String(ev.createdAt),
      updatedAt: ev.updatedAt instanceof Date ? ev.updatedAt.toISOString() : String(ev.updatedAt),
    });
  }

  for (const ev of localEvents) {
    if (!map.has(ev.id)) {
      const eDate = ev.eventDate || ev.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      map.set(ev.id, {
        ...ev,
        eventDate: eDate,
        startDate: eDate,
        category: detectCategory(ev.title, ev.category),
        completedDates: Array.isArray(ev.completedDates) ? ev.completedDates : [],
      });
    }
  }

  const events = Array.from(map.values()).sort((a, b) => (a.eventDate > b.eventDate ? 1 : -1));
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      eventDate,
      startDate,
      eventTime,
      category,
      recurrenceRule,
      reminderDays,
      isCompleted,
    } = body;

    const cleanDate = (eventDate || startDate || new Date().toISOString()).slice(0, 10);
    const resolvedCat = detectCategory(title, category);
    const newId = `evt-${Date.now()}`;

    const newEvent = {
      id: newId,
      title: (title || "Bez tytułu").trim(),
      description: (description || "").trim(),
      eventDate: cleanDate,
      startDate: cleanDate,
      eventTime: eventTime || "",
      category: resolvedCat,
      priority: "NORMAL",
      isCompleted: Boolean(isCompleted),
      recurrenceRule: recurrenceRule || "NONE",
      recurringId: null,
      completedDates: [],
      reminderDays: reminderDays !== undefined && reminderDays !== null ? Number(reminderDays) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNeonConfigured()) {
      try {
        const created = await prisma.calendarEvent.create({
          data: {
            title: newEvent.title,
            description: newEvent.description,
            eventDate: newEvent.eventDate,
            eventTime: newEvent.eventTime || null,
            category: newEvent.category,
            priority: newEvent.priority,
            isCompleted: newEvent.isCompleted,
            recurrenceRule: newEvent.recurrenceRule,
            reminderDays: newEvent.reminderDays,
          },
        });
        return NextResponse.json({
          success: true,
          event: {
            ...newEvent,
            id: created.id,
            startDate: created.eventDate,
          },
        });
      } catch (e) {
        console.warn("Błąd zapisu calendar event do Prisma:", e);
      }
    }

    const store = loadLocalStore();
    if (!(store as any).calendarEvents) (store as any).calendarEvents = [];
    (store as any).calendarEvents.push(newEvent);
    saveLocalStore(store);

    return NextResponse.json({ success: true, event: newEvent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      title,
      description,
      eventDate,
      startDate,
      eventTime,
      category,
      isCompleted,
      recurrenceRule,
      reminderDays,
      scope,
      occurrenceDate,
    } = body;

    if (!id) return NextResponse.json({ error: "Brak ID wydarzenia" }, { status: 400 });

    const cleanDate = (eventDate || startDate || "").slice(0, 10);
    const resolvedCat = detectCategory(title, category);

    // Oznaczanie pojedynczego wystąpienia cyklicznego terminu jako wykonane
    if (scope === "TOGGLE_OCCURRENCE" && occurrenceDate) {
      if (isNeonConfigured()) {
        try {
          const existing = await prisma.calendarEvent.findUnique({ where: { id } });
          if (existing) {
            let compArr: string[] = [];
            try {
              compArr = existing.completedDates ? JSON.parse(existing.completedDates) : [];
            } catch (_) {}
            if (compArr.includes(occurrenceDate)) {
              compArr = compArr.filter((d) => d !== occurrenceDate);
            } else {
              compArr.push(occurrenceDate);
            }
            const updated = await prisma.calendarEvent.update({
              where: { id },
              data: { completedDates: JSON.stringify(compArr) },
            });
            return NextResponse.json({ success: true, event: updated });
          }
        } catch (e) {
          console.warn("Błąd bazy przy TOGGLE_OCCURRENCE:", e);
        }
      }

      const store = loadLocalStore();
      if ((store as any).calendarEvents) {
        const ev = (store as any).calendarEvents.find((e: any) => e.id === id);
        if (ev) {
          if (!Array.isArray(ev.completedDates)) ev.completedDates = [];
          if (ev.completedDates.includes(occurrenceDate)) {
            ev.completedDates = ev.completedDates.filter((d: string) => d !== occurrenceDate);
          } else {
            ev.completedDates.push(occurrenceDate);
          }
          saveLocalStore(store);
          return NextResponse.json({ success: true, event: ev });
        }
      }
    }

    // Aktualizacja w bazie Neon Prisma
    if (isNeonConfigured()) {
      try {
        const updated = await prisma.calendarEvent.update({
          where: { id },
          data: {
            title: title !== undefined ? title.trim() : undefined,
            description: description !== undefined ? description.trim() : undefined,
            eventDate: cleanDate || undefined,
            eventTime: eventTime !== undefined ? eventTime : undefined,
            category: resolvedCat || undefined,
            isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
            recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : undefined,
            reminderDays: reminderDays !== undefined ? (reminderDays !== null ? Number(reminderDays) : null) : undefined,
          },
        });
        return NextResponse.json({
          success: true,
          event: {
            ...updated,
            startDate: updated.eventDate,
          },
        });
      } catch (e) {
        console.warn("Błąd aktualizacji calendar event w Prisma:", e);
      }
    }

    // Aktualizacja store lokalnego
    const store = loadLocalStore();
    if ((store as any).calendarEvents) {
      const idx = (store as any).calendarEvents.findIndex((e: any) => e.id === id);
      if (idx !== -1) {
        (store as any).calendarEvents[idx] = {
          ...(store as any).calendarEvents[idx],
          title: title !== undefined ? title.trim() : (store as any).calendarEvents[idx].title,
          description: description !== undefined ? description.trim() : (store as any).calendarEvents[idx].description,
          eventDate: cleanDate || (store as any).calendarEvents[idx].eventDate,
          startDate: cleanDate || (store as any).calendarEvents[idx].startDate,
          eventTime: eventTime !== undefined ? eventTime : (store as any).calendarEvents[idx].eventTime,
          category: resolvedCat,
          isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : (store as any).calendarEvents[idx].isCompleted,
          recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : (store as any).calendarEvents[idx].recurrenceRule,
          reminderDays: reminderDays !== undefined ? (reminderDays !== null ? Number(reminderDays) : null) : (store as any).calendarEvents[idx].reminderDays,
          updatedAt: new Date().toISOString(),
        };
        saveLocalStore(store);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Brak ID wydarzenia" }, { status: 400 });

    if (isNeonConfigured()) {
      try {
        await prisma.calendarEvent.delete({ where: { id } });
        return NextResponse.json({ success: true });
      } catch (e) {
        console.warn("Błąd usuwania calendar event z Prisma:", e);
      }
    }

    const store = loadLocalStore();
    if ((store as any).calendarEvents) {
      (store as any).calendarEvents = (store as any).calendarEvents.filter((e: any) => e.id !== id);
      saveLocalStore(store);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
