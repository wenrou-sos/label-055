'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface TimingPoint {
  id: string
  name: string
  distance: number
  order: number
  isStart: boolean
  isFinish: boolean
}

interface Event {
  id: string
  name: string
  timingPoints: TimingPoint[]
  categories: { id: string; name: string }[]
}

interface TimingRecord {
  id: string
  timestamp: string
  registration: {
    bibNumber: number
    athlete: { name: string }
    category: { name: string }
  }
  timingPoint: { name: string }
}

export default function TimingEntry({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const unwrappedParams = Promise.resolve(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const [bibNumber, setBibNumber] = useState('')
  const [timingPointId, setTimingPointId] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<TimingRecord | null>(null)
  const [records, setRecords] = useState<TimingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const bibInputRef = useRef<HTMLInputElement>(null)

  const loadRecords = async (eid: string) => {
    const res = await fetch(`/api/timing?eventId=${eid}`)
    const data = await res.json()
    setRecords(Array.isArray(data) ? data.slice().reverse().slice(0, 50) : [])
  }

  useEffect(() => {
    const init = async () => {
      const p = await unwrappedParams
      setEventId(p.id)
      const res = await fetch(`/api/events/${p.id}`)
      const data = await res.json()
      setEvent(data)
      if (data.timingPoints && data.timingPoints.length > 0) {
        setTimingPointId(data.timingPoints[0].id)
      }
      loadRecords(p.id)
    }
    init()
  }, [unwrappedParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)

    try {
      const timestamp = useCustomTime && customTime
        ? new Date(customTime).toISOString()
        : new Date().toISOString()

      const response = await fetch('/api/timing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bibNumber: parseInt(bibNumber),
          timingPointId,
          timestamp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '录入失败')
      }

      setSuccess(data)
      setBibNumber('')
      bibInputRef.current?.focus()

      if (eventId) {
        loadRecords(eventId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '录入失败')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('zh-CN', { hour12: false })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={eventId ? `/events/${eventId}` : '/'}
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            ← 返回赛事详情
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-8">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>⏱️</span> 计时录入
                </h1>
                {event && (
                  <p className="text-sm text-slate-500 mt-1">{event.name}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <span>✅</span> 录入成功！
                    </div>
                    <div className="text-xs text-green-600">
                      #{success.registration.bibNumber} {success.registration.athlete.name} -{' '}
                      {success.timingPoint.name} @ {formatTime(success.timestamp)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    计时点 *
                  </label>
                  <select
                    value={timingPointId}
                    onChange={(e) => setTimingPointId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-base"
                    required
                  >
                    {event?.timingPoints.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        #{tp.order} {tp.name} ({tp.distance}KM)
                        {tp.isStart ? ' - 起点' : ''}
                        {tp.isFinish ? ' - 终点' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    号码布编号 *
                  </label>
                  <input
                    ref={bibInputRef}
                    type="number"
                    value={bibNumber}
                    onChange={(e) => setBibNumber(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-3xl font-bold text-center tracking-widest bg-white"
                    placeholder="001"
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomTime}
                      onChange={(e) => setUseCustomTime(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      手动设置时间（默认使用当前系统时间）
                    </span>
                  </label>
                  {useCustomTime && (
                    <input
                      type="datetime-local"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      step="1"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white text-sm"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !bibNumber || !timingPointId}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
                >
                  {loading ? '录入中...' : '⏱️ 确认录入计时'}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  按 Enter 键快速录入，支持扫码枪连续输入
                </p>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  最近录入记录（显示最新50条）
                </h2>
                <button
                  onClick={() => eventId && loadRecords(eventId)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  🔄 刷新
                </button>
              </div>
              {records.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-slate-500">暂无计时记录，开始录入吧！</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          时间
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          号码布
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          姓名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          组别
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          计时点
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-slate-600">
                            {formatTime(r.timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-sm font-mono">
                              #{r.registration.bibNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {r.registration.athlete.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {r.registration.category.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                              {r.timingPoint.name}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
