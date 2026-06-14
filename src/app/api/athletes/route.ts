import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
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
        },
      }
    }

    const athletes = await prisma.athlete.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(athletes)
  } catch (error) {
    console.error('查询选手失败:', error)
    return NextResponse.json({ error: '查询选手失败' }, { status: 500 })
  }
}
