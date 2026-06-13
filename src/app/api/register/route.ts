import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getNextBibNumber } from '@/lib/raceService'
import { EventStatus } from '@/generated/prisma/client'

export async function POST(request: Request) {
  const body = await request.json()

  const {
    name,
    gender,
    birthDate,
    phone,
    emergencyContact,
    emergencyPhone,
    categoryId,
    shirtSize,
  } = body

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      event: true,
      _count: {
        select: { registrations: true },
      },
    },
  })

  if (!category) {
    return NextResponse.json({ error: '组别不存在' }, { status: 404 })
  }

  if (category.event.status !== EventStatus.REGISTRATION_OPEN) {
    return NextResponse.json({ error: '该赛事报名已关闭' }, { status: 400 })
  }

  if (category._count.registrations >= category.capacity) {
    return NextResponse.json({ error: '该组别报名人数已满' }, { status: 400 })
  }

  const existingAthlete = await prisma.athlete.findUnique({
    where: { phone },
  })

  let athlete = existingAthlete

  if (!athlete) {
    athlete = await prisma.athlete.create({
      data: {
        name,
        gender,
        birthDate: new Date(birthDate),
        phone,
        emergencyContact,
        emergencyPhone,
      },
    })
  } else {
    athlete = await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        name,
        gender,
        birthDate: new Date(birthDate),
        emergencyContact,
        emergencyPhone,
      },
    })
  }

  const existingRegistration = await prisma.registration.findFirst({
    where: {
      athleteId: athlete.id,
      category: {
        eventId: category.eventId,
      },
    },
  })

  if (existingRegistration) {
    return NextResponse.json({ error: '您已在该赛事中报名' }, { status: 400 })
  }

  const bibNumber = await getNextBibNumber(categoryId)

  const registration = await prisma.registration.create({
    data: {
      athleteId: athlete.id,
      categoryId,
      bibNumber,
      shirtSize,
    },
    include: {
      athlete: true,
      category: true,
    },
  })

  return NextResponse.json(registration, { status: 201 })
}
