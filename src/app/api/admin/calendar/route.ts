import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma, isNeonConfigured } from "@/lib/prisma";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  if (isNeonConfigured()) {
    try {
      const events = await prisma.calendarEvent.findMany({
        orderBy: { eventDate: "asc" },
      });
      return NextResponse.json({ events });
    } catch (e) {
      console.warn("Błąd bazy calendar:", e);
    }
  }

  const store = loadLocalStore();
  const events = (store as any).calendarEvents || [];
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, startDate, endDate, isAllDay, category, color, reminderMinutes } = body;

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: title || "Bez tytułu",
      description: description || "",
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || null,
      isAllDay: Boolean(isAllDay),
      category: category || "INNE",
      color: color || "#C5A069",
      reminderMinutes: reminderMinutes ? Number(reminderMinutes) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNeonConfigured()) {
      try {
        const created = await prisma.calendarEvent.create({
          data: {
            title: newEvent.title,
            description: newEvent.description,
            eventDate: newEvent.startDate.slice(0, 10),
            category: newEvent.category,
            isCompleted: false,
          },
        });
        return NextResponse.json({ success: true, event: created });
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
