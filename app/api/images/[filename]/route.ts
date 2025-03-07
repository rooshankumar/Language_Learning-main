
import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  
  try {
    const imageBuffer = await getImage(filename);
    
    if (!imageBuffer) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Determine content type based on file extension
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // Default
    
    if (fileExtension === 'png') contentType = 'image/png';
    else if (fileExtension === 'gif') contentType = 'image/gif';
    else if (fileExtension === 'webp') contentType = 'image/webp';
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}
