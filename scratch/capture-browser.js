const fs = require('fs');
const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\76054b58-280e-40d9-8982-1356ffa8daf2';

const edge = spawn(edgePath, [
  '--headless',
  '--remote-debugging-port=9223',
  '--window-size=1280,800',
  '--disable-gpu',
  'about:blank'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  
  const listRes = await fetch('http://127.0.0.1:9223/json/list');
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
    console.log('Connected to CDP on port 9223');
    await send('Page.enable');
    await send('Runtime.enable');
    
    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    
    // Wait 4 seconds for render and redirect to /login
    await new Promise(r => setTimeout(r, 4000));
    
    const urlRes = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log('Current URL in browser:', urlRes.result.value);

    const titleRes = await send('Runtime.evaluate', { expression: 'document.title' });
    console.log('Current Title:', titleRes.result.value);

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    if (screenshot && screenshot.data) {
      const imgPath = `${artifactDir}\\login_screen.png`;
      fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
      console.log('Screenshot saved to:', imgPath);
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
