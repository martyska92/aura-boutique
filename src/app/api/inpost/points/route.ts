import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface InpostPointOutput {
  name: string;
  city: string;
  street: string;
  postalCode: string;
  description: string;
  distanceMeters?: number;
}

// Funkcja Haversine do obliczania rzeczywistej odległości w metrach
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // promień Ziemi w metrach
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";
  const latStr = searchParams.get("lat")?.trim();
  const lngStr = searchParams.get("lng")?.trim();

  const userLat = latStr ? parseFloat(latStr) : null;
  const userLng = lngStr ? parseFloat(lngStr) : null;

  // Bez zapytania i bez współrzędnych zwracamy pustą listę z informacją o wyszukiwarce
  if (!query && (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng))) {
    return NextResponse.json({
      points: [],
      message: "Wpisz miejscowość, ulicę lub kod paczkomatu, albo skorzystaj z opcji 'Znajdź blisko mnie'.",
    });
  }

  try {
    let inpostUrl = "https://api-shipx-pl.easypack24.net/v1/points?type=parcel_locker&status=Operating&limit=25";

    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      inpostUrl += `&relative_point=${userLat},${userLng}`;
    } else if (query) {
      inpostUrl += `&query=${encodeURIComponent(query)}`;
    }

    const res = await fetch(inpostUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 180 }, // Cache na 3 minuty
    });

    if (res.ok) {
      const data = await res.json();
      const rawItems = Array.isArray(data.items) ? data.items : [];

      let points: InpostPointOutput[] = rawItems
        .filter((item: any) => {
          // Filtrujemy tylko sprawne paczkomaty InPost obsługujące standardowe nadania i odbiory
          const isLocker = item.type?.includes("parcel_locker");
          const isOperating = item.status === "Operating";
          return isLocker && isOperating;
        })
        .map((item: any) => {
          let dist: number | undefined = undefined;
          if (
            userLat !== null &&
            userLng !== null &&
            item.location?.latitude &&
            item.location?.longitude
          ) {
            dist = calculateDistanceMeters(
              userLat,
              userLng,
              item.location.latitude,
              item.location.longitude
            );
          }

          const street = `${item.address_details?.street || item.address?.line1 || ""} ${
            item.address_details?.building_number || ""
          }`.trim();

          return {
            name: item.name,
            city: item.address_details?.city || item.address?.line2 || "",
            street,
            postalCode: item.address_details?.post_code || "",
            description:
              item.location_description ||
              item.location_description_1 ||
              "Paczkomat InPost 24/7",
            distanceMeters: dist,
          };
        });

      // Jeśli mamy odległości, sortujemy od najbliższego
      if (userLat !== null && userLng !== null) {
        points.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
      }

      return NextResponse.json({ points });
    }
  } catch (err) {
    console.error("Błąd zapytania do oficjalnego InPost API:", err);
  }

  // W przypadku błędu API InPost zwracamy pustą listę i informację o błędzie sieciowym
  return NextResponse.json({
    points: [],
    error: "Nie udało się pobrać punktów InPost w tym momencie. Wpisz kod paczkomatu ręcznie.",
  });
}
