import fs from "fs";
import path from "path";
import {
  Category,
  Product,
  StoreSettings,
  Order,
  OrderItem,
  ReturnRequest,
  FulfillmentStatus,
  PaymentStatus,
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
}

export const initialAdminAccount: AdminAccount = {
  email: "aurazmigrod@wp.pl",
  password: "dupa",
  mustChangePassword: true,
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store-storage.json");

// Pomocnicza funkcja inicjalizacji pliku lokalnego
export function loadLocalStore(): StoreFileState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
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
      };
    }
  } catch (err) {
    console.error("Błąd odczytu lokalnego magazynu:", err);
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
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
  } catch (err) {
    console.error("Błąd zapisu domyślnego magazynu:", err);
  }

  return defaultState;
}

export function saveLocalStore(state: StoreFileState) {
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

export async function bulkUpdateOrders(
  orderIds: string[],
  updates: {
    fulfillmentStatus?: FulfillmentStatus;
    paymentStatus?: PaymentStatus;
  }
): Promise<Order[]> {
  const store = loadLocalStore();
  const now = new Date().toISOString();
  const updatedOrders: Order[] = [];

  store.orders = store.orders.map((o) => {
    if (orderIds.includes(o.id)) {
      if (updates.fulfillmentStatus) o.fulfillmentStatus = updates.fulfillmentStatus;
      if (updates.paymentStatus) o.paymentStatus = updates.paymentStatus;
      o.updatedAt = now;
      updatedOrders.push(o);
    }
    return o;
  });

  saveLocalStore(store);
  return updatedOrders;
}

// Klientka edytuje zamówienie (dokupuje lub zmienia pozycje przed akceptacją butiku)
export async function editOrderCustomer(
  orderId: string,
  newItems: OrderItem[]
): Promise<Order> {
  const store = loadLocalStore();
  const order = store.orders.find((o) => o.id === orderId);
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

  order.items = newItems;
  order.subtotalAmount = subtotal;
  order.shippingCost = shippingCost;
  order.totalAmount = subtotal + shippingCost;
  order.updatedAt = new Date().toISOString();

  saveLocalStore(store);
  return order;
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
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Nie znaleziono zamówienia");

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

  if (!order.returns) {
    order.returns = [];
  }
  order.returns.unshift(returnRequest);
  order.updatedAt = new Date().toISOString();

  saveLocalStore(store);
  return returnRequest;
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
  const store = loadLocalStore();
  return store.referralParticipants || [];
}

export async function getAllReferralRewardCodes(): Promise<ReferralRewardCode[]> {
  const store = loadLocalStore();
  return store.referralRewardCodes || [];
}

export async function getOrCreateReferralParticipant(
  email: string,
  customerName: string
): Promise<ReferralParticipant> {
  const store = loadLocalStore();
  if (!store.referralParticipants) store.referralParticipants = [];
  const normalizedEmail = email.trim().toLowerCase();

  const existing = store.referralParticipants.find(
    (p) => p.email.trim().toLowerCase() === normalizedEmail
  );
  if (existing) return existing;

  // Tworzymy unikalny, czytelny kod polecający
  const firstName = customerName.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "") || "AURA";
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const code = `${firstName}-AURA${randomSuffix}`;

  const newParticipant: ReferralParticipant = {
    id: `ref-p-${Date.now()}`,
    email: normalizedEmail,
    customerName: customerName.trim(),
    referralCode: code,
    totalReferralsCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  store.referralParticipants.unshift(newParticipant);
  saveLocalStore(store);
  return newParticipant;
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
  orderNumber: string;
  customerEmail: string;
  displayName: string;
  rating: number;
  content: string;
  photoUrl?: string;
}): Promise<{ review: ProductReview; rewardCode?: string; rewardPercent?: number }> {
  const store = loadLocalStore();
  if (!store.productReviews) store.productReviews = [];
  const normalizedEmail = data.customerEmail.trim().toLowerCase();

  // WERYFIKACJA ZAKUPU: szukamy zrealizowanego zamówienia (DELIVERED) zawierającego ten produkt
  const verifiedOrder = store.orders.find((o) => {
    const isMatchingOrder =
      o.orderNumber.toUpperCase() === data.orderNumber.trim().toUpperCase() ||
      o.id === data.orderNumber.trim();
    const isMatchingEmail = o.customerEmail.trim().toLowerCase() === normalizedEmail;
    const isDelivered = o.fulfillmentStatus === "DELIVERED";
    const hasProduct = o.items.some(
      (item) => item.variantSnapshot.includes(data.productId) || item.productNameSnapshot
    );
    return isMatchingOrder && isMatchingEmail && isDelivered;
  });

  if (!verifiedOrder) {
    throw new Error(
      "Opinie mogą wystawiać wyłącznie klientki, których zamówienie na ten produkt zostało już zrealizowane i doręczone."
    );
  }

  // Sprawdzamy czy klientka nie otrzymała już nagrody za ten produkt
  const existingReview = store.productReviews.find(
    (r) =>
      r.productId === data.productId &&
      r.customerEmail.trim().toLowerCase() === normalizedEmail
  );
  if (existingReview) {
    throw new Error("Wystawiłaś już opinię dla tego produktu.");
  }

  // Przyznanie kodu: 2% za tekst, 5% za opinię ze zdjęciem
  const hasPhoto = Boolean(data.photoUrl && data.photoUrl.trim());
  const rewardPercent = hasPhoto ? 5 : 2;
  const rewardCode = `OPINIA-${rewardPercent}P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const validUntil = addDaysWarsaw(30);

  const review: ProductReview = {
    id: `rev-${Date.now()}`,
    productId: data.productId,
    orderId: verifiedOrder.id,
    orderNumber: verifiedOrder.orderNumber,
    customerEmail: normalizedEmail,
    displayName: data.displayName.trim() || "Klientka AURA",
    rating: Math.max(1, Math.min(5, Math.round(data.rating))),
    content: data.content.trim(),
    photoUrl: data.photoUrl?.trim(),
    isVerifiedPurchase: true,
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
export async function getAdminAccount(): Promise<AdminAccount> {
  const store = loadLocalStore();
  if (!store.adminAccount) {
    store.adminAccount = { ...initialAdminAccount };
    saveLocalStore(store);
  }
  return store.adminAccount;
}

export async function updateAdminPassword(newPassword: string): Promise<AdminAccount> {
  const store = loadLocalStore();
  if (!store.adminAccount) {
    store.adminAccount = { ...initialAdminAccount };
  }
  store.adminAccount.password = newPassword.trim();
  store.adminAccount.mustChangePassword = false;
  store.adminAccount.lastPasswordChangedAt = new Date().toISOString();
  saveLocalStore(store);

  await addPromotionAuditLog(
    "ZMIANA_HASŁA_WŁAŚCICIELKI",
    "Pomyślnie zmieniono hasło dla konta aurazmigrod@wp.pl. Hasło jednorazowe zostało wyłączone.",
    "Właścicielka (aurazmigrod@wp.pl)"
  );

  return store.adminAccount;
}

// ==========================================
// KLIENCI BUTIKU (REJESTRACJA I LOGOWANIE)
// ==========================================
export async function getCustomers(): Promise<CustomerAccount[]> {
  const store = loadLocalStore();
  return store.customers || [];
}

export async function getCustomerByEmail(email: string): Promise<CustomerAccount | null> {
  const store = loadLocalStore();
  const normalized = email.trim().toLowerCase();
  const customer = (store.customers || []).find((c) => c.email.toLowerCase() === normalized);
  return customer || null;
}

export async function createCustomerAccount(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;
}): Promise<CustomerAccount> {
  const store = loadLocalStore();
  if (!store.customers) store.customers = [];

  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = store.customers.find((c) => c.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error("Konto z tym adresem e-mail już istnieje. Zaloguj się.");
  }

  const welcomeCode = `WITAJ15-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newCustomer: CustomerAccount = {
    id: `cust-${Date.now()}`,
    email: normalizedEmail,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: data.phone?.trim() || "",
    passwordHash: data.password ? data.password.trim() : undefined,
    createdAt: new Date().toISOString(),
    welcomeDiscountCode: welcomeCode,
  };

  store.customers.push(newCustomer);
  saveLocalStore(store);

  // Dodajemy też kod powitalny –15% jako indywidualny rabat
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
