import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import {
  Category,
  Product,
  ProductImage,
  ProductVariant,
  PriceHistoryRecord,
  StoreSettings,
  Order,
  OrderItem,
  ReturnRequest,
  FulfillmentStatus,
  PaymentStatus,
  ShippingMethod,
  PaymentMethod,
  Promotion,
  IndividualCustomerDiscount,
  ReferralParticipant,
  ReferralRewardCode,
  ProductReview,
  PromotionAuditLog,
  ContactMessage,
  AdminAccount,
  CustomerAccount,
} from "./types";
import {
  initialCategories,
  initialProducts,
  initialStoreSettings,
  initialOrders,
  initialPromotions,
  initialIndividualDiscounts,
  initialReferralParticipants,
  initialReferralRewardCodes,
  initialProductReviews,
  initialPromotionAuditLogs,
} from "./demo-data";
import { prisma } from "./prisma";
import { addDaysWarsaw } from "./date-utils";

export interface StoreFileState {
  categories: Category[];
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  promotions: Promotion[];
  individualDiscounts: IndividualCustomerDiscount[];
  referralParticipants: ReferralParticipant[];
  referralRewardCodes: ReferralRewardCode[];
  productReviews: ProductReview[];
  promotionAuditLogs: PromotionAuditLog[];
  contactMessages: ContactMessage[];
  adminAccount: AdminAccount;
  customers?: CustomerAccount[];
  passwordResetTokens?: {
    email: string;
    code: string;
    expiresAt: number;
    attempts?: number;
    createdAt?: number;
  }[];
  priceHistory?: PriceHistoryRecord[];
  emailOutbox?: any[];
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false;
  }
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
}

export const initialAdminAccount: AdminAccount = {
  email: "aurazmigrod@wp.pl",
  passwordHash: "",
  mustChangePassword: true,
  lastPasswordChangedAt: new Date(0).toISOString(),
};

declare global {
  var __aura_store: StoreFileState | undefined;
}

const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");
const BUNDLED_DATA_FILE = path.join(BUNDLED_DATA_DIR, "store-storage.json");
const TMP_DATA_FILE = path.join(os.tmpdir(), "aura-store-storage.json");

function getStorageReadPath(): string {
  const tmpExists = fs.existsSync(TMP_DATA_FILE);
  const bundledExists = fs.existsSync(BUNDLED_DATA_FILE);

  if (tmpExists && bundledExists) {
    try {
      const tmpMtime = fs.statSync(TMP_DATA_FILE).mtimeMs;
      const bundledMtime = fs.statSync(BUNDLED_DATA_FILE).mtimeMs;
      return tmpMtime >= bundledMtime ? TMP_DATA_FILE : BUNDLED_DATA_FILE;
    } catch {
      return TMP_DATA_FILE;
    }
  }

  if (tmpExists) {
    return TMP_DATA_FILE;
  }
  return BUNDLED_DATA_FILE;
}

function getStorageWritePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return TMP_DATA_FILE;
  }
  return BUNDLED_DATA_FILE;
}

// Pomocnicza funkcja inicjalizacji pliku lokalnego
export function loadLocalStore(): StoreFileState {
  const readPath = getStorageReadPath();

  try {
    if (fs.existsSync(readPath)) {
      const content = fs.readFileSync(readPath, "utf-8");
      const parsed = JSON.parse(content);
      const state: StoreFileState = {
        categories: parsed.categories || initialCategories,
        products: parsed.products || initialProducts,
        orders: parsed.orders || initialOrders,
        settings: { ...initialStoreSettings, ...(parsed.settings || {}) },
        promotions: parsed.promotions || initialPromotions,
        individualDiscounts: parsed.individualDiscounts || initialIndividualDiscounts,
        referralParticipants: parsed.referralParticipants || initialReferralParticipants,
        referralRewardCodes: parsed.referralRewardCodes || initialReferralRewardCodes,
        productReviews: parsed.productReviews || initialProductReviews,
        promotionAuditLogs: parsed.promotionAuditLogs || initialPromotionAuditLogs,
        contactMessages: parsed.contactMessages || [],
        adminAccount: parsed.adminAccount || initialAdminAccount,
        customers: parsed.customers || [],
        passwordResetTokens: parsed.passwordResetTokens || [],
        priceHistory: parsed.priceHistory || [],
        emailOutbox: parsed.emailOutbox || [],
      };
      globalThis.__aura_store = state;
      return state;
    }
  } catch (err) {
    console.error("Błąd odczytu lokalnego magazynu:", err);
  }

  if (globalThis.__aura_store) {
    return globalThis.__aura_store;
  }

  const defaultState: StoreFileState = {
    categories: initialCategories,
    products: initialProducts,
    orders: initialOrders,
    settings: initialStoreSettings,
    promotions: initialPromotions,
    individualDiscounts: initialIndividualDiscounts,
    referralParticipants: initialReferralParticipants,
    referralRewardCodes: initialReferralRewardCodes,
    productReviews: initialProductReviews,
    promotionAuditLogs: initialPromotionAuditLogs,
    contactMessages: [],
    adminAccount: initialAdminAccount,
    customers: [],
    passwordResetTokens: [],
    priceHistory: [],
  };

  try {
    const writeTarget = getStorageWritePath();
    const dir = path.dirname(writeTarget);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(writeTarget, JSON.stringify(defaultState, null, 2), "utf-8");
  } catch (err) {
    console.error("Błąd zapisu domyślnego magazynu:", err);
  }

  globalThis.__aura_store = defaultState;
  return defaultState;
}

export function saveLocalStore(state: StoreFileState) {
  globalThis.__aura_store = state;

  // 1. Zapis do pliku BUNDLED_DATA_FILE (jeśli system plików pozwala na zapis)
  try {
    const bundledDir = path.dirname(BUNDLED_DATA_FILE);
    if (!fs.existsSync(bundledDir)) {
      fs.mkdirSync(bundledDir, { recursive: true });
    }
    fs.writeFileSync(BUNDLED_DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (_) {
    // Na platformach read-only (np. Vercel lambda poza /tmp) zapis ten może rzucić EROFS
  }

  // 2. Zapis do TMP_DATA_FILE (dostępny w środowiskach serverless)
  try {
    const tmpDir = path.dirname(TMP_DATA_FILE);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (_) { }
}

// Sprawdzenie czy Neon / PostgreSQL jest poprawnie skonfigurowany
export function isNeonConfigured(): boolean {
  const raw =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL;
  if (!raw) return false;
  const url = raw.trim().replace(/^["']|["']$/g, "");
  return Boolean(
    url &&
    !url.includes("localhost:51213") &&
    !url.includes("username:password") &&
    !url.includes("twoja_baza") &&
    (url.startsWith("postgresql://") ||
      url.startsWith("postgres://") ||
      url.startsWith("prisma+postgres://") ||
      url.startsWith("prisma://"))
  );
}

let prismaConnectedCache: boolean | null = null;
let lastPrismaCheckTime = 0;

export async function isDatabaseConnected(): Promise<boolean> {
  if (!isNeonConfigured()) return false;
  const now = Date.now();
  if (prismaConnectedCache !== null && now - lastPrismaCheckTime < 20000) {
    return prismaConnectedCache;
  }
  try {
    // Sprawdzamy aktywne połączenie z bazą
    await prisma.$queryRaw`SELECT 1`;
    prismaConnectedCache = true;
    lastPrismaCheckTime = now;
    return true;
  } catch (err) {
    prismaConnectedCache = false;
    lastPrismaCheckTime = now;
    return false;
  }
}

// ==========================================
// KATEGORIE
// ==========================================
export async function getCategories(): Promise<Category[]> {
  const store = loadLocalStore();
  return store.categories.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function createCategory(data: {
  name: string;
  description?: string;
  imageUrl?: string;
}): Promise<Category> {
  const store = loadLocalStore();
  const slug = data.name
    .toLowerCase()
    .trim()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const newCat: Category = {
    id: `cat-${slug || Date.now()}`,
    name: data.name.trim(),
    slug: slug || `kat-${Date.now()}`,
    description: data.description || "",
    imageUrl: data.imageUrl || "",
    orderIndex: store.categories.length,
    isActive: true,
  };

  store.categories.push(newCat);
  saveLocalStore(store);

  if (isNeonConfigured()) {
    try {
      await prisma.category.create({
        data: {
          id: newCat.id,
          name: newCat.name,
          slug: newCat.slug,
          description: newCat.description,
          imageUrl: newCat.imageUrl,
          orderIndex: newCat.orderIndex,
          isActive: true,
        },
      });
    } catch (err) {
      console.error("Błąd zapisu kategorii do Prisma:", err);
    }
  }

  return newCat;
}

export async function updateCategory(
  id: string,
  data: Partial<Category>
): Promise<Category | null> {
  const store = loadLocalStore();
  const index = store.categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updated: Category = {
    ...store.categories[index],
    ...data,
  };

  if (data.name && !data.slug) {
    updated.slug = data.name
      .toLowerCase()
      .trim()
      .replace(/ą/g, "a")
      .replace(/ć/g, "c")
      .replace(/ę/g, "e")
      .replace(/ł/g, "l")
      .replace(/ń/g, "n")
      .replace(/ó/g, "o")
      .replace(/ś/g, "s")
      .replace(/ź/g, "z")
      .replace(/ż/g, "z")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  store.categories[index] = updated;
  saveLocalStore(store);

  if (isNeonConfigured()) {
    try {
      await prisma.category.update({
        where: { id },
        data: {
          name: updated.name,
          slug: updated.slug,
          description: updated.description,
          imageUrl: updated.imageUrl,
          orderIndex: updated.orderIndex,
          isActive: updated.isActive,
        },
      });
    } catch (err) {
      console.error("Błąd aktualizacji kategorii w Prisma:", err);
    }
  }

  return updated;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const store = loadLocalStore();
  const initialLen = store.categories.length;
  store.categories = store.categories.filter((c) => c.id !== id);
  if (store.categories.length === initialLen) return false;

  saveLocalStore(store);

  if (isNeonConfigured()) {
    try {
      await prisma.category.delete({
        where: { id },
      });
    } catch (err) {
      console.error("Błąd usuwania kategorii z Prisma:", err);
    }
  }

  return true;
}

// ==========================================
// DYREKTYWA OMNIBUS: KALKULACJA NAJNIŻSZEJ CENY Z 30 DNI
// ==========================================
export function calculateLowestPrice30Days(
  history: PriceHistoryRecord[],
  promotionStartedAt: Date | string,
  productCreatedAt?: Date | string,
  variantId?: string
): number | null {
  const promoDate = new Date(promotionStartedAt);
  const thirtyDaysAgo = new Date(promoDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filtrujemy wpisy cen regularnych sprzed daty rozpoczęcia tej promocji
  const relevantHistory = (history || []).filter((h) => {
    if (variantId && h.variantId && h.variantId !== variantId) return false;
    const changeDate = new Date(h.changedAt);
    return changeDate < promoDate && !h.isPromotion;
  });

  if (relevantHistory.length === 0) {
    return null; // Brak wiarygodnej historii sprzed promocji
  }

  // Wpisy w 30-dniowym oknie bezpośrednio przed obniżką
  const windowHistory = relevantHistory.filter((h) => new Date(h.changedAt) >= thirtyDaysAgo);

  if (windowHistory.length > 0) {
    const minPrice = Math.min(...windowHistory.map((h) => Number(h.price)));
    return Number(minPrice.toFixed(2));
  }

  // Jeżeli produkt jest oferowany krócej niż 30 dni:
  // najniższa cena od rozpoczęcia jego sprzedaży
  const minPriceAll = Math.min(...relevantHistory.map((h) => Number(h.price)));
  return Number(minPriceAll.toFixed(2));
}

// ==========================================
// PRODUKTY
// ==========================================
function mapPrismaProduct(dbProd: any, store: StoreFileState): Product {
  const promoStarted = dbProd.promotionStartedAt
    ? dbProd.promotionStartedAt instanceof Date
      ? dbProd.promotionStartedAt.toISOString()
      : String(dbProd.promotionStartedAt)
    : undefined;

  const priceHistory: PriceHistoryRecord[] =
    dbProd.priceHistory && dbProd.priceHistory.length > 0
      ? dbProd.priceHistory.map((ph: any) => ({
        id: ph.id,
        productId: ph.productId,
        variantId: ph.variantId || undefined,
        price: Number(ph.price),
        isPromotion: Boolean(ph.isPromotion),
        changedAt: ph.changedAt instanceof Date ? ph.changedAt.toISOString() : String(ph.changedAt),
      }))
      : store.products.find((p) => p.id === dbProd.id)?.priceHistory || [];

  return {
    id: dbProd.id,
    name: dbProd.name,
    slug: dbProd.slug,
    description: dbProd.description || "",
    composition: dbProd.composition || "",
    careGuide: dbProd.careGuide || "",
    sizeGuide: dbProd.sizeGuide || "",
    basePrice: Number(dbProd.basePrice),
    promotionalPrice: dbProd.promotionalPrice ? Number(dbProd.promotionalPrice) : undefined,
    promotionStartedAt: promoStarted,
    lowestPrice30Days: dbProd.lowestPrice30Days ? Number(dbProd.lowestPrice30Days) : undefined,
    isPromoted: Boolean(dbProd.isPromoted),
    isNew: Boolean(dbProd.isNew),
    isBestseller: Boolean(dbProd.isBestseller),
    isPublished: Boolean(dbProd.isPublished),
    isArchived: Boolean(dbProd.isArchived),
    isDemo: Boolean(dbProd.isDemo),
    categoryId: dbProd.categoryId,
    category: dbProd.category
      ? {
        id: dbProd.category.id,
        name: dbProd.category.name,
        slug: dbProd.category.slug,
        description: dbProd.category.description || undefined,
        imageUrl: dbProd.category.imageUrl || undefined,
        orderIndex: dbProd.category.orderIndex,
        isActive: dbProd.category.isActive !== undefined ? Boolean(dbProd.category.isActive) : true,
      }
      : store.categories.find((c) => c.id === dbProd.categoryId),
    images:
      dbProd.images && dbProd.images.length > 0
        ? dbProd.images.map((im: any) => ({
          id: im.id,
          productId: im.productId,
          url: im.url,
          altText: im.altText || undefined,
          orderIndex: im.orderIndex,
          isPrimary: im.isPrimary,
        }))
        : store.products.find((p) => p.id === dbProd.id)?.images || [],
    variants:
      dbProd.variants && dbProd.variants.length > 0
        ? dbProd.variants.map((v: any) => ({
          id: v.id,
          productId: v.productId,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || undefined,
          sku: v.sku,
          stockQuantity: v.stockQuantity,
          reservedQuantity: v.reservedQuantity || 0,
          price: v.price ? Number(v.price) : undefined,
          promotionalPrice: v.promotionalPrice ? Number(v.promotionalPrice) : undefined,
          lowestPrice30Days: v.lowestPrice30Days ? Number(v.lowestPrice30Days) : undefined,
        }))
        : [],
    priceHistory,
    createdAt: dbProd.createdAt instanceof Date ? dbProd.createdAt.toISOString() : String(dbProd.createdAt),
    updatedAt: dbProd.updatedAt instanceof Date ? dbProd.updatedAt.toISOString() : String(dbProd.updatedAt),
  };
}

export async function getProducts(options?: {
  categorySlug?: string;
  isPromotedOnly?: boolean;
  isNewOnly?: boolean;
  isBestsellerOnly?: boolean;
  includeArchived?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStockOnly?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest";
}): Promise<Product[]> {
  const store = loadLocalStore();

  // Sprawdzamy aktywne połączenie z bazą PostgreSQL/Neon
  if (await isDatabaseConnected()) {
    try {
      const where: any = {};
      if (!options?.includeArchived) {
        where.isArchived = false;
        where.isPublished = true;
      }
      if (options?.categorySlug) {
        where.category = { slug: options.categorySlug };
      }
      if (options?.isPromotedOnly) {
        where.isPromoted = true;
      }
      if (options?.isNewOnly) {
        where.isNew = true;
      }
      if (options?.isBestsellerOnly) {
        where.isBestseller = true;
      }
      if (options?.search) {
        const q = options.search.trim();
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }
      if (options?.minPrice !== undefined) {
        where.basePrice = { ...where.basePrice, gte: options.minPrice };
      }
      if (options?.maxPrice !== undefined) {
        where.basePrice = { ...where.basePrice, lte: options.maxPrice };
      }

      const dbProducts = await prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { orderIndex: "asc" } },
          variants: true,
          category: true,
          priceHistory: { orderBy: { changedAt: "desc" } },
        },
        orderBy:
          options?.sortBy === "price_asc"
            ? { basePrice: "asc" }
            : options?.sortBy === "price_desc"
              ? { basePrice: "desc" }
              : { createdAt: "desc" },
      });

      if (dbProducts && dbProducts.length > 0) {
        let mapped = dbProducts.map((p) => mapPrismaProduct(p, store));

        if (options?.size) {
          mapped = mapped.filter((p) =>
            p.variants.some((v) => v.size.toLowerCase() === options.size!.toLowerCase() && v.stockQuantity > 0)
          );
        }
        if (options?.color) {
          mapped = mapped.filter((p) =>
            p.variants.some((v) => v.color.toLowerCase().includes(options.color!.toLowerCase()))
          );
        }
        if (options?.inStockOnly) {
          mapped = mapped.filter((p) =>
            p.variants.some((v) => v.stockQuantity - v.reservedQuantity > 0)
          );
        }

        return mapped;
      }
    } catch (err) {
      console.warn("Ostrzeżenie: Błąd pobierania produktów z bazy Prisma:", err);
    }
  }

  // Fallback do lokalnego magazynu
  let list = [...store.products];

  if (!options?.includeArchived) {
    list = list.filter((p) => !p.isArchived && p.isPublished);
  }

  if (options?.categorySlug) {
    const category = store.categories.find((c) => c.slug === options.categorySlug);
    if (category) {
      list = list.filter((p) => p.categoryId === category.id);
    }
  }

  if (options?.isPromotedOnly) {
    list = list.filter((p) => p.isPromoted);
  }

  if (options?.isNewOnly) {
    list = list.filter((p) => p.isNew);
  }

  if (options?.isBestsellerOnly) {
    list = list.filter((p) => p.isBestseller);
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.composition?.toLowerCase().includes(q)
    );
  }

  if (options?.minPrice !== undefined) {
    list = list.filter((p) => (p.promotionalPrice ?? p.basePrice) >= options.minPrice!);
  }

  if (options?.maxPrice !== undefined) {
    list = list.filter((p) => (p.promotionalPrice ?? p.basePrice) <= options.maxPrice!);
  }

  if (options?.size) {
    list = list.filter((p) =>
      p.variants.some((v) => v.size.toLowerCase() === options.size!.toLowerCase() && v.stockQuantity > 0)
    );
  }

  if (options?.color) {
    list = list.filter((p) =>
      p.variants.some((v) => v.color.toLowerCase().includes(options.color!.toLowerCase()))
    );
  }

  if (options?.inStockOnly) {
    list = list.filter((p) =>
      p.variants.some((v) => v.stockQuantity - v.reservedQuantity > 0)
    );
  }

  // Dołączanie kategorii
  list = list.map((p) => ({
    ...p,
    category: store.categories.find((c) => c.id === p.categoryId),
  }));

  // Sortowanie
  if (options?.sortBy === "price_asc") {
    list.sort(
      (a, b) =>
        (a.promotionalPrice ?? a.basePrice) - (b.promotionalPrice ?? b.basePrice)
    );
  } else if (options?.sortBy === "price_desc") {
    list.sort(
      (a, b) =>
        (b.promotionalPrice ?? b.basePrice) - (a.promotionalPrice ?? a.basePrice)
    );
  } else {
    // newest domyślnie
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const store = loadLocalStore();

  if (await isDatabaseConnected()) {
    try {
      const dbProd = await prisma.product.findFirst({
        where: { slug },
        include: {
          images: { orderBy: { orderIndex: "asc" } },
          variants: true,
          category: true,
          priceHistory: { orderBy: { changedAt: "desc" } },
        },
      });
      if (dbProd) {
        return mapPrismaProduct(dbProd, store);
      }
    } catch (e) {
      console.warn("Błąd wyszukiwania produktu po slug w bazie Prisma:", e);
    }
  }

  const product = store.products.find((p) => p.slug === slug);
  if (!product) return null;
  return {
    ...product,
    category: store.categories.find((c) => c.id === product.categoryId),
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const store = loadLocalStore();

  if (await isDatabaseConnected()) {
    try {
      const dbProd = await prisma.product.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: {
          images: { orderBy: { orderIndex: "asc" } },
          variants: true,
          category: true,
          priceHistory: { orderBy: { changedAt: "desc" } },
        },
      });
      if (dbProd) {
        return mapPrismaProduct(dbProd, store);
      }
    } catch (e) {
      console.warn("Błąd wyszukiwania produktu w bazie Prisma:", e);
    }
  }

  const product = store.products.find((p) => p.id === id || p.slug === id);
  if (!product) return null;
  return {
    ...product,
    category: store.categories.find((c) => c.id === product.categoryId),
  };
}

async function syncProductToPrisma(prod: Product): Promise<void> {
  if (!isNeonConfigured()) return;
  try {
    // 1. Zapewnij, że kategoria istnieje w tabeli Category bazy danych (ochrona przed błędem klucza obcego P2003)
    const store = loadLocalStore();
    const cat = store.categories.find((c) => c.id === prod.categoryId);
    if (cat) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          imageUrl: cat.imageUrl || null,
          orderIndex: cat.orderIndex,
          isActive: true,
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          imageUrl: cat.imageUrl || null,
          orderIndex: cat.orderIndex,
          isActive: true,
        },
      });
    }

    // 2. Zapisz produkt
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description || "",
        composition: prod.composition || null,
        careGuide: prod.careGuide || null,
        sizeGuide: prod.sizeGuide || null,
        basePrice: prod.basePrice,
        promotionalPrice: prod.promotionalPrice || null,
        promotionStartedAt: prod.promotionStartedAt ? new Date(prod.promotionStartedAt) : null,
        lowestPrice30Days:
          prod.lowestPrice30Days !== undefined && prod.lowestPrice30Days !== null
            ? prod.lowestPrice30Days
            : null,
        isPromoted: Boolean(prod.isPromoted),
        isNew: Boolean(prod.isNew),
        isBestseller: Boolean(prod.isBestseller),
        isPublished: Boolean(prod.isPublished),
        isArchived: Boolean(prod.isArchived),
        isDemo: Boolean(prod.isDemo),
        categoryId: prod.categoryId,
      },
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description || "",
        composition: prod.composition || null,
        careGuide: prod.careGuide || null,
        sizeGuide: prod.sizeGuide || null,
        basePrice: prod.basePrice,
        promotionalPrice: prod.promotionalPrice || null,
        promotionStartedAt: prod.promotionStartedAt ? new Date(prod.promotionStartedAt) : null,
        lowestPrice30Days:
          prod.lowestPrice30Days !== undefined && prod.lowestPrice30Days !== null
            ? prod.lowestPrice30Days
            : null,
        isPromoted: Boolean(prod.isPromoted),
        isNew: Boolean(prod.isNew),
        isBestseller: Boolean(prod.isBestseller),
        isPublished: Boolean(prod.isPublished),
        isArchived: Boolean(prod.isArchived),
        isDemo: Boolean(prod.isDemo),
        categoryId: prod.categoryId,
      },
    });

    if (prod.variants && prod.variants.length > 0) {
      for (let i = 0; i < prod.variants.length; i++) {
        const v = prod.variants[i];
        const safeSku = v.sku?.trim()
          ? v.sku.trim()
          : `AURA-${prod.slug.toUpperCase().slice(0, 8)}-${v.size}-${i + 1}`;

        const variantData = {
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || null,
          sku: safeSku,
          stockQuantity: v.stockQuantity,
          reservedQuantity: v.reservedQuantity || 0,
          price: v.price !== undefined && v.price !== null ? v.price : null,
          promotionalPrice:
            v.promotionalPrice !== undefined && v.promotionalPrice !== null ? v.promotionalPrice : null,
          lowestPrice30Days:
            v.lowestPrice30Days !== undefined && v.lowestPrice30Days !== null ? v.lowestPrice30Days : null,
        };

        try {
          await prisma.productVariant.upsert({
            where: { id: v.id },
            update: variantData,
            create: {
              id: v.id,
              productId: prod.id,
              ...variantData,
            },
          });
        } catch (varErr: any) {
          if (varErr?.code === "P2002") {
            const fallbackSku = `${safeSku}-${Date.now().toString().slice(-4)}`;
            await prisma.productVariant.upsert({
              where: { id: v.id },
              update: { ...variantData, sku: fallbackSku },
              create: {
                id: v.id,
                productId: prod.id,
                ...variantData,
                sku: fallbackSku,
              },
            });
          } else {
            throw varErr;
          }
        }
      }
    }

    if (prod.images && prod.images.length > 0) {
      for (const im of prod.images) {
        await prisma.productImage.upsert({
          where: { id: im.id },
          update: {
            url: im.url,
            altText: im.altText || null,
            orderIndex: im.orderIndex,
            isPrimary: im.isPrimary,
          },
          create: {
            id: im.id,
            productId: prod.id,
            url: im.url,
            altText: im.altText || null,
            orderIndex: im.orderIndex,
            isPrimary: im.isPrimary,
          },
        });
      }
    }

    if (prod.priceHistory && prod.priceHistory.length > 0) {
      for (const ph of prod.priceHistory) {
        await prisma.priceHistory.upsert({
          where: { id: ph.id },
          update: {
            price: ph.price,
            isPromotion: ph.isPromotion,
            changedAt: new Date(ph.changedAt),
          },
          create: {
            id: ph.id,
            productId: prod.id,
            variantId: ph.variantId || null,
            price: ph.price,
            isPromotion: ph.isPromotion,
            changedAt: new Date(ph.changedAt),
          },
        });
      }
    }
  } catch (err: any) {
    console.error("Błąd synchronizacji produktu z bazą Neon Prisma:", err);
    if (await isDatabaseConnected()) {
      throw new Error(`Błąd trwałego zapisu produktu w bazie danych: ${err.message || err}`);
    }
  }
}

export async function saveProduct(productData: Partial<Product>): Promise<Product> {
  const store = loadLocalStore();
  const now = new Date().toISOString();

  // Sprawdzamy czy produkt z takim ID już istnieje w pamięci lub w bazie
  let existingProduct: Product | null = null;
  if (productData.id) {
    existingProduct = store.products.find((p) => p.id === productData.id) || null;
    if (!existingProduct && (await isDatabaseConnected())) {
      try {
        const dbProd = await prisma.product.findUnique({
          where: { id: productData.id },
          include: {
            images: true,
            variants: true,
            category: true,
            priceHistory: { orderBy: { changedAt: "desc" } },
          },
        });
        if (dbProd) {
          existingProduct = mapPrismaProduct(dbProd, store);
        }
      } catch (_) { }
    }
  }

  if (existingProduct) {
    // Istnieje -> aktualizujemy
    const existingImages = existingProduct.images || [];
    const finalImages =
      productData.images !== undefined
        ? productData.images.map((img, i) => ({
          id: img.id || `img-${existingProduct!.id}-${i}`,
          productId: existingProduct!.id,
          url: img.url,
          altText: img.altText || productData.name || existingProduct!.name,
          orderIndex: img.orderIndex !== undefined ? img.orderIndex : i,
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : i === 0,
        }))
        : existingImages;

    // Obsługa historii cen i dyrektywy Omnibus
    let updatedHistory: PriceHistoryRecord[] = existingProduct.priceHistory
      ? [...existingProduct.priceHistory]
      : [];

    const newBasePrice =
      productData.basePrice !== undefined ? Number(productData.basePrice) : existingProduct.basePrice;
    const basePriceChanged = Number(existingProduct.basePrice) !== newBasePrice;

    if (basePriceChanged && newBasePrice > 0) {
      const historyEntry: PriceHistoryRecord = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: existingProduct.id,
        price: newBasePrice,
        isPromotion: false,
        changedAt: now,
      };
      updatedHistory.unshift(historyEntry);
    }

    const isPromoted =
      productData.isPromoted !== undefined ? Boolean(productData.isPromoted) : existingProduct.isPromoted;

    let promotionalPrice =
      productData.promotionalPrice !== undefined
        ? productData.promotionalPrice
          ? Number(productData.promotionalPrice)
          : undefined
        : existingProduct.promotionalPrice;

    let promotionStartedAt = existingProduct.promotionStartedAt;
    let lowestPrice30Days = existingProduct.lowestPrice30Days;

    if (isPromoted && promotionalPrice) {
      // Czy to nowo uruchomiona promocja?
      if (!existingProduct.isPromoted || !promotionStartedAt) {
        promotionStartedAt = now;
        const calculated = calculateLowestPrice30Days(
          updatedHistory,
          promotionStartedAt,
          existingProduct.createdAt
        );
        lowestPrice30Days =
          productData.lowestPrice30Days !== undefined && productData.lowestPrice30Days !== null
            ? Number(productData.lowestPrice30Days)
            : (calculated ?? undefined);
      } else {
        // Trwająca promocja: zachowaj datę rozpoczęcia i cenę referencyjną
        if (productData.lowestPrice30Days !== undefined && productData.lowestPrice30Days !== null) {
          lowestPrice30Days = Number(productData.lowestPrice30Days);
        }
      }
    } else if (!isPromoted) {
      promotionalPrice = undefined;
      promotionStartedAt = undefined;
      lowestPrice30Days = undefined;
    }

    const updated: Product = {
      ...existingProduct,
      ...productData,
      basePrice: newBasePrice,
      promotionalPrice,
      isPromoted,
      promotionStartedAt,
      lowestPrice30Days,
      images: finalImages,
      priceHistory: updatedHistory,
      updatedAt: now,
    } as Product;

    const idx = store.products.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      store.products[idx] = updated;
    } else {
      store.products.unshift(updated);
    }
    saveLocalStore(store);
    await syncProductToPrisma(updated);
    return updated;
  }

  // Nowy produkt (lub upsert produktu o zadanym ID)
  const newId = productData.id || `prod-${Date.now()}`;
  const slug =
    productData.slug ||
    productData.name
      ?.toLowerCase()
      .replace(/ą/g, "a")
      .replace(/ć/g, "c")
      .replace(/ę/g, "e")
      .replace(/ł/g, "l")
      .replace(/ń/g, "n")
      .replace(/ó/g, "o")
      .replace(/ś/g, "s")
      .replace(/ź/g, "z")
      .replace(/ż/g, "z")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") ||
    `produkt-${Date.now()}`;

  const basePrice = Number(productData.basePrice || 0);
  const initialHistory: PriceHistoryRecord[] =
    basePrice > 0
      ? [
        {
          id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: newId,
          price: basePrice,
          isPromotion: false,
          changedAt: now,
        },
      ]
      : [];

  const isPromoted = Boolean(productData.isPromoted);
  let promotionalPrice = productData.promotionalPrice ? Number(productData.promotionalPrice) : undefined;
  let promotionStartedAt: string | undefined = undefined;
  let lowestPrice30Days: number | undefined = undefined;

  if (isPromoted && promotionalPrice) {
    promotionStartedAt = now;
    lowestPrice30Days =
      productData.lowestPrice30Days !== undefined && productData.lowestPrice30Days !== null
        ? Number(productData.lowestPrice30Days)
        : (calculateLowestPrice30Days(initialHistory, promotionStartedAt, now) ?? undefined);
  } else {
    promotionalPrice = undefined;
  }

  const newProduct: Product = {
    id: newId,
    name: productData.name || "Nowy produkt",
    slug,
    description: productData.description || "",
    composition: productData.composition || "",
    careGuide: productData.careGuide || "",
    sizeGuide: productData.sizeGuide || "",
    basePrice,
    promotionalPrice,
    promotionStartedAt,
    lowestPrice30Days,
    isPromoted,
    isNew: Boolean(productData.isNew),
    isBestseller: Boolean(productData.isBestseller),
    isPublished: productData.isPublished !== undefined ? productData.isPublished : true,
    isArchived: Boolean(productData.isArchived),
    isDemo: false,
    categoryId: productData.categoryId || store.categories[0]?.id || "cat-koszule",
    images: (productData.images || []).map((img, i) => ({
      id: img.id || `img-${newId}-${i}`,
      productId: newId,
      url: img.url,
      altText: img.altText || productData.name || "Zdjęcie produktu",
      orderIndex: img.orderIndex !== undefined ? img.orderIndex : i,
      isPrimary: img.isPrimary !== undefined ? img.isPrimary : i === 0,
    })),
    variants: productData.variants || [],
    priceHistory: initialHistory,
    createdAt: productData.createdAt || now,
    updatedAt: now,
  };

  store.products.unshift(newProduct);
  saveLocalStore(store);
  await syncProductToPrisma(newProduct);
  return newProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = loadLocalStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    store.products.splice(idx, 1);
    saveLocalStore(store);
  }

  if (isNeonConfigured()) {
    try {
      await prisma.product.delete({ where: { id } });
    } catch (e) {
      console.warn("Błąd usuwania produktu z Prisma:", e);
    }
  }
  return true;
}

export async function bulkUpdateProducts(
  ids: string[],
  updates: Partial<Product>
): Promise<Product[]> {
  const store = loadLocalStore();
  const now = new Date().toISOString();
  const updatedProducts: Product[] = [];

  store.products = store.products.map((p) => {
    if (ids.includes(p.id)) {
      const updated: Product = {
        ...p,
        ...updates,
        updatedAt: now,
      };
      updatedProducts.push(updated);
      return updated;
    }
    return p;
  });

  saveLocalStore(store);
  return updatedProducts;
}

export async function bulkDeleteProducts(ids: string[]): Promise<number> {
  const store = loadLocalStore();
  const beforeCount = store.products.length;
  store.products = store.products.filter((p) => !ids.includes(p.id));
  const deletedCount = beforeCount - store.products.length;
  saveLocalStore(store);
  return deletedCount;
}

export async function clearAllDemoData(): Promise<{ deletedCount: number }> {
  const store = loadLocalStore();
  const beforeCount = store.products.length;
  store.products = store.products.filter((p) => !p.isDemo);
  const deletedCount = beforeCount - store.products.length;
  saveLocalStore(store);
  return { deletedCount };
}

export async function resetDemoData(): Promise<void> {
  const store = loadLocalStore();
  store.products = initialProducts;
  store.categories = initialCategories;
  store.orders = initialOrders;
  store.settings = initialStoreSettings;
  saveLocalStore(store);
}

// ==========================================
// ZAMÓWIENIA (PRISMA + LOCAL FALLBACK)
// ==========================================
function mapPrismaOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.orderNumber,
    isTest: Boolean(dbOrder.isTest),
    customerId: dbOrder.customerId || undefined,
    customerFirstName: dbOrder.customerFirstName,
    customerLastName: dbOrder.customerLastName,
    customerEmail: dbOrder.customerEmail,
    customerPhone: dbOrder.customerPhone,
    shippingMethod: dbOrder.shippingMethod as ShippingMethod,
    parcelLockerCode: dbOrder.parcelLockerCode || undefined,
    shippingStreet: dbOrder.shippingStreet || undefined,
    shippingCity: dbOrder.shippingCity || undefined,
    shippingPostalCode: dbOrder.shippingPostalCode || undefined,
    paymentMethod: dbOrder.paymentMethod as PaymentMethod,
    paymentStatus: dbOrder.paymentStatus as PaymentStatus,
    paidAmount: dbOrder.paidAmount !== undefined && dbOrder.paidAmount !== null ? Number(dbOrder.paidAmount) : undefined,
    remainingAmount: dbOrder.remainingAmount !== undefined && dbOrder.remainingAmount !== null ? Number(dbOrder.remainingAmount) : undefined,
    payuOrderId: dbOrder.payuOrderId || undefined,
    accessKey: dbOrder.accessKey || undefined,
    fulfillmentStatus: dbOrder.fulfillmentStatus as FulfillmentStatus,
    trackingNumber: dbOrder.trackingNumber || undefined,
    subtotalAmount: Number(dbOrder.subtotalAmount),
    shippingCost: Number(dbOrder.shippingCost),
    totalAmount: Number(dbOrder.totalAmount),
    customerNotes: dbOrder.customerNotes || undefined,
    adminNotes: dbOrder.adminNotes || undefined,
    reservedUntil: dbOrder.reservedUntil
      ? dbOrder.reservedUntil instanceof Date
        ? dbOrder.reservedUntil.toISOString()
        : String(dbOrder.reservedUntil)
      : undefined,
    items: (dbOrder.items || []).map((it: any) => ({
      id: it.id,
      orderId: it.orderId,
      variantId: it.variantId || undefined,
      productNameSnapshot: it.productNameSnapshot,
      variantSnapshot: it.variantSnapshot,
      unitPriceSnapshot: Number(it.unitPriceSnapshot),
      quantity: it.quantity,
      totalSnapshot: Number(it.totalSnapshot),
      productImageUrl: it.productImageUrl || undefined,
    })),
    createdAt:
      dbOrder.createdAt instanceof Date
        ? dbOrder.createdAt.toISOString()
        : String(dbOrder.createdAt),
    updatedAt:
      dbOrder.updatedAt instanceof Date
        ? dbOrder.updatedAt.toISOString()
        : String(dbOrder.updatedAt),
  };
}

export async function syncOrderToPrisma(order: Order): Promise<void> {
  if (!isNeonConfigured()) return;
  try {
    const safeShipping = ["INPOST_LOCKER", "COURIER", "LOCAL_PICKUP"].includes(order.shippingMethod)
      ? (order.shippingMethod as any)
      : "INPOST_LOCKER";
    const safePaymentMethod = ["PRZELEWY24", "BLIK", "TRADITIONAL_TRANSFER"].includes(order.paymentMethod)
      ? (order.paymentMethod as any)
      : "BLIK";
    const safePaymentStatus = ["PENDING", "PAID", "FAILED", "REFUNDED"].includes(order.paymentStatus)
      ? (order.paymentStatus as any)
      : "PENDING";
    const safeFulfillmentStatus = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(
      order.fulfillmentStatus
    )
      ? (order.fulfillmentStatus as any)
      : "NEW";

    // 1. Sprawdź które warianty istnieją w bazie, by nie naruszyć klucza obcego P2003
    const safeItems = [];
    for (const it of order.items || []) {
      let validVariantId: string | null = null;
      if (it.variantId) {
        try {
          const v = await prisma.productVariant.findUnique({
            where: { id: it.variantId },
            select: { id: true },
          });
          if (v) validVariantId = it.variantId;
        } catch (_) { }
      }

      safeItems.push({
        id: it.id || `item-${order.id}-${Math.random().toString(36).slice(2, 7)}`,
        variantId: validVariantId,
        productNameSnapshot: it.productNameSnapshot || "Produkt",
        variantSnapshot: it.variantSnapshot || "Standard",
        unitPriceSnapshot: Number(it.unitPriceSnapshot || 0),
        quantity: Number(it.quantity || 1),
        totalSnapshot: Number(it.totalSnapshot || 0),
        productImageUrl: it.productImageUrl || null,
      });
    }

    // 2. Bezpieczne powiązanie z kontem klientki (weryfikacja klucza obcego P2003)
    let validCustomerId: string | null = null;
    if (order.customerId) {
      try {
        const c = await prisma.customerAccount.findUnique({
          where: { id: order.customerId },
          select: { id: true },
        });
        if (c) validCustomerId = c.id;
      } catch (_) {}
    }
    if (!validCustomerId && order.customerEmail) {
      try {
        const c = await prisma.customerAccount.findUnique({
          where: { email: order.customerEmail.trim().toLowerCase() },
          select: { id: true },
        });
        if (c) validCustomerId = c.id;
      } catch (_) {}
    }

    // 3. Upsert zamówienia
    await prisma.order.upsert({
      where: { id: order.id },
      update: {
        orderNumber: order.orderNumber,
        isTest: Boolean(order.isTest),
        customerId: validCustomerId,
        customerFirstName: order.customerFirstName,
        customerLastName: order.customerLastName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingMethod: safeShipping,
        parcelLockerCode: order.parcelLockerCode || null,
        shippingStreet: order.shippingStreet || null,
        shippingCity: order.shippingCity || null,
        shippingPostalCode: order.shippingPostalCode || null,
        paymentMethod: safePaymentMethod,
        paymentStatus: safePaymentStatus,
        fulfillmentStatus: safeFulfillmentStatus,
        trackingNumber: order.trackingNumber || null,
        subtotalAmount: Number(order.subtotalAmount || 0),
        shippingCost: Number(order.shippingCost || 0),
        totalAmount: Number(order.totalAmount || 0),
        customerNotes: order.customerNotes || null,
        adminNotes: order.adminNotes || null,
        reservedUntil: order.reservedUntil ? new Date(order.reservedUntil) : null,
        updatedAt: new Date(order.updatedAt || Date.now()),
      },
      create: {
        id: order.id,
        orderNumber: order.orderNumber,
        isTest: Boolean(order.isTest),
        customerId: validCustomerId,
        customerFirstName: order.customerFirstName,
        customerLastName: order.customerLastName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingMethod: safeShipping,
        parcelLockerCode: order.parcelLockerCode || null,
        shippingStreet: order.shippingStreet || null,
        shippingCity: order.shippingCity || null,
        shippingPostalCode: order.shippingPostalCode || null,
        paymentMethod: safePaymentMethod,
        paymentStatus: safePaymentStatus,
        fulfillmentStatus: safeFulfillmentStatus,
        trackingNumber: order.trackingNumber || null,
        subtotalAmount: Number(order.subtotalAmount || 0),
        shippingCost: Number(order.shippingCost || 0),
        totalAmount: Number(order.totalAmount || 0),
        customerNotes: order.customerNotes || null,
        adminNotes: order.adminNotes || null,
        reservedUntil: order.reservedUntil ? new Date(order.reservedUntil) : null,
        createdAt: new Date(order.createdAt || Date.now()),
        updatedAt: new Date(order.updatedAt || Date.now()),
        items: {
          create: safeItems.map((si) => ({
            id: si.id,
            variantId: si.variantId,
            productNameSnapshot: si.productNameSnapshot,
            variantSnapshot: si.variantSnapshot,
            unitPriceSnapshot: si.unitPriceSnapshot,
            quantity: si.quantity,
            totalSnapshot: si.totalSnapshot,
            productImageUrl: si.productImageUrl,
          })),
        },
      },
    });

    // 3. Upewnij się, że pozycje istnieją w bazie
    for (const si of safeItems) {
      await prisma.orderItem.upsert({
        where: { id: si.id },
        update: {
          productNameSnapshot: si.productNameSnapshot,
          variantSnapshot: si.variantSnapshot,
          unitPriceSnapshot: si.unitPriceSnapshot,
          quantity: si.quantity,
          totalSnapshot: si.totalSnapshot,
          productImageUrl: si.productImageUrl,
        },
        create: {
          id: si.id,
          orderId: order.id,
          variantId: si.variantId,
          productNameSnapshot: si.productNameSnapshot,
          variantSnapshot: si.variantSnapshot,
          unitPriceSnapshot: si.unitPriceSnapshot,
          quantity: si.quantity,
          totalSnapshot: si.totalSnapshot,
          productImageUrl: si.productImageUrl,
        },
      });
    }
  } catch (err) {
    console.warn("Ostrzeżenie: synchronizacja zamówienia z Prisma:", err);
  }
}

export async function getAllOrders(): Promise<Order[]> {
  const store = loadLocalStore();

  if (await isDatabaseConnected()) {
    try {
      const dbOrders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });

      if (dbOrders && dbOrders.length > 0) {
        const mapped = dbOrders.map(mapPrismaOrder);
        store.orders = mapped;
        return mapped;
      } else if (store.orders.length > 0) {
        // Baza połączona, ale jeszcze bez zamówień (np. świeża baza) -> zsynchronizuj zamówienia demonstracyjne
        for (const o of store.orders) {
          await syncOrderToPrisma(o);
        }
        const seeded = await prisma.order.findMany({
          include: { items: true },
          orderBy: { createdAt: "desc" },
        });
        if (seeded && seeded.length > 0) {
          const mapped = seeded.map(mapPrismaOrder);
          store.orders = mapped;
          return mapped;
        }
      }
    } catch (err) {
      console.warn("Ostrzeżenie: Błąd pobierania zamówień z bazy Prisma:", err);
    }
  }

  return store.orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const store = loadLocalStore();

  if (await isDatabaseConnected()) {
    try {
      const dbOrder = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
        include: { items: true },
      });
      if (dbOrder) {
        return mapPrismaOrder(dbOrder);
      }
    } catch (e) {
      console.warn("Błąd wyszukiwania zamówienia w bazie Prisma:", e);
    }
  }

  return store.orders.find((o) => o.id === id || o.orderNumber === id) || null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  return getOrderById(orderNumber);
}

export async function createOrder(
  orderInput: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">
): Promise<Order> {
  const store = loadLocalStore();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `AURA-${dateStr}-${randomSuffix}`;
  const now = new Date().toISOString();
  const newId = `ord-${Date.now()}`;

  // Weryfikacja i obniżenie stanu magazynowego na serwerze (wyłącznie dla rzeczywistej sprzedaży produkcyjnej)
  if (!orderInput.isTest) {
    for (const item of orderInput.items) {
      if (item.variantId) {
        for (const prod of store.products) {
          const variant = prod.variants?.find((v) => v.id === item.variantId);
          if (variant) {
            if (variant.stockQuantity < item.quantity) {
              throw new Error(
                `Brak wystarczającej ilości towaru: ${prod.name} (${variant.size}, ${variant.color}). Dostępne: ${variant.stockQuantity} szt.`
              );
            }
            variant.stockQuantity -= item.quantity;
          }
        }
        if (await isDatabaseConnected()) {
          try {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          } catch (_) { }
        }
      }
    }
  }

  const newOrder: Order = {
    ...orderInput,
    id: newId,
    orderNumber,
    accessKey: orderInput.accessKey || crypto.randomBytes(16).toString("hex"),
    createdAt: now,
    updatedAt: now,
  };

  // Rezerwacja/wykorzystanie kodu rabatowego
  const appliedCode = orderInput.couponCode?.trim().toUpperCase();
  if (appliedCode) {
    // 1. Sprawdzenie kodu powitalnego
    for (const cust of store.customers || []) {
      if (cust.welcomeDiscountCode?.trim().toUpperCase() === appliedCode) {
        cust.welcomeDiscountUsed = true;
        cust.welcomeDiscountUsedAt = now;
        cust.welcomeDiscountUsedInOrderId = newId;
        if (await isDatabaseConnected()) {
          try {
            await prisma.customerAccount.update({
              where: { id: cust.id },
              data: {
                welcomeDiscountUsed: true,
                welcomeDiscountUsedAt: new Date(),
                welcomeDiscountUsedInOrderId: newId,
              },
            });
          } catch (_) {}
        }
      }
    }
    // 2. Sprawdzenie kodu indywidualnego jednorazowego
    for (const d of (store as any).individualDiscountsList || []) {
      if (d.code?.trim().toUpperCase() === appliedCode && !d.isPermanent) {
        d.isUsed = true;
        d.usedAt = now;
        d.usedInOrderId = newId;
        if (await isDatabaseConnected()) {
          try {
            await prisma.individualDiscount.update({
              where: { id: d.id },
              data: {
                isUsed: true,
                usedAt: new Date(),
                usedInOrderId: newId,
              },
            });
          } catch (_) {}
        }
      }
    }
  }

  store.orders.unshift(newOrder);
  saveLocalStore(store);

  // Trwały zapis w bazie Neon Postgres
  await syncOrderToPrisma(newOrder);

  return newOrder;
}

export async function updateOrderAdmin(
  orderId: string,
  updates: {
    fulfillmentStatus?: FulfillmentStatus;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    adminNotes?: string;
    paidAt?: string;
    paidAmount?: number;
    remainingAmount?: number;
    payuOrderId?: string;
    paymentOperator?: string;
    items?: OrderItem[];
    totalAmount?: number;
    subtotalAmount?: number;
    shippingCost?: number;
  }
): Promise<Order> {
  const store = loadLocalStore();
  const now = new Date().toISOString();

  // 1. Pobierz aktualne zamówienie z bazy Neon lub lokalnego store
  let existingOrder: Order | null = null;
  if (await isDatabaseConnected()) {
    try {
      const dbOrder = await prisma.order.findFirst({
        where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
        include: { items: true },
      });
      if (dbOrder) {
        existingOrder = mapPrismaOrder(dbOrder);
      }
    } catch (err) {
      console.warn("Błąd pobierania zamówienia z bazy przed aktualizacją:", err);
    }
  }

  if (!existingOrder) {
    existingOrder =
      store.orders.find((o) => o.id === orderId || o.orderNumber === orderId) || null;
  }

  if (!existingOrder) {
    throw new Error(`Zamówienie "${orderId}" nie zostało odnalezione w bazie danych.`);
  }

  const prevFulfillmentStatus = existingOrder.fulfillmentStatus;
  const newFulfillmentStatus = updates.fulfillmentStatus || prevFulfillmentStatus;
  const prevPaymentStatus = existingOrder.paymentStatus;
  const newPaymentStatus = updates.paymentStatus || prevPaymentStatus;

  // 2. Obsługa stanów magazynowych:
  // Anulowanie zamówienia: przywróć stany magazynowe w bazie i w pamięci (tylko raz, dla rzeczywistych zamówień produkcyjnych)
  if (newFulfillmentStatus === "CANCELLED" && prevFulfillmentStatus !== "CANCELLED") {
    if (!existingOrder.isTest) {
      for (const item of existingOrder.items) {
        if (item.variantId) {
          for (const prod of store.products) {
            const variant = prod.variants?.find((v) => v.id === item.variantId);
            if (variant) {
              variant.stockQuantity += item.quantity;
            }
          }
          if (await isDatabaseConnected()) {
            try {
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: { stockQuantity: { increment: item.quantity } },
              });
            } catch (e) {
              console.warn("Błąd przywracania stanu magazynowego po anulowaniu:", e);
            }
          }
        }
      }
    }

    // Zwolnienie kodu rabatowego, by klientka nie utraciła zniżki po anulowanym/nieopłaconym zamówieniu
    // Wykonywane dla danego zamówienia (zarówno testowego jak i produkcyjnego)
    const cancelledCode = existingOrder.couponCode?.trim().toUpperCase();
    if (cancelledCode) {
      for (const cust of store.customers || []) {
        if (
          cust.welcomeDiscountCode?.trim().toUpperCase() === cancelledCode &&
          (cust.welcomeDiscountUsedInOrderId === existingOrder.id ||
            cust.welcomeDiscountUsedInOrderId === existingOrder.orderNumber)
        ) {
          cust.welcomeDiscountUsed = false;
          cust.welcomeDiscountUsedAt = undefined;
          cust.welcomeDiscountUsedInOrderId = undefined;
          if (await isDatabaseConnected()) {
            try {
              await prisma.customerAccount.update({
                where: { id: cust.id },
                data: {
                  welcomeDiscountUsed: false,
                  welcomeDiscountUsedAt: null,
                  welcomeDiscountUsedInOrderId: null,
                },
              });
            } catch (_) {}
          }
        }
      }
      for (const d of (store as any).individualDiscountsList || []) {
        if (
          d.code?.trim().toUpperCase() === cancelledCode &&
          (d.usedInOrderId === existingOrder.id || d.usedInOrderId === existingOrder.orderNumber) &&
          !d.isPermanent
        ) {
          d.isUsed = false;
          d.usedAt = undefined;
          d.usedInOrderId = undefined;
          if (await isDatabaseConnected()) {
            try {
              await prisma.individualDiscount.update({
                where: { id: d.id },
                data: {
                  isUsed: false,
                  usedAt: null,
                  usedInOrderId: null,
                },
              });
            } catch (_) {}
          }
        }
      }
    }
  } else if (prevFulfillmentStatus === "CANCELLED" && newFulfillmentStatus !== "CANCELLED") {
    // Przywrócenie z anulowanego: ponowne zarezerwowanie stanów
    for (const item of existingOrder.items) {
      if (item.variantId) {
        for (const prod of store.products) {
          const variant = prod.variants?.find((v) => v.id === item.variantId);
          if (variant && variant.stockQuantity >= item.quantity) {
            variant.stockQuantity -= item.quantity;
          }
        }
        if (await isDatabaseConnected()) {
          try {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          } catch (e) {
            console.warn("Błąd ponownego rezerwowania stanu:", e);
          }
        }
      }
    }
  }

  // 3. Spójne i atomowe ustalenie paidAt (nigdy nie nadpisuje pierwotnej daty wpłaty)
  let finalPaidAt = existingOrder.paidAt;
  if (newPaymentStatus === "PAID" && !finalPaidAt) {
    finalPaidAt = updates.paidAt || now;
  }

  // 4. Utwórz zaktualizowany obiekt zamówienia
  const updatedOrder: Order = {
    ...existingOrder,
    fulfillmentStatus: newFulfillmentStatus,
    paymentStatus: newPaymentStatus,
    paidAt: finalPaidAt,
    paidAmount: updates.paidAmount !== undefined ? updates.paidAmount : existingOrder.paidAmount,
    remainingAmount: updates.remainingAmount !== undefined ? updates.remainingAmount : existingOrder.remainingAmount,
    items: updates.items !== undefined ? updates.items : existingOrder.items,
    totalAmount: updates.totalAmount !== undefined ? updates.totalAmount : existingOrder.totalAmount,
    subtotalAmount: updates.subtotalAmount !== undefined ? updates.subtotalAmount : existingOrder.subtotalAmount,
    shippingCost: updates.shippingCost !== undefined ? updates.shippingCost : existingOrder.shippingCost,
    trackingNumber:
      updates.trackingNumber !== undefined
        ? updates.trackingNumber
        : existingOrder.trackingNumber,
    adminNotes:
      updates.adminNotes !== undefined ? updates.adminNotes : existingOrder.adminNotes,
    updatedAt: now,
  };

  // 4. Trwały zapis w bazie PostgreSQL / Neon
  if (await isDatabaseConnected()) {
    try {
      const safePaymentStatus = ["PENDING", "PAID", "FAILED", "REFUNDED"].includes(newPaymentStatus)
        ? (newPaymentStatus as any)
        : undefined;
      const safeFulfillmentStatus = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(
        newFulfillmentStatus
      )
        ? (newFulfillmentStatus as any)
        : undefined;

      const updateData: any = {
        updatedAt: new Date(now),
      };
      if (safeFulfillmentStatus) updateData.fulfillmentStatus = safeFulfillmentStatus;
      if (safePaymentStatus) updateData.paymentStatus = safePaymentStatus;
      if (updates.trackingNumber !== undefined) updateData.trackingNumber = updates.trackingNumber || null;
      if (updates.adminNotes !== undefined) updateData.adminNotes = updates.adminNotes || null;

      const existsInDb = await prisma.order.findUnique({
        where: { id: existingOrder.id },
        select: { id: true },
      });

      if (existsInDb) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: updateData,
        });
      } else {
        await syncOrderToPrisma(updatedOrder);
      }
    } catch (err: any) {
      console.error("Błąd trwałego zapisu zmiany statusu w Prisma:", err);
      throw new Error(`Błąd trwałego zapisu w bazie danych: ${err.message}`);
    }
  }

  // 5. Aktualizacja pamięci procesu
  const storeIdx = store.orders.findIndex(
    (o) => o.id === existingOrder!.id || o.orderNumber === existingOrder!.orderNumber
  );
  if (storeIdx !== -1) {
    store.orders[storeIdx] = updatedOrder;
  } else {
    store.orders.unshift(updatedOrder);
  }
  saveLocalStore(store);

  // 6. Nagrody polecające
  if (updatedOrder.fulfillmentStatus === "DELIVERED" && prevFulfillmentStatus !== "DELIVERED") {
    try {
      await awardReferralRewardOnDelivered(updatedOrder);
    } catch (e) {
      console.error("Błąd przyznawania nagrody polecającej:", e);
    }
  } else if (
    (updatedOrder.fulfillmentStatus === "CANCELLED" || updatedOrder.paymentStatus === "REFUNDED") &&
    prevFulfillmentStatus === "DELIVERED"
  ) {
    try {
      await revokeReferralRewardOnRefund(updatedOrder.id);
    } catch (e) {
      console.error("Błąd cofania nagrody polecającej:", e);
    }
  }

  // 7. Automatyczne powiadomienia e-mail dla klientki o wysyłce lub anulowaniu
  if (updatedOrder.fulfillmentStatus === "SHIPPED" && prevFulfillmentStatus !== "SHIPPED") {
    try {
      const { sendOrderShippedCustomerEmail } = await import("./email-service");
      await sendOrderShippedCustomerEmail(
        updatedOrder,
        updates.trackingNumber || updatedOrder.trackingNumber || "",
        updatedOrder.shippingMethod === "COURIER" ? "Kurier InPost" : "Paczkomaty InPost"
      );
    } catch (err) {
      console.error("Błąd wysyłki e-mail o nadaniu paczki:", err);
    }
  } else if (updatedOrder.fulfillmentStatus === "CANCELLED" && prevFulfillmentStatus !== "CANCELLED") {
    try {
      const { sendOrderCancelledCustomerEmail } = await import("./email-service");
      await sendOrderCancelledCustomerEmail(updatedOrder, updates.adminNotes);
    } catch (err) {
      console.error("Błąd wysyłki e-mail o anulowaniu zamówienia:", err);
    }
  }

  return updatedOrder;
}

export async function bulkUpdateOrders(
  orderIds: string[],
  updates: {
    fulfillmentStatus?: FulfillmentStatus;
    paymentStatus?: PaymentStatus;
  }
): Promise<Order[]> {
  const updatedOrders: Order[] = [];
  for (const id of orderIds) {
    try {
      const updated = await updateOrderAdmin(id, updates);
      updatedOrders.push(updated);
    } catch (err) {
      console.warn(`Błąd masowej aktualizacji zamówienia ${id}:`, err);
    }
  }
  return updatedOrders;
}

/**
 * Zwalnianie rezerwacji produktów i kodu rabatowego po wygaśnięciu nieopłaconego zamówienia.
 * Wywoływane dla konkretnego zamówienia lub wszystkich przeterminowanych zamówień w statusie PENDING/FAILED.
 */
export async function releaseExpiredOrderReservations(targetOrderId?: string): Promise<{
  releasedCount: number;
  releasedOrders: string[];
}> {
  const store = loadLocalStore();
  const now = new Date();
  const releasedOrders: string[] = [];

  const candidates = store.orders.filter((o) => {
    if (o.fulfillmentStatus === "CANCELLED" || o.paymentStatus === "PAID") return false;
    if (targetOrderId) return o.id === targetOrderId || o.orderNumber === targetOrderId;
    if (o.reservedUntil) {
      const exp = new Date(o.reservedUntil);
      return !isNaN(exp.getTime()) && exp < now;
    }
    return false;
  });

  for (const order of candidates) {
    await updateOrderAdmin(order.id, {
      fulfillmentStatus: "CANCELLED",
      adminNotes: `${order.adminNotes ? order.adminNotes + " | " : ""}Rezerwacja wygasła — automatycznie przywrócono stany magazynowe i zwolniono kod rabatowy.`,
    });
    releasedOrders.push(order.orderNumber);
  }

  return {
    releasedCount: releasedOrders.length,
    releasedOrders,
  };
}

// Klientka edytuje zamówienie (dokupuje lub zmienia pozycje przed akceptacją butiku)
export async function editOrderCustomer(
  orderId: string,
  newItems: OrderItem[]
): Promise<Order> {
  const store = loadLocalStore();
  let order: Order | null = null;

  if (await isDatabaseConnected()) {
    try {
      const dbOrder = await prisma.order.findFirst({
        where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
        include: { items: true },
      });
      if (dbOrder) order = mapPrismaOrder(dbOrder);
    } catch (_) { }
  }

  if (!order) {
    order = store.orders.find((o) => o.id === orderId) || null;
  }
  if (!order) throw new Error("Nie znaleziono zamówienia");

  // Edycja dozwolona tylko dopóki zamówienie ma status "NEW" (przed akceptacją przez właścicielkę)
  if (order.fulfillmentStatus !== "NEW") {
    throw new Error(
      "Zamówienie zostało już zaakceptowane i przekazane do realizacji przez butik. Zmiany nie są już możliwe."
    );
  }

  if (!newItems || newItems.length === 0) {
    throw new Error("Zamówienie musi zawierać co najmniej jeden produkt.");
  }

  // Przeliczanie sum
  const subtotal = newItems.reduce((acc, item) => acc + item.totalSnapshot, 0);
  const freeThreshold = store.settings.freeShippingFrom || 300;

  // Jeśli kwota przekracza próg, darmowa dostawa
  let shippingCost = order.shippingCost;
  if (subtotal >= freeThreshold) {
    shippingCost = 0;
  } else if (order.shippingMethod === "LOCAL_PICKUP") {
    shippingCost = 0;
  } else if (shippingCost === 0) {
    shippingCost = order.shippingMethod === "INPOST_LOCKER"
      ? (store.settings.inpostLockerCost || 13)
      : (store.settings.courierCost || 15);
  }

  const newTotal = Math.round((subtotal + shippingCost) * 100) / 100;

  // Rozliczenie dotychczasowych potwierdzonych wpłat
  const confirmedPaid =
    order.paidAmount !== undefined && order.paidAmount > 0
      ? order.paidAmount
      : (order.paymentStatus === "PAID" ? order.totalAmount : 0);

  const newRemaining = Math.max(0, Math.round((newTotal - confirmedPaid) * 100) / 100);

  let newPaymentStatus: PaymentStatus = order.paymentStatus;
  if (confirmedPaid > 0) {
    if (newRemaining > 0) {
      newPaymentStatus = "PARTIALLY_PAID";
    } else {
      newPaymentStatus = "PAID";
    }
  } else {
    newPaymentStatus = "PENDING";
  }

  // Weryfikacja i aktualizacja magazynu: wyłącznie dla zamówień rzeczywistych produkcyjnych!
  // Testy sandbox (isTest === true) NIGDY nie modyfikują stanów magazynowych butiku
  if (!order.isTest) {
    for (const newItem of newItems) {
      const prevItem = (order.items || []).find(
        (it) => it.variantId && it.variantId === newItem.variantId
      );
      const prevQty = prevItem ? prevItem.quantity : 0;
      const diffQty = newItem.quantity - prevQty;

      if (diffQty > 0 && newItem.variantId) {
        // Zmniejsz stan magazynowy o nowo dodane sztuki
        for (const prod of store.products) {
          const variant = prod.variants?.find((v) => v.id === newItem.variantId);
          if (variant) {
            variant.stockQuantity = Math.max(0, variant.stockQuantity - diffQty);
          }
        }
        if (await isDatabaseConnected()) {
          try {
            await prisma.productVariant.update({
              where: { id: newItem.variantId },
              data: { stockQuantity: { decrement: diffQty } },
            });
          } catch (e) {
            console.warn("Błąd pomniejszania stanu magazynowego po edycji zamówienia:", e);
          }
        }
      }
    }
  }

  const updatedOrder: Order = {
    ...order,
    items: newItems,
    subtotalAmount: subtotal,
    shippingCost,
    totalAmount: newTotal,
    paidAmount: confirmedPaid > 0 ? confirmedPaid : order.paidAmount,
    remainingAmount: newRemaining,
    paymentStatus: newPaymentStatus,
    updatedAt: new Date().toISOString(),
  };

  const idx = store.orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    store.orders[idx] = updatedOrder;
  }
  saveLocalStore(store);

  if (await isDatabaseConnected()) {
    try {
      await syncOrderToPrisma(updatedOrder);
    } catch (e) {
      console.warn("Błąd synchronizacji edycji zamówienia z bazą:", e);
    }
  }

  return updatedOrder;
}

// Zgłoszenie zwrotu produktów przez klientkę
export async function createReturnRequest(
  orderId: string,
  data: {
    items: {
      orderItemId: string;
      productName: string;
      variantSnapshot: string;
      quantity: number;
      reason: string;
      unitPrice: number;
    }[];
    returnMethod: "INPOST_LOCKER" | "COURIER" | "IN_PERSON";
    customerNote?: string;
  }
): Promise<ReturnRequest> {
  const store = loadLocalStore();
  const order = store.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) throw new Error("Nie znaleziono zamówienia.");

  // Warunek 1: Zwrot wyłącznie dla w pełni opłaconych zamówień!
  if (order.paymentStatus !== "PAID") {
    throw new Error("Zgłoszenie zwrotu jest możliwe dopiero po potwierdzeniu pełnej zapłaty za zamówienie.");
  }

  // Warunek 2: Sprawdzenie ilości zwracanych sztuk
  if (!order.returns) {
    order.returns = [];
  }

  for (const item of data.items) {
    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`Nieprawidłowa liczba zwracanych sztuk dla ${item.productName}.`);
    }

    const originalOrderItem = order.items.find((oi) => oi.id === item.orderItemId);
    if (!originalOrderItem) {
      throw new Error(`Produkt ${item.productName} nie znajduje się w tym zamówieniu.`);
    }

    // Oblicz już zwrócone sztuki w aktywnych zwrotach (nieodrzuconych)
    const alreadyReturnedQty = order.returns
      .filter((r) => r.status !== "REJECTED")
      .reduce((sum, ret) => {
        const retItem = ret.items.find((ri) => ri.orderItemId === item.orderItemId);
        return sum + (retItem ? retItem.quantity : 0);
      }, 0);

    const availableToReturn = originalOrderItem.quantity - alreadyReturnedQty;
    if (item.quantity > availableToReturn) {
      throw new Error(
        `Nie możesz zgłosić ${item.quantity} szt. produktu ${item.productName}. Zakupiono ${originalOrderItem.quantity} szt., z czego wcześniej zgłoszono już ${alreadyReturnedQty} szt.`
      );
    }
  }

  const returnId = `ZWR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Generujemy zwrotny kod nadania InPost dla wygody klientki
  const returnTrackingNumber = data.returnMethod === "INPOST_LOCKER"
    ? `ZWROT-${Math.floor(1000000000 + Math.random() * 9000000000)}`
    : undefined;

  const returnRequest: ReturnRequest = {
    id: returnId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    createdAt: new Date().toISOString(),
    status: "PENDING",
    items: data.items,
    returnMethod: data.returnMethod,
    returnTrackingNumber,
    customerNote: data.customerNote || "",
  };

  order.returns.unshift(returnRequest);
  order.updatedAt = new Date().toISOString();

  saveLocalStore(store);

  // Wysłanie e-maila z potwierdzeniem zgłoszenia zwrotu i instrukcją odesłania
  try {
    const { sendReturnRequestedCustomerEmail } = await import("./email-service");
    await sendReturnRequestedCustomerEmail(returnRequest, order);
  } catch (err) {
    console.error("Błąd wysyłki e-mail o zgłoszeniu zwrotu:", err);
  }

  return returnRequest;
}

// ==========================================
// USTAWIENIA SKLEPU
// ==========================================
export async function getStoreSettings(options?: { forAdminClient?: boolean }): Promise<StoreSettings> {
  const store = loadLocalStore();
  let settings: StoreSettings = { ...store.settings };

  // Sprawdzamy trwały zapis w bazie danych PostgreSQL / Neon
  if (await isDatabaseConnected()) {
    try {
      const dbSettings = await prisma.storeSettings.findUnique({
        where: { id: "default" },
      });
      if (dbSettings) {
        let visualBannerDraft = settings.visualBannerDraft;
        let visualBannerPublished = settings.visualBannerPublished;

        if (dbSettings.visualBannerDraft) {
          try {
            visualBannerDraft = typeof dbSettings.visualBannerDraft === "string"
              ? JSON.parse(dbSettings.visualBannerDraft)
              : dbSettings.visualBannerDraft;
          } catch (e) {
            console.warn("Błąd parsowania visualBannerDraft z bazy:", e);
          }
        }

        if (dbSettings.visualBannerPublished) {
          try {
            visualBannerPublished = typeof dbSettings.visualBannerPublished === "string"
              ? JSON.parse(dbSettings.visualBannerPublished)
              : dbSettings.visualBannerPublished;
          } catch (e) {
            console.warn("Błąd parsowania visualBannerPublished z bazy:", e);
          }
        }

        settings = {
          ...settings,
          boutiqueName: dbSettings.boutiqueName || settings.boutiqueName,
          companyName: dbSettings.companyName || settings.companyName,
          nip: dbSettings.nip || settings.nip,
          regon: dbSettings.regon || settings.regon,
          registeredAddress: dbSettings.registeredAddress || settings.registeredAddress,
          returnAddress: dbSettings.returnAddress || settings.returnAddress,
          address: dbSettings.address || settings.address,
          phone: dbSettings.phone || settings.phone,
          email: dbSettings.email || settings.email,
          openingHours: dbSettings.openingHours || settings.openingHours,
          announcementBarText: dbSettings.announcementBarText || settings.announcementBarText,
          heroHeadline: dbSettings.heroHeadline || settings.heroHeadline,
          heroSubheadline: dbSettings.heroSubheadline || settings.heroSubheadline,
          heroImageUrl: dbSettings.heroImageUrl || settings.heroImageUrl,
          freeShippingFrom: Number(dbSettings.freeShippingFrom) || settings.freeShippingFrom,
          courierCost: Number(dbSettings.courierCost) || settings.courierCost,
          inpostLockerCost: Number(dbSettings.inpostLockerCost) || settings.inpostLockerCost,
          localPickupCost: Number(dbSettings.localPickupCost) || settings.localPickupCost,
          termsAndConditions: dbSettings.termsAndConditions || settings.termsAndConditions,
          privacyPolicy: dbSettings.privacyPolicy || settings.privacyPolicy,
          visualBannerDraft,
          visualBannerPublished,
          bannerVersion: dbSettings.bannerVersion || settings.bannerVersion || 1,
          bannerPublishedAt: dbSettings.bannerPublishedAt ? dbSettings.bannerPublishedAt.toISOString() : settings.bannerPublishedAt,
          smtpHost: dbSettings.smtpHost ?? settings.smtpHost,
          smtpPort: dbSettings.smtpPort ?? settings.smtpPort,
          smtpUser: dbSettings.smtpUser ?? settings.smtpUser,
          smtpPassword: (dbSettings.smtpPassword && dbSettings.smtpPassword.trim()) ? dbSettings.smtpPassword.trim() : settings.smtpPassword,
          smtpSecure: dbSettings.smtpSecure !== null && dbSettings.smtpSecure !== undefined ? dbSettings.smtpSecure : settings.smtpSecure,
          emailSenderName: dbSettings.emailSenderName ?? settings.emailSenderName,
          emailSenderAddress: dbSettings.emailSenderAddress ?? settings.emailSenderAddress,
          emailProvider: (dbSettings.emailProvider as "smtp" | "resend") ?? settings.emailProvider,
          resendApiKey: (dbSettings.resendApiKey && dbSettings.resendApiKey.trim()) ? dbSettings.resendApiKey.trim() : settings.resendApiKey,
          payuPosId: dbSettings.payuPosId ?? settings.payuPosId,
          payuSecondKey: (dbSettings.payuSecondKey && dbSettings.payuSecondKey.trim()) ? dbSettings.payuSecondKey.trim() : settings.payuSecondKey,
          payuClientId: dbSettings.payuClientId ?? settings.payuClientId,
          payuClientSecret: (dbSettings.payuClientSecret && dbSettings.payuClientSecret.trim()) ? dbSettings.payuClientSecret.trim() : settings.payuClientSecret,
          payuSandbox: dbSettings.payuSandbox !== null && dbSettings.payuSandbox !== undefined ? dbSettings.payuSandbox : settings.payuSandbox,
        };

        // Synchronizujemy stan lokalny/pamięci z bazą danych
        if (store.settings) {
          store.settings = { ...store.settings, ...settings };
        }
      }
    } catch (dbErr) {
      console.warn("Ostrzeżenie: Błąd pobierania ustawień z bazy Prisma:", dbErr);
    }
  }

  // Sprawdzamy stan konfiguracji sekretów
  settings.smtpPasswordConfigured = Boolean(
    settings.smtpPassword ||
    process.env.SMTP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.WP_MAIL_PASSWORD
  );
  settings.resendApiKeyConfigured = Boolean(
    settings.resendApiKey || process.env.RESEND_API_KEY
  );

  const activePos = settings.payuSandbox ? settings.payuPosIdSandbox : settings.payuPosId;
  const activeSec = settings.payuSandbox ? settings.payuSecondKeySandbox : settings.payuSecondKey;
  settings.payuConfigured = Boolean(activePos && activeSec);

  // Bezpieczeństwo: Jeśli ustawienia są wysyłane do przeglądarki administratora,
  // maskujemy wrażliwe hasła i klucze prywatne, nie ujawniając ich w kodzie HTML/JSON
  if (options?.forAdminClient) {
    if (settings.smtpPassword) settings.smtpPassword = "";
    if (settings.resendApiKey) settings.resendApiKey = "";
    if (settings.payuSecondKey) settings.payuSecondKey = "";
    if (settings.payuClientSecret) settings.payuClientSecret = "";
    if (settings.payuSecondKeySandbox) settings.payuSecondKeySandbox = "";
    if (settings.payuClientSecretSandbox) settings.payuClientSecretSandbox = "";
  }

  return settings;
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings> & {
    clearSmtpPassword?: boolean;
    clearResendApiKey?: boolean;
    clearPayuSecrets?: boolean;
  }
): Promise<StoreSettings> {
  const store = loadLocalStore();
  // Wczytaj najświeższy stan bazy danych, aby zapobiec nadpisaniu nowszych sekretów z innego urządzenia
  let dbExistingSettings: any = null;
  if (await isDatabaseConnected()) {
    try {
      dbExistingSettings = await prisma.storeSettings.findUnique({
        where: { id: "default" },
      });
    } catch (_) { }
  }

  const existingPassword =
    (dbExistingSettings?.smtpPassword && dbExistingSettings.smtpPassword.trim()) ||
    (store.settings?.smtpPassword && store.settings.smtpPassword.trim());
  const existingResendKey =
    (dbExistingSettings?.resendApiKey && dbExistingSettings.resendApiKey.trim()) ||
    (store.settings?.resendApiKey && store.settings.resendApiKey.trim());
  const existingPayuSec =
    (dbExistingSettings?.payuSecondKey && dbExistingSettings.payuSecondKey.trim()) ||
    (store.settings?.payuSecondKey && store.settings.payuSecondKey.trim());
  const existingPayuSecret =
    (dbExistingSettings?.payuClientSecret && dbExistingSettings.payuClientSecret.trim()) ||
    (store.settings?.payuClientSecret && store.settings.payuClientSecret.trim());
  const existingPayuSecSandbox = store.settings?.payuSecondKeySandbox;
  const existingPayuSecretSandbox = store.settings?.payuClientSecretSandbox;

  const cleanSettings = { ...settings };

  // 1. Bezpieczne zachowanie hasła SMTP
  if (cleanSettings.clearSmtpPassword) {
    cleanSettings.smtpPassword = "";
    if (store.settings) store.settings.smtpPassword = "";
  } else if (cleanSettings.smtpPassword && cleanSettings.smtpPassword.trim().length > 0) {
    cleanSettings.smtpPassword = cleanSettings.smtpPassword.trim();
  } else if (existingPassword) {
    // Puste hasło oznacza zachowanie istniejącego sekretu!
    cleanSettings.smtpPassword = existingPassword;
  }

  // 2. Bezpieczne zachowanie klucza Resend API
  if (cleanSettings.clearResendApiKey) {
    cleanSettings.resendApiKey = "";
    if (store.settings) store.settings.resendApiKey = "";
  } else if (cleanSettings.resendApiKey && cleanSettings.resendApiKey.trim().length > 0) {
    cleanSettings.resendApiKey = cleanSettings.resendApiKey.trim();
  } else if (existingResendKey) {
    cleanSettings.resendApiKey = existingResendKey;
  }

  // 3. Bezpieczne zachowanie sekretów PayU (produkcja i sandbox)
  if (!cleanSettings.payuSecondKey && existingPayuSec) {
    cleanSettings.payuSecondKey = existingPayuSec;
  }
  if (!cleanSettings.payuClientSecret && existingPayuSecret) {
    cleanSettings.payuClientSecret = existingPayuSecret;
  }
  if (!cleanSettings.payuSecondKeySandbox && existingPayuSecSandbox) {
    cleanSettings.payuSecondKeySandbox = existingPayuSecSandbox;
  }
  if (!cleanSettings.payuClientSecretSandbox && existingPayuSecretSandbox) {
    cleanSettings.payuClientSecretSandbox = existingPayuSecretSandbox;
  }

  store.settings = { ...store.settings, ...cleanSettings };
  saveLocalStore(store);

  // Trwały zapis w bazie danych Neon PostgreSQL
  if (await isDatabaseConnected()) {
    try {
      const dataToSave: any = {
        boutiqueName: cleanSettings.boutiqueName,
        companyName: cleanSettings.companyName,
        nip: cleanSettings.nip,
        regon: cleanSettings.regon,
        registeredAddress: cleanSettings.registeredAddress,
        returnAddress: cleanSettings.returnAddress,
        address: cleanSettings.address,
        phone: cleanSettings.phone,
        email: cleanSettings.email,
        openingHours: cleanSettings.openingHours,
        announcementBarText: cleanSettings.announcementBarText,
        heroHeadline: cleanSettings.heroHeadline,
        heroSubheadline: cleanSettings.heroSubheadline,
        heroImageUrl: cleanSettings.heroImageUrl,
        termsAndConditions: cleanSettings.termsAndConditions,
        privacyPolicy: cleanSettings.privacyPolicy,
      };

      if (cleanSettings.freeShippingFrom !== undefined) dataToSave.freeShippingFrom = cleanSettings.freeShippingFrom;
      if (cleanSettings.courierCost !== undefined) dataToSave.courierCost = cleanSettings.courierCost;
      if (cleanSettings.inpostLockerCost !== undefined) dataToSave.inpostLockerCost = cleanSettings.inpostLockerCost;
      if (cleanSettings.localPickupCost !== undefined) dataToSave.localPickupCost = cleanSettings.localPickupCost;

      if (cleanSettings.visualBannerDraft !== undefined) {
        dataToSave.visualBannerDraft = JSON.stringify(cleanSettings.visualBannerDraft);
      }
      if (cleanSettings.visualBannerPublished !== undefined) {
        dataToSave.visualBannerPublished = JSON.stringify(cleanSettings.visualBannerPublished);
      }
      if (cleanSettings.bannerVersion !== undefined) {
        dataToSave.bannerVersion = cleanSettings.bannerVersion;
      }
      if (cleanSettings.bannerPublishedAt !== undefined) {
        dataToSave.bannerPublishedAt = new Date(cleanSettings.bannerPublishedAt);
      }

      // Konfiguracja SMTP & Email w trwałej bazie
      if (cleanSettings.smtpHost !== undefined) dataToSave.smtpHost = cleanSettings.smtpHost;
      if (cleanSettings.smtpPort !== undefined) dataToSave.smtpPort = cleanSettings.smtpPort;
      if (cleanSettings.smtpUser !== undefined) dataToSave.smtpUser = cleanSettings.smtpUser;
      if (cleanSettings.clearSmtpPassword) {
        dataToSave.smtpPassword = null;
      } else if (cleanSettings.smtpPassword && cleanSettings.smtpPassword.trim().length > 0) {
        dataToSave.smtpPassword = cleanSettings.smtpPassword.trim();
      }
      if (cleanSettings.smtpSecure !== undefined) dataToSave.smtpSecure = cleanSettings.smtpSecure;
      if (cleanSettings.emailSenderName !== undefined) dataToSave.emailSenderName = cleanSettings.emailSenderName;
      if (cleanSettings.emailSenderAddress !== undefined) dataToSave.emailSenderAddress = cleanSettings.emailSenderAddress;
      if (cleanSettings.emailProvider !== undefined) dataToSave.emailProvider = cleanSettings.emailProvider;
      if (cleanSettings.clearResendApiKey) {
        dataToSave.resendApiKey = null;
      } else if (cleanSettings.resendApiKey && cleanSettings.resendApiKey.trim().length > 0) {
        dataToSave.resendApiKey = cleanSettings.resendApiKey.trim();
      }

      // Konfiguracja PayU w trwałej bazie
      if (cleanSettings.payuPosId !== undefined) dataToSave.payuPosId = cleanSettings.payuPosId;
      if (cleanSettings.payuSecondKey !== undefined) dataToSave.payuSecondKey = cleanSettings.payuSecondKey;
      if (cleanSettings.payuClientId !== undefined) dataToSave.payuClientId = cleanSettings.payuClientId;
      if (cleanSettings.payuClientSecret !== undefined) dataToSave.payuClientSecret = cleanSettings.payuClientSecret;
      if (cleanSettings.payuSandbox !== undefined) dataToSave.payuSandbox = cleanSettings.payuSandbox;

      // Usuwamy klucze z wartościami undefined
      Object.keys(dataToSave).forEach((k) => {
        if (dataToSave[k] === undefined) delete dataToSave[k];
      });

      await prisma.storeSettings.upsert({
        where: { id: "default" },
        update: dataToSave,
        create: {
          id: "default",
          ...dataToSave,
        },
      });
    } catch (dbErr) {
      console.error("Błąd trwałego zapisu ustawień w bazie Prisma:", dbErr);
    }
  }

  // Przygotuj odpowiedź z poprawnymi flagami statusu
  const result: StoreSettings = { ...store.settings };
  result.smtpPasswordConfigured = Boolean(result.smtpPassword);
  result.resendApiKeyConfigured = Boolean(result.resendApiKey);
  result.smtpPasswordConfigured = Boolean(
    result.smtpPassword ||
    process.env.SMTP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.WP_MAIL_PASSWORD
  );
  result.resendApiKeyConfigured = Boolean(
    result.resendApiKey || process.env.RESEND_API_KEY
  );
  const pos = result.payuSandbox ? result.payuPosIdSandbox : result.payuPosId;
  const sec = result.payuSandbox ? result.payuSecondKeySandbox : result.payuSecondKey;
  result.payuConfigured = Boolean(pos && sec);

  // Nie zwracaj haseł w odpowiedzi API
  // Bezpieczeństwo: Nigdy nie zwracaj haseł w odpowiedzi API do przeglądarki
  result.smtpPassword = "";
  result.resendApiKey = "";
  result.payuSecondKey = "";
  result.payuClientSecret = "";
  result.payuSecondKeySandbox = "";
  result.payuClientSecretSandbox = "";

  return result;
}

// ==========================================
// DZIENNIK ZMIAN PROMOCJI (AUDIT LOG)
// ==========================================
export async function addPromotionAuditLog(
  action: string,
  details: string,
  adminUser: string = "Właścicielka"
): Promise<PromotionAuditLog> {
  const store = loadLocalStore();
  const newLog: PromotionAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    adminUser,
    action,
    details,
  };
  if (!store.promotionAuditLogs) store.promotionAuditLogs = [];
  store.promotionAuditLogs.unshift(newLog);
  saveLocalStore(store);
  return newLog;
}

export async function getPromotionAuditLogs(): Promise<PromotionAuditLog[]> {
  const store = loadLocalStore();
  return (store.promotionAuditLogs || []).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ==========================================
// ZARZĄDZANIE PROMOCJAMI
// ==========================================
export async function getAllPromotions(): Promise<Promotion[]> {
  const store = loadLocalStore();
  return store.promotions || [];
}

export async function getPromotionById(id: string): Promise<Promotion | undefined> {
  const store = loadLocalStore();
  return (store.promotions || []).find((p) => p.id === id);
}

export async function savePromotion(
  promoData: Partial<Promotion> & { id?: string }
): Promise<Promotion> {
  const store = loadLocalStore();
  const now = new Date().toISOString();
  if (!store.promotions) store.promotions = [];

  if (promoData.id) {
    const idx = store.promotions.findIndex((p) => p.id === promoData.id);
    if (idx === -1) throw new Error("Nie znaleziono promocji");

    const updated: Promotion = {
      ...store.promotions[idx],
      ...promoData,
      updatedAt: now,
    } as Promotion;

    store.promotions[idx] = updated;
    saveLocalStore(store);
    await addPromotionAuditLog(
      `Edycja promocji: ${updated.name}`,
      `Zaktualizowano parametry promocji typu ${updated.type}`
    );
    return updated;
  } else {
    const newId = `promo-${Date.now()}`;
    const newPromo: Promotion = {
      id: newId,
      name: promoData.name || "Nowa promocja",
      publicTitle: promoData.publicTitle || promoData.name || "Promocja",
      description: promoData.description || "",
      type: promoData.type || "PERCENTAGE",
      discountValue: Number(promoData.discountValue || 0),
      code: promoData.code ? promoData.code.trim().toUpperCase() : undefined,
      isAutomatic: promoData.isAutomatic !== undefined ? promoData.isAutomatic : true,
      targetScope: promoData.targetScope || "ALL",
      categoryIds: promoData.categoryIds || [],
      productIds: promoData.productIds || [],
      excludedCategoryIds: promoData.excludedCategoryIds || [],
      excludedProductIds: promoData.excludedProductIds || [],
      excludeDiscounted: Boolean(promoData.excludeDiscounted),
      minOrderValue: promoData.minOrderValue ? Number(promoData.minOrderValue) : undefined,
      startDate: promoData.startDate,
      endDate: promoData.endDate,
      noEndDate: promoData.noEndDate !== undefined ? promoData.noEndDate : true,
      isRecurringWeekend: Boolean(promoData.isRecurringWeekend),
      targetAudience: promoData.targetAudience || "ALL",
      specificEmails: promoData.specificEmails || [],
      totalUsageLimit: promoData.totalUsageLimit,
      usageLimitPerEmail: promoData.usageLimitPerEmail,
      currentUsageCount: 0,
      canCombineWithOtherPromotions: Boolean(promoData.canCombineWithOtherPromotions),
      bannerEnabled: Boolean(promoData.bannerEnabled),
      bannerText: promoData.bannerText,
      bannerButtonText: promoData.bannerButtonText,
      bannerButtonUrl: promoData.bannerButtonUrl,
      giftProductId: promoData.giftProductId,
      giftAvailableColors: promoData.giftAvailableColors || ["Cielisty Nude", "Kremowy Ecru", "Czarne Classic", "Pudrowy Róż"],
      giftStockQuantity: promoData.giftStockQuantity !== undefined ? promoData.giftStockQuantity : 50,
      giftReservedQuantity: 0,
      isActive: promoData.isActive !== undefined ? promoData.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    store.promotions.unshift(newPromo);
    saveLocalStore(store);
    await addPromotionAuditLog(
      `Utworzono nową promocję: ${newPromo.name}`,
      `Typ: ${newPromo.type}, Wartość: ${newPromo.discountValue}`
    );
    return newPromo;
  }
}

export async function deletePromotion(id: string): Promise<boolean> {
  const store = loadLocalStore();
  const idx = store.promotions.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  const promoName = store.promotions[idx].name;
  store.promotions.splice(idx, 1);
  saveLocalStore(store);
  await addPromotionAuditLog(`Usunięto promocję: ${promoName}`, `ID: ${id}`);
  return true;
}

export async function duplicatePromotion(id: string): Promise<Promotion> {
  const store = loadLocalStore();
  const original = store.promotions.find((p) => p.id === id);
  if (!original) throw new Error("Nie znaleziono promocji do skopiowania");

  const newPromo: Promotion = {
    ...original,
    id: `promo-${Date.now()}`,
    name: `${original.name} (Kopia)`,
    code: original.code ? `${original.code}-KOPIA` : undefined,
    currentUsageCount: 0,
    giftReservedQuantity: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.promotions.unshift(newPromo);
  saveLocalStore(store);
  await addPromotionAuditLog(`Skopiowano promocję: ${original.name}`, `Nowa promocja: ${newPromo.name}`);
  return newPromo;
}

export async function togglePromotion(id: string): Promise<Promotion> {
  const store = loadLocalStore();
  const promo = store.promotions.find((p) => p.id === id);
  if (!promo) throw new Error("Nie znaleziono promocji");
  promo.isActive = !promo.isActive;
  promo.updatedAt = new Date().toISOString();
  saveLocalStore(store);
  await addPromotionAuditLog(
    `${promo.isActive ? "Aktywowano" : "Wyłączono"} promocję: ${promo.name}`,
    `Nowy status: ${promo.isActive ? "Aktywna" : "Wyłączona"}`
  );
  return promo;
}

// ==========================================
// INDYWIDUALNE RABATY PO E-MAILU
// ==========================================
export async function getAllIndividualDiscounts(): Promise<IndividualCustomerDiscount[]> {
  const store = loadLocalStore();
  return store.individualDiscounts || [];
}

export async function saveIndividualDiscount(
  data: Partial<IndividualCustomerDiscount> & { email: string; discountPercent: number }
): Promise<IndividualCustomerDiscount> {
  const store = loadLocalStore();
  const now = new Date().toISOString();
  if (!store.individualDiscounts) store.individualDiscounts = [];
  const normalizedEmail = data.email.trim().toLowerCase();

  const existingIdx = store.individualDiscounts.findIndex(
    (d) => d.email.trim().toLowerCase() === normalizedEmail
  );

  if (existingIdx !== -1) {
    const updated: IndividualCustomerDiscount = {
      ...store.individualDiscounts[existingIdx],
      ...data,
      email: normalizedEmail,
      discountPercent: Number(data.discountPercent),
      updatedAt: now,
    };
    store.individualDiscounts[existingIdx] = updated;
    saveLocalStore(store);
    await addPromotionAuditLog(
      `Zaktualizowano indywidualny rabat dla: ${normalizedEmail}`,
      `Rabat: ${updated.discountPercent}%`
    );
    return updated;
  } else {
    const newDiscount: IndividualCustomerDiscount = {
      id: `ind-${Date.now()}`,
      email: normalizedEmail,
      discountPercent: Number(data.discountPercent),
      scope: data.scope || "ALL",
      categoryIds: data.categoryIds || [],
      productIds: data.productIds || [],
      startDate: data.startDate,
      endDate: data.endDate,
      isIndefinite: data.isIndefinite !== undefined ? data.isIndefinite : true,
      isActive: data.isActive !== undefined ? data.isActive : true,
      adminNote: data.adminNote || "",
      isEmailVerified: true, // Z poziomu administratora domyślnie zatwierdzony
      verificationToken: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };
    store.individualDiscounts.unshift(newDiscount);
    saveLocalStore(store);
    await addPromotionAuditLog(
      `Przyznano indywidualny rabat dla: ${normalizedEmail}`,
      `Rabat: ${newDiscount.discountPercent}%`
    );
    return newDiscount;
  }
}

export async function deleteIndividualDiscount(id: string): Promise<boolean> {
  const store = loadLocalStore();
  const idx = store.individualDiscounts.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  const email = store.individualDiscounts[idx].email;
  store.individualDiscounts.splice(idx, 1);
  saveLocalStore(store);
  await addPromotionAuditLog(`Usunięto indywidualny rabat dla: ${email}`, `ID: ${id}`);
  return true;
}

// ==========================================
// PROGRAM POLECEŃ
// ==========================================
export async function getAllReferralParticipants(): Promise<ReferralParticipant[]> {
  migrateAllReferralCodes();
  const store = loadLocalStore();
  return store.referralParticipants || [];
}

export async function getAllReferralRewardCodes(): Promise<ReferralRewardCode[]> {
  const store = loadLocalStore();
  return store.referralRewardCodes || [];
}

/**
 * Generuje losowy, unikalny kod polecający bez danych osobowych.
 * Format: AURA-XXXXXXXX (np. AURA-7K9P2X8M)
 * Alfabet bez mylących znaków (wykluczone 0, 1, I, O)
 */
export function generateRandomReferralCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AURA-${randomPart}`;
}

export function generateUniqueReferralCode(existingCodes: Set<string>): string {
  let code = generateRandomReferralCode();
  let attempts = 0;
  while (existingCodes.has(code.toUpperCase()) && attempts < 1000) {
    code = generateRandomReferralCode();
    attempts++;
  }
  return code;
}

/**
 * Pobiera lub generuje trwały, unikalny kod polecający dla klientki.
 * Kod jest powiązany z kontem i pozostaje STAŁY po ponownym logowaniu,
 * zmianie e-maila oraz na innych urządzeniach.
 */
export async function getOrCreateReferralParticipant(
  email: string,
  customerName?: string
): Promise<ReferralParticipant> {
  const store = loadLocalStore();
  if (!store.referralParticipants) store.referralParticipants = [];
  if (!store.customers) store.customers = [];

  const normalizedEmail = email.trim().toLowerCase();

  // Zbierz wszystkie kody w systemie
  const existingCodes = new Set<string>();
  for (const c of store.customers) {
    if (c.referralCode) existingCodes.add(c.referralCode.toUpperCase());
  }
  for (const p of store.referralParticipants) {
    if (p.referralCode) existingCodes.add(p.referralCode.toUpperCase());
  }

  // 1. Sprawdź konto klientki w store.customers
  const customer = store.customers.find((c) => c.email.toLowerCase() === normalizedEmail);
  const resolvedName = customer
    ? `${customer.firstName} ${customer.lastName}`.trim()
    : customerName?.trim() || email.split("@")[0];

  // 2. Sprawdź czy uczestnik już istnieje
  let participant = store.referralParticipants.find(
    (p) =>
      p.email.toLowerCase() === normalizedEmail ||
      (customer && p.customerId && p.customerId === customer.id)
  );

  // A) Klientka ma już przypisany stały unikalny kod AURA-XXXXXXXX
  if (customer?.referralCode && /^AURA-[2-9A-Z]{8}$/i.test(customer.referralCode)) {
    if (!participant) {
      participant = {
        id: `ref-p-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        customerId: customer.id,
        email: normalizedEmail,
        customerName: resolvedName,
        referralCode: customer.referralCode,
        totalReferralsCount: 0,
        isActive: true,
        createdAt: customer.createdAt || new Date().toISOString(),
      };
      store.referralParticipants.unshift(participant);
      saveLocalStore(store);
    } else {
      let changed = false;
      if (participant.referralCode !== customer.referralCode) {
        participant.referralCode = customer.referralCode;
        changed = true;
      }
      if (customer.id && participant.customerId !== customer.id) {
        participant.customerId = customer.id;
        changed = true;
      }
      if (changed) saveLocalStore(store);
    }
    return participant;
  }

  // B) Uczestnik w referralParticipants ma już kod AURA-XXXXXXXX
  if (participant?.referralCode && /^AURA-[2-9A-Z]{8}$/i.test(participant.referralCode)) {
    if (customer && customer.referralCode !== participant.referralCode) {
      customer.referralCode = participant.referralCode;
      saveLocalStore(store);
    }
    return participant;
  }

  // C) Wygeneruj NOWY unikalny stały kod
  const newCode = generateUniqueReferralCode(existingCodes);
  existingCodes.add(newCode.toUpperCase());

  if (customer) {
    customer.referralCode = newCode;
  }

  if (participant) {
    participant.referralCode = newCode;
    if (customer) participant.customerId = customer.id;
    participant.customerName = resolvedName;
  } else {
    participant = {
      id: `ref-p-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      customerId: customer?.id,
      email: normalizedEmail,
      customerName: resolvedName,
      referralCode: newCode,
      totalReferralsCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    store.referralParticipants.unshift(participant);
  }

  saveLocalStore(store);

  if (isNeonConfigured()) {
    try {
      await prisma.referralParticipant.upsert({
        where: { email: normalizedEmail },
        update: { referralCode: newCode, customerName: resolvedName },
        create: {
          email: normalizedEmail,
          customerName: resolvedName,
          referralCode: newCode,
          customerId: customer?.id,
        },
      });
    } catch (e) {
      console.warn("Neon referral sync error:", e);
    }
  }

  return participant;
}

/**
 * Wyszukuje uczestniczkę polecającą po jej kodzie polecającym
 */
export async function getReferralParticipantByCode(code: string): Promise<ReferralParticipant | null> {
  const store = loadLocalStore();
  const normalized = code.trim().toUpperCase();

  const participant = (store.referralParticipants || []).find(
    (p) => p.referralCode.trim().toUpperCase() === normalized
  );
  if (participant) return participant;

  const customer = (store.customers || []).find(
    (c) => c.referralCode && c.referralCode.trim().toUpperCase() === normalized
  );
  if (customer) {
    return {
      id: `ref-p-${customer.id}`,
      customerId: customer.id,
      email: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      referralCode: customer.referralCode,
      totalReferralsCount: 0,
      isActive: true,
      createdAt: customer.createdAt,
    };
  }

  return null;
}

// Przyznanie nagrody 15% polecającej, gdy zamówienie koleżanki zostaje oznaczone jako zrealizowane (DELIVERED)
export async function awardReferralRewardOnDelivered(
  order: Order
): Promise<ReferralRewardCode | null> {
  if (!order.referralCodeUsed || !order.referrerEmail) return null;
  const store = loadLocalStore();
  if (!store.referralRewardCodes) store.referralRewardCodes = [];

  const referrerEmail = order.referrerEmail.trim().toLowerCase();
  const referredEmail = order.customerEmail.trim().toLowerCase();

  // Blokada polecania samej siebie
  if (referrerEmail === referredEmail) return null;

  // Zabezpieczenie przed wielokrotnym generowaniem nagrody za to samo zamówienie
  const alreadyAwarded = store.referralRewardCodes.some(
    (rc) => rc.referredOrderId === order.id
  );
  if (alreadyAwarded) return null;

  // Kod ważny dokładnie 30 dni od zrealizowania zamówienia
  const validUntil = addDaysWarsaw(30);
  const rewardCodeString = `POLECAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const rewardCode: ReferralRewardCode = {
    id: `ref-rew-${Date.now()}`,
    code: rewardCodeString,
    referrerEmail,
    referredEmail,
    referredOrderId: order.id,
    discountPercent: 15,
    validUntil,
    isUsed: false,
    isRevoked: false,
    createdAt: new Date().toISOString(),
  };

  store.referralRewardCodes.unshift(rewardCode);

  // Zwiększ licznik poleceń u uczestniczki
  const participant = store.referralParticipants?.find(
    (p) => p.email.trim().toLowerCase() === referrerEmail
  );
  if (participant) {
    participant.totalReferralsCount = (participant.totalReferralsCount || 0) + 1;
  }

  saveLocalStore(store);
  await addPromotionAuditLog(
    `Przyznano nagrodę polecającej: ${referrerEmail}`,
    `Kod 15%: ${rewardCodeString} za zrealizowane zamówienie ${order.orderNumber}`
  );

  if (isNeonConfigured()) {
    try {
      await prisma.referralRewardCode.create({
        data: {
          id: rewardCode.id,
          code: rewardCode.code,
          referrerEmail: rewardCode.referrerEmail,
          referredEmail: rewardCode.referredEmail,
          referredOrderId: rewardCode.referredOrderId,
          discountPercent: rewardCode.discountPercent,
          validUntil: new Date(rewardCode.validUntil),
          isUsed: false,
          isRevoked: false,
        },
      });
    } catch (e) {
      console.warn("Neon referral reward sync error:", e);
    }
  }

  return rewardCode;
}

// Unieważnienie nagrody za polecenie przy zwrocie zamówienia koleżanki
export async function revokeReferralRewardOnRefund(
  orderId: string
): Promise<{ success: boolean; flaggedAlreadyUsed?: boolean }> {
  const store = loadLocalStore();
  const reward = store.referralRewardCodes?.find((rc) => rc.referredOrderId === orderId);
  if (!reward) return { success: false };

  if (reward.isUsed) {
    // Kod został już wykorzystany - oznaczamy sytuację administratorowi bez zmiany opłaconych zamówień
    reward.adminFlagged = true;
    saveLocalStore(store);
    await addPromotionAuditLog(
      `ALARM: Zwrot zamówienia z wykorzystaną nagrodą polecającą`,
      `Zamówienie ${orderId} zostało zwrócone, ale kod ${reward.code} polecającej ${reward.referrerEmail} został już wykorzystany!`
    );
    return { success: true, flaggedAlreadyUsed: true };
  } else {
    // Kod nie został jeszcze zużyty - unieważniamy
    reward.isRevoked = true;
    reward.revokedReason = "Pełny zwrot zamówienia koleżanki";
    saveLocalStore(store);
    await addPromotionAuditLog(
      `Unieważniono nagrodę polecającą ${reward.code}`,
      `Powód: Zwrot zamówienia ${orderId}`
    );
    return { success: true };
  }
}

// ==========================================
// OPINIE O PRODUKTACH & RABAT ZA OPINIĘ (2% / 5%)
// ==========================================
export async function getAllProductReviews(): Promise<ProductReview[]> {
  const store = loadLocalStore();
  return store.productReviews || [];
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const store = loadLocalStore();
  return (store.productReviews || []).filter(
    (r) => r.productId === productId && !r.isHidden
  );
}

export async function createProductReview(data: {
  productId: string;
  orderNumber?: string;
  customerEmail: string;
  displayName: string;
  rating: number;
  content: string;
  photoUrl?: string;
}): Promise<{ review: ProductReview; rewardCode?: string; rewardPercent?: number }> {
  const store = loadLocalStore();
  if (!store.productReviews) store.productReviews = [];
  const normalizedEmail = data.customerEmail.trim().toLowerCase();

  // WERYFIKACJA ZAKUPU: szukamy zamówienia (opcjonalnie)
  let verifiedOrder = undefined;
  if (data.orderNumber) {
    verifiedOrder = store.orders.find((o) => {
      const isMatchingOrder =
        o.orderNumber.toUpperCase() === data.orderNumber!.trim().toUpperCase() ||
        o.id === data.orderNumber!.trim();
      const isMatchingEmail = o.customerEmail.trim().toLowerCase() === normalizedEmail;
      return isMatchingOrder && isMatchingEmail;
    });
  } else {
    verifiedOrder = store.orders.find((o) => {
      const isMatchingEmail = o.customerEmail.trim().toLowerCase() === normalizedEmail;
      const hasProduct = o.items.some(
        (item) => item.variantSnapshot.includes(data.productId) || item.productNameSnapshot
      );
      return isMatchingEmail && hasProduct;
    });
  }

  // Przyznanie kodu: 2% za tekst, 5% za opinię ze zdjęciem
  const hasPhoto = Boolean(data.photoUrl && data.photoUrl.trim());
  const rewardPercent = hasPhoto ? 5 : 2;
  const rewardCode = `OPINIA-${rewardPercent}P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const validUntil = addDaysWarsaw(30);

  const review: ProductReview = {
    id: `rev-${Date.now()}`,
    productId: data.productId,
    orderId: verifiedOrder?.id,
    orderNumber: verifiedOrder?.orderNumber || data.orderNumber?.trim(),
    customerEmail: normalizedEmail,
    displayName: data.displayName.trim() || "Klientka AURA",
    rating: Math.max(1, Math.min(5, Math.round(data.rating))),
    content: data.content.trim(),
    photoUrl: data.photoUrl?.trim(),
    isVerifiedPurchase: Boolean(verifiedOrder),
    rewardCodeIssued: rewardCode,
    rewardPercentIssued: rewardPercent,
    rewardCodeValidUntil: validUntil,
    rewardCodeUsed: false,
    hasPhotoBonusApplied: hasPhoto,
    isHidden: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.productReviews.unshift(review);
  saveLocalStore(store);

  await addPromotionAuditLog(
    `Przyznano kod za opinię (${rewardPercent}%): ${rewardCode}`,
    `Dla: ${normalizedEmail}, produkt: ${data.productId}`
  );

  return { review, rewardCode, rewardPercent };
}

// Uzupełnienie opinii o zdjęcie (upgrade z 2% na 5% z zachowaniem pierwotnej daty ważności)
export async function upgradeReviewWithPhoto(
  reviewId: string,
  photoUrl: string
): Promise<{ success: boolean; newRewardCode?: string }> {
  const store = loadLocalStore();
  const review = store.productReviews?.find((r) => r.id === reviewId);
  if (!review) throw new Error("Nie znaleziono opinii");

  if (review.hasPhotoBonusApplied) {
    throw new Error("Ta opinia posiada już bonus za zdjęcie.");
  }

  // Sprawdzamy czy poprzedni kod 2% jest nadal ważny i niewykorzystany
  const isExpired = review.rewardCodeValidUntil
    ? new Date().getTime() > new Date(review.rewardCodeValidUntil).getTime()
    : false;

  if (review.rewardCodeUsed || isExpired) {
    // Dodajemy tylko zdjęcie bez nowego kodu
    review.photoUrl = photoUrl;
    review.hasPhotoBonusApplied = true;
    review.updatedAt = new Date().toISOString();
    saveLocalStore(store);
    return { success: true };
  }

  // Generujemy nowy kod 5% zachowując pierwotną datę ważności
  const newRewardCode = `OPINIA-5P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  review.photoUrl = photoUrl;
  review.hasPhotoBonusApplied = true;
  review.rewardCodeIssued = newRewardCode;
  review.rewardPercentIssued = 5;
  review.updatedAt = new Date().toISOString();

  saveLocalStore(store);
  return { success: true, newRewardCode };
}

export async function toggleReviewVisibility(
  reviewId: string,
  isHidden: boolean,
  hiddenReason?: string
): Promise<ProductReview> {
  const store = loadLocalStore();
  const review = store.productReviews?.find((r) => r.id === reviewId);
  if (!review) throw new Error("Nie znaleziono opinii");

  review.isHidden = isHidden;
  if (hiddenReason !== undefined) review.hiddenReason = hiddenReason;
  review.updatedAt = new Date().toISOString();
  saveLocalStore(store);

  await addPromotionAuditLog(
    `${isHidden ? "Ukryto" : "Przywrócono"} opinię`,
    `ID: ${reviewId}, powód: ${hiddenReason || "Brak"}`
  );

  return review;
}

// ==========================================
// FORMULARZ KONTAKTOWY
// ==========================================
export async function getAllContactMessages(): Promise<ContactMessage[]> {
  const store = loadLocalStore();
  return store.contactMessages || [];
}

export async function markContactMessageRead(id: string): Promise<boolean> {
  const store = loadLocalStore();
  const msg = store.contactMessages?.find((m) => m.id === id);
  if (!msg) return false;
  msg.isRead = true;
  saveLocalStore(store);
  return true;
}

// ==========================================
// KONTO WŁAŚCICIELKI (aurazmigrod@wp.pl)
// ==========================================
export function hashResetCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export async function getAdminAccount(): Promise<AdminAccount> {
  const store = loadLocalStore();
  if (!store.adminAccount) {
    store.adminAccount = { ...initialAdminAccount };
    saveLocalStore(store);
  }
  // Sanityzacja: usuwamy stare jawne pole hasła z pamięci i dysku jeśli występuje
  if ("password" in (store.adminAccount as any)) {
    delete (store.adminAccount as any).password;
    saveLocalStore(store);
  }

  // Synchronizacja z trwałą bazą PostgreSQL (Neon)
  if (isNeonConfigured()) {
    try {
      let dbAdmin = await prisma.adminAccount.findUnique({
        where: { id: "default" },
      });

      if (!dbAdmin) {
        dbAdmin = await prisma.adminAccount.create({
          data: {
            id: "default",
            email: store.adminAccount.email || "aurazmigrod@wp.pl",
            passwordHash: store.adminAccount.passwordHash || null,
            mustChangePassword: Boolean(store.adminAccount.mustChangePassword),
            lastPasswordChangedAt: store.adminAccount.lastPasswordChangedAt
              ? new Date(store.adminAccount.lastPasswordChangedAt)
              : null,
          },
        });
      }

      store.adminAccount.email = dbAdmin.email;
      store.adminAccount.passwordHash = dbAdmin.passwordHash || undefined;
      store.adminAccount.mustChangePassword = dbAdmin.mustChangePassword;
      if (dbAdmin.lastPasswordChangedAt) {
        store.adminAccount.lastPasswordChangedAt = dbAdmin.lastPasswordChangedAt.toISOString();
      }
    } catch (_) {
      // W przypadku braku łączności bazujemy na stanie lokalnym
    }
  }

  return store.adminAccount;
}

/**
 * Zapisuje kod resetowania hasła z ograniczeniem częstotliwości (rate limit 60s) i limitem prób.
 * Kod jest haszowany funkcją skrótu SHA-256 – NIGDY nie jest zapisywany jawnie.
 */
export async function savePasswordResetCode(
  email: string,
  code: string,
  ttlMs: number = 15 * 60 * 1000
): Promise<{ success: boolean; rateLimited?: boolean; retryAfterSeconds?: number }> {
  const normalized = email.trim().toLowerCase();
  const codeHash = hashResetCode(code);
  const now = Date.now();
  const expiresAt = new Date(now + ttlMs);

  // 1. Sprawdzamy i zapisujemy w trwałej bazie PostgreSQL (Neon)
  if (isNeonConfigured()) {
    try {
      const activeToken = await prisma.passwordResetToken.findFirst({
        where: {
          email: normalized,
          expiresAt: { gt: new Date(now) },
        },
        orderBy: { createdAt: "desc" },
      });

      if (activeToken && now - activeToken.createdAt.getTime() < 60 * 1000) {
        const remainingSeconds = Math.ceil((activeToken.createdAt.getTime() + 60 * 1000 - now) / 1000);
        return { success: false, rateLimited: true, retryAfterSeconds: remainingSeconds };
      }

      await prisma.passwordResetToken.deleteMany({
        where: { email: normalized },
      });

      await prisma.passwordResetToken.create({
        data: {
          email: normalized,
          codeHash,
          expiresAt,
          attempts: 0,
        },
      });
    } catch (e) {
      console.warn("Błąd zapisu tokenu resetu w PostgreSQL:", e);
    }
  }

  // 2. Kopia zapasowa w magazynie lokalnym / pamięci
  const store = loadLocalStore();
  if (!store.passwordResetTokens) store.passwordResetTokens = [];

  const existing = store.passwordResetTokens.find(
    (t: any) => t.email.toLowerCase() === normalized && t.expiresAt > now
  );

  if (existing && existing.createdAt && now - existing.createdAt < 60 * 1000) {
    const remainingSeconds = Math.ceil((existing.createdAt + 60 * 1000 - now) / 1000);
    return { success: false, rateLimited: true, retryAfterSeconds: remainingSeconds };
  }

  store.passwordResetTokens = store.passwordResetTokens.filter(
    (t: any) => t.email.toLowerCase() !== normalized && t.expiresAt > now
  );

  store.passwordResetTokens.push({
    email: normalized,
    code: codeHash,
    expiresAt: now + ttlMs,
    attempts: 0,
    createdAt: now,
  } as any);

  saveLocalStore(store);
  return { success: true };
}

/**
 * Weryfikuje kod resetowania hasła z zabezpieczeniem brute-force (max 5 prób)
 * Weryfikuje skrót SHA-256 – nie ujawnia kodu.
 */
export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const enteredCodeHash = hashResetCode(code);
  const now = new Date();

  // 1. Sprawdzamy w trwałej bazie PostgreSQL (Neon)
  if (isNeonConfigured()) {
    try {
      const dbToken = await prisma.passwordResetToken.findFirst({
        where: {
          email: normalized,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!dbToken) {
        return { valid: false, error: "Kod wygasł lub nie istnieje. Poproś o nowy kod." };
      }

      if (dbToken.attempts >= 5) {
        await prisma.passwordResetToken.delete({ where: { id: dbToken.id } });
        return { valid: false, error: "Zbyt wiele nieudanych prób. Wygeneruj nowy kod resetowania." };
      }

      if (dbToken.codeHash !== enteredCodeHash) {
        await prisma.passwordResetToken.update({
          where: { id: dbToken.id },
          data: { attempts: { increment: 1 } },
        });
        return {
          valid: false,
          error: `Nieprawidłowy kod weryfikacyjny. Pozostało prób: ${Math.max(0, 4 - dbToken.attempts)}.`,
        };
      }

      return { valid: true };
    } catch (e) {
      console.warn("Błąd weryfikacji tokenu w PostgreSQL, fallback do magazynu lokalnego:", e);
    }
  }

  // 2. Fallback do pamięci podręcznej magazynu
  const store = loadLocalStore();
  const token = (store.passwordResetTokens || []).find(
    (t: any) => t.email.toLowerCase() === normalized && t.expiresAt > Date.now()
  );

  if (!token) {
    return { valid: false, error: "Kod wygasł lub nie istnieje. Poproś o nowy kod." };
  }

  if ((token.attempts || 0) >= 5) {
    store.passwordResetTokens = (store.passwordResetTokens || []).filter(
      (t: any) => t.email.toLowerCase() !== normalized
    );
    saveLocalStore(store);
    return { valid: false, error: "Zbyt wiele nieudanych prób. Wygeneruj nowy kod resetowania." };
  }

  const storedHash = (token as any).code || (token as any).codeHash || "";
  // Porównanie skrótów lub wariantu legacy
  const isMatch = storedHash === enteredCodeHash || storedHash === code.trim();
  if (!isMatch) {
    token.attempts = (token.attempts || 0) + 1;
    saveLocalStore(store);
    return {
      valid: false,
      error: `Nieprawidłowy kod weryfikacyjny. Pozostało prób: ${Math.max(0, 5 - token.attempts)}.`,
    };
  }

  return { valid: true };
}

/**
 * Resetuje hasło dla konta właścicielki lub klientki
 */
export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; role: "ADMIN" | "CUSTOMER" }> {
  const store = loadLocalStore();
  const normalized = email.trim().toLowerCase();
  const cleanPassword = newPassword; // Bez przycinania znaków hasła

  // 1. Sprawdzamy czy to konto właścicielki (admin)
  const adminEmail = (store.adminAccount?.email || "aurazmigrod@wp.pl").trim().toLowerCase();
  if (normalized === adminEmail) {
    if (!store.adminAccount) {
      store.adminAccount = { ...initialAdminAccount };
    }
    store.adminAccount.passwordHash = hashPassword(cleanPassword);
    delete (store.adminAccount as any).password;
    store.adminAccount.mustChangePassword = false;
    store.adminAccount.lastPasswordChangedAt = new Date().toISOString();

    // Usuwamy zużyty token
    if (store.passwordResetTokens) {
      store.passwordResetTokens = store.passwordResetTokens.filter(
        (t) => t.email.toLowerCase() !== normalized
      );
    }

    saveLocalStore(store);

    if (isNeonConfigured()) {
      try {
        await prisma.adminAccount.upsert({
          where: { id: "default" },
          update: {
            passwordHash: hashPassword(cleanPassword),
            mustChangePassword: false,
            lastPasswordChangedAt: new Date(),
          },
          create: {
            id: "default",
            email: adminEmail,
            passwordHash: hashPassword(cleanPassword),
            mustChangePassword: false,
            lastPasswordChangedAt: new Date(),
          },
        });
        await prisma.passwordResetToken.deleteMany({
          where: { email: normalized },
        });
        // Unieważnienie wszystkich dotychczasowych aktywnych sesji administratora
        await prisma.adminSession.deleteMany({});
      } catch (e) {
        console.warn("Neon admin password reset sync error:", e);
      }
    }

    await addPromotionAuditLog(
      "RESET_HASŁA_ADMINA",
      "Pomyślnie zresetowano hasło dla konta właścicielki butiku (aurazmigrod@wp.pl). Zapisano bezpieczny skrót PBKDF2.",
      "System resetowania hasła"
    );
    return { success: true, role: "ADMIN" };
  }

  // 2. Sprawdzamy czy to zarejestrowana klientka (Neon PostgreSQL + magazyn lokalny)
  const customer = await getCustomerByEmail(normalized);
  if (customer) {
    const hashedPassword = hashPassword(cleanPassword);
    customer.passwordHash = hashedPassword;

    if (isNeonConfigured()) {
      try {
        await prisma.customerAccount.update({
          where: { email: customer.email },
          data: { passwordHash: hashedPassword },
        });
        await prisma.passwordResetToken.deleteMany({
          where: { email: normalized },
        });
      } catch (e) {
        console.warn("Neon customer password reset sync error:", e);
      }
    }

    const store = loadLocalStore();
    if (store.customers) {
      const localCust = store.customers.find((c) => c.email.toLowerCase() === normalized);
      if (localCust) {
        localCust.passwordHash = hashedPassword;
      }
    }
    if (store.passwordResetTokens) {
      store.passwordResetTokens = store.passwordResetTokens.filter(
        (t) => t.email.toLowerCase() !== normalized
      );
    }
    saveLocalStore(store);

    return { success: true, role: "CUSTOMER" };
  }

  throw new Error("Nie znaleziono konta z podanym adresem e-mail.");
}

export async function updateAdminPassword(newPassword: string): Promise<AdminAccount> {
  const store = loadLocalStore();
  if (!store.adminAccount) {
    store.adminAccount = { ...initialAdminAccount };
  }
  store.adminAccount.passwordHash = hashPassword(newPassword.trim());
  delete (store.adminAccount as any).password;
  store.adminAccount.mustChangePassword = false;
  store.adminAccount.lastPasswordChangedAt = new Date().toISOString();
  saveLocalStore(store);

  if (isNeonConfigured()) {
    try {
      await prisma.adminAccount.upsert({
        where: { id: "default" },
        update: {
          passwordHash: hashPassword(newPassword.trim()),
          mustChangePassword: false,
          lastPasswordChangedAt: new Date(),
        },
        create: {
          id: "default",
          email: store.adminAccount.email || "aurazmigrod@wp.pl",
          passwordHash: hashPassword(newPassword.trim()),
          mustChangePassword: false,
          lastPasswordChangedAt: new Date(),
        },
      });
    } catch (e) {
      console.warn("Neon admin password update sync error:", e);
    }
  }

  await addPromotionAuditLog(
    "ZMIANA_HASŁA_WŁAŚCICIELKI",
    "Pomyślnie zmieniono hasło dla konta aurazmigrod@wp.pl. Zapisano bezpieczny skrót PBKDF2.",
    "Właścicielka (aurazmigrod@wp.pl)"
  );

  return store.adminAccount;
}

// ==========================================
// KLIENCI BUTIKU (REJESTRACJA I LOGOWANIE)
// ==========================================
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export async function getCustomers(): Promise<CustomerAccount[]> {
  const store = loadLocalStore();
  let customers: CustomerAccount[] = [...(store.customers || [])];

  if (isNeonConfigured()) {
    try {
      const dbCusts = await prisma.customerAccount.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (dbCusts && dbCusts.length > 0) {
        const dbMapped: CustomerAccount[] = dbCusts.map((d) => ({
          id: d.id,
          email: d.email,
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone || "",
          passwordHash: d.passwordHash || undefined,
          referralCode: d.referralCode || "",
          defaultStreet: d.defaultStreet || undefined,
          defaultCity: d.defaultCity || undefined,
          defaultPostalCode: d.defaultPostalCode || undefined,
          lastParcelLocker: d.lastParcelLocker || undefined,
          lastParcelLockerAddress: d.lastParcelLockerAddress || undefined,
          invoiceType: (d.invoiceType as any) || undefined,
          invoiceCompanyName: d.invoiceCompanyName || undefined,
          invoiceNip: d.invoiceNip || undefined,
          invoiceStreet: d.invoiceStreet || undefined,
          invoiceCity: d.invoiceCity || undefined,
          invoicePostalCode: d.invoicePostalCode || undefined,
          createdAt: d.createdAt.toISOString(),
        }));

        const existingEmails = new Set(dbMapped.map((c) => c.email.toLowerCase()));
        customers = [...dbMapped, ...customers.filter((c) => !existingEmails.has(c.email.toLowerCase()))];
      }
    } catch (e) {
      console.warn("Neon getCustomers error, fallback to local:", e);
    }
  }

  return customers;
}

export async function getCustomerById(id: string): Promise<CustomerAccount | null> {
  if (isNeonConfigured()) {
    try {
      const dbCust = await prisma.customerAccount.findUnique({
        where: { id },
      });
      if (dbCust) {
        return {
          id: dbCust.id,
          email: dbCust.email,
          firstName: dbCust.firstName,
          lastName: dbCust.lastName,
          phone: dbCust.phone || "",
          passwordHash: dbCust.passwordHash || undefined,
          referralCode: dbCust.referralCode || "",
          defaultStreet: dbCust.defaultStreet || undefined,
          defaultCity: dbCust.defaultCity || undefined,
          defaultPostalCode: dbCust.defaultPostalCode || undefined,
          lastParcelLocker: dbCust.lastParcelLocker || undefined,
          lastParcelLockerAddress: dbCust.lastParcelLockerAddress || undefined,
          invoiceType: (dbCust.invoiceType as any) || undefined,
          invoiceCompanyName: dbCust.invoiceCompanyName || undefined,
          invoiceNip: dbCust.invoiceNip || undefined,
          invoiceStreet: dbCust.invoiceStreet || undefined,
          invoiceCity: dbCust.invoiceCity || undefined,
          invoicePostalCode: dbCust.invoicePostalCode || undefined,
          createdAt: dbCust.createdAt.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Neon getCustomerById error:", e);
    }
  }

  const store = loadLocalStore();
  return (store.customers || []).find((c) => c.id === id) || null;
}

export async function getCustomerByEmail(email: string): Promise<CustomerAccount | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (isNeonConfigured()) {
    try {
      const dbCust = await prisma.customerAccount.findUnique({
        where: { email: normalized },
      });
      if (dbCust) {
        return {
          id: dbCust.id,
          email: dbCust.email,
          firstName: dbCust.firstName,
          lastName: dbCust.lastName,
          phone: dbCust.phone || "",
          passwordHash: dbCust.passwordHash || undefined,
          referralCode: dbCust.referralCode || "",
          defaultStreet: dbCust.defaultStreet || undefined,
          defaultCity: dbCust.defaultCity || undefined,
          defaultPostalCode: dbCust.defaultPostalCode || undefined,
          lastParcelLocker: dbCust.lastParcelLocker || undefined,
          lastParcelLockerAddress: dbCust.lastParcelLockerAddress || undefined,
          invoiceType: (dbCust.invoiceType as any) || undefined,
          invoiceCompanyName: dbCust.invoiceCompanyName || undefined,
          invoiceNip: dbCust.invoiceNip || undefined,
          invoiceStreet: dbCust.invoiceStreet || undefined,
          invoiceCity: dbCust.invoiceCity || undefined,
          invoicePostalCode: dbCust.invoicePostalCode || undefined,
          createdAt: dbCust.createdAt.toISOString(),
          welcomeDiscountCode: undefined,
          welcomeEmailStatus: undefined,
        };
      }
    } catch (e) {
      console.warn("Neon getCustomerByEmail error, fallback to local:", e);
    }
  }

  const store = loadLocalStore();
  const customer = (store.customers || []).find((c) => c.email.toLowerCase() === normalized);
  return customer || null;
}

export async function updateCustomerProfile(
  idOrEmail: string,
  data: Partial<CustomerAccount>
): Promise<CustomerAccount> {
  const norm = normalizeEmail(idOrEmail);
  const customer = (await getCustomerByEmail(norm)) || (await getCustomerById(idOrEmail));
  if (!customer) {
    throw new Error("Nie znaleziono konta klientki.");
  }

  const updated: CustomerAccount = {
    ...customer,
    firstName: data.firstName !== undefined ? data.firstName.trim() : customer.firstName,
    lastName: data.lastName !== undefined ? data.lastName.trim() : customer.lastName,
    phone: data.phone !== undefined ? data.phone.trim() : customer.phone,
    defaultStreet: data.defaultStreet !== undefined ? data.defaultStreet.trim() : customer.defaultStreet,
    defaultCity: data.defaultCity !== undefined ? data.defaultCity.trim() : customer.defaultCity,
    defaultPostalCode: data.defaultPostalCode !== undefined ? data.defaultPostalCode.trim() : customer.defaultPostalCode,
    lastParcelLocker: data.lastParcelLocker !== undefined ? data.lastParcelLocker.trim() : customer.lastParcelLocker,
    lastParcelLockerAddress: data.lastParcelLockerAddress !== undefined ? data.lastParcelLockerAddress.trim() : customer.lastParcelLockerAddress,
    invoiceType: data.invoiceType !== undefined ? data.invoiceType : customer.invoiceType,
    invoiceCompanyName: data.invoiceCompanyName !== undefined ? data.invoiceCompanyName.trim() : customer.invoiceCompanyName,
    invoiceNip: data.invoiceNip !== undefined ? data.invoiceNip.trim() : customer.invoiceNip,
    invoiceStreet: data.invoiceStreet !== undefined ? data.invoiceStreet.trim() : customer.invoiceStreet,
    invoiceCity: data.invoiceCity !== undefined ? data.invoiceCity.trim() : customer.invoiceCity,
    invoicePostalCode: data.invoicePostalCode !== undefined ? data.invoicePostalCode.trim() : customer.invoicePostalCode,
  };

  if (isNeonConfigured()) {
    try {
      await prisma.customerAccount.update({
        where: { id: customer.id },
        data: {
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
          defaultStreet: updated.defaultStreet,
          defaultCity: updated.defaultCity,
          defaultPostalCode: updated.defaultPostalCode,
          lastParcelLocker: updated.lastParcelLocker,
          lastParcelLockerAddress: updated.lastParcelLockerAddress,
          invoiceType: updated.invoiceType,
          invoiceCompanyName: updated.invoiceCompanyName,
          invoiceNip: updated.invoiceNip,
          invoiceStreet: updated.invoiceStreet,
          invoiceCity: updated.invoiceCity,
          invoicePostalCode: updated.invoicePostalCode,
        },
      });
    } catch (e) {
      console.warn("Neon updateCustomerProfile error:", e);
    }
  }

  const store = loadLocalStore();
  if (store.customers) {
    const idx = store.customers.findIndex((c) => c.id === customer.id || c.email.toLowerCase() === customer.email.toLowerCase());
    if (idx !== -1) {
      store.customers[idx] = updated;
    } else {
      store.customers.push(updated);
    }
    saveLocalStore(store);
  }

  return updated;
}

export async function createCustomerAccount(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;
}): Promise<CustomerAccount> {
  const normalizedEmail = normalizeEmail(data.email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Podaj prawidłowy adres e-mail.");
  }

  // Sprawdzamy czy konto już istnieje w Neon lub w magazynie lokalnym
  const existing = await getCustomerByEmail(normalizedEmail);
  if (existing) {
    // Jeśli konto ma już hasło -> jest w pełni zarejestrowane
    if (existing.passwordHash) {
      throw new Error("Konto z tym adresem e-mail już istnieje. Przejdź do logowania.");
    }
    // Jeśli konto istniało bez hasła (np. po zakupie gościnnym lub newsletterze), aktywujemy je:
    const hashedPassword = data.password ? hashPassword(data.password.trim()) : undefined;
    const updated = await updateCustomerProfile(existing.id, {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || existing.phone,
    });
    if (hashedPassword && isNeonConfigured()) {
      try {
        await prisma.customerAccount.update({
          where: { id: existing.id },
          data: { passwordHash: hashedPassword },
        });
        updated.passwordHash = hashedPassword;
      } catch (_) {}
    }
    return updated;
  }

  const store = loadLocalStore();
  if (!store.customers) store.customers = [];
  if (!store.referralParticipants) store.referralParticipants = [];

  // Zbierz istniejące kody, by zagwarantować unikalność
  const allCustomers = await getCustomers();
  const existingCodes = new Set<string>();
  for (const c of allCustomers) {
    if (c.referralCode) existingCodes.add(c.referralCode.toUpperCase());
  }
  for (const p of store.referralParticipants) {
    if (p.referralCode) existingCodes.add(p.referralCode.toUpperCase());
  }

  const permanentReferralCode = generateUniqueReferralCode(existingCodes);
  const welcomeCode = `WITAJ15-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const hashedPassword = data.password ? hashPassword(data.password.trim()) : undefined;

  const newCustomer: CustomerAccount = {
    id: `cust-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    email: normalizedEmail,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: data.phone?.trim() || "",
    passwordHash: hashedPassword,
    referralCode: permanentReferralCode,
    createdAt: new Date().toISOString(),
    welcomeDiscountCode: welcomeCode,
    welcomeEmailStatus: "PENDING",
  };

  // 1. Zapis transakcyjny do PostgreSQL Neon
  if (isNeonConfigured()) {
    try {
      await prisma.customerAccount.create({
        data: {
          id: newCustomer.id,
          email: newCustomer.email,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          phone: newCustomer.phone,
          passwordHash: newCustomer.passwordHash,
          referralCode: newCustomer.referralCode,
        },
      });
      await prisma.referralParticipant.create({
        data: {
          id: `ref-p-${newCustomer.id}`,
          customerId: newCustomer.id,
          email: newCustomer.email,
          customerName: `${newCustomer.firstName} ${newCustomer.lastName}`.trim(),
          referralCode: newCustomer.referralCode,
        },
      });
    } catch (e: any) {
      console.error("Neon create customer error:", e);
      throw new Error("Wystąpił błąd podczas trwałego tworzenia konta w bazie danych.");
    }
  }

  // 2. Magazyn lokalny
  store.customers.push(newCustomer);
  store.referralParticipants.unshift({
    id: `ref-p-${newCustomer.id}`,
    customerId: newCustomer.id,
    email: normalizedEmail,
    customerName: `${newCustomer.firstName} ${newCustomer.lastName}`.trim(),
    referralCode: permanentReferralCode,
    totalReferralsCount: 0,
    isActive: true,
    createdAt: newCustomer.createdAt,
  });
  saveLocalStore(store);

  // 3. Dodaj kod powitalny –15%
  try {
    await saveIndividualDiscount({
      email: normalizedEmail,
      discountPercent: 15,
      scope: "ALL",
      isIndefinite: true,
      isActive: true,
      isEmailVerified: true,
      adminNote: `Rabat powitalny –15% dla nowej klientki: ${data.firstName} ${data.lastName}`,
    });
  } catch (err) {
    console.error("Błąd zapisu rabatu powitalnego:", err);
  }

  return newCustomer;
}

/**
 * Automatyczna migracja: dla wszystkich istniejących kont bez kodu lub ze starym kodem
 * generuje trwały, unikalny kod AURA-XXXXXXXX i zapisuje go w bazie.
 * Ponowne uruchomienie nie modyfikuje już przypisanych kodów!
 */
export function migrateAllReferralCodes(): void {
  const store = loadLocalStore();
  let modified = false;

  const existingCodes = new Set<string>();
  for (const c of store.customers || []) {
    if (c.referralCode && /^AURA-[2-9A-Z]{8}$/i.test(c.referralCode)) {
      existingCodes.add(c.referralCode.toUpperCase());
    }
  }
  for (const p of store.referralParticipants || []) {
    if (p.referralCode && /^AURA-[2-9A-Z]{8}$/i.test(p.referralCode)) {
      existingCodes.add(p.referralCode.toUpperCase());
    }
  }

  if (!store.customers) store.customers = [];
  if (!store.referralParticipants) store.referralParticipants = [];

  for (const customer of store.customers) {
    if (!customer.referralCode || !/^AURA-[2-9A-Z]{8}$/i.test(customer.referralCode)) {
      const code = generateUniqueReferralCode(existingCodes);
      customer.referralCode = code;
      existingCodes.add(code.toUpperCase());
      modified = true;
    }
  }

  for (const customer of store.customers) {
    const norm = customer.email.toLowerCase();
    let participant = store.referralParticipants.find(
      (p) => p.email.toLowerCase() === norm || p.customerId === customer.id
    );

    if (!participant) {
      participant = {
        id: `ref-p-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        customerId: customer.id,
        email: norm,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        referralCode: customer.referralCode,
        totalReferralsCount: 0,
        isActive: true,
        createdAt: customer.createdAt || new Date().toISOString(),
      };
      store.referralParticipants.push(participant);
      modified = true;
    } else {
      if (participant.referralCode !== customer.referralCode) {
        participant.referralCode = customer.referralCode;
        participant.customerId = customer.id;
        modified = true;
      }
    }
  }

  for (const participant of store.referralParticipants) {
    if (!participant.referralCode || !/^AURA-[2-9A-Z]{8}$/i.test(participant.referralCode)) {
      const code = generateUniqueReferralCode(existingCodes);
      participant.referralCode = code;
      existingCodes.add(code.toUpperCase());
      modified = true;
    }
  }

  if (modified) {
    saveLocalStore(store);
  }
}

/**
 * Aktualizuje status wysyłki wiadomości powitalnej dla zarejestrowanej klientki
 */
export async function updateCustomerWelcomeEmailStatus(
  customerIdOrEmail: string,
  status: "SENT" | "FAILED" | "NOT_CONFIGURED" | "PENDING",
  error?: string
): Promise<void> {
  const store = loadLocalStore();
  if (!store.customers) return;
  const lower = customerIdOrEmail.toLowerCase();
  const customer = store.customers.find((c) => c.id === customerIdOrEmail || c.email.toLowerCase() === lower);
  if (customer) {
    customer.welcomeEmailStatus = status;
    customer.welcomeEmailError = error;
    if (status === "SENT") {
      customer.welcomeEmailSentAt = new Date().toISOString();
      customer.welcomeEmailError = undefined;
    }
    saveLocalStore(store);
  }
}
