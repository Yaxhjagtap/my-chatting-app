import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import { Message } from '../../../../models/Message';

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { messageId } = await req.json();
    await Message.findByIdAndUpdate(messageId, { status: 'seen' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/messages/seen ERROR:", error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}