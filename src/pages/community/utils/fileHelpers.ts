// fileHelpers.ts
// Advanced, Firestore-compliant file helpers for the community platform

import { DEFAULT_LIMITS } from './constants';

// Allowed file types/extensions (can be extended)
export const ALLOWED_FILE_TYPES = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav', 'zip', 'rar',
  'txt', 'csv', 'json', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css'
];

export const ALLOWED_MIME_TYPES = [
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav',
  'application/zip', 'application/x-rar-compressed', 'text/plain', 'text/csv', 'application/json',
  'text/javascript', 'text/css', 'text/html', 'application/octet-stream'
];

// Validate file size (in bytes)
export function validateFileSize(file: File, maxSizeMB: number = DEFAULT_LIMITS.MAX_FILE_SIZE_MB): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

// Validate file type by extension or MIME type
export function validateFileType(file: File): boolean {
  const ext = getFileExtension(file.name);
  return ALLOWED_FILE_TYPES.includes(ext) || ALLOWED_MIME_TYPES.includes(file.type);
}

// Get file extension from file name
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

// Guess MIME type from extension (basic mapping)
export function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    js: 'text/javascript',
    ts: 'text/javascript',
    py: 'text/x-python',
    java: 'text/x-java-source',
    cpp: 'text/x-c++src',
    c: 'text/x-csrc',
    html: 'text/html',
    css: 'text/css',
  };
  return map[ext] || 'application/octet-stream';
}

// Sanitize file name for storage
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Generate Firestore/Storage path for uploads
export function generateFilePath(
  communityId: string,
  userId: string,
  fileName: string,
  type: 'resource' | 'chat' | 'avatar' | 'other' = 'other',
  context?: { resourceId?: string; chatMessageId?: string }
): string {
  const safeName = sanitizeFileName(fileName);
  if (type === 'resource') {
    return `resources/${communityId}/${Date.now()}_${safeName}`;
  } else if (type === 'chat') {
    return `chat/${communityId}/${context?.chatMessageId || 'general'}/${Date.now()}_${safeName}`;
  } else if (type === 'avatar') {
    return `avatars/${userId}/${Date.now()}_${safeName}`;
  } else {
    return `uploads/${communityId}/${Date.now()}_${safeName}`;
  }
}

// Get attachment metadata (for Firestore/Storage)
export function getAttachmentMetadata(file: File, uploadedBy: string) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedBy,
    uploadedAt: new Date(),
  };
} 