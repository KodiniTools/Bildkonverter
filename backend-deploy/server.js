import express from 'express';
import convertRouter from './routes/convert.js';

const app = express();
const PORT = process.env.PORT || 9007;

app.use(express.json());

// Health-Check (NGINX: /bildkonverter/health → /health)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bildkonverter-api', timestamp: new Date().toISOString() });
});

// Konvertierungs-Routen (NGINX: /bildkonverter/api/* → /api/*)
app.use('/api', convertRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Bildkonverter API läuft auf http://127.0.0.1:${PORT}`);
});
