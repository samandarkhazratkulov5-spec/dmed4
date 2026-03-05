
import { createClient } from "@supabase/supabase-js";

// --- PASTE YOUR CREDENTIALS HERE ---
const SUPABASE_URL = "https://qztehlyubxqfxewfqftm.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_UMqt5f4e4zuVay-OYJoBtQ_dzUlGOxK";
// -----------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
