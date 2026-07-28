import pg from "pg";
import {
  type DbUser,
  type DbListing,
  formatListingSummary,
  formatUser,
} from "./supabase-db";
import { AppError } from "../middleware/errorHandler";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function isPostgresAvailable(): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  return pgHealthCheck();
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

export async function pgGetUser(id: string): Promise<DbUser | null> {
  const db = getPgPool();
  const { rows } = await db.query<DbUser>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function pgUpdateUser(
  id: string,
  body: {
    name?: string;
    avatar?: string;
    bio?: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<DbUser> {
  const db = getPgPool();
  const fields: Array<[keyof typeof body, string]> = [
    ["name", "name"],
    ["avatar", "avatar"],
    ["bio", "bio"],
    ["city", "city"],
    ["district", "district"],
    ["latitude", "latitude"],
    ["longitude", "longitude"],
  ];

  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, col] of fields) {
    if (body[key] !== undefined) {
      sets.push(`${col} = $${idx++}`);
      values.push(body[key]);
    }
  }

  if (sets.length === 0) {
    const existing = await pgGetUser(id);
    if (!existing) throw new AppError("Kullanıcı bulunamadı", 404);
    return existing;
  }

  sets.push("updated_at = NOW()");
  values.push(id);

  const { rows } = await db.query<DbUser>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
  if (!rows[0]) throw new AppError("Kullanıcı bulunamadı", 404);
  return rows[0];
}

export async function pgUpdatePushToken(id: string, token: string): Promise<void> {
  const db = getPgPool();
  await db.query("UPDATE users SET push_token = $1, updated_at = NOW() WHERE id = $2", [
    token,
    id,
  ]);
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
  if (!process.env.DATABASE_URL?.trim()) return false;
  try {
    await getPgPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function pgGetListingImages(listingIds: string[]) {
  const map = new Map<string, string[]>();
  if (!listingIds.length) return map;
  const db = getPgPool();
  const { rows } = await db.query<{ listing_id: string; url: string; sort_order: number }>(
    `SELECT listing_id, url, sort_order FROM listing_images
     WHERE listing_id = ANY($1::uuid[]) ORDER BY sort_order`,
    [listingIds],
  );
  for (const row of rows) {
    const list = map.get(row.listing_id) ?? [];
    list.push(row.url);
    map.set(row.listing_id, list);
  }
  return map;
}

async function pgGetFavoriteSet(userId: string | undefined, listingIds: string[]) {
  const set = new Set<string>();
  if (!userId || !listingIds.length) return set;
  const db = getPgPool();
  const { rows } = await db.query<{ listing_id: string }>(
    `SELECT listing_id FROM favorites WHERE user_id = $1 AND listing_id = ANY($2::uuid[])`,
    [userId, listingIds],
  );
  for (const row of rows) set.add(row.listing_id);
  return set;
}

export async function pgListListings(params: {
  limit: number;
  category?: string;
  q?: string;
  cursor?: string;
  sellerId?: string;
  userId?: string;
  includeNonActive?: boolean;
}) {
  const db = getPgPool();
  const limit = params.limit;
  const values: unknown[] = [];
  const where: string[] = [];

  if (!params.includeNonActive) where.push(`l.status = 'active'`);
  else where.push(`l.status <> 'deleted'`);

  if (params.category && params.category !== "Tümü") {
    values.push(params.category);
    where.push(`l.category = $${values.length}`);
  }
  if (params.q) {
    values.push(`%${params.q}%`);
    where.push(`l.title ILIKE $${values.length}`);
  }
  if (params.sellerId) {
    values.push(params.sellerId);
    where.push(`l.seller_id = $${values.length}`);
  }
  if (params.cursor) {
    values.push(params.cursor);
    where.push(`l.created_at < $${values.length}`);
  }

  values.push(limit + 1);
  const sql = `
    SELECT l.*, row_to_json(u.*) AS seller
    FROM listings l
    JOIN users u ON u.id = l.seller_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY l.created_at DESC
    LIMIT $${values.length}
  `;

  const { rows } = await db.query<DbListing & { seller: DbUser }>(sql, values);
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const listingIds = page.map((r) => r.id);
  const imageMap = await pgGetListingImages(listingIds);
  const favSet = await pgGetFavoriteSet(params.userId, listingIds);

  let userLat: number | null = params.lat ?? null;
  let userLon: number | null = params.lon ?? null;
  if ((userLat == null || userLon == null) && params.userId) {
    const me = await db.query<{ latitude: number | null; longitude: number | null }>(
      "SELECT latitude, longitude FROM users WHERE id = $1",
      [params.userId],
    );
    userLat = userLat ?? me.rows[0]?.latitude ?? null;
    userLon = userLon ?? me.rows[0]?.longitude ?? null;
  }

  const items = await Promise.all(
    page.map((row) => {
      const seller = row.seller as DbUser;
      const { seller: _s, ...listing } = row;
      return formatListingSummary(
        listing as DbListing,
        seller,
        imageMap.get(row.id)?.[0] ?? "",
        favSet.has(row.id),
        userLat,
        userLon,
      );
    }),
  );

  return {
    items,
    hasMore,
    nextCursor: hasMore ? page[page.length - 1]!.created_at : null,
  };
}

export async function pgBuildListingDetail(listingId: string, userId?: string) {
  const row = await pgGetListingRow(listingId);
  if (!row?.listing || !row.seller) throw new AppError("İlan bulunamadı", 404);

  const listing = row.listing as unknown as DbListing;
  if (listing.status === "deleted") throw new AppError("İlan bulunamadı", 404);

  const seller = row.seller as DbUser;
  const images = row.images;
  const favSet = await pgGetFavoriteSet(userId, [listingId]);

  let userLat: number | null = null;
  let userLon: number | null = null;
  if (userId) {
    const db = getPgPool();
    const me = await db.query<{ latitude: number | null; longitude: number | null }>(
      "SELECT latitude, longitude FROM users WHERE id = $1",
      [userId],
    );
    userLat = me.rows[0]?.latitude ?? null;
    userLon = me.rows[0]?.longitude ?? null;
  }

  const summary = await formatListingSummary(
    listing,
    seller,
    images[0] ?? "",
    favSet.has(listingId),
    userLat,
    userLon,
  );

  return {
    ...summary,
    description: listing.description,
    images,
    acceptsOffers: listing.accepts_offers,
    sellerId: listing.seller_id,
    latitude: listing.latitude,
    longitude: listing.longitude,
    seller: formatUser(seller),
  };
}

export async function pgIncrementViews(listingId: string) {
  const db = getPgPool();
  await db.query("UPDATE listings SET views = views + 1 WHERE id = $1", [listingId]);
}

export async function pgGetListingRow(listingId: string) {
  const db = getPgPool();
  const listing = await db.query<{ seller_id: string } & Record<string, unknown>>(
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
