'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatTime, getGenderText } from '@/lib/utils'

interface Category {
  id: string
  name: string
}

interface Event {
  id: string
  name: string
  categories: Category[]
  status: string
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
}

export default function Results({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [eventId, setEventId] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchBib, setSearchBib] = useState('')
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)

  const loadResults = async (evId: string, catId?: string) => {
    setLoading(true)
    const url = catId
      ? `/api/events/${evId}/results?categoryId=${catId}`
      : `/api/events/${evId}/results`
    const res = await fetch(url)
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    params.then((p) => {
      if (!cancelled) setEventId(p.id)
    })
    return () => {
      cancelled = true
    }
  }, [params])

  useEffect(() => {
    if (!eventId) return

    const init = async () => {
      const res = await fetch(`/api/events/${eventId}`)
      const eventData = await res.json()
      setEvent(eventData)
      loadResults(eventId)
    }
    init()
  }, [eventId])

  const handleCategoryChange = (catId: string) => {
    const newCatId = catId === selectedCategoryId ? null : catId
    setSelectedCategoryId(newCatId)
    if (event) {
      loadResults(event.id, newCatId || undefined)
    }
  }

  const filteredResults = results.filter((r) => {
    const matchBib = searchBib ? r.bibNumber.toString().includes(searchBib) : true
    const matchName = searchName
      ? r.athleteName.toLowerCase().includes(searchName.toLowerCase())
      : true
    return matchBib && matchName
  })

  const finishedResults = filteredResults
    .filter((r) => r.finished && r.chipTime !== null)
    .sort((a, b) => (a.chipTime as number) - (b.chipTime as number))

  const unfinishedResults = filteredResults.filter((r) => !r.finished)

  const getRankBadge = (rank: number | null, type: 'overall' | 'category' | 'gender') => {
    if (!rank) return <span className="text-slate-400">-</span>
    const colors = {
      overall: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      category: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      gender: 'bg-gradient-to-r from-pink-500 to-rose-500',
    }
    const medals = ['🥇', '🥈', '🥉']
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-xs font-bold ${colors[type]}`}
      >
        {type === 'category' && rank <= 3 ? medals[rank - 1] : ''}
        {rank}
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={event ? `/events/${event.id}` : '/'}
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            ← 返回赛事详情
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <span>🏆</span> 成绩排名
            </h1>
            {event && <p className="text-white/90">{event.name}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
              <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <span>🏁</span> 完赛选手 {finishedResults.length}
              </span>
              <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <span>🏃</span> 进行中 {unfinishedResults.length}
              </span>
            </div>
          </div>
        </div>

        {event && event.categories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">筛选组别</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCategoryId === null
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  全部组别
                </button>
                {event.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedCategoryId === cat.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="number"
                placeholder="按号码布搜索..."
                value={searchBib}
                onChange={(e) => setSearchBib(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="按姓名搜索..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500">加载成绩数据中...</p>
            </div>
          ) : finishedResults.length === 0 && unfinishedResults.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-500">暂无成绩数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      总排名
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      号码布
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      姓名
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      性别/年龄
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      组别
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      组别排名
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      性别排名
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      净成绩
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...finishedResults, ...unfinishedResults].map((r, idx) => (
                    <tr
                      key={r.registrationId}
                      className={`hover:bg-gradient-to-r from-indigo-50/50 to-purple-50/50 transition-colors ${
                        idx < 3 && r.finished ? 'bg-gradient-to-r from-amber-50/50 to-yellow-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-4">{getRankBadge(r.overallRank, 'overall')}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-900 text-white font-bold text-sm font-mono">
                          {String(r.bibNumber).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{r.athleteName}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {getGenderText(r.gender)} · {r.age}岁
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{r.categoryName}</td>
                      <td className="px-4 py-4">{getRankBadge(r.categoryRank, 'category')}</td>
                      <td className="px-4 py-4">{getRankBadge(r.genderRank, 'gender')}</td>
                      <td className="px-4 py-4">
                        {r.chipTime !== null ? (
                          <span className="font-mono font-bold text-lg text-slate-900">
                            {formatTime(r.chipTime)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">--:--:--</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {r.finished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            ✓ 已完赛
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            🏃 进行中
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedResult(r)}
                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            查看分段
                          </button>
                          {r.finished && event && (
                            <a
                              href={`/events/${event.id}/certificates/${r.registrationId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all"
                            >
                              🎖️ 证书
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedResult && (
        <SplitTimesModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </main>
  )
}

function SplitTimesModal({ result, onClose }: { result: Result; onClose: () => void }) {
  const formatPace = (paceMs: number) => {
    if (paceMs <= 0) return '--'
    const min = Math.floor(paceMs / 60000)
    const sec = Math.floor((paceMs % 60000) / 1000)
    return `${min}'${sec.toString().padStart(2, '0')}"/KM`
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-xl bg-white/20 backdrop-blur-sm font-bold text-lg font-mono">
                  #{String(result.bibNumber).padStart(3, '0')}
                </span>
                <h2 className="text-2xl font-bold">{result.athleteName}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <span>{result.categoryName}</span>
                <span>{getGenderText(result.gender)} · {result.age}岁</span>
                <span>
                  净成绩: <strong className="text-lg font-mono">{result.chipTime !== null ? formatTime(result.chipTime) : '--:--:--'}</strong>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        {result.finished && (
          <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-700">🎖️</span>
              <span className="text-amber-800 font-medium">该选手已完赛，可下载电子完赛证书</span>
            </div>
            <button
              onClick={() => {
                const eventMatch = window.location.pathname.match(/\/events\/([^/]+)/)
                if (eventMatch) {
                  window.open(`/events/${eventMatch[1]}/certificates/${result.registrationId}`, '_blank')
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all"
            >
              🎖️ 下载证书
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">
          {result.splitTimes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-5xl mb-4">⏱️</div>
              <p>暂无分段计时数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                分段计时详情
              </h3>
              {result.splitTimes.map((split, idx) => (
                <div
                  key={split.timingPointId}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{split.timingPointName}</span>
                      <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {split.distance} KM
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                      <span>
                        用时: <strong className="text-slate-800 font-mono">{formatTime(split.elapsedTime)}</strong>
                      </span>
                      <span>
                        分段: <strong className="text-slate-800 font-mono">{formatTime(split.splitTime)}</strong>
                      </span>
                      <span>
                        配速: <strong className="text-slate-800 font-mono">{formatPace(split.pace)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            <StatCard label="总排名" value={result.overallRank ? `第 ${result.overallRank} 名` : '-'} color="from-amber-500 to-yellow-500" />
            <StatCard label="组别排名" value={result.categoryRank ? `第 ${result.categoryRank} 名` : '-'} color="from-indigo-500 to-purple-500" />
            <StatCard label="性别排名" value={result.genderRank ? `第 ${result.genderRank} 名` : '-'} color="from-pink-500 to-rose-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white text-center shadow-md`}>
      <p className="text-xs font-medium text-white/80 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}
