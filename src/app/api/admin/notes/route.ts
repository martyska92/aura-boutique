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
      const notes = await prisma.ownerNote.findMany({
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      });
      return NextResponse.json({ notes });
    } catch (e) {
      console.warn("Błąd bazy notes:", e);
    }
  }

  const store = loadLocalStore();
  const notes = (store as any).ownerNotes || [];
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, isPinned } = body;

    const newNote = {
      id: `note-${Date.now()}`,
      title: title || "Bez tytułu",
      content: content || "",
      isPinned: Boolean(isPinned),
      isDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNeonConfigured()) {
      try {
        const created = await prisma.ownerNote.create({
          data: {
            title: newNote.title,
            content: newNote.content,
            isPinned: newNote.isPinned,
            isCompleted: false,
          },
        });
        return NextResponse.json({ success: true, note: created });
      } catch (e) {
        console.warn("Błąd zapisu note do Prisma:", e);
      }
    }

    const store = loadLocalStore();
    if (!(store as any).ownerNotes) (store as any).ownerNotes = [];
    (store as any).ownerNotes.unshift(newNote);
    saveLocalStore(store);

    return NextResponse.json({ success: true, note: newNote });
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
    const { id, isDone, isPinned, title, content } = body;

    if (!id) return NextResponse.json({ error: "Brak ID notatki" }, { status: 400 });

    if (isNeonConfigured()) {
      try {
        const updated = await prisma.ownerNote.update({
          where: { id },
          data: {
            ...(isDone !== undefined ? { isCompleted: isDone } : {}),
            ...(isPinned !== undefined ? { isPinned } : {}),
            ...(title !== undefined ? { title } : {}),
            ...(content !== undefined ? { content } : {}),
          },
        });
        return NextResponse.json({ success: true, note: updated });
      } catch (e) {
        console.warn("Błąd aktualizacji notatki w Prisma:", e);
      }
    }

    const store = loadLocalStore();
    const notes = (store as any).ownerNotes || [];
    const idx = notes.findIndex((n: any) => n.id === id);
    if (idx !== -1) {
      if (isDone !== undefined) notes[idx].isDone = isDone;
      if (isPinned !== undefined) notes[idx].isPinned = isPinned;
      if (title !== undefined) notes[idx].title = title;
      if (content !== undefined) notes[idx].content = content;
      notes[idx].updatedAt = new Date().toISOString();
      saveLocalStore(store);
      return NextResponse.json({ success: true, note: notes[idx] });
    }

    return NextResponse.json({ error: "Nie odnaleziono notatki" }, { status: 404 });
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
    if (!id) return NextResponse.json({ error: "Brak ID notatki" }, { status: 400 });

    if (isNeonConfigured()) {
      try {
        await prisma.ownerNote.delete({ where: { id } });
        return NextResponse.json({ success: true });
      } catch (e) {
        console.warn("Błąd usuwania notatki z Prisma:", e);
      }
    }

    const store = loadLocalStore();
    if ((store as any).ownerNotes) {
      (store as any).ownerNotes = (store as any).ownerNotes.filter((n: any) => n.id !== id);
      saveLocalStore(store);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
