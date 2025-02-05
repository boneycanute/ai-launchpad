import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = "metaschool-launchpad";

interface UploadProgressCallback {
  (progress: number): void;
}

async function fileToBuffer(file: File): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(Buffer.from(reader.result));
      } else {
        reject(new Error('Failed to convert file to buffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export async function uploadFileToS3(
  file: File,
  userId: string,
  agentName: string,
  fileType: "knowledge" | "avatar",
  onProgress?: UploadProgressCallback
): Promise<string> {
  try {
    // Call progress callback to show upload started
    onProgress?.(0);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('agentName', agentName);
    formData.append('fileType', fileType);

    // Upload using the API route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    // Call progress callback to show upload complete
    onProgress?.(100);

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

export async function deleteFileFromS3(
  userId: string,
  agentName: string,
  fileName: string,
  fileType: "knowledge" | "avatar"
): Promise<void> {
  try {
    const response = await fetch('/api/upload/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        agentName,
        fileName,
        fileType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw error;
  }
}
