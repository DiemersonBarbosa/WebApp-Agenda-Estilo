import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.vps12020.panel.icontainer.cloud';
// Utiliza a chave de serviço para bypassar qualquer restrição de JWT/401 em ambiente próprio
const supabaseServiceKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3OTE5OTc2NzksImV4cCI6MTc5MjAwMTI3OSwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.H6RQauAP7qh3o73tM4MICiFVS1d_3aUX2VbxEzy9kuA';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});