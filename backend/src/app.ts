import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { mockAuth } from './middleware/mockAuth.js';
import usersRouter from './routes/users.js';
import chatRouter from './routes/chat.js';
import directoryRouter from './routes/directory.js';
import messagesRouter from './routes/messages.js';
import floorsRouter from './routes/floors.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // Health check (no auth).
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'connectops-backend' });
  });

  // Mock auth attaches req.currentUser to every API request below.
  app.use('/api', mockAuth);

  app.use('/api/users', usersRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/directory', directoryRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/floors', floorsRouter);

  // 404 for unknown API routes.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
