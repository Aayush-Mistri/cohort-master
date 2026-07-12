import express from 'express';
import mongoose from 'mongoose';
import { getMediaFileDocument, openMediaDownloadStream } from '../utils/media.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const file = await getMediaFileDocument(id);
    if (!file) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const mimeType = file.metadata?.mimeType || file.contentType || 'application/octet-stream';
    const fileName = file.metadata?.originalName || file.filename || 'file';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', String(file.length || 0));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const dispositionType = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader(
      'Content-Disposition',
      `${dispositionType}; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );

    const downloadStream = openMediaDownloadStream(id);
    downloadStream.on('error', (error) => {
      if (!res.headersSent) {
        res.status(500).json({ message: 'Could not load media', error: error.message });
        return;
      }
      res.destroy(error);
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Could not load media', error: error.message });
  }
});

export default router;
