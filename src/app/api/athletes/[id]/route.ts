import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAthleteResults } from '@/lib/raceService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const athlete = await prisma.athlete.findUnique({
      where: { id },
    })

    if (!athlete) {
      return NextResponse.json({ error: '选手不存在' }, { status: 404 })
    }

    const results = await getAthleteResults(id)

    return NextResponse.json({ athlete, results })
  } catch (error) {
    console.error('获取选手详情失败:', error)
    return NextResponse.json({ error: '获取选手详情失败' }, { status: 500 })
  }
}
