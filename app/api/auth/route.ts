import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import { User } from '../../../models/User';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { action, name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    const formattedName = name.trim();

    if (action === 'register') {
      const existingUser = await User.findOne({ name: formattedName });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists. Please log in.' }, { status: 400 });
      }
      
      const newUser = await User.create({ name: formattedName, password, avatar: '' });
      return NextResponse.json({ 
        success: true, 
        user: { id: newUser._id.toString(), name: newUser.name, avatar: newUser.avatar || '' } 
      });
    } 
    
    if (action === 'login') {
      const user = await User.findOne({ name: formattedName, password });
      if (!user) {
        return NextResponse.json({ error: 'Invalid name or password' }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: true, 
        user: { id: user._id.toString(), name: user.name, avatar: user.avatar || '' } 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: 'Server error during authentication' }, { status: 500 });
  }
}