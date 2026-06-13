import prisma from './prisma'
import type { TimingRecord, TimingPoint } from '../generated/prisma/client'

export async function getNextBibNumber(categoryId: string): Promise<number> {
  const maxBib = await prisma.registration.aggregate({
    where: { categoryId },
    _max: { bibNumber: true },
  })
  return (maxBib._max.bibNumber || 0) + 1
}

export interface SplitTime {
  timingPointId: string
  timingPointName: string
  distance: number
  timestamp: Date
  elapsedTime: number
  splitTime: number
  pace: number
}

export interface RaceResult {
  registrationId: string
  athleteId: string
  athleteName: string
  bibNumber: number
  gender: string
  age: number
  categoryId: string
  categoryName: string
  chipTime: number | null
  gunTime: number | null
  splitTimes: SplitTime[]
  overallRank: number | null
  categoryRank: number | null
  genderRank: number | null
  finished: boolean
}

export function calculateSplitTimes(
  timingRecords: (TimingRecord & { timingPoint: TimingPoint })[],
  startTime: Date | null
): SplitTime[] {
  const sortedRecords = [...timingRecords].sort(
    (a, b) => a.timingPoint.order - b.timingPoint.order
  )

  const splitTimes: SplitTime[] = []
  let previousTimestamp: Date | null = null

  for (const record of sortedRecords) {
    const elapsedTime = startTime
      ? record.timestamp.getTime() - startTime.getTime()
      : 0

    const splitTime = previousTimestamp
      ? record.timestamp.getTime() - previousTimestamp.getTime()
      : 0

    const distance = record.timingPoint.distance
    const pace = distance > 0 && splitTime > 0 ? splitTime / (distance / 1000) : 0

    splitTimes.push({
      timingPointId: record.timingPointId,
      timingPointName: record.timingPoint.name,
      distance: record.timingPoint.distance,
      timestamp: record.timestamp,
      elapsedTime,
      splitTime,
      pace,
    })

    previousTimestamp = record.timestamp
  }

  return splitTimes
}

export function calculateChipTime(
  timingRecords: (TimingRecord & { timingPoint: TimingPoint })[]
): number | null {
  const startRecord = timingRecords.find((r) => r.timingPoint.isStart)
  const finishRecord = timingRecords.find((r) => r.timingPoint.isFinish)

  if (!startRecord || !finishRecord) return null

  return finishRecord.timestamp.getTime() - startRecord.timestamp.getTime()
}

export function calculateGunTime(
  timingRecords: (TimingRecord & { timingPoint: TimingPoint })[],
  gunStartTime: Date | null
): number | null {
  if (!gunStartTime) return null

  const finishRecord = timingRecords.find((r) => r.timingPoint.isFinish)
  if (!finishRecord) return null

  return finishRecord.timestamp.getTime() - gunStartTime.getTime()
}

export async function calculateRaceResults(
  eventId: string,
  categoryId?: string
): Promise<RaceResult[]> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      timingPoints: {
        orderBy: { order: 'asc' },
      },
      categories: true,
    },
  })

  if (!event) throw new Error('Event not found')

  const whereClause = categoryId ? { categoryId } : {}

  const registrations = await prisma.registration.findMany({
    where: {
      ...whereClause,
      category: { eventId },
    },
    include: {
      athlete: true,
      category: true,
      timingRecords: {
        include: { timingPoint: true },
      },
    },
  })

  const results: RaceResult[] = []

  for (const registration of registrations) {
    const splitTimes = calculateSplitTimes(
      registration.timingRecords,
      registration.category.startTime || null
    )

    const chipTime = calculateChipTime(registration.timingRecords)
    const gunTime = calculateGunTime(
      registration.timingRecords,
      registration.category.startTime || null
    )

    const hasFinishRecord = registration.timingRecords.some(
      (r: TimingRecord & { timingPoint: TimingPoint }) => r.timingPoint.isFinish
    )

    const birthDate = new Date(registration.athlete.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    results.push({
      registrationId: registration.id,
      athleteId: registration.athleteId,
      athleteName: registration.athlete.name,
      bibNumber: registration.bibNumber,
      gender: registration.athlete.gender,
      age,
      categoryId: registration.categoryId,
      categoryName: registration.category.name,
      chipTime,
      gunTime,
      splitTimes,
      overallRank: null,
      categoryRank: null,
      genderRank: null,
      finished: hasFinishRecord && chipTime !== null,
    })
  }

  const finishedResults = results
    .filter((r) => r.finished && r.chipTime !== null)
    .sort((a, b) => (a.chipTime as number) - (b.chipTime as number))

  finishedResults.forEach((result, index) => {
    result.overallRank = index + 1
  })

  if (categoryId) {
    const categoryFinished = finishedResults.filter(
      (r) => r.categoryId === categoryId
    )
    categoryFinished.forEach((result, index) => {
      result.categoryRank = index + 1
    })

    const genders = ['MALE', 'FEMALE', 'OTHER']
    for (const gender of genders) {
      const genderFinished = categoryFinished.filter((r) => r.gender === gender)
      genderFinished.forEach((result, index) => {
        result.genderRank = index + 1
      })
    }
  }

  return results
}

export interface AthleteRaceResult extends RaceResult {
  eventId?: string
  eventName?: string
  eventDate?: string
  eventStatus?: string
  shirtSize?: string
  registeredAt?: string
}

export async function getAthleteResults(athleteId: string): Promise<AthleteRaceResult[]> {
  const registrations = await prisma.registration.findMany({
    where: { athleteId },
    include: {
      athlete: true,
      category: {
        include: { event: true },
      },
      timingRecords: {
        include: { timingPoint: true },
      },
    },
    orderBy: {
      category: { event: { date: 'desc' } },
    },
  })

  const results: AthleteRaceResult[] = []

  for (const registration of registrations) {
    const splitTimes = calculateSplitTimes(
      registration.timingRecords,
      registration.category.startTime || null
    )

    const chipTime = calculateChipTime(registration.timingRecords)
    const gunTime = calculateGunTime(
      registration.timingRecords,
      registration.category.startTime || null
    )

    const hasFinishRecord = registration.timingRecords.some(
      (r: TimingRecord & { timingPoint: TimingPoint }) => r.timingPoint.isFinish
    )

    const birthDate = new Date(registration.athlete.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    const allResults = await calculateRaceResults(
      registration.category.eventId,
      registration.categoryId
    )

    const thisResult = allResults.find((r) => r.registrationId === registration.id)

    results.push({
      registrationId: registration.id,
      athleteId: registration.athleteId,
      athleteName: registration.athlete.name,
      bibNumber: registration.bibNumber,
      gender: registration.athlete.gender,
      age,
      categoryId: registration.categoryId,
      categoryName: registration.category.name,
      chipTime,
      gunTime,
      splitTimes,
      overallRank: thisResult?.overallRank || null,
      categoryRank: thisResult?.categoryRank || null,
      genderRank: thisResult?.genderRank || null,
      finished: hasFinishRecord && chipTime !== null,
      eventId: registration.category.eventId,
      eventName: registration.category.event.name,
      eventDate: registration.category.event.date.toISOString(),
      eventStatus: registration.category.event.status,
      shirtSize: registration.shirtSize,
      registeredAt: registration.registeredAt.toISOString(),
    })
  }

  return results
}
