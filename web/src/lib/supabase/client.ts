"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for signed-in teachers. It uses the publishable
 * (anon) key, so row-level security decides what a teacher can read.
 * Students never use this: they go through the server routes.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return client;
}
