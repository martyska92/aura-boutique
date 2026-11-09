import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";

// Pomocnicza funkcja uploadu do Cloudinary (jeśli skonfigurowano w .env)
async function uploadToCloudinary(buffer: Buffer): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName.includes("twoja_nazwa")) {
    return null;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(`folder=aura_products&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: "image/webp" });
    formData.append("file", blob, "photo.webp");
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", "aura_products");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.secure_url || data.url;
    }
  } catch (err) {
    console.error("Cloudinary upload error:", err);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      const singleFile = formData.get("file") as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "Nie przesłano żadnych plików" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== "function") continue;

      const bytes = await file.arrayBuffer();
      const rawBuffer = Buffer.from(bytes);

      // Optymalizacja grafiki: automatyczna rotacja z EXIF (orientacja aparatu telefonu),
      // zmniejszenie wymiarów do max 1400px i kompresja WebP
      let optimizedBuffer: Buffer;
      try {
        optimizedBuffer = await sharp(rawBuffer)
          .rotate() // Obraca pionowe zdjęcia ze smartfona do właściwej orientacji
          .resize({
            width: 1400,
            height: 1400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toBuffer();
      } catch (sharpError) {
        console.warn("Błąd sharp, używam surowego bufora:", sharpError);
        optimizedBuffer = rawBuffer;
      }

      // 1. Sprawdź, czy Cloudinary jest skonfigurowane
      const cloudinaryUrl = await uploadToCloudinary(optimizedBuffer);
      if (cloudinaryUrl) {
        uploadedUrls.push(cloudinaryUrl);
        continue;
      }

      // 2. Jeśli jesteśmy na Vercel (środowisko read-only bez Cloudinary), użyj zoptymalizowanego Data URL
      const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      if (isVercel) {
        const base64Data = optimizedBuffer.toString("base64");
        uploadedUrls.push(`data:image/webp;base64,${base64Data}`);
        continue;
      }

      // 3. Środowisko lokalne - próba zapisu do public/uploads
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const filename = `prod-${timestamp}-${randomSuffix}.webp`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, optimizedBuffer);
        uploadedUrls.push(`/uploads/${filename}`);
      } catch (fsError: any) {
        // Jeśli system plików okazał się read-only (EROFS), bezpieczny fallback do Data URL
        console.warn("Brak uprawnień do zapisu na dysku, używam Data URL:", fsError?.message);
        const base64Data = optimizedBuffer.toString("base64");
        uploadedUrls.push(`data:image/webp;base64,${base64Data}`);
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
