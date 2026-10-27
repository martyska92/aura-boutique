import fs from "fs";
import path from "path";
import {
  Category,
  Product,
  StoreSettings,
  Order,
  FulfillmentStatus,
  PaymentStatus,
} from "./types";
import {
  initialCategories,
  initialProducts,
  initialStoreSettings,
  initialOrders,
} from "./demo-data";
import { prisma } from "./prisma";

interface StoreFileState {
  categories: Category[];
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store-storage.json");

// Pomocnicza funkcja inicjalizacji pliku lokalnego
function loadLocalStore(): StoreFileState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Błąd odczytu lokalnego magazynu:", err);
  }

  const defaultState: StoreFileState = {
    categories: initialCategories,
    products: initialProducts,
    orders: initialOrders,
    settings: initialStoreSettings,
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
  } catch (err) {
    console.error("Błąd zapisu domyślnego magazynu:", err);
  }

  return defaultState;
}

function saveLocalStore(state: StoreFileState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Błąd zapisu danych:", err);
  }
}

// Sprawdzenie czy Neon PostgreSQL jest skonfigurowany
export function isNeonConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
    !url.includes("localhost:51213") &&
    !url.includes("username:password") &&
    (url.startsWith("postgresql://") || url.startsWith("postgres://"))
  );
}

// ==========================================
// KATEGORIE
// ==========================================
export async function getCategories(): Promise<Category[]> {
  const store = loadLocalStore();
  return store.categories.sort((a, b) => a.orderIndex - b.orderIndex);
}

// ==========================================
// PRODUKTY
// ==========================================
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
  const product = store.products.find((p) => p.slug === slug);
  if (!product) return null;
  return {
    ...product,
    category: store.categories.find((c) => c.id === product.categoryId),
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const store = loadLocalStore();
  const product = store.products.find((p) => p.id === id);
  if (!product) return null;
  return {
    ...product,
    category: store.categories.find((c) => c.id === product.categoryId),
  };
}

export async function saveProduct(productData: Partial<Product>): Promise<Product> {
  const store = loadLocalStore();
  const now = new Date().toISOString();

  if (productData.id) {
    // Edycja
    const idx = store.products.findIndex((p) => p.id === productData.id);
    if (idx === -1) throw new Error("Produkt nie został znaleziony");

    const updated: Product = {
      ...store.products[idx],
      ...productData,
      updatedAt: now,
    } as Product;

    store.products[idx] = updated;
    saveLocalStore(store);
    return updated;
  } else {
    // Nowy produkt
    const newId = `prod-${Date.now()}`;
    const slug =
      productData.slug ||
      productData.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") ||
      `produkt-${Date.now()}`;

    const newProduct: Product = {
      id: newId,
      name: productData.name || "Nowy produkt",
      slug,
      description: productData.description || "",
      composition: productData.composition || "",
      careGuide: productData.careGuide || "",
      sizeGuide: productData.sizeGuide || "",
      basePrice: Number(productData.basePrice || 0),
      promotionalPrice: productData.promotionalPrice ? Number(productData.promotionalPrice) : undefined,
      isPromoted: Boolean(productData.isPromoted),
      isNew: Boolean(productData.isNew),
      isBestseller: Boolean(productData.isBestseller),
      isPublished: productData.isPublished !== undefined ? productData.isPublished : true,
      isArchived: Boolean(productData.isArchived),
      isDemo: false,
      categoryId: productData.categoryId || store.categories[0]?.id || "cat-sukienki",
      images: productData.images || [],
      variants: productData.variants || [],
      createdAt: now,
      updatedAt: now,
    };

    store.products.unshift(newProduct);
    saveLocalStore(store);
    return newProduct;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = loadLocalStore();
  const idx = store.products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.products.splice(idx, 1);
  saveLocalStore(store);
  return true;
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
// ZAMÓWIENIA
// ==========================================
export async function getAllOrders(): Promise<Order[]> {
  const store = loadLocalStore();
  return store.orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const store = loadLocalStore();
  return store.orders.find((o) => o.id === id) || null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const store = loadLocalStore();
  return store.orders.find((o) => o.orderNumber === orderNumber) || null;
}

export async function createOrder(
  orderInput: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">
): Promise<Order> {
  const store = loadLocalStore();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `AURA-${dateStr}-${randomSuffix}`;
  const now = new Date().toISOString();

  // Weryfikacja i obniżenie stanu magazynowego na serwerze
  for (const item of orderInput.items) {
    if (item.variantId) {
      for (const prod of store.products) {
        const variant = prod.variants.find((v) => v.id === item.variantId);
        if (variant) {
          if (variant.stockQuantity < item.quantity) {
            throw new Error(
              `Brak wystarczającej ilości towaru: ${prod.name} (${variant.size}, ${variant.color}). Dostępne: ${variant.stockQuantity} szt.`
            );
          }
          variant.stockQuantity -= item.quantity;
        }
      }
    }
  }

  const newOrder: Order = {
    ...orderInput,
    id: `ord-${Date.now()}`,
    orderNumber,
    createdAt: now,
    updatedAt: now,
  };

  store.orders.unshift(newOrder);
  saveLocalStore(store);
  return newOrder;
}

export async function updateOrderAdmin(
  orderId: string,
  updates: {
    fulfillmentStatus?: FulfillmentStatus;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    adminNotes?: string;
  }
): Promise<Order> {
  const store = loadLocalStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Nie znaleziono zamówienia");

  if (updates.fulfillmentStatus) order.fulfillmentStatus = updates.fulfillmentStatus;
  if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus;
  if (updates.trackingNumber !== undefined) order.trackingNumber = updates.trackingNumber;
  if (updates.adminNotes !== undefined) order.adminNotes = updates.adminNotes;
  order.updatedAt = new Date().toISOString();

  saveLocalStore(store);
  return order;
}

// ==========================================
// USTAWIENIA SKLEPU
// ==========================================
export async function getStoreSettings(): Promise<StoreSettings> {
  const store = loadLocalStore();
  return store.settings;
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings>
): Promise<StoreSettings> {
  const store = loadLocalStore();
  store.settings = { ...store.settings, ...settings };
  saveLocalStore(store);
  return store.settings;
}
