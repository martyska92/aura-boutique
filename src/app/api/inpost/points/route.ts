import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";

  try {
    // Zapytanie do oficjalnego publicznego API punktów InPost ShipX
    const inpostUrl = `https://api-shipx-pl.easypack24.net/v1/points?type=parcel_locker&limit=15${
      query ? `&query=${encodeURIComponent(query)}` : "&relative_point=51.46588,16.90508"
    }`;

    const res = await fetch(inpostUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // Cache na 5 minut
    });

    if (res.ok) {
      const data = await res.json();
      const points = (data.items || []).map((item: any) => ({
        name: item.name, // np. ZMG01BAPP
        city: item.address_details?.city || item.address?.line2 || "",
        street: `${item.address_details?.street || item.address?.line1 || ""} ${item.address_details?.building_number || ""}`.trim(),
        postalCode: item.address_details?.post_code || "",
        description: item.location_description || item.location_description_1 || "Paczkomat InPost 24/7",
      }));

      return NextResponse.json({ points });
    }
  } catch (err) {
    console.error("Błąd zapytania do InPost API:", err);
  }

  // Fallback punkty w okolicy Żmigród / Pełczyń / Trzebnica
  const fallbackPoints = [
    {
      name: "ZMI01M",
      city: "Żmigród",
      street: "ul. Poprzeczna 3/1A",
      postalCode: "55-140",
      description: "Butik AURA / Centrum",
    },
    {
      name: "ZMG01BAPP",
      city: "Żmigród",
      street: "ul. Wrocławska 36A",
      postalCode: "55-140",
      description: "Market Dino",
    },
    {
      name: "ZMG05M",
      city: "Żmigród",
      street: "ul. Kolejowa 10b",
      postalCode: "55-140",
      description: "Dworzec PKP / Dino",
    },
    {
      name: "PEL01M",
      city: "Pełczyń",
      street: "ul. Główna 15",
      postalCode: "55-140",
      description: "Centrum miejscowości Pełczyń",
    },
    {
      name: "TRZ01M",
      city: "Trzebnica",
      street: "ul. Bochenka 2",
      postalCode: "55-100",
      description: "Market Biedronka",
    },
  ].filter(
    (p) =>
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.city.toLowerCase().includes(query.toLowerCase()) ||
      p.street.toLowerCase().includes(query.toLowerCase())
  );

  return NextResponse.json({ points: fallbackPoints });
}

