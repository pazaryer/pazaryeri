import WebSocket from "ws";

/** Supabase JS Node < 22 ortamında native WebSocket bekler */
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
}
