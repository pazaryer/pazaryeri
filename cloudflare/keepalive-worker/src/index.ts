/**
 * Pazaryeri Render keep-alive — API'yi 15 dk uyku döngüsünden korur.
 * Kullanıcı URL'lerini değiştirmez; yalnızca periyodik healthz ping atar.
 */

export interface Env {
  API_HEALTH_URL: string;
}

type PingResult = {
  ok: boolean;
  status?: number;
  at: string;
  error?: string;
};

async function pingApi(env: Env): Promise<PingResult> {
  const at = new Date().toISOString();
  try {
    const res = await fetch(env.API_HEALTH_URL, {
      method: "GET",
      headers: {
        "User-Agent": "Pazaryeri-KeepAlive/1.0 (+https://pazaryeri0.web.app)",
        Accept: "application/json",
      },
    });
    return { ok: res.ok, status: res.status, at };
  } catch (e) {
    return {
      ok: false,
      at,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export default {
  /** Cron: her 14 dakikada Render API uyanık kalır */
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(pingApi(env));
  },

  /** Manuel test: GET worker URL → son ping sonucu */
  async fetch(_request: Request, env: Env): Promise<Response> {
    const result = await pingApi(env);
    return Response.json({
      worker: "pazaryeri-keepalive",
      target: env.API_HEALTH_URL,
      ...result,
    });
  },
};
