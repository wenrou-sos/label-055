import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDate, getStatusText, getStatusColor } from '@/lib/utils'
import { EventStatus } from '@/generated/prisma/client'

async function getEvents() {
  return await prisma.event.findMany({
    include: {
      categories: {
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  })
}

export default async function Home() {
  const events = await getEvents()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <span className="text-4xl">🏃</span>
                马拉松赛事管理系统
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                专业的路跑赛事报名、计时与成绩管理平台
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/events/create"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <span className="mr-2">+</span> 创建赛事
              </Link>
              <Link
                href="/athletes"
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors border border-slate-300"
              >
                选手查询
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="赛事总数"
            value={events.length.toString()}
            icon="📅"
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            label="报名中赛事"
            value={events.filter((e) => e.status === EventStatus.REGISTRATION_OPEN).length.toString()}
            icon="✍️"
            color="from-green-500 to-green-600"
          />
          <StatCard
            label="进行中赛事"
            value={events.filter((e) => e.status === EventStatus.IN_PROGRESS).length.toString()}
            icon="🏃"
            color="from-orange-500 to-orange-600"
          />
          <StatCard
            label="已结束赛事"
            value={events.filter((e) => e.status === EventStatus.COMPLETED).length.toString()}
            icon="🏆"
            color="from-purple-500 to-purple-600"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-semibold text-slate-900">赛事列表</h2>
          </div>

          {events.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-500 text-lg mb-6">暂无赛事，点击右上角创建您的第一场比赛！</p>
              <Link
                href="/events/create"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                <span className="mr-2">+</span> 创建第一场赛事
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((event) => {
                const totalRegistrations = event.categories.reduce(
                  (sum, cat) => sum + cat._count.registrations,
                  0
                )
                const totalCapacity = event.categories.reduce(
                  (sum, cat) => sum + cat.capacity,
                  0
                )

                return (
                  <div
                    key={event.id}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {event.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                            {getStatusText(event.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                          <span className="flex items-center gap-1.5">
                            <span>📅</span> {formatDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>📍</span> {event.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>👥</span> 已报名 {totalRegistrations}/{totalCapacity} 人
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>🏃</span> {event.categories.length} 个组别
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {event.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                            >
                              {cat.name} ({cat._count.registrations}/{cat.capacity})
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-6 shrink-0">
                        <Link
                          href={`/events/${event.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors text-sm"
                        >
                          查看详情
                        </Link>
                        {event.status === EventStatus.REGISTRATION_OPEN && (
                          <Link
                            href={`/events/${event.id}/register`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            立即报名
                          </Link>
                        )}
                        {(event.status === EventStatus.IN_PROGRESS || event.status === EventStatus.COMPLETED) && (
                          <Link
                            href={`/events/${event.id}/results`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            成绩排名
                          </Link>
                        )}
                        {event.status === EventStatus.IN_PROGRESS && (
                          <Link
                            href={`/events/${event.id}/timing`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            计时录入
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  )
}
