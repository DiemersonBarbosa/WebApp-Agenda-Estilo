import { createClient } from '@supabase/supabase-js';

// Forçado diretamente para a VPS para eliminar qualquer falha de leitura de .env
const supabaseUrl = 'https://supabase.vps12020.panel.icontainer.cloud';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3OTE5OTc2NzksImV4cCI6MTc5MjAwMTI3OSwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.fANjOyDfIKg-5AR1RLiOgO2OGoEuuUBCq9Ftbzm922Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);