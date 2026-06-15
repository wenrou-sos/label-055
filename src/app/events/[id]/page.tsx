import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDate, getStatusText, getGenderText } from '@/lib/utils'
import { EventStatus } from '@/generated/prisma/client'
import { notFound } from 'next/navigation'
import StatusControl from './StatusControl'

async function getEvent(id: string) {
  try {
    return await prisma.event.findUnique({
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
  } catch (error) {
    console.error('获取赛事详情失败:', error)
    return null
  }
}

async function getEventStats(eventId: string) {
  try {
    const registrations = await prisma.registration.findMany({
      where: { category: { eventId } },
      select: {
        shirtSize: true,
        categoryId: true,
        athlete: { select: { gender: true } },
      },
    })

    const genderCounts = { MALE: 0, FEMALE: 0, OTHER: 0 }
    const shirtSizeCounts: Record<string, number> = {}
    const shirtSizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    for (const size of shirtSizeOrder) shirtSizeCounts[size] = 0

    for (const reg of registrations) {
      const g = reg.athlete.gender as keyof typeof genderCounts
      if (g in genderCounts) genderCounts[g]++
      const s = reg.shirtSize as string
      if (s in shirtSizeCounts) shirtSizeCounts[s]++
    }

    return {
      total: registrations.length,
      genderCounts,
      shirtSizeCounts,
      shirtSizeOrder,
    }
  } catch (error) {
    console.error('获取赛事统计失败:', error)
    return null
  }
}

export default async function EventDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)
  const stats = await getEventStats(id)

  if (!event) {
    notFound()
  }

  const totalRegistrations = event.categories.reduce(
    (sum, cat) => sum + cat._count.registrations,
    0
  )
  const totalCapacity = event.categories.reduce(
    (sum, cat) => sum + cat.capacity,
    0
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            ← 返回赛事列表
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm border border-white/30`}>
                    {getStatusText(event.status)}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-3">{event.name}</h1>
                <div className="flex flex-wrap items-center gap-5 text-white/90">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📅</span> {formatDate(event.date)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📍</span> {event.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">👥</span> 已报名 {totalRegistrations}/{totalCapacity}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {event.status === EventStatus.REGISTRATION_OPEN && (
                  <Link
                    href={`/events/${event.id}/register`}
                    className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                  >
                    立即报名
                  </Link>
                )}
                {event.status === EventStatus.IN_PROGRESS && (
                  <Link
                    href={`/events/${event.id}/timing`}
                    className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
                  >
                    计时录入
                  </Link>
                )}
                {(event.status === EventStatus.IN_PROGRESS || event.status === EventStatus.COMPLETED) && (
                  <Link
                    href={`/events/${event.id}/results`}
                    className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
                  >
                    查看成绩
                  </Link>
                )}
              </div>
            </div>
            {event.description && (
              <p className="mt-4 text-white/80 leading-relaxed">{event.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>📊</span> 各组报名进度
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {event.categories.map((cat) => {
                const percent = cat.capacity > 0
                  ? Math.round((cat._count.registrations / cat.capacity) * 100)
                  : 0
                const isFull = cat._count.registrations >= cat.capacity

                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      <span className={`text-sm font-semibold ${isFull ? 'text-red-600' : 'text-slate-900'}`}>
                        {cat._count.registrations}/{cat.capacity}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : percent >= 80
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{percent}%</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>👥</span> 男女比例
              </h2>
            </div>
            <div className="p-5">
              {!stats ? (
                <p className="text-sm text-slate-400 text-center py-6">统计数据加载中...</p>
              ) : stats.total === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">暂无报名数据</p>
              ) : (
                <>
                  <div className="flex h-8 rounded-lg overflow-hidden mb-5">
                    {stats.genderCounts.MALE > 0 && (
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center"
                        style={{ width: `${(stats.genderCounts.MALE / stats.total) * 100}%` }}
                      >
                        {stats.genderCounts.MALE / stats.total > 0.15 && (
                          <span className="text-xs font-semibold text-white">
                            {Math.round((stats.genderCounts.MALE / stats.total) * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    {stats.genderCounts.FEMALE > 0 && (
                      <div
                        className="bg-gradient-to-r from-pink-400 to-pink-500 flex items-center justify-center"
                        style={{ width: `${(stats.genderCounts.FEMALE / stats.total) * 100}%` }}
                      >
                        {stats.genderCounts.FEMALE / stats.total > 0.15 && (
                          <span className="text-xs font-semibold text-white">
                            {Math.round((stats.genderCounts.FEMALE / stats.total) * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    {stats.genderCounts.OTHER > 0 && (
                      <div
                        className="bg-gradient-to-r from-teal-400 to-teal-500 flex items-center justify-center"
                        style={{ width: `${(stats.genderCounts.OTHER / stats.total) * 100}%` }}
                      >
                        {stats.genderCounts.OTHER / stats.total > 0.15 && (
                          <span className="text-xs font-semibold text-white">
                            {Math.round((stats.genderCounts.OTHER / stats.total) * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-blue-500" />
                        <span className="text-sm text-slate-600">{getGenderText('MALE')}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{stats.genderCounts.MALE} 人</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-pink-500" />
                        <span className="text-sm text-slate-600">{getGenderText('FEMALE')}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{stats.genderCounts.FEMALE} 人</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-teal-500" />
                        <span className="text-sm text-slate-600">{getGenderText('OTHER')}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{stats.genderCounts.OTHER} 人</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>👕</span> 衣服尺码分布
              </h2>
            </div>
            <div className="p-5">
              {!stats ? (
                <p className="text-sm text-slate-400 text-center py-6">统计数据加载中...</p>
              ) : stats.total === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">暂无报名数据</p>
              ) : (
                <div className="space-y-3">
                  {stats.shirtSizeOrder.map((size) => {
                    const count = stats.shirtSizeCounts[size] || 0
                    const maxCount = Math.max(...Object.values(stats.shirtSizeCounts), 1)

                    return (
                      <div key={size}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{size}</span>
                          <span className="text-sm text-slate-500">{count} 人</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded overflow-hidden">
                          <div
                            className="h-full rounded bg-gradient-to-r from-violet-400 to-violet-500 transition-all"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span>🏃</span> 比赛组别
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {event.categories.map((cat) => {
                  const percent = cat.capacity > 0
                    ? Math.round((cat._count.registrations / cat.capacity) * 100)
                    : 0
                  const isFull = cat._count.registrations >= cat.capacity

                  return (
                    <div key={cat.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {cat.distance >= 40 ? '全' : cat.distance >= 20 ? '半' : cat.distance >= 10 ? '10' : '5'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                            <p className="text-sm text-slate-500">
                              {cat.distance} 公里 · ¥{cat.price}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">已报名</p>
                          <p className={`text-lg font-bold ${isFull ? 'text-red-600' : 'text-slate-900'}`}>
                            {cat._count.registrations}/{cat.capacity}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull
                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {isFull && (
                        <p className="mt-2 text-xs text-red-600 font-medium">
                          ⚠️ 该组别名额已满
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span>⏱️</span> 计时点
                </h2>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  {event.timingPoints.map((tp) => (
                    <div
                      key={tp.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          tp.isStart
                            ? 'bg-green-500 text-white'
                            : tp.isFinish
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {tp.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{tp.name}</p>
                        <p className="text-xs text-slate-500">{tp.distance} KM</p>
                      </div>
                      <div className="flex gap-1">
                        {tp.isStart && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            起点
                          </span>
                        )}
                        {tp.isFinish && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            终点
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span>⚙️</span> 赛事状态管理
                </h2>
              </div>
              <div className="p-5">
                <StatusControl eventId={event.id} currentStatus={event.status} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
