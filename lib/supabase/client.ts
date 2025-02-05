import { createClient } from '@supabase/supabase-js';

// We'll replace these with env variables later
const supabaseUrl = 'your-project-url';
const supabaseKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
