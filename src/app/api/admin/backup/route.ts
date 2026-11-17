import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  createBackup,
  getBackupSystemStatus,
  listBackups,
} from "@/lib/backup-service";

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const status = await getBackupSystemStatus();
    const backups = await listBackups();
    return NextResponse.json({ status, backups });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Błąd odczytu statusu kopii: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const trigger = body.trigger || "MANUAL";
    const label = body.label || "Kopia wykonana ręcznie z panelu właścicielki";

    const metadata = await createBackup(trigger, label);
    const status = await getBackupSystemStatus();
    const backups = await listBackups();

    return NextResponse.json({
      success: true,
      message: "Zaszyfrowana kopia zapasowa została pomyślnie utworzona.",
      metadata,
      status,
      backups,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Nie udało się utworzyć kopii: " + err.message },
      { status: 500 }
    );
  }
}
