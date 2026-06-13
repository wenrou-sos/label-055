import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { EventStatus } from '@/generated/prisma/client'

export async function GET() {
  const events = await prisma.event.findMany({
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
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const body = await request.json()

  const { name, date, location, description, categories, timingPoints } = body

  const event = await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      location,
      description,
      status: EventStatus.REGISTRATION_OPEN,
      categories: {
        create: categories.map((cat: {
          name: string
          distance: number
          distanceUnit?: string
          capacity: number
          price: number
          startTime?: string
        }) => ({
          name: cat.name,
          distance: cat.distance,
          distanceUnit: cat.distanceUnit || 'KM',
          capacity: cat.capacity,
          price: cat.price,
          startTime: cat.startTime ? new Date(cat.startTime) : null,
        })),
      },
      timingPoints: {
        create: timingPoints.map((tp: {
          name: string
          distance: number
          distanceUnit?: string
          order: number
          isStart?: boolean
          isFinish?: boolean
        }) => ({
          name: tp.name,
          distance: tp.distance,
          distanceUnit: tp.distanceUnit || 'KM',
          order: tp.order,
          isStart: tp.isStart || false,
          isFinish: tp.isFinish || false,
        })),
      },
    },
    include: {
      categories: true,
      timingPoints: true,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
