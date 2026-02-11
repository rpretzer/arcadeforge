
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import handler from 'serve-handler';
import chalk from 'chalk';
import open from 'open';

const FEEDBACK_FILE = 'feedback.json';
const PORT = 3000;

const INJECTED_SCRIPT = `
<!-- ArcadeForge Dev Tools -->
<style>
  #af-toolbar{position:fixed;bottom:20px;right:20px;z-index:10000;font-family:monospace}
  #af-toggle{background:#000;color:#0f0;border:1px solid #0f0;padding:8px 12px;cursor:pointer;font-weight:bold;box-shadow:2px 2px 0 #0f0}
  #af-toggle:focus{outline:2px solid #fff;outline-offset:2px}
  #af-panel{display:none;background:#111;border:1px solid #333;padding:15px;width:300px;margin-bottom:10px;box-shadow:0 4px 12px rgba(0,0,0,0.5)}
  #af-panel textarea{width:100%;height:100px;background:#222;border:1px solid #444;color:#eee;padding:8px;margin-bottom:10px;font-family:inherit;resize:vertical}
  #af-panel button.save{background:#0f0;color:#000;border:none;padding:6px 12px;cursor:pointer;font-weight:bold;width:100%}
  #af-panel button.save:hover{background:#4f4}
  #af-panel button.save:focus{outline:2px solid #fff}
  .af-success{color:#0f0;font-size:12px;margin-top:5px;text-align:center;display:none}
</style>
<div id="af-toolbar" role="region" aria-label="ArcadeForge Developer Tools">
  <div id="af-panel" role="dialog" aria-modal="false" aria-labelledby="af-title">
    <div id="af-title" style="margin-bottom:8px; color:#888; font-size:12px">ARCADEFORGE FEEDBACK</div>
    <textarea id="af-input" aria-label="Feedback text" placeholder="What feels off? Enemies too fast? Jump too floaty?"></textarea>
    <button class="save" id="af-save" aria-label="Save feedback notes">SAVE NOTES</button>
    <div id="af-msg" class="af-success" role="status">✓ Saved to feedback.json</div>
  </div>
  <button id="af-toggle" aria-expanded="false" aria-controls="af-panel">_ NOTES</button>
</div>
<script>
  (function() {
    const toggle = document.getElementById('af-toggle');
    const panel = document.getElementById('af-panel');
    const saveBtn = document.getElementById('af-save');
    const input = document.getElementById('af-input');
    const msg = document.getElementById('af-msg');

    toggle.addEventListener('click', () => {
      const isHidden = panel.style.display === 'none' || panel.style.display === '';
      panel.style.display = isHidden ? 'block' : 'none';
      toggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      if (isHidden) input.focus();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.style.display === 'block') {
        panel.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    saveBtn.addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) return;

      try {
        saveBtn.disabled = true;
        saveBtn.innerText = 'SAVING...';
        
        const res = await fetch('/__arcadeforge/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: text, timestamp: new Date().toISOString() })
        });

        if (res.ok) {
          input.value = '';
          msg.style.display = 'block';
          setTimeout(() => msg.style.display = 'none', 2000);
        }
      } catch (err) {
        console.error('Failed to save feedback', err);
        alert('Error saving feedback. Is the server running?');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'SAVE NOTES';
      }
    });
  })();
</script>
`;

export async function serveGame(dir: string = '.'): Promise<void> {
  const targetDir = path.resolve(dir);
  
  if (!existsSync(targetDir)) {
    console.error(chalk.red(`Directory not found: ${targetDir}`));
    process.exit(1);
  }

  const indexPath = path.join(targetDir, 'index.html');
  if (!existsSync(indexPath)) {
    console.warn(chalk.yellow(`\n⚠️  Warning: No index.html found in ${targetDir}`));
    console.warn(chalk.dim('   The server will start, but you might just see a file listing.'));
    console.warn(chalk.dim('   Make sure you are in your game\'s root directory.\n'));
  }

  const server = http.createServer(async (req, res) => {
    // API: Handle Feedback
    if (req.url === '/__arcadeforge/feedback' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const feedbackPath = path.join(targetDir, FEEDBACK_FILE);
          
          let currentFeedback: any[] = [];
          if (existsSync(feedbackPath)) {
            const content = await fs.readFile(feedbackPath, 'utf-8');
            try {
              currentFeedback = JSON.parse(content);
              if (!Array.isArray(currentFeedback)) currentFeedback = [];
            } catch {
              // file exists but is corrupt/empty, start fresh
            }
          }

          currentFeedback.push(data);
          await fs.writeFile(feedbackPath, JSON.stringify(currentFeedback, null, 2));
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          console.log(chalk.gray(`   📝 Feedback saved: "${data.note.substring(0, 40)}${data.note.length > 40 ? '...' : ''}"`));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to save' }));
        }
      });
      return;
    }

    // Serve HTML with injection
    if (req.url === '/' || req.url === '/index.html') {
      const indexPath = path.join(targetDir, 'index.html');
      if (existsSync(indexPath)) {
        try {
          let html = await fs.readFile(indexPath, 'utf-8');
          // Inject before body close
          html = html.replace('</body>', `${INJECTED_SCRIPT}</body>`);
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        } catch (err) {
          console.error('Error reading index.html', err);
        }
      }
    }

    // Default static file serving
    return handler(req, res, {
      public: targetDir,
      headers: [
        { source: '**/*@(.js|.css|.json)', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }
      ]
    });
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(chalk.green(`\n🚀 Server running at ${chalk.bold(url)}`));
    console.log(chalk.dim('   Serving directory: ' + targetDir));
    console.log(chalk.dim('   Feedback will be saved to: ' + FEEDBACK_FILE));
    
    open(url).catch(() => {});
  });
}

