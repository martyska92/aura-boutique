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

export type PriceHistoryRecord = {
  id: string;
  productId: string;
  variantId?: string;
  price: number;
  isPromotion: boolean;
  changedAt: string; // ISO date string
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
  price?: number; // Indywidualna cena wariantu (jeśli różna od bazowej)
  promotionalPrice?: number;
  lowestPrice30Days?: number;
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
  promotionStartedAt?: string; // Data rozpoczęcia promocji
  lowestPrice30Days?: number; // Dyrektywa Omnibus: najniższa cena z 30 dni przed obniżką
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
  priceHistory?: PriceHistoryRecord[];
  createdAt: string;
  updatedAt: string;
};

export type ShippingMethod = 'INPOST_LOCKER' | 'COURIER' | 'LOCAL_PICKUP';
export type PaymentMethod = 'PRZELEWY24' | 'BLIK' | 'PAYU' | 'TRADITIONAL_TRANSFER' | 'COD';
export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';
export type FulfillmentStatus =
  | 'NEW'
  | 'PROCESSING'
  | 'READY_FOR_SHIPMENT'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

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
  unitPriceSnapshot: number; // cena katalogowa bazowa
  originalUnitPrice?: number; // cena jednostkowa przed rabatem
  discountedUnitPrice?: number; // cena jednostkowa po uwzględnieniu rabatu
  quantity: number;
  totalSnapshot: number; // suma końcowa za pozycję po rabacie
  originalTotalSnapshot?: number; // suma za pozycję przed rabatem
  discountAmount?: number; // wartość rabatu na tej pozycji
  appliedPromoName?: string; // nazwa zastosowanej promocji lub kodu
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
  isTest?: boolean;
  accessKey?: string; // bezpieczny unikalny token dostępu dla klientki (np. gościa)
  customerId?: string; // powiązanie z kontem zarejestrowanej klientki
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
  paidAt?: string; // data zaksięgowania / weryfikacji wpłaty
  paymentOperator?: string; // np. "PRZELEWY24" | "TRADITIONAL_TRANSFER" | "COD"
  p24SessionId?: string;
  p24OrderId?: number;
  trackingNumber?: string;
  inpostShipmentId?: string;
  subtotalAmount: number; // wartość produktów po rabacie
  discountAmount?: number; // łączna kwota rabatu
  originalSubtotal?: number; // wartość produktów przed rabatem
  shippingCost: number;
  totalAmount: number;
  couponCode?: string;
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
  bankTransferDetails?: {
    recipient: string;
    accountNumber: string;
    bankName?: string;
    amount: number;
    title: string;
    deadlineHours: number;
  };
  // Dane do faktury
  wantsInvoice?: boolean;
  invoiceType?: "COMPANY" | "PRIVATE";
  invoiceCompanyName?: string;
  invoiceNip?: string;
  invoiceStreet?: string;
  invoiceCity?: string;
  invoicePostalCode?: string;
  invoicePdfUrl?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
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
  registeredAddress?: string;
  returnAddress?: string;
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
  // Konfiguracja wysyłki wiadomości e-mail (kody rabatowe, powiadomienia, opinie)
  emailProvider?: "smtp" | "resend";
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  emailSenderName?: string;
  emailSenderAddress?: string;
  resendApiKey?: string;
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
  p24Enabled?: boolean;
  // Integracja PayU (w tym BLIK przez PayU)
  payuEnabled?: boolean;
  payuSandbox?: boolean;
  payuPosId?: string;
  payuSecondKey?: string;
  payuClientId?: string;
  payuClientSecret?: string;
  payuPosIdSandbox?: string;
  payuSecondKeySandbox?: string;
  payuClientIdSandbox?: string;
  payuClientSecretSandbox?: string;
  defaultPaymentGateway?: "P24" | "PAYU";
  payuConfigured?: boolean;
  // Treści banera i paska ogłoszeń
  heroButtonText?: string;
  heroButtonLink?: string;
  heroSlides?: HeroSlide[];
  announcementBarLeft?: string;
  announcementBarRight?: string;
  announcementItems?: string[];
  // Wizualny edytor banera głównego (szkic roboczy i opublikowana wersja)
  visualBannerDraft?: VisualBannerConfig;
  visualBannerPublished?: VisualBannerConfig;
  bannerVersion?: number;
  bannerPublishedAt?: string;
  // Flagi bezpieczeństwa sekretów serwerowych
  smtpPasswordConfigured?: boolean;
  resendApiKeyConfigured?: boolean;
  // Płatności tradycyjne i za pobraniem
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountRecipient?: string;
  traditionalTransferEnabled?: boolean;
  codEnabled?: boolean;
};

export type HeroSlide = {
  id: string;
  headline: string;
  subheadline: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  order: number;
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

// Indywidualne rabaty przypisane do konkretnej klientki
export type IndividualDiscountRecord = {
  id: string;
  code: string;
  customerId?: string;
  customerEmail: string;
  discountPercent: number;
  isPermanent: boolean;
  validUntil?: string;
  minCartValue?: number;
  canCombine: boolean;
  adminNote?: string;
  grantedBy: string;
  isUsed: boolean;
  usedAt?: string;
  usedInOrderId?: string;
  isRevoked: boolean;
  revokedAt?: string;
  revokedReason?: string;
  emailSentAt?: string;
  emailSendStatus?: "SENT" | "FAILED" | "NOT_SENT";
  emailSendError?: string;
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
  orderId?: string;
  orderNumber?: string;
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
  email: string;
  passwordHash?: string;
  mustChangePassword: boolean;
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
  googleId?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  verificationExpiresAt?: string;
  resendCooldownUntil?: string;
  resendAttemptsCount?: number;
  welcomeDiscountUsed?: boolean;
  referralCode: string; // Stały, unikalny kod polecający np. AURA-7K9P2X8M (UNIQUE)
  createdAt: string;
  welcomeDiscountCode?: string;
  welcomeDiscountUsedAt?: string;
  welcomeDiscountUsedInOrderId?: string;
  welcomeEmailStatus?: "PENDING" | "SENT" | "FAILED" | "NOT_CONFIGURED";
  welcomeEmailError?: string;
  welcomeEmailSentAt?: string;
  wishlistProductIds?: string[];
  // Domyślny adres dostawy i ostatni Paczkomat
  defaultStreet?: string;
  defaultCity?: string;
  defaultPostalCode?: string;
  lastParcelLocker?: string;
  lastParcelLockerAddress?: string;
  // Dane do faktury
  invoiceType?: "COMPANY" | "PRIVATE";
  invoiceCompanyName?: string;
  invoiceNip?: string;
  invoiceStreet?: string;
  invoiceCity?: string;
  invoicePostalCode?: string;
};

// ==========================================
// WIZUALNY EDYTOR BANERA GŁÓWNEGO
// ==========================================
export type DeviceViewport = "desktop" | "tablet" | "mobile";

export interface VisualElementResponsiveProps {
  x: number; // 0 do 100 procent szerokości banera
  y: number; // 0 do 100 procent wysokości banera
  width?: number; // procentowa szerokość pola tekstowego (np. 50%) lub undefined dla auto
  fontSize?: number; // rozmiar fontu w px
  textAlign?: "left" | "center" | "right";
  visible?: boolean;
}

export interface BannerTextElement {
  id: string;
  type: "text";
  label?: string; // np. "Nagłówek", "Podtytuł", "Hasło 1"
  text: string;
  fontFamily: "serif" | "sans" | "playfair" | "cormorant" | "montserrat" | "inter" | "script";
  fontWeight: 300 | 400 | 500 | 600 | 700;
  italic: boolean;
  color: string; // kod HEX np. #241D1B
  letterSpacing: number; // w px lub em
  lineHeight: number; // np. 1.2
  opacity: number; // 0 do 1
  zIndex: number;
  // Cień tekstu
  hasShadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowX?: number;
  shadowY?: number;
  // Obrys tekstu
  hasStroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  // Tło pod tekstem (kapsuła / frosted glass)
  hasBackground?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  backgroundPadding?: number; // w px
  borderRadius?: number; // w px
  // Pozycje i wielkości per urządzenie
  desktop: VisualElementResponsiveProps;
  tablet?: VisualElementResponsiveProps;
  mobile?: VisualElementResponsiveProps;
}

export interface BannerButtonElement {
  id: string;
  type: "button";
  text: string;
  link: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius: number;
  paddingY: number;
  paddingX: number;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  letterSpacing: number;
  hasShadow?: boolean;
  visible: boolean;
  zIndex: number;
  // Pozycje per urządzenie
  desktop: VisualElementResponsiveProps;
  tablet?: VisualElementResponsiveProps;
  mobile?: VisualElementResponsiveProps;
}

export interface BannerOverlayConfig {
  enabled: boolean;
  color: string; // np. #000000 lub #423229
  opacity: number; // 0 do 1
  gradientType: "none" | "to-bottom" | "to-top" | "to-right" | "radial";
}

export interface VisualBannerConfig {
  imageUrl: string;
  focalPointX: number; // 0 do 100 (%)
  focalPointY: number; // 0 do 100 (%)
  aspectRatioDesktop: string; // np. "1024/380"
  aspectRatioTablet: string; // np. "768/400"
  aspectRatioMobile: string; // np. "375/460"
  overlay: BannerOverlayConfig;
  textElements: BannerTextElement[];
  buttonElement: BannerButtonElement;
  updatedAt: string;
  publishedAt?: string;
}

// Notatki własne właścicielki
export type OwnerNote = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isCompleted: boolean;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
};

// Terminarz i kalendarz zadań butiku
export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM
  category: "TAXES" | "DELIVERIES" | "BOUTIQUE" | "OTHER";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isCompleted: boolean;
  recurrenceRule?: "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY";
  recurringId?: string;
  isException?: boolean;
  completedDates?: string[]; // Array stringów dat wystąpień (YYYY-MM-DD)
  reminderDays?: number; // 0, 1, 3
  createdAt: string;
  updatedAt: string;
};

// ==========================================
// SYSTEM KOPII ZAPASOWYCH I DISASTER RECOVERY
// ==========================================
export type BackupTrigger =
  | "MANUAL"
  | "DAILY_SCHEDULED"
  | "MONTHLY"
  | "PRE_MIGRATION"
  | "PRE_RESTORE";

export interface BackupMetadata {
  id: string; // np. "backup-2026-11-18-003015-manual"
  filename: string;
  createdAt: string;
  trigger: BackupTrigger;
  label: string;
  sizeBytes: number;
  sizeFormatted: string;
  recordCounts: {
    customers: number;
    orders: number;
    products: number;
    variants: number;
    discounts: number;
    newsletter: number;
    notes: number;
    calendar: number;
    mediaAssets: number;
    settingsIncluded: boolean;
    bannersIncluded: boolean;
  };
  sha256Checksum: string;
  encryptionAlgorithm: "AES-256-GCM";
  isEncrypted: boolean;
  storageLocation: "OFFSITE_LOCAL_SECURE" | "NEON_STANDALONE";
  retentionDays: number;
}

export interface BackupSystemStatus {
  lastBackupDate: string | null;
  lastBackupStatus: "SUCCESS" | "FAILED" | "IDLE";
  lastBackupError?: string;
  lastBackupSize: string;
  totalBackupsCount: number;
  lastRestoreTestDate: string | null;
  lastRestoreTestResult: {
    success: boolean;
    timestamp: string;
    durationMs: number;
    checkedItemsCount: number;
    warnings: string[];
    details: string;
  } | null;
  storageInfo: {
    retentionDailyDays: number; // 30 dni
    retentionMonthlyMonths: number; // 6 miesięcy
    encryption: string;
    offsiteProtected: boolean;
  };
  neonPlanAudit: {
    planType: "Neon Free Tier (Aktualny)" | "Neon Pro / Launch (Rekomendowane dla PITR 30 dni)";
    pitrSupportedHours: number; // 24h w Free Tier
    pitrProSupportedDays: number; // 30 dni w Pro
    rpoDescription: string; // "Do 24 godzin przy awarii bazy; ~0 min w ramach okna PITR Neon"
    rtoDescription: string; // "2 - 5 minut przy procedurze awaryjnej z pliku snapshotu"
    photoStorage: string; // "Cloudinary CDN (chmura ze stałym URL) + lokalna kopia zapasowa manifestu"
    recommendedUpgradeCost: string; // "Opcjonalnie: Neon Launch (~19 USD/miesięcznie) dla 30 dni PITR"
  };
  activeAlert?: {
    level: "WARNING" | "CRITICAL";
    message: string;
    createdAt: string;
  } | null;
}

export interface RestoreTestResult {
  success: boolean;
  backupId: string;
  testedAt: string;
  durationMs: number;
  verifiedCounts: {
    customers: number;
    orders: number;
    products: number;
    newsletter: number;
    notes: number;
    calendar: number;
  };
  sideEffectsPrevented: {
    emailsSuppressed: boolean;
    paymentWebhooksDisabled: boolean;
    oldSessionsInvalidated: boolean;
    resetTokensPurged: boolean;
  };
  reconciliationAudit: {
    ordersCreatedAfterBackup: number;
    paymentsToReconcile: number;
    postBackupNewsletterUnsubscribes: number;
  };
  details: string;
  warnings: string[];
}






