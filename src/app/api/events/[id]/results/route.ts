import { NextResponse } from 'next/server'
import { calculateRaceResults } from '@/lib/raceService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId') || undefined

  try {
    const results = await calculateRaceResults(id, categoryId)
    return NextResponse.json(results)
  } catch (error) {
    if (error instanceof Error && error.message === 'Event not found') {
      return NextResponse.json({ error: '赛事不存在' }, { status: 404 })
    }
    return NextResponse.json({ error: '计算成绩时出错' }, { status: 500 })
  }
}
