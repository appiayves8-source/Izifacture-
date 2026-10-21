const supabaseUrl = 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

async function checkPaymentAccounts() {
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json', 'Connection': 'close' },
    body: JSON.stringify({ email: 'cbonano056@gmail.com', password: 'Bonano1234' })
  });
  const { access_token } = await authRes.json();
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${access_token}`, 'Connection': 'close' };

  const res = await fetch(`${supabaseUrl}/rest/v1/payment_accounts?select=*`, { headers });
  console.log('payment_accounts table status:', res.status);
  if (res.ok) {
    const data = await res.json();
    console.log('payment_accounts count:', data.length);
  } else {
    console.log('payment_accounts error:', await res.text());
  }
}

checkPaymentAccounts();
