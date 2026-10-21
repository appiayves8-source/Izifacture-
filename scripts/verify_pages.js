async function verifyPages() {
  const pages = [
    '/',
    '/login',
    '/invoices',
    '/invoices/new',
    '/invoices/inv-1',
    '/clients',
    '/quotes',
    '/payments',
    '/settings'
  ];

  console.log('Testing Next.js local pages at http://localhost:3000...');
  for (const p of pages) {
    try {
      const res = await fetch(`http://localhost:3000${p}`);
      console.log(`Page ${p.padEnd(20)}: HTTP ${res.status}`);
    } catch (e) {
      console.log(`Page ${p.padEnd(20)}: ERROR (${e.message})`);
    }
  }
}

verifyPages();
