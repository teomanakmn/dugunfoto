import { createClient } from "@supabase/supabase-js";

// Use placeholder credentials during build time if environment variables are not yet defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const BUCKET_NAME = "wedding-photos";
