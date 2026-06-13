'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CategoryForm {
  name: string
  distance: string
  capacity: string
  price: string
}

interface TimingPointForm {
  name: string
  distance: string
  order: string
  isStart: boolean
  isFinish: boolean
}

export default function CreateEvent() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<CategoryForm[]>([
    { name: '全马', distance: '42.195', capacity: '500', price: '200' },
    { name: '半马', distance: '21.0975', capacity: '1000', price: '150' },
    { name: '10公里', distance: '10', capacity: '1500', price: '100' },
    { name: '5公里欢乐跑', distance: '5', capacity: '2000', price: '80' },
  ])
  const [timingPoints, setTimingPoints] = useState<TimingPointForm[]>([
    { name: '起点', distance: '0', order: '1', isStart: true, isFinish: false },
    { name: '5公里', distance: '5', order: '2', isStart: false, isFinish: false },
    { name: '10公里', distance: '10', order: '3', isStart: false, isFinish: false },
    { name: '半程点', distance: '21.0975', order: '4', isStart: false, isFinish: false },
    { name: '30公里', distance: '30', order: '5', isStart: false, isFinish: false },
    { name: '35公里', distance: '35', order: '6', isStart: false, isFinish: false },
    { name: '终点', distance: '42.195', order: '7', isStart: false, isFinish: true },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addCategory = () => {
    setCategories([...categories, { name: '', distance: '', capacity: '', price: '' }])
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const updateCategory = (index: number, field: keyof CategoryForm, value: string) => {
    const updated = [...categories]
    updated[index] = { ...updated[index], [field]: value }
    setCategories(updated)
  }

  const addTimingPoint = () => {
    setTimingPoints([
      ...timingPoints,
      { name: '', distance: '', order: String(timingPoints.length + 1), isStart: false, isFinish: false },
    ])
  }

  const removeTimingPoint = (index: number) => {
    setTimingPoints(timingPoints.filter((_, i) => i !== index))
  }

  const updateTimingPoint = (index: number, field: keyof TimingPointForm, value: string | boolean) => {
    const updated = [...timingPoints]
    updated[index] = { ...updated[index], [field]: value }
    setTimingPoints(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          date: new Date(date).toISOString(),
          location,
          description,
          categories: categories.map((c) => ({
            name: c.name,
            distance: parseFloat(c.distance),
            capacity: parseInt(c.capacity),
            price: parseFloat(c.price),
          })),
          timingPoints: timingPoints.map((tp) => ({
            name: tp.name,
            distance: parseFloat(tp.distance),
            order: parseInt(tp.order),
            isStart: tp.isStart,
            isFinish: tp.isFinish,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '创建赛事失败')
      }

      const data = await response.json()
      router.push(`/events/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建赛事失败')
    } finally {
      setLoading(false)
    }
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
            <h1 className="text-2xl font-bold text-slate-900">创建新赛事</h1>
            <p className="text-sm text-slate-500 mt-1">设置赛事基本信息、比赛组别和计时点</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                基本信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    赛事名称 *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="如：2026 春季城市马拉松"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    比赛日期 *
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    比赛地点 *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="如：XX城市市民广场"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    赛事描述
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="简要介绍赛事特色、路线等信息..."
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-lg font-semibold text-slate-900">比赛组别</h2>
                <button
                  type="button"
                  onClick={addCategory}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + 添加组别
                </button>
              </div>
              <div className="space-y-3">
                {categories.map((cat, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end bg-slate-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        组别名称
                      </label>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCategory(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="全马"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        距离(KM)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={cat.distance}
                        onChange={(e) => updateCategory(index, 'distance', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="42.195"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        人数上限
                      </label>
                      <input
                        type="number"
                        value={cat.capacity}
                        onChange={(e) => updateCategory(index, 'capacity', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        报名费(元)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={cat.price}
                        onChange={(e) => updateCategory(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="200"
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="w-full px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-lg font-semibold text-slate-900">计时点设置</h2>
                <button
                  type="button"
                  onClick={addTimingPoint}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + 添加计时点
                </button>
              </div>
              <div className="space-y-3">
                {timingPoints.map((tp, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end bg-slate-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        名称
                      </label>
                      <input
                        type="text"
                        value={tp.name}
                        onChange={(e) => updateTimingPoint(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="起点"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        距离(KM)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={tp.distance}
                        onChange={(e) => updateTimingPoint(index, 'distance', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        顺序
                      </label>
                      <input
                        type="number"
                        value={tp.order}
                        onChange={(e) => updateTimingPoint(index, 'order', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="1"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={tp.isStart}
                          onChange={(e) => updateTimingPoint(index, 'isStart', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        起点
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={tp.isFinish}
                          onChange={(e) => updateTimingPoint(index, 'isFinish', e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        终点
                      </label>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeTimingPoint(index)}
                        className="w-full px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                href="/"
                className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? '创建中...' : '创建赛事'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
