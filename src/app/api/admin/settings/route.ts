import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { updateStoreSettings, getStoreSettings } from "@/lib/store-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "Brak autoryzacji sesji." },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const settings = await getStoreSettings({ forAdminClient: true });
    return NextResponse.json(
      { success: true, settings },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json(
      { error: "Brak autoryzacji sesji." },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const settingsUpdate = await req.json();
    const updated = await updateStoreSettings(settingsUpdate);
    return NextResponse.json(
      { success: true, settings: updated },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
