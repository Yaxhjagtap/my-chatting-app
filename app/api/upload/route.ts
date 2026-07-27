import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // STRICT FIX: Forcibly tell the native driver to use chatting_app
    const db = mongoose.connection.getClient().db('chatting_app');
    
    const bucket = new mongoose.mongo.GridFSBucket(db, { 
      bucketName: 'media' 
    });

    const uploadStream = bucket.openUploadStream(file.name, {
      contentType: file.type,
    });

    uploadStream.end(buffer);

    return await new Promise((resolve, reject) => {
      uploadStream.on('finish', () => {
        resolve(NextResponse.json({ 
          success: true, 
          mediaUrl: `/api/media/${uploadStream.id.toString()}` 
        }));
      });
      
      uploadStream.on('error', (error) => {
        console.error("GridFS Upload Error:", error);
        reject(NextResponse.json({ error: 'Upload failed' }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error("POST /api/upload ERROR:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}