import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  executeIsolatedRestoreTest,
  getBackupSystemStatus,
} from "@/lib/backup-service";

export async function POST(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const backupId = body.backupId;

    const testResult = await executeIsolatedRestoreTest(backupId);
    const status = await getBackupSystemStatus();

    return NextResponse.json({
      success: testResult.success,
      testResult,
      status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Błąd podczas próbnego odtworzenia: " + err.message },
      { status: 500 }
    );
  }
}
