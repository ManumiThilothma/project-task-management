import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user. First user registered in system can optionally be ADMIN, but let's default to TEAM_MEMBER.
    // Actually, we can check if there are any users in the DB yet. If not, make them ADMIN. This makes setup very user-friendly!
    const userCount = await db.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'TEAM_MEMBER';

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
      },
    });

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set cookie response
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Registration successful',
    }, { status: 201 });

    // Cookie configuration
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
