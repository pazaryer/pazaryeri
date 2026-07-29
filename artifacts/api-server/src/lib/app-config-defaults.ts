/** Varsayılan uygulama yapılandırması — admin panelden üzerine yazılabilir */

export const DEFAULT_APP_CONFIG: Record<string, unknown> = {
  "brand": {
    primary: "#3D1A78",
    primaryDark: "#2A1260",
    primaryMid: "#5B3FA0",
    primaryLight: "#F4F1FA",
    gold: "#C9A84C",
    background: "#F7F5FC",
    supportEmail: "pazaryer0@gmail.com",
  },
  "web.seo": {
    brand: "Pazaryeri",
    tagline: "Türkiye'nin ikinci el alım satım platformu",
    title: "Pazaryeri — İkinci El Alım Satım | Ücretsiz İlan Ver",
    description:
      "Pazaryeri ile ücretsiz ilan verin, ikinci el alım satım yapın. Telefon, araç, mobilya, elektronik ve binlerce kategoride güvenli ikinci el alışveriş.",
    keywords:
      "pazaryeri, ikinci el, ücretsiz ilan, alım satım, ikinci el telefon, ikinci el araba",
  },
  "web.announcements": [],
  "mobile.categories": [
    "Tümü",
    "Elektronik",
    "Telefon",
    "Bilgisayar",
    "Araç",
    "Emlak",
    "Mobilya",
    "Ev & Bahçe",
    "Moda",
    "Spor",
    "Bebek",
    "Hobi",
    "İş & Ofis",
    "Hayvanlar",
    "Müzik",
    "Beyaz Eşya",
    "Kozmetik",
    "Antika",
    "Diğer",
  ],
  "mobile.featureFlags": {
    enableOffers: true,
    enableComments: true,
    enablePush: true,
    enableLocationFilter: true,
    maintenanceMode: false,
    maintenanceMessage: "Bakım çalışması yapılıyor. Kısa süre sonra tekrar deneyin.",
  },
  "mobile.app": {
    name: "Pazaryeri",
    version: "1.0.0",
    minSupportedVersion: "1.0.0",
    forceUpdate: false,
    updateMessage: "Yeni sürüm mevcut. Lütfen güncelleyin.",
  },
};

export const CONFIG_KEYS = Object.keys(DEFAULT_APP_CONFIG);
