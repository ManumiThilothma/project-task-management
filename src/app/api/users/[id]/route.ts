import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/users/[id] - Update user (Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = params.id;
    const currentAdminId = request.headers.get('x-user-id');
    const { name, email, password, role } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    if (!['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user role specified' }, { status: 400 });
    }

    // Check if email already in use by someone else
    const existingUser = await db.user.findFirst({
      where: {
        email: email.toLowerCase(),
        id: { not: userId },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use by another user' }, { status: 409 });
    }

    // If changing own role, prevent locking out Admin role
    if (userId === currentAdminId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'You cannot revoke your own Administrator role' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {
      name,
      email: email.toLowerCase(),
      role: role as any,
    };

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.passwordHash = hashPassword(password);
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updatedUser, message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = params.id;
    const currentAdminId = request.headers.get('x-user-id');

    if (userId === currentAdminId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
