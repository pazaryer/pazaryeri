/**
 * Seed script - demo verileri yükler
 * Kullanım: DATABASE_URL=... npx tsx scripts/seed.ts
 */
import { db, pool } from "@workspace/db";
import {
  usersTable,
  listingsTable,
  listingImagesTable,
} from "@workspace/db/schema";

const DEMO_USERS = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Ahmet Yılmaz", email: "ahmet@demo.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", rating: 4.8, totalSales: 42, isVerified: true, city: "İstanbul", district: "Kadıköy" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Ayşe Kaya", email: "ayse@demo.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", rating: 5.0, totalSales: 15, isVerified: true, city: "İstanbul", district: "Moda" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Mehmet Demir", email: "mehmet@demo.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", rating: 4.5, totalSales: 89, isVerified: false, city: "İstanbul", district: "Ataşehir" },
];

const DEMO_LISTINGS = [
  { title: "iPhone 14 Pro 256GB Siyah - Çiziksiz", price: 42500, category: "Elektronik", description: "Cihaz 6 aylıktır, pil sağlığı %98. Kutusu ve orijinal şarj kablosu ile.", image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=90", sellerIdx: 0, city: "İstanbul", district: "Kadıköy", location: "Kadıköy, İstanbul" },
  { title: "2018 Ford Focus Titanium, Otomatik", price: 950000, category: "Araç", description: "Sahibinden temiz aile aracı. Tüm bakımları yetkili serviste yapılmıştır.", image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=90", sellerIdx: 2, city: "İstanbul", district: "Ataşehir", location: "Ataşehir, İstanbul" },
  { title: "L Şeklinde Gri Kumaş Koltuk Takımı", price: 6000, category: "Mobilya", description: "Taşınma sebebiyle acil satılıktır. Sigara içilmeyen evde kullanıldı.", image: "https://images.unsplash.com/photo-1567016547370-c98d98e8b5e8?w=800&q=90", sellerIdx: 1, city: "İstanbul", district: "Moda", location: "Moda, İstanbul" },
  { title: "Siyah Hakiki Deri Ceket (M Beden)", price: 1200, category: "Moda", description: "Orijinal deri ceket, çok az giyildi.", image: "https://images.unsplash.com/photo-1548778943-5bbeeb1ba6c1?w=800&q=90", sellerIdx: 0, city: "İstanbul", district: "Şişli", location: "Şişli, İstanbul" },
  { title: "MacBook Pro M2 14\" 512GB", price: 52000, category: "Elektronik", description: "1 yıllık, garantisi devam ediyor. Kılıf ve çanta hediye.", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90", sellerIdx: 1, city: "İstanbul", district: "Beşiktaş", location: "Beşiktaş, İstanbul" },
  { title: "Trek Dağ Bisikleti 29\"", price: 8500, category: "Spor", description: "Çok az kullanıldı, lastikler yeni.", image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=90", sellerIdx: 2, city: "İstanbul", district: "Sarıyer", location: "Sarıyer, İstanbul" },
  { title: "Samsung 55\" QLED Smart TV", price: 18000, category: "Elektronik", description: "2 yıllık, uzaktan kumandası ve duvar aparatı dahil.", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=90", sellerIdx: 0, city: "İstanbul", district: "Üsküdar", location: "Üsküdar, İstanbul" },
  { title: "Vintage Ahşap Yemek Masası", price: 4500, category: "Mobilya", description: "6 kişilik, masif ahşap, antika değerinde.", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=90", sellerIdx: 1, city: "İstanbul", district: "Cihangir", location: "Cihangir, İstanbul" },
];

async function seed() {
  console.log("🌱 Seed başlıyor...");

  for (const user of DEMO_USERS) {
    await db.insert(usersTable).values(user).onConflictDoNothing();
  }
  console.log(`✅ ${DEMO_USERS.length} kullanıcı eklendi`);

  for (const item of DEMO_LISTINGS) {
    const seller = DEMO_USERS[item.sellerIdx];
    const [listing] = await db
      .insert(listingsTable)
      .values({
        sellerId: seller.id,
        title: item.title,
        price: item.price,
        category: item.category,
        description: item.description,
        city: item.city,
        district: item.district,
        location: item.location,
        status: "active",
      })
      .returning();

    await db.insert(listingImagesTable).values({
      listingId: listing.id,
      url: item.image,
      sortOrder: 0,
    });
  }
  console.log(`✅ ${DEMO_LISTINGS.length} ilan eklendi`);
  console.log("🎉 Seed tamamlandı!");
}

seed()
  .catch(console.error)
  .finally(() => pool.end());
