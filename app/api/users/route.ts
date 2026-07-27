import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({}, 'name avatar isOnline lastSeen');
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users ERROR:", error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { userId, name, avatar } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar;

    // Fixed Mongoose deprecation warning by using returnDocument: 'after'
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { returnDocument: 'after', runValidators: false }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: updatedUser._id.toString(), name: updatedUser.name, avatar: updatedUser.avatar } 
    });
  } catch (error) {
    console.error("PATCH /api/users ERROR:", error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}