import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            _count: {
              select: { registrations: true },
            },
          },
        },
        timingPoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: '赛事不存在' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('获取赛事详情失败:', error)
    return NextResponse.json({ error: '获取赛事详情失败' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, name, date, location, description } = body

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(date && { date: new Date(date) }),
        ...(location && { location }),
        ...(description && { description }),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('更新赛事失败:', error)
    return NextResponse.json({ error: '更新赛事失败' }, { status: 500 })
  }
}
