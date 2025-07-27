import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  FirestoreError,
  Timestamp
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../../../firebase';
import type { MediaFile } from '../types/common.types';
import type { Resource } from '../types/resource.types';
import type { ChatAttachment } from '../types/chat.types';

export class FileUploadService {
  private static instance: FileUploadService;
  private readonly RESOURCES_COLLECTION = 'resources';
  private readonly CHAT_ATTACHMENTS_COLLECTION = 'chatAttachments'; // If you want to store attachments separately

  private constructor() {}
  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Upload a file to Firebase Storage and store metadata in Firestore
   * Returns the MediaFile metadata
   */
  async uploadFile(
    file: File,
    {
      communityId,
      uploadedBy,
      type,
      context,
      onProgress
    }: {
      communityId: string;
      uploadedBy: string;
      type: 'resource' | 'chat' | 'avatar' | 'other';
      context?: { resourceId?: string; chatMessageId?: string };
      onProgress?: (progress: number) => void;
    }
  ): Promise<MediaFile> {
    // Validate file type/size (example: max 100MB)
    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) throw new Error('File too large');
    // TODO: Add allowed file type validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav', 'zip', 'rar', 'txt', 'csv', 'json', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css'];
    if (!ext || !allowedTypes.includes(ext)) throw new Error('File type not allowed');

    // Storage path
    let path = '';
    if (type === 'resource') {
      path = `resources/${communityId}/${Date.now()}_${file.name}`;
    } else if (type === 'chat') {
      path = `chat/${communityId}/${context?.chatMessageId || 'general'}/${Date.now()}_${file.name}`;
    } else if (type === 'avatar') {
      path = `avatars/${uploadedBy}/${Date.now()}_${file.name}`;
    } else {
      path = `uploads/${communityId}/${Date.now()}_${file.name}`;
    }

    const sRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(sRef, file);

    return new Promise<MediaFile>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const now = serverTimestamp();
            const metadata: MediaFile = {
              id: sRef.name,
              name: file.name,
              originalName: file.name,
              size: file.size,
              type: file.type,
              url,
              uploadedBy,
              uploadedAt: now as Timestamp,
              // Optionally add thumbnailUrl, metadata, etc.
            };
            // Store metadata in Firestore (resources or chat attachments)
            if (type === 'resource') {
              // Add to resources collection (as a new resource or update existing)
              // This is just the file metadata, not the full Resource object
              await setDoc(doc(collection(db, this.RESOURCES_COLLECTION)), metadata);
            } else if (type === 'chat') {
              // Optionally store in a separate chatAttachments collection
              await setDoc(doc(collection(db, this.CHAT_ATTACHMENTS_COLLECTION)), metadata);
            }
            resolve(metadata);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  /**
   * Get file metadata by ID (from resources or chatAttachments)
   */
  async getFileMetadata(id: string, type: 'resource' | 'chat' | 'avatar' | 'other'): Promise<MediaFile | null> {
    let col = this.RESOURCES_COLLECTION;
    if (type === 'chat') col = this.CHAT_ATTACHMENTS_COLLECTION;
    const ref = doc(db, col, id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as MediaFile;
  }

  /**
   * List files for a community or user (with optional filters)
   */
  async listFiles({
    communityId,
    uploadedBy,
    type = 'resource',
    limitCount = 20,
    startAfterDoc
  }: {
    communityId?: string;
    uploadedBy?: string;
    type?: 'resource' | 'chat' | 'avatar' | 'other';
    limitCount?: number;
    startAfterDoc?: unknown;
  }): Promise<MediaFile[]> {
    let col = this.RESOURCES_COLLECTION;
    if (type === 'chat') col = this.CHAT_ATTACHMENTS_COLLECTION;
    let q = query(collection(db, col));
    if (communityId) q = query(q, where('communityId', '==', communityId));
    if (uploadedBy) q = query(q, where('uploadedBy', '==', uploadedBy));
    q = query(q, orderBy('uploadedAt', 'desc'), limit(limitCount));
    if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaFile));
  }

  /**
   * Delete a file from Storage and Firestore (if allowed)
   */
  async deleteFile(id: string, type: 'resource' | 'chat' | 'avatar' | 'other'): Promise<void> {
    let col = this.RESOURCES_COLLECTION;
    if (type === 'chat') col = this.CHAT_ATTACHMENTS_COLLECTION;
    const ref = doc(db, col, id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('File not found');
    const data = snapshot.data() as MediaFile;
    // Delete from Storage
    const sRef = storageRef(storage, data.url);
    await deleteObject(sRef);
    // Delete metadata
    await deleteDoc(ref);
  }

  /**
   * Subscribe to file metadata changes (real-time)
   */
  subscribeToFiles(
    type: 'resource' | 'chat' | 'avatar' | 'other',
    callback: (files: MediaFile[]) => void,
    onError?: (error: FirestoreError) => void,
    communityId?: string,
    uploadedBy?: string
  ): Unsubscribe {
    let col = this.RESOURCES_COLLECTION;
    if (type === 'chat') col = this.CHAT_ATTACHMENTS_COLLECTION;
    let q = query(collection(db, col));
    if (communityId) q = query(q, where('communityId', '==', communityId));
    if (uploadedBy) q = query(q, where('uploadedBy', '==', uploadedBy));
    q = query(q, orderBy('uploadedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const files: MediaFile[] = [];
        snapshot.forEach(doc => {
          files.push({ id: doc.id, ...doc.data() } as MediaFile);
        });
        callback(files);
      },
      onError
    );
  }

  /**
   * Get a download URL for a file (from Storage)
   */
  async getDownloadUrl(pathOrUrl: string): Promise<string> {
    // If already a URL, return as is
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    const sRef = storageRef(storage, pathOrUrl);
    return getDownloadURL(sRef);
  }
} 