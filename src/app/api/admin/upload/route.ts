import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      // Check single file fallback
      const singleFile = formData.get("file") as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "Nie przesłano żadnych plików" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== "function") continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `prod-${timestamp}-${randomSuffix}.webp`;
      const filePath = path.join(uploadDir, filename);

      try {
        // Automatyczna rotacja z EXIF (kluczowe dla zdjęć robionych smartfonem), resize i kompresja do WebP
        await sharp(buffer)
          .rotate() // automatycznie obraca zgodnie z orientacją aparatu telefonu
          .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toFile(filePath);

        uploadedUrls.push(`/uploads/${filename}`);
      } catch (sharpError) {
        console.error("Błąd kompresji sharp, zapisuję oryginał:", sharpError);
        // Fallback w razie problemów z nietypowym formatem pliku
        const fallbackExt = path.extname(file.name) || ".jpg";
        const fallbackFilename = `prod-${timestamp}-${randomSuffix}${fallbackExt}`;
        const fallbackPath = path.join(uploadDir, fallbackFilename);
        fs.writeFileSync(fallbackPath, buffer);
        uploadedUrls.push(`/uploads/${fallbackFilename}`);
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: "Nie udało się przetworzyć przesłanych plików" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Błąd w endpointzie uploadu:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas przesyłania plików na serwer" },
      { status: 500 }
    );
  }
}

