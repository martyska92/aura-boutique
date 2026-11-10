import { NextRequest, NextResponse } from "next/server";
import { loadLocalStore, saveLocalStore } from "@/lib/store-data";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  recipientEmail?: string;
  createdAt: string;
  isRead: boolean;
}

const OWNER_EMAIL = "aurazmigrod@wp.pl";

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
      recipientEmail: OWNER_EMAIL,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // 1. Zapis do lokalnego magazynu wiadomości butiku
    const store = loadLocalStore();
    if (!store.contactMessages) {
      store.contactMessages = [];
    }
    store.contactMessages.unshift(newMessage);
    saveLocalStore(store);

    // 2. Jeśli jest skonfigurowana usługa wysyłki maili (np. RESEND_API_KEY lub SMTP)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "AURA Boutique <kontakt@auraboutique.pl>",
            to: [OWNER_EMAIL],
            reply_to: newMessage.email,
            subject: `Nowa wiadomość od klientki: ${newMessage.name}`,
            text: `Imię: ${newMessage.name}\nEmail: ${newMessage.email}\nData: ${newMessage.createdAt}\n\nWiadomość:\n${newMessage.message}`,
          }),
        });
      } catch (mailErr) {
        console.error("Błąd wysyłki e-mail przez Resend:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      recipient: OWNER_EMAIL,
      message: `Dziękujemy! Twoja wiadomość została przekazana na adres: ${OWNER_EMAIL}. Odpowiemy najszybciej jak to możliwe.`,
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
