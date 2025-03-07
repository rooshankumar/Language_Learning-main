
import { Client } from 'replit-object-storage';

const storage = new Client();
const BUCKET_NAME = 'user-images';

export async function uploadImage(file: File): Promise<string> {
  try {
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    
    // Upload to Replit Object Storage
    await storage.upload(`${BUCKET_NAME}/${filename}`, buffer);
    
    // Return the URL that can be used to access the file
    return `/api/images/${filename}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function getImage(filename: string): Promise<Buffer | null> {
  try {
    return await storage.download(`${BUCKET_NAME}/${filename}`);
  } catch (error) {
    console.error('Error retrieving image:', error);
    return null;
  }
}
