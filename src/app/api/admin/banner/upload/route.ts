import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

async function uploadBannerToCloudinary(buffer: Buffer): Promise<string | null> {
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
      .update(`folder=aura_banners&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: "image/webp" });
    formData.append("file", blob, `banner_${timestamp}.webp`);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", "aura_banners");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.secure_url || data.url;
    }
  } catch (err) {
    console.error("Błąd przesyłania do Cloudinary:", err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Weryfikacja sesji administratora
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Brak uprawnień administratora do wgrywania plików banera." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Nie wybrano pliku ze zdjęciem." },
        { status: 400 }
      );
    }

    // 2. Walidacja typu pliku
    const mimeType = file.type?.toLowerCase() || "";
    const fileName = file.name || "banner.jpg";
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

    const isValidMime = ALLOWED_MIME_TYPES.includes(mimeType) || ["jpg", "jpeg", "png", "webp"].includes(fileExt);
    if (!isValidMime) {
      return NextResponse.json(
        { error: "Nieobsługiwany format pliku. Dopuszczalne formaty to: JPG, PNG oraz WebP." },
        { status: 400 }
      );
    }

    // 3. Walidacja rozmiaru
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `Plik jest zbyt duży (${sizeMB} MB). Maksymalny dopuszczalny rozmiar to 10 MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // 4. Optymalizacja grafiki za pomocą sharp
    let optimizedBuffer: Buffer = rawBuffer;
    let isWebpConverted = false;

    try {
      const sharpModule = (await import("sharp")).default;
      optimizedBuffer = await sharpModule(rawBuffer)
        .rotate() // Automatyczna orientacja z EXIF
        .resize({
          width: 2560,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 88, effort: 4 })
        .toBuffer();
      isWebpConverted = true;
    } catch (sharpError) {
      console.warn("Sharp niedostępny lub błąd konwersji, zachowuję oryginalny bufor:", sharpError);
      optimizedBuffer = rawBuffer;
      isWebpConverted = false;
    }

    // 5. Zapis w trwałym magazynie plików
    // 5a. Próba przesłania do Cloudinary (jeśli skonfigurowane)
    const cloudinaryUrl = await uploadBannerToCloudinary(optimizedBuffer);
    if (cloudinaryUrl) {
      return NextResponse.json({
        success: true,
        url: cloudinaryUrl,
        storage: "cloudinary",
        size: optimizedBuffer.length,
        message: "Zdjęcie banera zostało pomyślnie zoptymalizowane i zapisane w chmurze.",
      });
    }

    // 5b. Próba zapisu do lokalnego systemu plików (jeśli zapisywalny)
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const targetExt = isWebpConverted ? "webp" : (fileExt || "jpg");

    if (!isVercel) {
      try {
        const heroDir = path.join(process.cwd(), "public", "images", "hero");
        if (!fs.existsSync(heroDir)) {
          fs.mkdirSync(heroDir, { recursive: true });
        }

        const newFileName = `banner-${timestamp}-${randomSuffix}.${targetExt}`;
        const targetPath = path.join(heroDir, newFileName);
        fs.writeFileSync(targetPath, optimizedBuffer);

        const publicUrl = `/images/hero/${newFileName}?v=${timestamp}`;
        return NextResponse.json({
          success: true,
          url: publicUrl,
          storage: "local-public",
          size: optimizedBuffer.length,
          message: "Zdjęcie banera zostało pomyślnie zapisane na serwerze.",
        });
      } catch (fsErr) {
        console.warn("Zapis do public/images/hero niemożliwy, używam trwałego Data URL:", fsErr);
      }
    }

    // 5c. Trwały zapis w bazie danych jako Data URL (Vercel / read-only filesystem)
    // Ponieważ VisualBannerConfig jest zapisywany w kolumnach TEXT bazy Neon PostgreSQL,
    // Data URL jest trwale zachowywany w bazie danych i nie znika po restarcie kontenera Vercel.
    const outputMime = isWebpConverted ? "image/webp" : (mimeType || "image/jpeg");
    const base64Data = optimizedBuffer.toString("base64");
    const dataUrl = `data:${outputMime};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      storage: "database-base64",
      size: optimizedBuffer.length,
      message: "Zdjęcie banera zostało pomyślnie zoptymalizowane i przygotowane do trwałego zapisu w bazie danych.",
    });
  } catch (error: any) {
    console.error("Błąd w endpointzie uploadu banera:", error);
    return NextResponse.json(
      {
        error: error?.message || "Wystąpił błąd podczas przetwarzania zdjęcia banera.",
      },
      { status: 500 }
    );
  }
}
