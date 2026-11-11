import {
  Category,
  Product,
  StoreSettings,
  Order,
  Promotion,
  IndividualCustomerDiscount,
  ReferralParticipant,
  ReferralRewardCode,
  ProductReview,
  PromotionAuditLog,
} from "./types";

export const initialCategories: Category[] = [
  {
    id: "cat-bluzy",
    name: "Bluzy",
    slug: "bluzy",
    description: "Wygodne, miękkie i stylowe bluzy damskie z wysokogatunkowych tkanin.",
    imageUrl: "/images/categories/cat-bluzy.jpg",
    orderIndex: 1,
    isActive: true,
  },
  {
    id: "cat-koszule",
    name: "Koszule",
    slug: "koszule",
    description: "Eleganckie koszule satynowe, bawełniane i wiskozowe na każdą okazję.",
    imageUrl: "/images/categories/cat-koszule.jpg",
    orderIndex: 2,
    isActive: true,
  },
  {
    id: "cat-topy",
    name: "Topy",
    slug: "topy",
    description: "Kobiece topy na ramiączkach, satynowe bazy i minimalistyczne fasony.",
    imageUrl: "/images/categories/cat-topy.jpg",
    orderIndex: 3,
    isActive: true,
  },
  {
    id: "cat-t-shirty",
    name: "T-shirty",
    slug: "t-shirty",
    description: "Klasyczne t-shirty z bawełny organicznej w odcieniach nude, bieli i czerni.",
    imageUrl: "/images/categories/cat-t-shirty.jpg",
    orderIndex: 4,
    isActive: true,
  },
  {
    id: "cat-marynarki",
    name: "Marynarki",
    slug: "marynarki",
    description: "Dopasowane i oversize'owe marynarki dodające klasy każdej stylizacji.",
    imageUrl: "/images/categories/cat-marynarki.jpg",
    orderIndex: 5,
    isActive: true,
  },
];

export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Satynowa Sukienka Midi z Wiązaniem",
    slug: "satynowa-sukienka-midi-z-wiazaniem",
    description:
      "Zmysłowa i niezwykle kobieca sukienka midi wykonana z lejącej, najwyższej próby satyny jedwabistej. Regulowane ramiączka, subtelny dekolt woda oraz pasek podkreślający talię sprawiają, że leży nienagannie na każdej sylwetce. Idealna na wyjątkowe okazje, wieczorne wyjścia i eleganckie spotkania.",
    composition: "75% wiskoza wysokogatunkowa, 25% jedwab naturalny",
    careGuide:
      "Pranie delikatne ręczne w temperaturze max 30°C z użyciem płynów do tkanin delikatnych. Prasować po lewej stronie chłodnym żelazkiem (max 110°C). Nie wirować.",
    sizeGuide:
      "XS: Biust 82-86 cm, Talia 62-66 cm, Długość 122 cm\nS: Biust 86-90 cm, Talia 66-70 cm, Długość 123 cm\nM: Biust 90-95 cm, Talia 70-75 cm, Długość 124 cm\nL: Biust 95-100 cm, Talia 75-80 cm, Długość 125 cm",
    basePrice: 349.0,
    promotionalPrice: 299.0,
    isPromoted: true,
    isNew: true,
    isBestseller: true,
    isPublished: true,
    isArchived: false,
    isDemo: true,
    categoryId: "cat-koszule",
    images: [
      {
        id: "img-1-1",
        productId: "prod-1",
        url: "/images/products/sukienka-satynowa-ivory.jpg",
        altText: "Satynowa Sukienka Midi Ivory AURA Boutique",
        orderIndex: 1,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-1-xs-ivory",
        productId: "prod-1",
        size: "XS",
        color: "Kość Słoniowa (Ivory)",
        colorHex: "#FAF4EC",
        sku: "AURA-SUK-01-XS-IVR",
        stockQuantity: 4,
        reservedQuantity: 0,
      },
      {
        id: "var-1-s-ivory",
        productId: "prod-1",
        size: "S",
        color: "Kość Słoniowa (Ivory)",
        colorHex: "#FAF4EC",
        sku: "AURA-SUK-01-S-IVR",
        stockQuantity: 6,
        reservedQuantity: 0,
      },
      {
        id: "var-1-m-ivory",
        productId: "prod-1",
        size: "M",
        color: "Kość Słoniowa (Ivory)",
        colorHex: "#FAF4EC",
        sku: "AURA-SUK-01-M-IVR",
        stockQuantity: 3,
        reservedQuantity: 0,
      },
      {
        id: "var-1-l-ivory",
        productId: "prod-1",
        size: "L",
        color: "Kość Słoniowa (Ivory)",
        colorHex: "#FAF4EC",
        sku: "AURA-SUK-01-L-IVR",
        stockQuantity: 2,
        reservedQuantity: 0,
      },
      {
        id: "var-1-s-black",
        productId: "prod-1",
        size: "S",
        color: "Głęboka Czerń",
        colorHex: "#141414",
        sku: "AURA-SUK-01-S-BLK",
        stockQuantity: 5,
        reservedQuantity: 0,
      },
      {
        id: "var-1-m-black",
        productId: "prod-1",
        size: "M",
        color: "Głęboka Czerń",
        colorHex: "#141414",
        sku: "AURA-SUK-01-M-BLK",
        stockQuantity: 4,
        reservedQuantity: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Sweter ze Splotem Wełniano-Kaszmirowym",
    slug: "sweter-ze-splotem-welniano-kaszmirowym",
    description:
      "Niezwykle miękki i ciepły sweter ze stójką, uszyty z luksusowej mieszanki wełny merino i kaszmiru. Delikatny prążkowany splot, obniżona linia ramion oraz klasyczny fason gwarantują swobodę i ponadczasowy styl.",
    composition: "70% wełna merynosowa (Merino Wool), 30% kaszmir",
    careGuide:
      "Pranie chemiczne lub pranie ręczne w chłodnej wodzie w płynie do wełny. Suszyć wyłącznie rozłożony na płasko na ręczniku. Nie wykręcać.",
    sizeGuide:
      "S: Biust 96-104 cm, Długość całkowita 60 cm, Rękaw 62 cm\nM: Biust 102-110 cm, Długość całkowita 62 cm, Rękaw 63 cm\nL: Biust 108-116 cm, Długość całkowita 64 cm, Rękaw 64 cm",
    basePrice: 389.0,
    promotionalPrice: undefined,
    isPromoted: false,
    isNew: true,
    isBestseller: true,
    isPublished: true,
    isArchived: false,
    isDemo: true,
    categoryId: "cat-bluzy",
    images: [
      {
        id: "img-2-1",
        productId: "prod-2",
        url: "/images/products/sweter-kaszmirowy-sand.jpg",
        altText: "Sweter z Wełną Merino i Kaszmirem Piaskowy Beż AURA",
        orderIndex: 1,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-2-s-sand",
        productId: "prod-2",
        size: "S",
        color: "Piaskowy Beż (Sand)",
        colorHex: "#D8C7B5",
        sku: "AURA-SWE-02-S-SND",
        stockQuantity: 5,
        reservedQuantity: 0,
      },
      {
        id: "var-2-m-sand",
        productId: "prod-2",
        size: "M",
        color: "Piaskowy Beż (Sand)",
        colorHex: "#D8C7B5",
        sku: "AURA-SWE-02-M-SND",
        stockQuantity: 7,
        reservedQuantity: 0,
      },
      {
        id: "var-2-l-sand",
        productId: "prod-2",
        size: "L",
        color: "Piaskowy Beż (Sand)",
        colorHex: "#D8C7B5",
        sku: "AURA-SWE-02-L-SND",
        stockQuantity: 3,
        reservedQuantity: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    name: "Elegancki Garnitur Damski Blush Rose",
    slug: "elegancki-garnitur-damski-blush-rose",
    description:
      "Damski garnitur w odcieniu przydymionego pudrowego różu. Zestaw składa się z jednorzędowej marynarki o nowoczesnej, lekko luźniejszej linii oraz spodni z wysokim stanem i eleganckim kantem. Perfekcyjne krawiectwo i wykończenie.",
    composition: "68% poliester szlachetny, 28% wiskoza, 4% elastan. Podszewka: 100% acetat oddychający.",
    careGuide: "Zalecane profesjonalne czyszczenie chemiczne.",
    sizeGuide:
      "36 (S): Marynarka biust 92 cm, talia spodni 68 cm, biodra 94 cm\n38 (M): Marynarka biust 96 cm, talia spodni 72 cm, biodra 98 cm\n40 (L): Marynarka biust 100 cm, talia spodni 76 cm, biodra 102 cm",
    basePrice: 549.0,
    promotionalPrice: 469.0,
    isPromoted: true,
    isNew: false,
    isBestseller: true,
    isPublished: true,
    isArchived: false,
    isDemo: true,
    categoryId: "cat-marynarki",
    images: [
      {
        id: "img-3-1",
        productId: "prod-3",
        url: "/images/products/garnitur-blush-rose.jpg",
        altText: "Komplet Garniturowy Pudrowy Róż AURA Boutique",
        orderIndex: 1,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-3-s-blush",
        productId: "prod-3",
        size: "S (36)",
        color: "Pudrowy Róż (Blush)",
        colorHex: "#E5BEB8",
        sku: "AURA-KOM-03-S-BLS",
        stockQuantity: 3,
        reservedQuantity: 0,
      },
      {
        id: "var-3-m-blush",
        productId: "prod-3",
        size: "M (38)",
        color: "Pudrowy Róż (Blush)",
        colorHex: "#E5BEB8",
        sku: "AURA-KOM-03-M-BLS",
        stockQuantity: 4,
        reservedQuantity: 0,
      },
      {
        id: "var-3-l-blush",
        productId: "prod-3",
        size: "L (40)",
        color: "Pudrowy Róż (Blush)",
        colorHex: "#E5BEB8",
        sku: "AURA-KOM-03-L-BLS",
        stockQuantity: 2,
        reservedQuantity: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    name: "Dwurzędowy Płaszcz Wełniany Camel",
    slug: "dwurzedowy-plaszcz-welniany-camel",
    description:
      "Kultowy płaszcz w odcieniu ciepłego camel. Uszyty z gęstej wełny owczej z dodatkiem kaszmiru. Posiada pasek z klamrą do wiązania w talii, szerokie klapy i rozcięcie z tyłu zapewniające komfort ruchu. Prawdziwa inwestycja na lata w garderobie eleganckiej kobiety.",
    composition: "80% wełna jagnięca, 20% poliamid zapewniający trwałość formy. Podszewka: 100% wiskoza.",
    careGuide: "Wyłącznie czyszczenie chemiczne.",
    sizeGuide:
      "S/M: Biust do 102 cm, Biodra do 106 cm, Długość 118 cm\nM/L: Biust do 110 cm, Biodra do 114 cm, Długość 120 cm",
    basePrice: 799.0,
    promotionalPrice: undefined,
    isPromoted: false,
    isNew: true,
    isBestseller: false,
    isPublished: true,
    isArchived: false,
    isDemo: true,
    categoryId: "cat-marynarki",
    images: [
      {
        id: "img-4-1",
        productId: "prod-4",
        url: "/images/products/plaszcz-welna-camel.jpg",
        altText: "Wełniany Płaszcz Camel AURA Boutique K.B.",
        orderIndex: 1,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-4-sm-camel",
        productId: "prod-4",
        size: "S/M",
        color: "Ciepły Camel",
        colorHex: "#B8874E",
        sku: "AURA-PLA-04-SM-CML",
        stockQuantity: 4,
        reservedQuantity: 0,
      },
      {
        id: "var-4-ml-camel",
        productId: "prod-4",
        size: "M/L",
        color: "Ciepły Camel",
        colorHex: "#B8874E",
        sku: "AURA-PLA-04-ML-CML",
        stockQuantity: 3,
        reservedQuantity: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialStoreSettings: StoreSettings = {
  id: "default",
  boutiqueName: "AURA Boutique K.B.",
  companyName: "AURA Boutique K.B. Karolina Borkowska",
  nip: "9151234567",
  regon: "021987654",
  address: "Żmigród | ul. Poprzeczna 3/1A",
  phone: "+48 789 123 456",
  email: "kontakt@auraboutique.pl",
  openingHours: "Pon - Pt: 10:00 - 17:00 | Sob: 9:00 - 13:00",
  announcementBarText: "Darmowa dostawa od 300 PLN | Odbiór osobisty w butiku w Żmigrodzie",
  heroHeadline: "Elegancja w każdym detalu",
  heroSubheadline: "Odkryj kolekcję stworzoną dla kobiet ceniących klasę, subtelność i najwyższą jakość kroju.",
  heroImageUrl: "/images/hero/aura-hero-motto.png",
  freeShippingFrom: 300.0,
  courierCost: 15.0,
  inpostLockerCost: 13.0,
  localPickupCost: 0.0,
  termsAndConditions: `§ 1. Postanowienia ogólne i dane Sprzedawcy
1. Niniejszy Regulamin określa zasady korzystania ze sklepu internetowego AURA Boutique K.B. oraz warunki składania zamówień i zawierania umów sprzedaży na odległość.
2. Właścicielem sklepu internetowego AURA Boutique K.B. jest:
AURA Boutique K.B. Karolina Borkowska
Adres butiku stacjonarnego: ul. Poprzeczna 3/1A, 55-140 Żmigród, woj. dolnośląskie
NIP: 9151234567, REGON: 021987654
Adres poczty elektronicznej: kontakt@auraboutique.pl, Telefon: +48 789 123 456

§ 2. Zasady składania zamówień i zakupy bez rejestracji
1. Sklep umożliwia składanie zamówień zarówno z rejestracją konta, jak i bez rejestracji (zakupy jako gość).
2. Wszystkie ceny produktów podawane są w polskich złotych (PLN) i stanowią całkowitą kwotę do zapłaty (sprzedawca zwolniony podmiotowo z VAT).
3. Do momentu zaakceptowania zamówienia przez butik i zmiany statusu na "W realizacji", klientka ma możliwość dokupienia kolejnych ubrań bez dodatkowych kosztów przesyłki. Po przejściu w status "W realizacji" edycja zamówienia zostaje zablokowana.

§ 3. Dostawa i Płatności
1. Dostępne metody dostawy: Paczkomaty InPost (13,00 zł), Kurier (15,00 zł), Odbiór osobisty w butiku stacjonarnym w Żmigrodzie (0,00 zł).
2. Standardowa dostawa jest bezpłatna dla zamówień o wartości produktów co najmniej 300,00 zł po uwzględnieniu rabatów.
3. Dostępne metody płatności: Płatność online BLIK, szybkie przelewy Przelewy24 oraz tradycyjny przelew bankowy.

§ 4. Odstąpienie od umowy i zwroty (14 dni)
1. Każda klientka będąca konsumentem ma prawo odstąpić od umowy w terminie 14 dni od dnia odebrania przesyłki bez podawania przyczyny.
2. Zgłoszenie zwrotu można wyklikać bezpośrednio na stronie ze statusem zamówienia lub drogą mailową.

§ 5. Postanowienia końcowe
1. Umowy zawierane poprzez sklep internetowy zawierane są w języku polskim i podlegają prawu polskiemu.`,
  privacyPolicy: `POLITYKA PRYWATNOŚCI I KLAUZULA INFORMACYJNA RODO
AURA Boutique K.B.

1. Administrator Danych Osobowych
Administratorem danych osobowych klientek sklepu internetowego oraz butiku stacjonarnego jest AURA Boutique K.B. Karolina Borkowska, ul. Poprzeczna 3/1A, 55-140 Żmigród, NIP: 9151234567, e-mail: kontakt@auraboutique.pl, telefon: +48 789 123 456.

2. Cele i podstawy przetwarzania danych
Dane osobowe przetwarzane są w celu:
a) realizacji złożonych zamówień i umów sprzedaży (art. 6 ust. 1 lit. b RODO),
b) obsługi zwrotów, reklamacji i wystawiania dokumentów księgowych (art. 6 ust. 1 lit. c RODO),
c) udziału w programie poleceń oraz systemie rabatowym i opiniach (art. 6 ust. 1 lit. b i f RODO),
d) kontaktu telefonicznego lub mailowego w sprawach doręczenia przesyłki i statusu zamówienia.

3. Odbiorcy danych
Dane mogą być przekazywane wyłącznie podmiotom niezbędnym do realizacji zamówienia: operatorom pocztowym i kurierskim (InPost, firmy kurierskie) oraz operatorom płatności online (Przelewy24).

4. Prawa osoby, której dane dotyczą
Każda klientka ma prawo dostępu do swoich danych, ich sprostowania, usunięcia ("prawo do bycia zapomnianym"), ograniczenia przetwarzania oraz wniesienia sprzeciwu. W celu realizacji praw prosimy o kontakt na adres kontakt@auraboutique.pl.

5. Bezpieczeństwo
Sklep stosuje szyfrowanie SSL, a dane przechowywane są zgodnie z najwyższymi standardami bezpieczeństwa teleinformatycznego.`,
  inpostApiKey: "",
  inpostOrganizationId: "",
  inpostEnvironment: "production",
  inpostSenderLocker: "ZMI01M",
  inpostSenderName: "AURA Boutique K.B.",
  inpostSenderEmail: "kontakt@auraboutique.pl",
  inpostSenderPhone: "+48 572 268 005",
  p24MerchantId: "",
  p24PosId: "",
  p24CrcKey: "",
  p24ApiKey: "",
  p24Sandbox: true,
};

export const initialOrders: Order[] = [
  {
    id: "ord-demo-1",
    orderNumber: "AURA-2026-0001",
    customerFirstName: "Anna",
    customerLastName: "Kowalska",
    customerEmail: "anna.kowalska@example.pl",
    customerPhone: "+48 501 234 567",
    shippingMethod: "INPOST_LOCKER",
    parcelLockerCode: "ZMI01M",
    paymentMethod: "BLIK",
    paymentStatus: "PENDING",
    fulfillmentStatus: "NEW",
    subtotalAmount: 299.0,
    shippingCost: 13.0,
    totalAmount: 312.0,
    customerNotes: "Proszę o staranne zapakowanie na prezent.",
    items: [
      {
        id: "item-1-1",
        orderId: "ord-demo-1",
        variantId: "var-1-s-ivory",
        productNameSnapshot: "Satynowa Sukienka Midi z Wiązaniem",
        variantSnapshot: "Rozmiar: S, Kolor: Kość Słoniowa (Ivory), SKU: AURA-SUK-01-S-IVR",
        unitPriceSnapshot: 299.0,
        quantity: 1,
        totalSnapshot: 299.0,
        productImageUrl: "/images/products/sukienka-satynowa-ivory.jpg",
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "ord-demo-2",
    orderNumber: "AURA-2026-0002",
    customerFirstName: "Magdalena",
    customerLastName: "Nowak",
    customerEmail: "magda.nowak@example.pl",
    customerPhone: "+48 602 345 678",
    shippingMethod: "LOCAL_PICKUP",
    paymentMethod: "TRADITIONAL_TRANSFER",
    paymentStatus: "PENDING",
    fulfillmentStatus: "PROCESSING",
    subtotalAmount: 389.0,
    shippingCost: 0.0,
    totalAmount: 389.0,
    customerNotes: "Odbiorę osobiście w butiku w Żmigrodzie w czwartek po 14:00.",
    items: [
      {
        id: "item-2-1",
        orderId: "ord-demo-2",
        variantId: "var-2-m-sand",
        productNameSnapshot: "Sweter ze Splotem Wełniano-Kaszmirowym",
        variantSnapshot: "Rozmiar: M, Kolor: Piaskowy Beż (Sand), SKU: AURA-SWE-02-M-SND",
        unitPriceSnapshot: 389.0,
        quantity: 1,
        totalSnapshot: 389.0,
        productImageUrl: "/images/products/sweter-kaszmirowy-sand.jpg",
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

export const initialPromotions: Promotion[] = [
  {
    id: "promo-weekend-15",
    name: "Weekendowa Promocja –15% na wybraną kategorię",
    publicTitle: "Weekendowa Promocja –15% na Marynarki!",
    description: "Automatyczny rabat –15% na wszystkie produkty z wybranej kategorii przez cały weekend (sobota 00:00 – niedziela 23:59).",
    type: "CATEGORY_WEEKEND",
    discountValue: 15,
    isAutomatic: true,
    targetScope: "CATEGORIES",
    categoryIds: ["cat-marynarki"],
    excludeDiscounted: true,
    noEndDate: true,
    isRecurringWeekend: true,
    targetAudience: "ALL",
    currentUsageCount: 0,
    canCombineWithOtherPromotions: false,
    bannerEnabled: true,
    bannerText: "✨ Weekend z AURA Boutique: –15% na wszystkie Marynarki! Rabat nalicza się automatycznie w koszyku.",
    bannerButtonText: "Zobacz Marynarki",
    bannerButtonUrl: "/katalog?kategoria=marynarki",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "promo-first-order-15",
    name: "–15% na pierwsze zamówienie",
    publicTitle: "Rabat –15% na Twoje pierwsze zakupy",
    description: "Automatyczny rabat –15% dla nowych klientek (weryfikacja po adresie e-mail w historii zamówień).",
    type: "FIRST_ORDER",
    discountValue: 15,
    isAutomatic: true,
    targetScope: "ALL",
    excludeDiscounted: false,
    noEndDate: true,
    targetAudience: "NEW_CUSTOMERS",
    currentUsageCount: 0,
    canCombineWithOtherPromotions: false,
    bannerEnabled: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "promo-socks-gift",
    name: "Promocja na start — Skarpetki w prezencie",
    publicTitle: "Prezent na otwarcie! Skarpetki w losowym kolorze gratis",
    description: "Przy wartości produktów powyżej 100 zł po rabatach, automatycznie dodawana jest bezpłatna para skarpetek w losowym kolorze.",
    type: "FREE_GIFT",
    discountValue: 0,
    minOrderValue: 100.0,
    isAutomatic: true,
    targetScope: "ALL",
    excludeDiscounted: false,
    noEndDate: true,
    targetAudience: "ALL",
    currentUsageCount: 0,
    canCombineWithOtherPromotions: true,
    bannerEnabled: true,
    bannerText: "🎁 Prezent na otwarcie! Przy zakupach powyżej 100 zł otrzymasz skarpetki w losowym kolorze gratis. Do wyczerpania zapasów.",
    bannerButtonText: "Zrób zakupy",
    bannerButtonUrl: "/katalog",
    giftProductId: "prod-socks-gift",
    giftAvailableColors: ["Cielisty Nude", "Kremowy Ecru", "Czarne Classic", "Pudrowy Róż"],
    giftStockQuantity: 50,
    giftReservedQuantity: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "promo-free-shipping-300",
    name: "Darmowa dostawa od 300 zł",
    publicTitle: "Darmowa dostawa od 300 PLN",
    description: "Standardowa dostawa Paczkomat / Kurier gratis dla zamówień od 300 zł po rabatach.",
    type: "FREE_SHIPPING",
    discountValue: 0,
    minOrderValue: 300.0,
    isAutomatic: true,
    targetScope: "ALL",
    excludeDiscounted: false,
    noEndDate: true,
    targetAudience: "ALL",
    currentUsageCount: 0,
    canCombineWithOtherPromotions: true,
    bannerEnabled: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialIndividualDiscounts: IndividualCustomerDiscount[] = [
  {
    id: "ind-demo-1",
    email: "stala.klientka@example.pl",
    discountPercent: 10,
    scope: "ALL",
    isIndefinite: true,
    isActive: true,
    isEmailVerified: true,
    adminNote: "Stała klientka z butiku w Żmigrodzie - rabat VIP 10%",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialReferralParticipants: ReferralParticipant[] = [
  {
    id: "ref-p-1",
    email: "karolina.borkowska@auraboutique.pl",
    customerName: "Karolina Borkowska",
    referralCode: "KASIA-AURA15",
    totalReferralsCount: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const initialReferralRewardCodes: ReferralRewardCode[] = [];

export const initialProductReviews: ProductReview[] = [
  {
    id: "rev-1",
    productId: "prod-1",
    orderId: "ord-demo-1",
    orderNumber: "AURA-2026-0001",
    customerEmail: "anna.kowalska@example.pl",
    displayName: "Anna K.",
    rating: 5,
    content: "Sukienka leży przepięknie! Satyna ma szlachetny, subtelny połysk, a krój idealnie modeluje sylwetkę. Polecam każdej kobiecie ceniącej klasę.",
    photoUrl: "/images/products/sukienka-satynowa-ivory.jpg",
    isVerifiedPurchase: true,
    rewardCodeIssued: "OPINIA-FOTO-5-ANN",
    rewardPercentIssued: 5,
    rewardCodeValidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    rewardCodeUsed: false,
    hasPhotoBonusApplied: true,
    isHidden: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "rev-2",
    productId: "prod-2",
    orderId: "ord-demo-2",
    orderNumber: "AURA-2026-0002",
    customerEmail: "magda.nowak@example.pl",
    displayName: "Magdalena",
    rating: 5,
    content: "Miękki, ciepły i niezwykle przyjemny dla ciała sweter. Jakość wykonania i kaszmirowy splot na najwyższym poziomie.",
    isVerifiedPurchase: true,
    rewardCodeIssued: "OPINIA-TEKST-2-MAG",
    rewardPercentIssued: 2,
    rewardCodeValidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    rewardCodeUsed: false,
    hasPhotoBonusApplied: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export const initialPromotionAuditLogs: PromotionAuditLog[] = [
  {
    id: "log-1",
    timestamp: new Date().toISOString(),
    adminUser: "Właścicielka",
    action: "Inicjalizacja systemu promocji",
    details: "Skonfigurowano promocję weekendową –15%, powitalną –15%, prezent (skarpetki) oraz program poleceń i opinii.",
  },
];
