import { NextRequest, NextResponse } from "next/server";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Podaj swoje imię." },
        { status: 400 }
      );
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "Podaj prawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Wpisz treść wiadomości." },
        { status: 400 }
      );
    }

    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // Zapis do lokalnego magazynu
    const store = loadLocalStore();
    if (!store.contactMessages) {
      store.contactMessages = [];
    }
    store.contactMessages.unshift(newMessage);
    saveLocalStore(store);

    return NextResponse.json({
      success: true,
      message: "Wiadomość została wysłana i zapisana.",
      id: newMessage.id,
    });
  } catch (err: any) {
    console.error("Błąd zapisu wiadomości kontaktowej:", err);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas wysyłania wiadomości." },
      { status: 500 }
    );
  }
}

