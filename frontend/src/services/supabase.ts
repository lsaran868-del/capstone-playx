import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xrhlsbsyrzvpznuspqvh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaGxzYnN5cnp2cHpudXNwcXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMTEyNjksImV4cCI6MjEwNTg4NzI2OX0.rMAqpB6zQAOQwTxBcmLFV_dqYBWt88z0ExEbPaxQg_c';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;
