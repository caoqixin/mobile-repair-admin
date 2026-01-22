import { createClient } from "@refinedev/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export const supabaseClient: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    db: {
      schema: "public",
    },
    auth: {
      persistSession: true,
    },
  },
);
