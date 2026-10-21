const supabaseUrl = 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

async function printDb() {
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json', 'Connection': 'close' },
    body: JSON.stringify({ email: 'cbonano056@gmail.com', password: 'Bonano1234' })
  });
  const { access_token } = await authRes.json();
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${access_token}`, 'Connection': 'close' };

  console.log('=== CLIENTS IN DB ===');
  const resClients = await fetch(`${supabaseUrl}/rest/v1/clients?select=*`, { headers });
  const clients = await resClients.json();
  console.log(clients.map(c => ({ id: c.id, name: c.name })));

  console.log('=== INVOICES IN DB ===');
  const resInvoices = await fetch(`${supabaseUrl}/rest/v1/invoices?select=*`, { headers });
  const invoices = await resInvoices.json();
  console.log(invoices.map(i => ({ id: i.id, num: i.invoice_number, status: i.status, amount: i.amount, date: i.issue_date })));

  console.log('=== SETTINGS IN DB ===');
  const resSettings = await fetch(`${supabaseUrl}/rest/v1/company_settings?select=*`, { headers });
  const settings = await resSettings.json();
  console.log(settings);
}

printDb();
