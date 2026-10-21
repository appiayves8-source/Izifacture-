const fs = require('fs');
const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\76054b58-280e-40d9-8982-1356ffa8daf2';

const edge = spawn(edgePath, [
  '--headless',
  '--remote-debugging-port=9224',
  '--window-size=1366,768',
  '--disable-gpu',
  'about:blank'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  
  const listRes = await fetch('http://127.0.0.1:9224/json/list');
  const tabs = await listRes.json();
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  if (!pageTab) {
    console.log('No page tab found');
    edge.kill();
    return;
  }
  
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg.result);
    }
  };

  ws.onopen = async () => {
    console.log('Connected to CDP port 9224');
    await send('Page.enable');
    await send('Runtime.enable');
    
    console.log('Navigating to http://localhost:3000/login...');
    await send('Page.navigate', { url: 'http://localhost:3000/login' });
    await new Promise(r => setTimeout(r, 2500));
    
    // Click on quick access button
    console.log('Triggering quick login for Cyrille M...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const directBtn = btns.find(b => b.innerText.includes('Accès direct'));
        if (directBtn) { directBtn.click(); return 'clicked'; }
        return 'not found';
      })()`
    });

    // Wait 3 seconds for Supabase Auth and redirect to /
    await new Promise(r => setTimeout(r, 3500));
    
    const urlRes = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log('Current URL after login:', urlRes.result.value);

    // Capture screenshot of dashboard
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    if (screenshot && screenshot.data) {
      const imgPath = `${artifactDir}\\dashboard_screen.png`;
      fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
      console.log('Dashboard screenshot saved to:', imgPath);
    }

    ws.close();
    edge.kill();
    process.exit(0);
  };
}

run().catch(err => {
  console.error(err);
  edge.kill();
  process.exit(1);
});
