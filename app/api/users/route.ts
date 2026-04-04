import { NextRequest, NextResponse } from 'next/server'
import { query, isDatabaseConfigured, UserRecord } from '@/lib/db'
import crypto from 'crypto'

// Simple password hashing (in production use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Local users storage for fallback mode
const localUsers: Map<string, { id: number; email: string; passwordHash: string; fullName: string; organization: string; role: string }> = new Map()
let localUserId = 1

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, email, password, fullName, organization, role = 'buyer' } = body

  // Fallback mode - use local storage
  if (!isDatabaseConfigured()) {
    if (action === 'register') {
      if (localUsers.has(email)) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }

      const user = {
        id: localUserId++,
        email,
        passwordHash: hashPassword(password),
        fullName,
        organization,
        role
      }
      localUsers.set(email, user)

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          organization: user.organization,
          role: user.role
        },
        source: 'local'
      }, { status: 201 })
    }

    if (action === 'login') {
      const user = localUsers.get(email)
      
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          organization: user.organization,
          role: user.role
        },
        source: 'local'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Database mode
  try {
    if (action === 'register') {
      // Check if user already exists
      const existing = await query<UserRecord>(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      
      if (existing && existing.rows.length > 0) {
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

      if (!result || result.rows.length === 0) {
        // Fallback to local
        const user = {
          id: localUserId++,
          email,
          passwordHash,
          fullName,
          organization,
          role
        }
        localUsers.set(email, user)

        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            organization: user.organization,
            role: user.role
          },
          source: 'local'
        }, { status: 201 })
      }

      return NextResponse.json({
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          fullName: result.rows[0].full_name,
          organization: result.rows[0].organization,
          role: result.rows[0].role
        },
        source: 'database'
      }, { status: 201 })
    }

    if (action === 'login') {
      const result = await query<UserRecord>(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (!result || result.rows.length === 0) {
        // Try local fallback
        const localUser = localUsers.get(email)
        if (localUser && verifyPassword(password, localUser.passwordHash)) {
          return NextResponse.json({
            user: {
              id: localUser.id,
              email: localUser.email,
              fullName: localUser.fullName,
              organization: localUser.organization,
              role: localUser.role
            },
            source: 'local'
          })
        }
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
        },
        source: 'database'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Users error:', error)
    
    // Fallback to local on error
    if (action === 'register') {
      const user = {
        id: localUserId++,
        email,
        passwordHash: hashPassword(password),
        fullName,
        organization,
        role
      }
      localUsers.set(email, user)

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          organization: user.organization,
          role: user.role
        },
        source: 'local'
      }, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    )
  }
}
