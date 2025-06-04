import { createClient } from '@supabase/supabase-js';

// TODO: Add your Supabase project URL and anon key to your .env file
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
