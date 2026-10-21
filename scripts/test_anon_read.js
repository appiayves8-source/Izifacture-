const supabaseUrl = 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

async function testAnon() {
  console.log('Testing reading tables with ONLY ANON KEY (no user session)...');
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Connection': 'close'
  };

  const tables = ['invoices', 'clients', 'company_settings', 'quotes'];
  for (const t of tables) {
    const res = await fetch(`${supabaseUrl}/rest/v1/${t}?select=*`, { headers });
    console.log(`Table '${t}': HTTP ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`  Row count: ${data.length}`);
    } else {
      console.log(`  Error:`, await res.text());
    }
  }
}

testAnon();
