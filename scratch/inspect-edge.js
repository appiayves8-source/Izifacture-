const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edge = spawn(edgePath, [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  'about:blank'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await listRes.json();
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  if (!pageTab) {
    console.log('No page tab found');
    edge.kill();
    return;
  }
  
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => {
    ws.send(JSON.stringify({ id: id++, method, params }));
  };

  ws.onopen = () => {
    console.log('Connected to CDP');
    send('Runtime.enable');
    send('Log.enable');
    send('Page.enable');
    send('Page.navigate', { url: 'http://localhost:3000' });
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[CONSOLE ${msg.params.type}]`, args);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('[EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
    }
  };

  setTimeout(async () => {
    // Evaluate Next.js error overlay text
    const evalId = id++;
    ws.send(JSON.stringify({
      id: evalId,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const portal = document.querySelector('nextjs-portal');
          if (portal && portal.shadowRoot) {
            return portal.shadowRoot.innerText;
          }
          const errors = document.querySelectorAll('[data-nextjs-dialog-header], [data-nextjs-toast]');
          return Array.from(errors).map(e => e.innerText).join('\\n');
        })()`
      }
    }));
  }, 4000);

  setTimeout(() => {
    ws.close();
    edge.kill();
    process.exit(0);
  }, 6000);
}

run().catch(err => {
  console.error(err);
  edge.kill();
  process.exit(1);
});
