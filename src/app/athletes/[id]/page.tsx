'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  formatTime,
  formatDate,
  getGenderText,
  getShirtSizeText,
} from '@/lib/utils'

interface Athlete {
  id: string
  name: string
  gender: string
  birthDate: string
  phone: string
  emergencyContact: string
  emergencyPhone: string
  createdAt: string
}

interface SplitTime {
  timingPointId: string
  timingPointName: string
  distance: number
  elapsedTime: number
  splitTime: number
  pace: number
}

interface Result {
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
  eventId?: string
  eventName?: string
  eventDate?: string
  eventStatus?: string
  shirtSize?: string
  registeredAt?: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  REGISTRATION_OPEN: { label: '报名中', color: 'bg-green-100 text-green-700' },
  REGISTRATION_CLOSED: { label: '报名截止', color: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: '已结束', color: 'bg-purple-100 text-purple-700' },
}

export default function AthleteDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const unwrappedParams = Promise.resolve(params)
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const p = await unwrappedParams
      try {
        const res = await fetch(`/api/athletes/${p.id}`)
        if (!res.ok) {
          throw new Error('选手不存在')
        }
        const data = await res.json()
        setAthlete(data.athlete)
        setResults(data.results || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [unwrappedParams])

  const formatPace = (paceMs: number) => {
    if (paceMs <= 0) return '--'
    const min = Math.floor(paceMs / 60000)
    const sec = Math.floor((paceMs % 60000) / 1000)
    return `${min}'${sec.toString().padStart(2, '0')}"/KM`
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getMedalEmoji = (rank: number | null) => {
    if (!rank) return null
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const getRankBadge = (rank: number | null, total: number) => {
    if (!rank) return <span className="text-slate-400">-</span>
    const medal = getMedalEmoji(rank)
    const percentage = Math.round((rank / total) * 100)
    let colorClass = 'bg-slate-100 text-slate-700'
    if (rank <= 3) colorClass = 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800'
    else if (percentage <= 10) colorClass = 'bg-indigo-100 text-indigo-700'
    else if (percentage <= 30) colorClass = 'bg-green-100 text-green-700'

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-sm ${colorClass}`}>
        {medal}
        第 {rank} 名
      </span>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">加载选手信息中...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!athlete) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/athletes"
              className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
              ← 返回选手搜索
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-slate-500 text-lg">未找到该选手信息</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/athletes"
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            ← 返回选手搜索
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  {athlete.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{athlete.name}</h1>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30">
                      {getGenderText(athlete.gender)} · {calculateAge(athlete.birthDate)}岁
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-white/90">
                    <span className="flex items-center gap-2">
                      <span>📱</span> {athlete.phone}
                    </span>
                    <span className="flex items-center gap-2">
                      <span>🎂</span> {formatDate(athlete.birthDate)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span>📅</span> 注册于 {formatDate(athlete.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-white/80 text-sm">参赛次数</div>
                <div className="text-5xl font-bold">{results.length}</div>
                <div className="text-white/80 text-sm">
                  完赛 {results.filter((r) => r.finished).length} 场
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50">
            <InfoCard
              icon="👤"
              label="紧急联系人"
              value={athlete.emergencyContact}
            />
            <InfoCard
              icon="📞"
              label="紧急联系电话"
              value={athlete.emergencyPhone}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <span>🏆</span> 参赛记录
              <span className="ml-auto text-sm font-normal text-slate-500">
                共 {results.length} 条记录
              </span>
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-500 text-lg mb-2">该选手暂无参赛记录</p>
              <p className="text-slate-400 text-sm">在首页选择赛事即可报名参加</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {results.map((result) => {
                const isExpanded = expandedResult === result.registrationId
                const categoryTotal = results.filter(
                  (r) => r.categoryId === result.categoryId && r.finished
                ).length

                return (
                  <div
                    key={result.registrationId}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() =>
                        setExpandedResult(isExpanded ? null : result.registrationId)
                      }
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-900">
                              {result.eventName || result.categoryName}
                            </h3>
                            {result.eventStatus && STATUS_MAP[result.eventStatus] && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[result.eventStatus].color}`}
                              >
                                {STATUS_MAP[result.eventStatus].label}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <span>📅</span>
                              {result.eventDate ? formatDate(result.eventDate) : '-'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span>🏃</span>
                              {result.categoryName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span>🏷️</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 text-white font-bold font-mono text-xs">
                                #{String(result.bibNumber).padStart(3, '0')}
                              </span>
                            </span>
                            {result.shirtSize && (
                              <span className="flex items-center gap-1.5">
                                <span>👕</span>
                                {getShirtSizeText(result.shirtSize)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="text-center">
                            <div className="text-xs text-slate-500 mb-1">净成绩</div>
                            <div
                              className={`font-mono font-bold text-xl ${
                                result.chipTime !== null
                                  ? 'text-slate-900'
                                  : 'text-slate-300'
                              }`}
                            >
                              {result.chipTime !== null
                                ? formatTime(result.chipTime)
                                : '--:--:--'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500 mb-1">组别排名</div>
                            <div>{getRankBadge(result.categoryRank, categoryTotal)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-500 mb-1">状态</div>
                            {result.finished ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                ✓ 已完赛
                              </span>
                            ) : result.eventStatus === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                                ✗ 未完成
                              </span>
                            ) : result.eventStatus === 'IN_PROGRESS' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                🏃 进行中
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                                待开始
                              </span>
                            )}
                          </div>
                          <button
                            className={`w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedResult(isExpanded ? null : result.registrationId)
                            }}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                        <div className="pt-6">
                          {(result.overallRank || result.categoryRank || result.genderRank) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <RankCard
                                label="总排名"
                                rank={result.overallRank}
                                color="from-amber-500 to-yellow-500"
                              />
                              <RankCard
                                label="组别排名"
                                rank={result.categoryRank}
                                color="from-indigo-500 to-purple-500"
                              />
                              <RankCard
                                label="性别排名"
                                rank={result.genderRank}
                                color="from-pink-500 to-rose-500"
                              />
                            </div>
                          )}

                          {result.gunTime !== null && (
                            <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                              <div className="flex items-center gap-6 flex-wrap">
                                <div>
                                  <div className="text-xs text-indigo-600 font-medium mb-1">
                                    枪声成绩
                                  </div>
                                  <div className="font-mono font-bold text-lg text-indigo-800">
                                    {formatTime(result.gunTime)}
                                  </div>
                                </div>
                                {result.chipTime !== null && result.gunTime !== null && (
                                  <div>
                                    <div className="text-xs text-indigo-600 font-medium mb-1">
                                      净时差
                                    </div>
                                    <div className="font-mono font-bold text-lg text-indigo-800">
                                      +
                                      {formatTime(result.gunTime - result.chipTime).replace(
                                        /^00:/,
                                        ''
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                            分段用时详情
                          </h4>

                          {result.splitTimes.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl">
                              <div className="text-4xl mb-3">⏱️</div>
                              <p className="text-slate-500">暂无分段计时数据</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {result.splitTimes.map((split, idx) => (
                                <div
                                  key={split.timingPointId}
                                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200"
                                >
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-md ${
                                      idx === 0
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : idx === result.splitTimes.length - 1
                                        ? 'bg-gradient-to-br from-red-500 to-rose-600'
                                        : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-slate-900">
                                        {split.timingPointName}
                                      </span>
                                      <span className="text-xs text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                                        {split.distance} KM
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <div className="text-xs text-slate-500 mb-0.5">
                                          累计用时
                                        </div>
                                        <div className="font-mono font-bold text-slate-800 text-sm">
                                          {formatTime(split.elapsedTime)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-slate-500 mb-0.5">
                                          分段用时
                                        </div>
                                        <div className="font-mono font-bold text-indigo-700 text-sm">
                                          {idx === 0
                                            ? formatTime(split.elapsedTime)
                                            : formatTime(split.splitTime)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-slate-500 mb-0.5">
                                          配速
                                        </div>
                                        <div className="font-mono font-bold text-purple-700 text-sm">
                                          {idx === 0
                                            ? split.distance > 0
                                              ? formatPace(
                                                  split.elapsedTime / (split.distance / 1000)
                                                )
                                              : '--'
                                            : formatPace(split.pace)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {result.eventId && (
                            <div className="mt-6 flex justify-end">
                              <Link
                                href={`/events/${result.eventId}/results`}
                                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-sm"
                              >
                                查看完整排行榜 →
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
        <div className="font-semibold text-slate-900 truncate">{value}</div>
      </div>
    </div>
  )
}

function RankCard({
  label,
  rank,
  color,
}: {
  label: string
  rank: number | null
  color: string
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}
    >
      <div className="text-xs font-medium text-white/80 mb-2">{label}</div>
      {rank ? (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{rank}</span>
          <span className="text-sm text-white/80">名</span>
          {rank <= 3 && (
            <span className="text-2xl">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </span>
          )}
        </div>
      ) : (
        <span className="text-2xl font-bold text-white/60">-</span>
      )}
    </div>
  )
}
