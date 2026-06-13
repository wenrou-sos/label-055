import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const name = searchParams.get('name')

  let where = {}

  if (phone) {
    where = { phone }
  } else if (name) {
    where = {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    }
  }

  const athletes = await prisma.athlete.findMany({
    where,
    take: 50,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(athletes)
}
