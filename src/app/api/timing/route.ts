import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { bibNumber, categoryId, timingPointId, eventId, timestamp } = body

    if (!bibNumber || !timingPointId) {
      return NextResponse.json(
        { error: '号码布、计时点不能为空' },
        { status: 400 }
      )
    }

    let registration

    if (categoryId) {
      registration = await prisma.registration.findUnique({
        where: {
          categoryId_bibNumber: {
            categoryId,
            bibNumber: parseInt(bibNumber),
          },
        },
        include: {
          category: true,
        },
      })
    } else if (eventId) {
      registration = await prisma.registration.findFirst({
        where: {
          bibNumber: parseInt(bibNumber),
          category: { eventId },
        },
        include: {
          category: true,
        },
      })
    } else {
      const registrations = await prisma.registration.findMany({
        where: { bibNumber: parseInt(bibNumber) },
        include: {
          category: {
            include: {
              event: {
                include: { timingPoints: true },
              },
            },
          },
        },
      })

      for (const reg of registrations) {
        const timingPoints = reg.category?.event?.timingPoints
        if (timingPoints && timingPoints.some((tp) => tp.id === timingPointId)) {
          registration = reg
          break
        }
      }
    }

  if (!registration) {
    return NextResponse.json({ error: '未找到该报名记录' }, { status: 404 })
  }

  const timingPoint = await prisma.timingPoint.findUnique({
    where: { id: timingPointId },
  })

  if (!timingPoint) {
    return NextResponse.json({ error: '计时点不存在' }, { status: 404 })
  }

  const existingRecord = await prisma.timingRecord.findUnique({
    where: {
      registrationId_timingPointId: {
        registrationId: registration.id,
        timingPointId,
      },
    },
  })

  if (existingRecord) {
    return NextResponse.json(
      { error: '该计时点已有该选手的记录' },
      { status: 400 }
    )
  }

  const record = await prisma.timingRecord.create({
    data: {
      registrationId: registration.id,
      timingPointId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    },
    include: {
      registration: {
        include: {
          athlete: true,
          category: true,
        },
      },
      timingPoint: true,
    },
  })

  return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('录入计时数据失败:', error)
    return NextResponse.json({ error: '录入计时数据失败' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const timingPointId = searchParams.get('timingPointId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId 是必填参数' },
        { status: 400 }
      )
    }

    const where = timingPointId
      ? { timingPointId }
      : { timingPoint: { eventId } }

    const records = await prisma.timingRecord.findMany({
      where,
      include: {
        registration: {
          select: {
            bibNumber: true,
            athlete: {
              select: { name: true },
            },
            category: {
              select: { name: true },
            },
          },
        },
        timingPoint: {
          select: { name: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('获取计时记录失败:', error)
    return NextResponse.json({ error: '获取计时记录失败' }, { status: 500 })
  }
}
