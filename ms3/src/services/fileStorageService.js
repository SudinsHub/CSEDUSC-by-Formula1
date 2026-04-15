import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import crypto from 'crypto';

export const save = async (file) => {
  // Generate unique filename
  const ext = path.extname(file.originalname);
  const uuid = crypto.randomUUID();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Create directory structure: /uploads/YYYY/MM/
  const dir = path.join(config.upload.dir, String(year), month);
  
  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filename = `${uuid}${ext}`;
  const filepath = path.join(dir, filename);
  
  // Move file from temp location to final destination
  fs.renameSync(file.path, filepath);
  
  // Return relative path for database storage
  return path.join(String(year), month, filename);
};

export const buildPath = (relativePath) => {
  return path.join(config.upload.dir, relativePath);
};

export const stream = (filePath, res) => {
  const fullPath = buildPath(filePath);
  
  if (!fs.existsSync(fullPath)) {
    const error = new Error('File not found');
    error.status = 404;
    throw error;
  }
  
  const stat = fs.statSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  
  // Set appropriate content type
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf',
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`);
  
  const readStream = fs.createReadStream(fullPath);
  readStream.pipe(res);
};

export const deleteFile = (filePath) => {
  const fullPath = buildPath(filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};
