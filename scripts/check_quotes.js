const supabaseUrl = 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

async function safeFetch(url, options = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Connection: 'close'
        }
      });
      return res;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function checkQuotes() {
  const authRes = await safeFetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cbonano056@gmail.com', password: 'Bonano1234' })
  });
  const { access_token } = await authRes.json();
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${access_token}` };

  const res1 = await safeFetch(`${supabaseUrl}/rest/v1/quotes?select=*,client:clients(*)`, { headers });
  console.log('quotes query status:', res1.status);
  const data1 = await res1.json();
  console.log('quotes sample:', JSON.stringify(data1[0]));

  const res2 = await safeFetch(`${supabaseUrl}/rest/v1/quote_items?select=*`, { headers });
  console.log('quote_items table status:', res2.status);
  if (res2.ok) {
    const data2 = await res2.json();
    console.log('quote_items count:', data2.length);
  } else {
    console.log('quote_items error:', await res2.text());
  }
}

checkQuotes();
