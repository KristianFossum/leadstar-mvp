import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iiifotfnwvlsjcpzgpex.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWZvdGZud3Zsc2pjcHpncGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODc2MzUsImV4cCI6MjA3NzA2MzYzNX0.1J73hVclCUtFmfBtJyoIdJRkuKsK2KW_k6WaskOLr6g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
