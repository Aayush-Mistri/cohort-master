import path from 'path';
import mongoose from 'mongoose';

const MEDIA_BUCKET_NAME = 'media';
const MEDIA_URL_PREFIX = '/api/media/';

const getMediaBucket = () => {
  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error('MongoDB is not connected');
  }

  return new mongoose.mongo.GridFSBucket(db, { bucketName: MEDIA_BUCKET_NAME });
};

const sanitizeFileName = (originalName = '', fallbackPrefix = 'file') => {
  const safeOriginalName = path.basename(String(originalName || ''));
  const extension = path.extname(safeOriginalName);
  const baseName = path.basename(safeOriginalName, extension)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  const resolvedBaseName = baseName || `${fallbackPrefix}-${Date.now()}`;
  return `${resolvedBaseName}${extension || ''}`;
};

export const buildMediaUrl = (id) => `${MEDIA_URL_PREFIX}${id.toString()}`;

export const extractMediaIdFromUrl = (url = '') => {
  const match = String(url).match(/\/api\/media\/([a-fA-F0-9]{24})$/);
  return match?.[1] || null;
};

export const getMediaFileDocument = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error('MongoDB is not connected');
  }

  return db.collection(`${MEDIA_BUCKET_NAME}.files`).findOne({
    _id: new mongoose.Types.ObjectId(id)
  });
};

export const openMediaDownloadStream = (id) => (
  getMediaBucket().openDownloadStream(new mongoose.Types.ObjectId(id))
);

export const saveBufferAsMedia = async ({
  buffer,
  originalName = '',
  mimeType = 'application/octet-stream',
  size = 0,
  ownerId = null,
  category = 'general',
  source = 'upload'
}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('File buffer is required');
  }

  const fileName = sanitizeFileName(originalName, category);
  const uploadStream = getMediaBucket().openUploadStream(fileName, {
    metadata: {
      originalName: path.basename(originalName || fileName),
      mimeType,
      size: size || buffer.length,
      ownerId: ownerId ? ownerId.toString() : '',
      category,
      source,
      uploadedAt: new Date()
    }
  });

  return new Promise((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve({
        id: uploadStream.id.toString(),
        url: buildMediaUrl(uploadStream.id),
        fileName: path.basename(originalName || fileName),
        mimeType,
        size: size || buffer.length
      });
    });

    uploadStream.end(buffer);
  });
};

export const saveUploadAsMedia = async ({ file, ownerId = null, category = 'general' }) => {
  if (!file?.buffer) {
    throw new Error('Uploaded file is missing');
  }

  return saveBufferAsMedia({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size || file.buffer.length,
    ownerId,
    category,
    source: 'multer'
  });
};

export const deleteMediaByUrl = async (url) => {
  const mediaId = extractMediaIdFromUrl(url);
  if (!mediaId) {
    return false;
  }

  try {
    await getMediaBucket().delete(new mongoose.Types.ObjectId(mediaId));
    return true;
  } catch (error) {
    if (error?.message?.includes('FileNotFound')) {
      return false;
    }
    throw error;
  }
};

