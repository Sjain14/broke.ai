const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const BACKUP_NAME = 'broke_ai_backup.json';

/**
 * Search for the backup file in the user's Google Drive.
 * Returns the fileId if found, null otherwise.
 */
async function findBackupFile(token: string): Promise<string | null> {
  const res = await fetch(
    `${DRIVE_API}?q=name='${BACKUP_NAME}' and trashed=false&spaces=drive&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`);
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

/**
 * Backup the entire app state to Google Drive.
 * Creates broke_ai_backup.json if it doesn't exist, or updates it if it does.
 */
export async function backupToDrive(token: string, data: string): Promise<void> {
  const existingId = await findBackupFile(token);

  if (existingId) {
    // PATCH — update existing file content
    const res = await fetch(`${DRIVE_UPLOAD}/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data,
    });
    if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
  } else {
    // POST — create new file via multipart/related
    const boundary = '-------broke_ai_boundary';
    const metadata = JSON.stringify({ name: BACKUP_NAME, mimeType: 'application/json' });

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${data}\r\n` +
      `--${boundary}--`;

    const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
  }
}

/**
 * Restore app state from Google Drive.
 * Returns the parsed JSON if the backup exists, null otherwise.
 */
export async function restoreFromDrive(token: string): Promise<any | null> {
  const fileId = await findBackupFile(token);
  if (!fileId) return null;

  const res = await fetch(`${DRIVE_API}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.json();
}
