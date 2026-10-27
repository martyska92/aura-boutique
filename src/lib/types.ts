export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  orderIndex: number;
  isActive: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  size: string; // np. 'XS', 'S', 'M', 'L', 'XL', 'UNI'
  color: string; // np. 'Piaskowy Beż'
  colorHex?: string; // np. '#E5D6C5'
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  orderIndex: number;
  isPrimary: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  composition?: string;
  careGuide?: string;
  sizeGuide?: string;
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
  subtotalAmount: number;
  shippingCost: number;
  totalAmount: number;
  customerNotes?: string;
  adminNotes?: string;
  reservedUntil?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  id: string;
  boutiqueName: string;
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
