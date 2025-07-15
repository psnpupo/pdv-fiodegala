import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNzc0NTMsImV4cCI6MjA2NTg1MzQ1M30.0VVPA3XWy0nk5BQFa9e2KlFxqoMhU7MVkbBXq_q8XrM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);