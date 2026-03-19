import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import soundsRouter from './routes/sounds';
import presetsRouter from './routes/presets';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

// Servir arquivos de áudio estáticos
app.use('/sounds', express.static(path.join(__dirname, '..', 'public', 'sounds')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Rotas da API
app.use('/api/sounds', soundsRouter);
app.use('/api/presets', presetsRouter);

// Middleware de erros (deve ser o último)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎵 Hibiki API rodando em http://localhost:${PORT}`);
});

export default app;
