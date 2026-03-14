import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.route.js';
import messageRoutes from './routes/message.route.js';
import communityRoutes from './routes/community.route.js';
import groupRoutes from './routes/group.route.js';
import eventRoutes from './routes/event.route.js';
import updateRoutes from './routes/update.route.js';
import aiRoutes from './routes/ai.route.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(backendRoot, 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/user', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/ai', aiRoutes);

export default app;
