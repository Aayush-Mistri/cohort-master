import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/user-model.js';
import Update from '../models/update-model.js';
import Message from '../models/message-model.js';
import Group from '../models/group-model.js';
import Community from '../models/community-model.js';
import Event from '../models/event-model.js';
import { saveBufferAsMedia } from '../utils/media.js';

dotenv.config({ quiet: true });

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const migratedCache = new Map();
const missingCache = new Set();

const isLocalUploadPath = (value) => (
  typeof value === 'string'
  && value.startsWith('/uploads/')
  && value.length > '/uploads/'.length
);

const getMimeTypeFromName = (fileName = '') => {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip'
  };

  return mimeTypes[ext] || 'application/octet-stream';
};

const migrateLocalPath = async ({ url, ownerId = null, category = 'general', mimeType = '' }) => {
  if (!isLocalUploadPath(url)) {
    return { changed: false, url };
  }

  if (migratedCache.has(url)) {
    return { changed: true, url: migratedCache.get(url), reused: true };
  }

  if (missingCache.has(url)) {
    return { changed: false, url, missing: true };
  }

  const fileName = path.basename(url);
  const absolutePath = path.join(uploadsRoot, fileName);

  try {
    const buffer = await fs.readFile(absolutePath);
    const stored = await saveBufferAsMedia({
      buffer,
      originalName: fileName,
      mimeType: mimeType || getMimeTypeFromName(fileName),
      size: buffer.length,
      ownerId,
      category,
      source: 'migration'
    });

    migratedCache.set(url, stored.url);
    return { changed: true, url: stored.url };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      missingCache.add(url);
      return { changed: false, url, missing: true };
    }
    throw error;
  }
};

const migrateUsers = async () => {
  let updated = 0;
  let missing = 0;
  const users = await User.find({ profilePic: /^\/uploads\// });

  for (const user of users) {
    const result = await migrateLocalPath({
      url: user.profilePic,
      ownerId: user._id,
      category: 'profiles'
    });

    if (result.changed) {
      user.profilePic = result.url;
      await user.save();
      updated += 1;
    } else if (result.missing) {
      missing += 1;
    }
  }

  return { updated, missing, scanned: users.length };
};

const migrateUpdates = async () => {
  let updated = 0;
  let missing = 0;
  const updates = await Update.find({ image: /^\/uploads\// });

  for (const update of updates) {
    const result = await migrateLocalPath({
      url: update.image,
      ownerId: update.author,
      category: 'updates'
    });

    if (result.changed) {
      update.image = result.url;
      await update.save();
      updated += 1;
    } else if (result.missing) {
      missing += 1;
    }
  }

  return { updated, missing, scanned: updates.length };
};

const migrateMessages = async () => {
  let updated = 0;
  let missing = 0;
  const messages = await Message.find({ 'attachments.url': /^\/uploads\// });

  for (const message of messages) {
    let changed = false;

    message.attachments = await Promise.all((message.attachments || []).map(async (attachment) => {
      const result = await migrateLocalPath({
        url: attachment.url,
        ownerId: message.sender,
        category: 'messages',
        mimeType: attachment.mimeType || ''
      });

      if (result.changed) {
        changed = true;
        return {
          ...attachment.toObject(),
          url: result.url
        };
      }

      if (result.missing) {
        missing += 1;
      }

      return attachment;
    }));

    if (changed) {
      message.markModified('attachments');
      await message.save();
      updated += 1;
    }
  }

  return { updated, missing, scanned: messages.length };
};

const migrateModelImageField = async ({ Model, field, category }) => {
  let updated = 0;
  let missing = 0;
  const query = {};
  query[field] = /^\/uploads\//;
  const docs = await Model.find(query);

  for (const doc of docs) {
    const result = await migrateLocalPath({
      url: doc[field],
      ownerId: doc.creator || null,
      category
    });

    if (result.changed) {
      doc[field] = result.url;
      await doc.save();
      updated += 1;
    } else if (result.missing) {
      missing += 1;
    }
  }

  return { updated, missing, scanned: docs.length };
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const summary = {
    users: await migrateUsers(),
    updates: await migrateUpdates(),
    messages: await migrateMessages(),
    groupsProfile: await migrateModelImageField({ Model: Group, field: 'profileImage', category: 'groups' }),
    groupsCover: await migrateModelImageField({ Model: Group, field: 'coverImage', category: 'groups' }),
    groupsIcon: await migrateModelImageField({ Model: Group, field: 'icon', category: 'groups' }),
    communitiesCover: await migrateModelImageField({ Model: Community, field: 'coverImage', category: 'communities' }),
    communitiesIcon: await migrateModelImageField({ Model: Community, field: 'icon', category: 'communities' }),
    eventsCover: await migrateModelImageField({ Model: Event, field: 'coverImage', category: 'events' }),
    reusedUploads: migratedCache.size,
    missingFiles: missingCache.size
  };

  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Media migration failed:', error);
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
