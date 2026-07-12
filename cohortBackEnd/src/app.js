import express from 'express';
import cors from 'cors';
import multer from 'multer';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.route.js';
import messageRoutes from './routes/message.route.js';
import communityRoutes from './routes/community.route.js';
import groupRoutes from './routes/group.route.js';
import eventRoutes from './routes/event.route.js';
import updateRoutes from './routes/update.route.js';
import aiRoutes from './routes/ai.route.js';
import mediaRoutes from './routes/media.route.js';
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
app.use('/api/media', mediaRoutes);

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? ((err.field === 'profilePic' || err.field === 'image')
        ? 'Image is too large. Max size is 10 MB.'
        : 'File is too large. Please upload a smaller file.')
      : err.message;
    return res.status(400).json({ message });
  }

  if (err.message === 'Please upload a JPG, PNG, GIF, WebP, SVG, AVIF, or BMP image.') {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Server error', error: err.message });
});

export default app;
