import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectToDatabase();
    
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || typeof id !== 'string' || id.length !== 24) {
      return new NextResponse('Invalid ID format', { status: 400 });
    }

    // Connect directly to your chatting_app database via the native client
    const db = mongoose.connection.getClient().db('chatting_app');
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'media' });
    
    // CRITICAL FIX: Use the native mongo ObjectId required by GridFS buckets
    const objectId = new mongoose.mongo.ObjectId(id);
    
    // Query the bucket directly
    const files = await bucket.find({ _id: objectId }).toArray();
    
    if (!files || files.length === 0) {
      console.error(`GridFS 404: File ID not found: ${id}`);
      return new NextResponse('File not found', { status: 404 });
    }

    const fileDoc = files[0];
    const downloadStream = bucket.openDownloadStream(objectId);

    const stream = new ReadableStream({
      start(controller) {
        downloadStream.on('data', (chunk) => controller.enqueue(chunk));
        downloadStream.on('end', () => controller.close());
        downloadStream.on('error', (error) => {
          console.error("GridFS Stream error:", error);
          controller.error(error);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': fileDoc.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', 
      }
    });
  } catch (error) {
    console.error("GET /api/media ERROR:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}