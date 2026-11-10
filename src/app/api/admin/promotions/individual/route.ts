import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { saveIndividualDiscount, deleteIndividualDiscount } from "@/lib/store-data";
import { sendIndividualDiscountNoticeEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { email, discountPercent, scope, categoryIds, productIds, isIndefinite, adminNote, sendNotification } =
      await req.json();

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Podaj prawidłowy adres e-mail." }, { status: 400 });
    }

    if (!discountPercent || isNaN(Number(discountPercent)) || Number(discountPercent) <= 0) {
      return NextResponse.json({ error: "Podaj prawidłową wysokość rabatu w %." }, { status: 400 });
    }

    const saved = await saveIndividualDiscount({
      email,
      discountPercent: Number(discountPercent),
      scope: scope || "ALL",
      categoryIds,
      productIds,
      isIndefinite: isIndefinite !== undefined ? isIndefinite : true,
      adminNote,
    });

    if (sendNotification) {
      await sendIndividualDiscountNoticeEmail({
        customerEmail: saved.email,
        discountPercent: saved.discountPercent,
        note: adminNote,
      });
    }

    return NextResponse.json({ success: true, individualDiscount: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji sesji." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Wymagane ID rabatu." }, { status: 400 });
    }

    const success = await deleteIndividualDiscount(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

