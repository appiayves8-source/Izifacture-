const supabaseUrl = 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

async function testCrud() {
  console.log('Testing full CRUD operations on Supabase...');

  // 1. Authenticate
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json', 'Connection': 'close' },
    body: JSON.stringify({ email: 'cbonano056@gmail.com', password: 'Bonano1234' })
  });
  const { access_token } = await authRes.json();
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    'Connection': 'close'
  };

  const testClientId = `cli-test-${Date.now()}`;

  // 2. Insert Client
  console.log('1. Inserting client:', testClientId);
  const insertClientRes = await fetch(`${supabaseUrl}/rest/v1/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: testClientId,
      name: 'Client Test OHADA',
      email: 'test@client-ohada.ci',
      phone: '+225 01 02 03 04 05',
      address: 'Plateau Rue du Commerce',
      city: 'Abidjan',
      country: "Côte d'Ivoire"
    })
  });
  console.log('Insert Client status:', insertClientRes.status);
  if (!insertClientRes.ok) console.log(await insertClientRes.text());

  // 3. Update Client
  console.log('2. Updating client...');
  const updateClientRes = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${testClientId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: 'Client Test OHADA Updated' })
  });
  console.log('Update Client status:', updateClientRes.status);

  // 4. Insert Invoice for this client
  const testInvId = `inv-test-${Date.now()}`;
  console.log('3. Inserting invoice:', testInvId);
  const insertInvRes = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: testInvId,
      invoice_number: `FAC-TEST-001`,
      client_id: testClientId,
      issue_date: '2026-10-12',
      due_date: '2026-10-26',
      status: 'brouillon',
      service_type: 'Audit & Conseil',
      subtotal: 1000000,
      tax_rate: 0.18,
      tax_amount: 180000,
      amount: 1180000,
      payment_method: 'Wave'
    })
  });
  console.log('Insert Invoice status:', insertInvRes.status);
  if (!insertInvRes.ok) console.log(await insertInvRes.text());

  // 5. Update Invoice status
  console.log('4. Updating invoice status to payee...');
  const updateInvRes = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${testInvId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'payee' })
  });
  console.log('Update Invoice status:', updateInvRes.status);

  // 6. Delete test invoice and test client
  console.log('5. Deleting test invoice...');
  const delInvRes = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${testInvId}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete Invoice status:', delInvRes.status);

  console.log('6. Deleting test client...');
  const delClientRes = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${testClientId}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete Client status:', delClientRes.status);

  // 7. Update company settings
  console.log('7. Testing company_settings update...');
  const updateSettingsRes = await fetch(`${supabaseUrl}/rest/v1/company_settings?id=eq.default`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ updated_at: new Date().toISOString() })
  });
  console.log('Update Settings status:', updateSettingsRes.status);

  console.log('--- ALL CRUD TESTS COMPLETED ---');
}

testCrud();
