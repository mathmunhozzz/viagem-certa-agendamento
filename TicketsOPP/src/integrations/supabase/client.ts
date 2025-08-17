import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ninybkgnipuxmvcaxkwt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbnlia2duaXB1eG12Y2F4a3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDg0NzYsImV4cCI6MjA2ODY4NDQ3Nn0.SO41zfL2l6SKJEKWd1gr0fTDfMJdeAxrvLIPpMsMVzk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});