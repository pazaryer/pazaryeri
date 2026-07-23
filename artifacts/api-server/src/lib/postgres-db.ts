import pg from "pg";
import type { DbUser } from "./supabase-db";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPgPool(): pg.Pool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL yapılandırılmamış");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
      max: 5,
      connectionTimeoutMillis: 15_000,
    });
  }
  return pool;
}

export async function pgEnsureUser(
  id: string,
  data?: { name?: string; email?: string; phone?: string; avatar?: string },
): Promise<DbUser> {
  const db = getPgPool();
  const existing = await db.query<DbUser>("SELECT * FROM users WHERE id = $1", [id]);
  if (existing.rows[0]) return existing.rows[0];

  const name = data?.name ?? "Kullanıcı";
  const inserted = await db.query<DbUser>(
    `INSERT INTO users (id, name, email, phone, avatar)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, users.name),
       email = COALESCE(EXCLUDED.email, users.email),
       updated_at = NOW()
     RETURNING *`,
    [id, name, data?.email ?? null, data?.phone ?? null, data?.avatar ?? null],
  );

  if (!inserted.rows[0]) throw new Error("Kullanıcı oluşturulamadı");
  return inserted.rows[0];
}

export async function pgCreateListing(
  sellerId: string,
  body: {
    title: string;
    price: number;
    category: string;
    description: string;
    city?: string;
    district?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    acceptsOffers: boolean;
    images: string[];
  },
): Promise<string> {
  const db = getPgPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const listingRes = await client.query<{ id: string }>(
      `INSERT INTO listings (
        seller_id, title, price, category, description, city, district, location,
        latitude, longitude, accepts_offers
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id`,
      [
        sellerId,
        body.title,
        body.price,
        body.category,
        body.description,
        body.city ?? null,
        body.district ?? null,
        body.location ?? null,
        body.latitude ?? null,
        body.longitude ?? null,
        body.acceptsOffers,
      ],
    );
    const listingId = listingRes.rows[0]?.id;
    if (!listingId) throw new Error("İlan oluşturulamadı");

    for (let i = 0; i < body.images.length; i++) {
      await client.query(
        `INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1, $2, $3)`,
        [listingId, body.images[i], i],
      );
    }
    await client.query("COMMIT");
    return listingId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function pgHealthCheck(): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  try {
    await getPgPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function pgGetListingRow(listingId: string) {
  const db = getPgPool();
  const listing = await db.query<DbUser & { seller_id: string }>(
    "SELECT * FROM listings WHERE id = $1",
    [listingId],
  );
  if (!listing.rows[0]) return null;

  const seller = await db.query<DbUser>("SELECT * FROM users WHERE id = $1", [
    listing.rows[0].seller_id,
  ]);
  const images = await db.query<{ url: string }>(
    "SELECT url FROM listing_images WHERE listing_id = $1 ORDER BY sort_order",
    [listingId],
  );

  return {
    listing: listing.rows[0] as unknown as Record<string, unknown>,
    seller: seller.rows[0] ?? null,
    images: images.rows.map((r) => r.url),
  };
}
