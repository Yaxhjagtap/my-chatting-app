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
      const existingUser = await User.findOne({ 
        name: { $regex: new RegExp(`^${formattedName}$`, 'i') } 
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists. Please log in.' }, { status: 400 });
      }
      
      const newUser = await User.create({ name: formattedName, password, avatar: '😎' });
      return NextResponse.json({ 
        success: true, 
        user: { 
          id: newUser._id.toString(), 
          name: newUser.name, 
          avatar: newUser.avatar,
          chatBackgrounds: newUser.chatBackgrounds || {} 
        } 
      });
    } 
    
    if (action === 'login') {
      const user = await User.findOne({ name: formattedName });
      
      if (!user) {
        return NextResponse.json({ error: 'Account not found. Please register.' }, { status: 404 });
      }

      if (user.password !== password) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: true, 
        user: { 
          id: user._id.toString(), 
          name: user.name, 
          avatar: user.avatar || '',
          chatBackgrounds: user.chatBackgrounds || {} 
        } 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: 'Server error during authentication' }, { status: 500 });
  }
}