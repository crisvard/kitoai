import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupWhatsAppTable() {
  try {
    console.log('🔧 Setting up WhatsApp connections table...');

    // First, create the table if it doesn't exist
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_connections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

          -- Status WAHA
          waha_status TEXT DEFAULT 'disconnected',
          waha_session_name TEXT,

          -- Status N8N
          n8n_workflow_id TEXT,
          n8n_webhook_url TEXT,
          n8n_status TEXT DEFAULT 'not_created',

          -- Status Gemini
          gemini_status TEXT DEFAULT 'configured',

          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),

          UNIQUE(user_id)
        );
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
    } else {
      console.log('✅ Table created successfully');
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    }

    // Create policies
    const policies = [
      `CREATE POLICY "Users can view own connection" ON whatsapp_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert own connection" ON whatsapp_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update own connection" ON whatsapp_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);`
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.error('Error creating policy:', error);
      }
    }

    console.log('✅ RLS policies created');

    // Insert initial record for user
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'kitoaiagency@gmail.com')
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }

    const { error: insertError } = await supabase
      .from('whatsapp_connections')
      .upsert({
        user_id: userData.id,
        waha_status: 'disconnected',
        n8n_status: 'not_created',
        gemini_status: 'configured'
      });

    if (insertError) {
      console.error('Error inserting initial record:', insertError);
    } else {
      console.log('✅ Initial record inserted');
    }

    // Verify
    const { data: verifyData, error: verifyError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userData.id);

    if (verifyError) {
      console.error('Error verifying:', verifyError);
    } else {
      console.log('✅ Verification successful:', verifyData);
    }

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupWhatsAppTable();