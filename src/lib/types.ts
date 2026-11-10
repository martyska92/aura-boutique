export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  orderIndex: number;
  isActive: boolean;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  orderIndex: number;
  isPrimary: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  size: string;
  color: string;
  colorHex?: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  composition?: string; // Skład materiałowy
  careGuide?: string; // Instrukcja pielęgnacji
  sizeGuide?: string; // Tabela wymiarów
  basePrice: number;
  promotionalPrice?: number;
  isPromoted: boolean; // Dedykowana rubryka: produkt w promocji
  isNew: boolean;
  isBestseller: boolean;
  isPublished: boolean;
  isArchived: boolean;
  isDemo?: boolean;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
};

export type ShippingMethod = 'INPOST_LOCKER' | 'COURIER' | 'LOCAL_PICKUP';
export type PaymentMethod = 'PRZELEWY24' | 'BLIK' | 'TRADITIONAL_TRANSFER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type FulfillmentStatus = 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type ReturnItem = {
  orderItemId: string;
  productName: string;
  variantSnapshot: string;
  quantity: number;
  reason: string;
  unitPrice: number;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
  items: ReturnItem[];
  returnMethod: 'INPOST_LOCKER' | 'COURIER' | 'IN_PERSON';
  returnTrackingNumber?: string;
  customerNote?: string;
  adminNote?: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  variantId?: string;
  productNameSnapshot: string;
  variantSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  totalSnapshot: number;
  productImageUrl?: string;
};

export type AppliedPromotionSummary = {
  id?: string;
  name: string;
  type: string;
  discountAmount: number;
  code?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  shippingMethod: ShippingMethod;
  parcelLockerCode?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber?: string;
  inpostShipmentId?: string;
  subtotalAmount: number;
  discountAmount?: number;
  originalSubtotal?: number;
  shippingCost: number;
  totalAmount: number;
  customerNotes?: string;
  adminNotes?: string;
  reservedUntil?: string;
  items: OrderItem[];
  returns?: ReturnRequest[];
  appliedPromotions?: AppliedPromotionSummary[];
  giftItem?: {
    productName: string;
    color: string;
    value: number;
  };
  referralCodeUsed?: string;
  referrerEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  id: string;
  boutiqueName: string;
  companyName?: string;
  nip?: string;
  regon?: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  announcementBarText: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl?: string;
  freeShippingFrom: number;
  courierCost: number;
  inpostLockerCost: number;
  localPickupCost: number;
  // Treści prawne edytowalne przez właścicielkę
  termsAndConditions?: string;
  privacyPolicy?: string;
  // Integracja InPost ShipX
  inpostApiKey?: string;
  inpostOrganizationId?: string;
  inpostEnvironment?: 'sandbox' | 'production';
  inpostSenderLocker?: string;
  inpostSenderName?: string;
  inpostSenderEmail?: string;
  inpostSenderPhone?: string;
  // Integracja Przelewy24
  p24MerchantId?: string;
  p24PosId?: string;
  p24CrcKey?: string;
  p24ApiKey?: string;
  p24Sandbox: boolean;
};

export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  colorHex?: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  maxStock: number;
};

// ==========================================
// SYSTEM PROMOCJI, KODÓW I RABATÓW
// ==========================================
export type PromotionType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'FREE_SHIPPING'
  | 'FREE_GIFT'
  | 'FIRST_ORDER'
  | 'INDIVIDUAL_EMAIL'
  | 'COUPON_CODE'
  | 'CATEGORY_WEEKEND';

export type PromotionStatus =
  | 'ACTIVE'
  | 'SCHEDULED'
  | 'ENDED'
  | 'DISABLED'
  | 'EXHAUSTED';

export type Promotion = {
  id: string;
  name: string; // Nazwa wewnętrzna
  publicTitle: string; // Treść widoczna dla klientek
  description?: string;
  type: PromotionType;
  discountValue: number; // np. 15 dla 15%, lub 50 dla 50 PLN
  code?: string; // Kod rabatowy (wielkość liter nie ma znaczenia)
  isAutomatic: boolean; // Automatycznie czy po wpisaniu kodu
  targetScope: 'ALL' | 'CATEGORIES' | 'PRODUCTS';
  categoryIds?: string[];
  productIds?: string[];
  excludedCategoryIds?: string[];
  excludedProductIds?: string[];
  excludeDiscounted: boolean; // Wykluczenie produktów już przecenionych
  minOrderValue?: number; // Minimalna wartość produktów po rabatach
  startDate?: string; // ISO / Europe/Warsaw
  endDate?: string;
  noEndDate: boolean;
  isRecurringWeekend?: boolean; // Cykliczna w każdy weekend (sob 00:00 - nd 23:59)
  targetAudience: 'ALL' | 'NEW_CUSTOMERS' | 'SPECIFIC_EMAILS';
  specificEmails?: string[];
  totalUsageLimit?: number;
  usageLimitPerEmail?: number;
  currentUsageCount: number;
  canCombineWithOtherPromotions: boolean;
  bannerEnabled: boolean;
  bannerText?: string;
  bannerButtonText?: string;
  bannerButtonUrl?: string;
  // Prezent do zamówienia
  giftProductId?: string;
  giftAvailableColors?: string[];
  giftStockQuantity?: number;
  giftReservedQuantity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Indywidualny rabat dla konkretnej osoby po e-mailu
export type IndividualCustomerDiscount = {
  id: string;
  email: string; // Znormalizowany: trimmed, lowercase
  discountPercent: number;
  scope: 'ALL' | 'CATEGORIES' | 'PRODUCTS';
  categoryIds?: string[];
  productIds?: string[];
  startDate?: string;
  endDate?: string;
  isIndefinite: boolean;
  isActive: boolean;
  adminNote?: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  createdAt: string;
  updatedAt: string;
};

// Program poleceń
export type ReferralParticipant = {
  id: string;
  customerId?: string;
  email: string;
  customerName: string;
  referralCode: string; // Stały, unikalny losowy kod (np. AURA-7K9P2X8M)
  totalReferralsCount: number;
  isActive: boolean;
  createdAt: string;
};

export type ReferralRewardCode = {
  id: string;
  code: string; // Jednorazowy kod 15%
  referrerEmail: string;
  referredEmail: string;
  referredOrderId: string;
  discountPercent: number; // 15%
  validUntil: string; // 30 dni od zrealizowania zamówienia koleżanki
  isUsed: boolean;
  usedAt?: string;
  usedInOrderId?: string;
  isRevoked: boolean;
  revokedReason?: string;
  adminFlagged?: boolean; // Koleżanka zwróciła zamówienie, ale kod został już zużyty
  createdAt: string;
};

// Opinie o produktach
export type ProductReview = {
  id: string;
  productId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  displayName: string; // Publiczna nazwa, np. Anna K.
  rating: number; // 1-5 gwiazdek
  content: string;
  photoUrl?: string;
  isVerifiedPurchase: boolean;
  rewardCodeIssued?: string;
  rewardPercentIssued?: number; // 2 lub 5
  rewardCodeValidUntil?: string; // 30 dni
  rewardCodeUsed?: boolean;
  hasPhotoBonusApplied?: boolean;
  isHidden: boolean; // Moderacja (np. spam, PII)
  hiddenReason?: string;
  createdAt: string;
  updatedAt: string;
};

// Historia zmian administracyjnych (Audit Log)
export type PromotionAuditLog = {
  id: string;
  timestamp: string;
  adminUser: string;
  action: string;
  details: string;
};

// Wiadomość formularza kontaktowego
export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

// Konto administratora / właścicielki
export type AdminAccount = {
  email: string; // aurazmigrod@wp.pl
  password: string; // Początkowo "dupa"
  mustChangePassword: boolean; // true na starcie, zmusza do natychmiastowej zmiany
  lastPasswordChangedAt?: string;
};

// Sesja zalogowanego użytkownika (klientka lub właścicielka)
export type UserSession = {
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  isAdmin: boolean;
  mustChangePassword?: boolean;
  customerName?: string;
  createdAt: number;
  expiresAt: number;
};

// Konto zarejestrowanej klientki butiku
export type CustomerAccount = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  passwordHash?: string;
  referralCode: string; // Stały, unikalny kod polecający np. AURA-7K9P2X8M (UNIQUE)
  createdAt: string;
  welcomeDiscountCode?: string;
};





