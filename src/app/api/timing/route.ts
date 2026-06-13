import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { TimingPoint } from '@/generated/prisma/client'

export async function POST(request: Request) {
  const body = await request.json()

  const { bibNumber, categoryId, timingPointId, timestamp } = body

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
  } else {
    const registrations = await prisma.registration.findMany({
      where: { bibNumber: parseInt(bibNumber) },
      include: {
        category: {
          include: {
            event: true,
            timingPoints: true,
          },
        },
      },
    })

    for (const reg of registrations) {
      const hasTimingPoint = reg.category.event.timingPoints.some(
        (tp: TimingPoint) => tp.id === timingPointId
      )
      if (hasTimingPoint) {
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
}

export async function GET(request: Request) {
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
        include: {
          athlete: true,
          category: true,
        },
      },
      timingPoint: true,
    },
    orderBy: { timestamp: 'asc' },
  })

  return NextResponse.json(records)
}
