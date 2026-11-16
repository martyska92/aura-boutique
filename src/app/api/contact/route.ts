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

    // 2. Wysłanie powiadomienia do właścicielki przez skonfigurowany kanał e-mail (SMTP / Resend)
    try {
      const { dispatchEmail } = await import("@/lib/email-service");
      await dispatchEmail({
        to: OWNER_EMAIL,
        subject: `Nowa wiadomość od klientki: ${newMessage.name}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #241D1B; line-height: 1.6;">
            <h2 style="font-size: 18px; margin-top: 0;">Wiadomość z formularza kontaktowego</h2>
            <p><strong>Klientka:</strong> ${newMessage.name}</p>
            <p><strong>E-mail:</strong> <a href="mailto:${newMessage.email}">${newMessage.email}</a></p>
            <p><strong>Data:</strong> ${newMessage.createdAt}</p>
            <hr style="border: 0; border-top: 1px solid #EADFD5; margin: 20px 0;" />
            <p style="white-space: pre-line;">${newMessage.message}</p>
          </div>
        `,
        type: "CONTACT_MESSAGE" as any,
      });
    } catch (mailErr) {
      console.error("Błąd wysyłki e-mail kontaktu:", mailErr);
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
