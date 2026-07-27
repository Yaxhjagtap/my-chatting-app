import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import { Message } from '../../../models/Message';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const user1 = url.searchParams.get('user1');
    const user2 = url.searchParams.get('user2');

    let query = {};
    if (user1 && user2) {
      query = {
        $or: [
          { senderName: user1, recipientName: user2 },
          { senderName: user2, recipientName: user1 },
          { recipientName: { $exists: false } }
        ]
      };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(100);
    
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      _id: msg._id.toString(),
      senderName: msg.senderName,
      recipientName: msg.recipientName || user2,
      text: msg.text || '',
      mediaUrl: msg.mediaUrl,
      status: msg.status,
      reactions: msg.reactions || [],
      isEdited: msg.isEdited || false,
      time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("GET /api/messages ERROR:", error); 
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const newMessage = await Message.create({
      senderName: body.senderName,
      recipientName: body.recipientName,
      text: body.text || '',
      mediaUrl: body.mediaUrl,
      status: 'sent',
      reactions: []
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("POST /api/messages ERROR:", error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { messageId, action, text, emoji, userName } = body;

    if (action === 'edit') {
      const updated = await Message.findByIdAndUpdate(
        messageId, 
        { text, isEdited: true }, 
        { new: true, runValidators: false }
      );
      return NextResponse.json({ success: true, message: updated });
    }

    if (action === 'react') {
      const msg = await Message.findById(messageId);
      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

      if (!msg.reactions) msg.reactions = [];

      const existingIndex = msg.reactions.findIndex((r: any) => r.userName === userName);
      if (existingIndex > -1) {
        if (msg.reactions[existingIndex].emoji === emoji) {
          msg.reactions.splice(existingIndex, 1);
        } else {
          msg.reactions[existingIndex].emoji = emoji;
        }
      } else {
        msg.reactions.push({ emoji, userName });
      }

      const updated = await Message.findByIdAndUpdate(
        messageId,
        { reactions: msg.reactions },
        { new: true, runValidators: false }
      );

      return NextResponse.json({ success: true, message: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/messages ERROR:", error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const messageId = url.searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    await Message.findByIdAndDelete(messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/messages ERROR:", error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}