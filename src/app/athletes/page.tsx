'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate, getGenderText } from '@/lib/utils'

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

export default function AthletesSearch() {
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchPhone && !searchName) {
      alert('请输入手机号或姓名进行搜索')
      return
    }
    setLoading(true)
    setSearched(true)

    const params = new URLSearchParams()
    if (searchPhone) params.set('phone', searchPhone)
    if (searchName) params.set('name', searchName)

    const res = await fetch(`/api/athletes?${params.toString()}`)
    const data = await res.json()
    setAthletes(data)
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <span>🔍</span> 选手查询
            </h1>
            <p className="text-white/90">通过手机号或姓名查找选手参赛信息和历史成绩</p>
          </div>

          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">📱</span>
                <input
                  type="tel"
                  placeholder="输入手机号精确查找..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-base"
                />
              </div>
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">👤</span>
                <input
                  type="text"
                  placeholder="或输入姓名模糊搜索..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? '搜索中...' : '🔍 搜索'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500">搜索中...</p>
            </div>
          ) : !searched ? (
            <div className="p-16 text-center">
              <div className="text-6xl mb-4">🔎</div>
              <p className="text-slate-500 text-lg">输入手机号或姓名开始搜索</p>
            </div>
          ) : athletes.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-6xl mb-4">😕</div>
              <p className="text-slate-500 text-lg mb-2">未找到匹配的选手</p>
              <p className="text-slate-400 text-sm">请确认手机号或姓名拼写正确</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <p className="text-sm text-slate-600">
                  找到 <strong className="text-indigo-600">{athletes.length}</strong> 位选手
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {athletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="p-6 hover:bg-gradient-to-r from-indigo-50/50 to-purple-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {athlete.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-slate-900">{athlete.name}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {getGenderText(athlete.gender)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <span>📱</span> {athlete.phone}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span>🎂</span> {formatDate(athlete.birthDate)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span>📅</span> 注册于 {formatDate(athlete.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-sm"
                      >
                        查看详情 →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
