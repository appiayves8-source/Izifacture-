import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
