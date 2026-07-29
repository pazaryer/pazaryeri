import { getSupabaseAdmin } from "./supabase-db";
import { notifyUser } from "./notify";

export async function notifyAdmins(params: {
  type: string;
  title: string;
  subtitle?: string;
  body: string;
  data?: Record<string, string>;
  roles?: ("admin" | "moderator")[];
}): Promise<void> {
  const sb = getSupabaseAdmin();
  const roles = params.roles ?? ["admin", "moderator"];
  const { data: admins } = await sb
    .from("users")
    .select("id")
    .in("role", roles)
    .eq("is_banned", false);

  if (!admins?.length) return;

  await Promise.allSettled(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: params.type,
        title: params.title,
        subtitle: params.subtitle,
        body: params.body,
        data: params.data,
      }),
    ),
  );
}
