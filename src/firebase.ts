import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { DriveBackupFile } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required scope for Google Drive file creation & listing
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If user is logged in but token was cleared, we can prompt or try to refresh.
        // For standard client-side, we'll let them sign in again or try popup.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Google Drive API Helpers

/**
 * Lists the backups stored by PLUNDERER in Google Drive
 */
export const listDriveBackups = async (accessToken: string): Promise<DriveBackupFile[]> => {
  try {
    const query = encodeURIComponent("(name contains 'plunderer_backup_' or name contains 'obanai_backup_') and mimeType = 'application/json' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime+desc`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`Google Drive API error: ${res.status} - ${errorMsg}`);
    }
    
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
      size: f.size ? `${(parseInt(f.size) / 1024).toFixed(2)} KB` : 'N/A'
    }));
  } catch (err) {
    console.error('Failed listing Drive backups:', err);
    throw err;
  }
};

/**
 * Uploads a JSON backup payload to Google Drive using multipart upload
 */
export const uploadBackupToDrive = async (accessToken: string, backupData: any): Promise<any> => {
  try {
    const boundary = 'plunderer_multipart_boundary';
    const metadata = {
      name: `plunderer_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`,
      description: 'Sincronização de backup de scrapers e comandos da API PLUNDERER',
      mimeType: 'application/json',
    };
    
    const body = 
      `\r\n--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `\r\n--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(backupData, null, 2)}\r\n` +
      `\r\n--${boundary}--`;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`Google Drive upload error: ${res.status} - ${errorMsg}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error('Failed uploading backup to Drive:', err);
    throw err;
  }
};

/**
 * Deletes a file in Google Drive
 */
export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<boolean> => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(`Google Drive delete error: ${res.status} - ${errorMsg}`);
    }
    
    return true;
  } catch (err) {
    console.error('Failed to delete file from Drive:', err);
    throw err;
  }
};
