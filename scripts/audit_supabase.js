const supabaseUrl = 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function runAudit() {
  console.log('--- SUPABASE AUDIT WITH NATIVE FETCH ---');

  // 1. Sign in to get JWT token
  const authRes = await fetchWithTimeout(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'cbonano056@gmail.com',
      password: 'Bonano1234'
    })
  });

  if (!authRes.ok) {
    console.error('Sign-in failed:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  console.log('Successfully authenticated as:', authData.user.email);

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const tables = ['clients', 'invoices', 'invoice_items', 'company_settings', 'quotes'];

  for (const t of tables) {
    try {
      const res = await fetchWithTimeout(`${supabaseUrl}/rest/v1/${t}?select=*`, { headers });
      if (res.ok) {
        const rows = await res.json();
        console.log(`Table '${t}': OK (${rows.length} rows)`);
        if (rows.length > 0) {
          console.log(`   Sample item:`, JSON.stringify(rows[0]).slice(0, 100));
        }
      } else {
        console.log(`Table '${t}': HTTP ${res.status} - ${await res.text()}`);
      }
    } catch (e) {
      console.log(`Table '${t}': Error: ${e.message}`);
    }
  }
}

runAudit();
