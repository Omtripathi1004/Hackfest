import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleChatRequest } from './app/api/chat/route.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'bazarsetu-chat-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/chat' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const result = await handleChatRequest(parsed);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = result.status || 200;
                res.end(JSON.stringify(result.body));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Chat API error' }));
              }
            });
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    open: true,
  },
});
