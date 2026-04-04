import { NextRequest, NextResponse } from 'next/server'
import { query, UserRecord } from '@/lib/db'
import crypto from 'crypto'

// Simple password hashing (in production use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, fullName, organization, role = 'buyer' } = body

    if (action === 'register') {
      // Check if user already exists
      const existing = await query<UserRecord>(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }

      // Create new user
      const passwordHash = hashPassword(password)
      const result = await query<UserRecord>(
        `INSERT INTO users (email, password_hash, full_name, organization, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, email, full_name, organization, role, created_at`,
        [email, passwordHash, fullName, organization, role]
      )

      return NextResponse.json({
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          fullName: result.rows[0].full_name,
          organization: result.rows[0].organization,
          role: result.rows[0].role
        }
      }, { status: 201 })
    }

    if (action === 'login') {
      const result = await query<UserRecord>(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const user = result.rows[0]
      if (!verifyPassword(password, user.password_hash)) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          organization: user.organization,
          role: user.role
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Users error:', error)
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    )
  }
}
