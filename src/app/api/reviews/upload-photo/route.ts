import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nie przesłano pliku zdjęcia." }, { status: 400 });
    }

    // Sprawdzenie typu pliku
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Dozwolone są wyłącznie pliki graficzne (JPEG, PNG, WebP)." },
        { status: 400 }
      );
    }

    // Sprawdzenie wielkości (maks 8 MB)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Zdjęcie jest za duże. Maksymalny rozmiar to 8 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Próba optymalizacji i usunięcia metadanych GPS / EXIF za pomocą sharp
    let outputBuffer: Buffer = buffer;
    let mimeType = "image/jpeg";

    try {
      const sharpModule = await import("sharp");
      const sharp = sharpModule.default || sharpModule;
      // sharp domyślnie usuwa metadane EXIF (chyba że wywołano .withMetadata())
      outputBuffer = await sharp(buffer)
        .rotate() // auto-orientacja wg EXIF przed usunięciem
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      mimeType = "image/webp";
    } catch (e) {
      console.warn("Sharp niedostępny do czyszczenia EXIF, fallback do surowego bufora:", e);
    }

    const base64 = outputBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
    });
  } catch (err: any) {
    console.error("Błąd przesyłania zdjęcia do opinii:", err);
    return NextResponse.json(
      { error: err?.message || "Wystąpił błąd podczas przetwarzania zdjęcia." },
      { status: 500 }
    );
  }
}

