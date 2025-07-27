// ChatMediaUpload.tsx
// Placeholder for ChatMediaUpload component

import React, { useRef, useState } from 'react';
import { FileUploadService } from '../../services/fileUploadService';
import { validateFileSize, validateFileType, generateFilePath } from '../../utils/fileHelpers';
import { DEFAULT_LIMITS } from '../../utils/constants';
import { ChatAttachment, AttachmentType } from '../../types/chat.types';
import { Timestamp } from 'firebase/firestore';

interface ChatMediaUploadProps {
  communityId: string;
  userId: string;
  chatMessageId?: string;
  onUploadComplete?: (attachments: ChatAttachment[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
}

const DEFAULT_MAX_FILES = DEFAULT_LIMITS.MAX_FILES_PER_UPLOAD;
const DEFAULT_MAX_FILE_SIZE_MB = DEFAULT_LIMITS.MAX_FILE_SIZE_MB;

function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith('image/')) return AttachmentType.IMAGE;
  if (file.type.startsWith('video/')) return AttachmentType.VIDEO;
  if (file.type.startsWith('audio/')) return AttachmentType.AUDIO;
  return AttachmentType.DOCUMENT;
}

export default function ChatMediaUpload({
  communityId,
  userId,
  chatMessageId,
  onUploadComplete,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
}: ChatMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addFiles(files);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newErrors: string[] = [];
    let validFiles = files.filter(file => {
      if (!validateFileType(file)) {
        newErrors.push(`${file.name}: Invalid file type.`);
        return false;
      }
      if (!validateFileSize(file, maxFileSizeMB)) {
        newErrors.push(`${file.name}: Exceeds ${maxFileSizeMB}MB.`);
        return false;
      }
      return true;
    });
    // Limit total files
    if (selectedFiles.length + validFiles.length > maxFiles) {
      newErrors.push(`You can upload up to ${maxFiles} files at once.`);
      validFiles = validFiles.slice(0, maxFiles - selectedFiles.length);
    }
    setErrors(newErrors);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file before upload
  const handleRemoveFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Upload all files
  const handleUpload = async () => {
    setUploading(true);
    setErrors([]);
    const newAttachments: ChatAttachment[] = [];
    for (const file of selectedFiles) {
      try {
        const type = getAttachmentType(file);
        const metadata = await FileUploadService.getInstance().uploadFile(file, {
          communityId,
          uploadedBy: userId,
          type: 'chat',
          context: { chatMessageId },
          onProgress: (progress) => setUploadProgress(prev => ({ ...prev, [file.name]: progress })),
        });
        // Build ChatAttachment from MediaFile
        const attachment: ChatAttachment = {
          id: metadata.id,
          type,
          name: metadata.name,
          url: metadata.url,
          thumbnailUrl: metadata.thumbnailUrl,
          size: metadata.size,
          mimeType: metadata.type,
          uploadedBy: metadata.uploadedBy,
          uploadedAt: metadata.uploadedAt ?? Timestamp.now(),
          isProcessing: false,
          isScanned: false,
        };
        newAttachments.push(attachment);
      } catch (err: unknown) {
        let errorMsg = 'Upload failed.';
        if (err instanceof Error) errorMsg = err.message;
        setErrors(prev => [...prev, `${file.name}: ${errorMsg}`]);
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    setSelectedFiles([]);
    setUploading(false);
    setUploadProgress({});
    if (onUploadComplete && newAttachments.length > 0) {
      onUploadComplete(newAttachments);
    }
  };

  return (
    <div className="chat-media-upload">
      <div
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{ border: '2px dashed #00bcd4', borderRadius: 10, padding: 16, marginBottom: 12, background: '#f9f9f9', cursor: 'pointer' }}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        aria-label="Upload files"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={'.' + [
            'pdf','doc','docx','ppt','pptx','xls','xlsx','jpg','jpeg','png','gif','mp4','mp3','wav','zip','rar','txt','csv','json','js','ts','py','java','cpp','c','html','css'
          ].join(',.')}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={uploading}
        />
        <div style={{ color: '#00bcd4', fontWeight: 600, fontSize: 16 }}>Drag & drop or click to select files</div>
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Max {maxFiles} files, {maxFileSizeMB}MB each</div>
      </div>
      {selectedFiles.length > 0 && (
        <div className="selected-files" style={{ marginBottom: 12 }}>
          {selectedFiles.map((file, idx) => (
            <div key={file.name + idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
              <span style={{ fontWeight: 500 }}>{file.name}</span>
              <span style={{ color: '#888', fontSize: 13 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              {uploadProgress[file.name] !== undefined && (
                <span style={{ color: '#00bcd4', fontSize: 13 }}>{Math.round(uploadProgress[file.name])}%</span>
              )}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRemoveFile(idx); }}
                style={{ marginLeft: 8, color: '#f44336', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                aria-label={`Remove ${file.name}`}
                disabled={uploading}
              >
                ✖️
              </button>
            </div>
          ))}
        </div>
      )}
      {attachments.length > 0 && (
        <div className="uploaded-attachments" style={{ marginBottom: 12 }}>
          {attachments.map(att => (
            <div key={att.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
              <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, color: '#00bcd4' }}>{att.name}</a>
              <span style={{ color: '#888', fontSize: 13 }}>{(att.size / 1024 / 1024).toFixed(2)} MB</span>
              <span style={{ color: '#888', fontSize: 13 }}>{att.mimeType}</span>
            </div>
          ))}
        </div>
      )}
      {errors.length > 0 && (
        <div className="upload-errors" style={{ color: '#f44336', marginBottom: 8 }}>
          {errors.map((err, idx) => <div key={idx}>{err}</div>)}
        </div>
      )}
      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading || selectedFiles.length === 0}
        style={{ background: '#00bcd4', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
        aria-label="Upload selected files"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
} 