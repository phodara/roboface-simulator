#!/usr/bin/env node

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const output = path.join(root, 'assets', 'social', 'vidiotbox-philosophy-instagram.mp4');
const silentOutput = path.join(root, 'assets', 'social', 'vidiotbox-philosophy-instagram-WithoutAudio.mp4');
const framesDir = path.join(os.tmpdir(), 'vidiotbox-philosophy-frames');
const profileDir = path.join(os.tmpdir(), 'vidiotbox-philosophy-chrome-profile');
const width = Number(process.env.WIDTH || 1080);
const height = Number(process.env.HEIGHT || 1920);
const fps = Number(process.env.FPS || 30);
const seconds = Number(process.env.SECONDS || 59);
const urlCardSeconds = Number(process.env.URL_CARD_SECONDS || 8);
const frameCount = Math.round(fps * seconds);
const urlCardFrameCount = Math.round(fps * urlCardSeconds);
const crawlFrameCount = frameCount - urlCardFrameCount;
const port = Number(process.env.CDP_PORT || 9227);
const finalTranslate = Number(process.env.FINAL_TRANSLATE || -1050);
const startScale = Number(process.env.START_SCALE || 0.46);
const finalScale = Number(process.env.FINAL_SCALE || 0.46);
const crawlTop = process.env.CRAWL_TOP || '42vh';
const audioInput = process.env.AUDIO
  ? path.resolve(root, process.env.AUDIO)
  : '';
const audioVolume = Number(process.env.AUDIO_VOLUME || 1);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function waitForChrome() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch (_) {
      await wait(100);
    }
  }
  throw new Error('Chrome did not open its debugging port in time.');
}

function createCdpClient(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result || {});
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const messageId = ++id;
          ws.send(JSON.stringify({ id: messageId, method, params }));
          return new Promise((resolveSend, rejectSend) => {
            pending.set(messageId, { resolve: resolveSend, reject: rejectSend });
          });
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener('error', reject);
  });
}

async function main() {
  if (audioInput && !fs.existsSync(audioInput)) {
    throw new Error(`Audio file not found: ${audioInput}`);
  }

  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    `file://${path.join(root, 'philosophy.html')}`,
  ], { stdio: 'ignore' });

  try {
    await waitForChrome();
    const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
    const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    if (!page) throw new Error('Chrome did not expose a controllable page target.');
    const browser = await createCdpClient(page.webSocketDebuggerUrl);
    const send = (method, params = {}) => browser.send(method, params);

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: width,
      screenHeight: height,
    });
    await send('Page.navigate', { url: `file://${path.join(root, 'philosophy.html')}` });
    await wait(700);

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          document.querySelector('.site-menu')?.remove();
          document.body.style.width = '${width}px';
          document.body.style.height = '${height}px';
          document.body.style.overflow = 'hidden';
          const style = document.createElement('style');
          style.textContent = \`
            .crawl-stage {
              width: ${width}px !important;
              height: ${height}px !important;
              padding: 0 48px !important;
              perspective: 360px !important;
              perspective-origin: 50% 18% !important;
            }
            .crawl-stage::before {
              height: 64vh !important;
            }
            .crawl {
              animation: none !important;
              top: ${crawlTop} !important;
              width: 980px !important;
              will-change: transform;
            }
          \`;
          document.head.appendChild(style);
        })()
      `,
    });

    if (crawlFrameCount < 2) {
      throw new Error('The crawl needs at least two frames. Lower URL_CARD_SECONDS or increase SECONDS.');
    }

    for (let frame = 0; frame < crawlFrameCount; frame += 1) {
      const progress = frame / (crawlFrameCount - 1);
      const translateY = finalTranslate * progress;
      const scale = startScale + ((finalScale - startScale) * progress);
      await send('Runtime.evaluate', {
        expression: `
          document.querySelector('.crawl').style.transform =
            'rotateX(68deg) translateY(${translateY}px) scale(${scale})';
        `,
      });
      const shot = await send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 92,
        clip: { x: 0, y: 0, width, height, scale: 1 },
        captureBeyondViewport: false,
      });
      fs.writeFileSync(
        path.join(framesDir, `frame-${String(frame).padStart(5, '0')}.jpg`),
        Buffer.from(shot.data, 'base64')
      );
      if (frame % fps === 0) {
        process.stdout.write(`captured ${Math.round(frame / fps)}s / ${seconds}s\n`);
      }
    }

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          document.body.innerHTML = \`
            <main class="url-card" aria-label="Vidiotbox website">
              <div class="url-mark">VIDIOTBOX</div>
              <div class="url">https://vidiotbox.net</div>
            </main>
          \`;
          const style = document.createElement('style');
          style.textContent = \`
            html,
            body {
              width: ${width}px !important;
              height: ${height}px !important;
              margin: 0 !important;
              overflow: hidden !important;
              background: #111 !important;
              color: #d7dee3 !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            .url-card {
              width: 100%;
              height: 100%;
              display: grid;
              place-content: center;
              gap: 44px;
              padding: 96px;
              text-align: center;
            }
            .url-mark {
              color: #00ff66;
              font-size: 76px;
              line-height: 1;
              font-weight: 900;
              letter-spacing: 0;
            }
            .url {
              color: #7dd3fc;
              font-size: 74px;
              line-height: 1.08;
              font-weight: 900;
              letter-spacing: 0;
              text-wrap: balance;
            }
          \`;
          document.head.appendChild(style);
        })()
      `,
    });

    for (let frame = crawlFrameCount; frame < frameCount; frame += 1) {
      const shot = await send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 92,
        clip: { x: 0, y: 0, width, height, scale: 1 },
        captureBeyondViewport: false,
      });
      fs.writeFileSync(
        path.join(framesDir, `frame-${String(frame).padStart(5, '0')}.jpg`),
        Buffer.from(shot.data, 'base64')
      );
      if (frame % fps === 0) {
        process.stdout.write(`captured ${Math.round(frame / fps)}s / ${seconds}s\n`);
      }
    }

    browser.close();
    chrome.kill();

    execFileSync('ffmpeg', [
      '-y',
      '-framerate', String(fps),
      '-i', path.join(framesDir, 'frame-%05d.jpg'),
      '-vf', 'format=yuv420p',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-movflags', '+faststart',
      audioInput ? silentOutput : output,
    ], { stdio: 'inherit' });

    if (audioInput) {
      execFileSync('ffmpeg', [
        '-y',
        '-i', silentOutput,
        '-stream_loop', '-1',
        '-i', audioInput,
        '-t', String(seconds),
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-af', `volume=${audioVolume}`,
        '-movflags', '+faststart',
        output,
      ], { stdio: 'inherit' });
    }

    const stats = fs.statSync(output);
    process.stdout.write(`wrote ${output} (${(stats.size / 1024 / 1024).toFixed(1)} MB)\n`);
  } finally {
    if (!chrome.killed) chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
