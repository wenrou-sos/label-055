'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  distance: number
  capacity: number
  price: string
  _count: { registrations: number }
}

interface Event {
  id: string
  name: string
  status: string
  categories: Category[]
}

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const GENDERS = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
  { value: 'OTHER', label: '其他' },
]

interface RegistrationSuccess {
  id: string
  bibNumber: number
  shirtSize: string
  athlete?: {
    id: string
    name: string
    gender: string
    phone: string
  }
  category?: {
    id: string
    name: string
  }
}

export default function Register({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const unwrappedParams = Promise.resolve(params)
  const [eventId, setEventId] = useState<string | null>(null)
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [name, setName] = useState('')
  const [gender, setGender] = useState('MALE')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [shirtSize, setShirtSize] = useState('M')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<RegistrationSuccess | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const p = await unwrappedParams
      setEventId(p.id)
      const res = await fetch(`/api/events/${p.id}`)
      const data = await res.json()
      setEvent(data)
      if (data.categories && data.categories.length > 0) {
        setCategoryId(data.categories[0].id)
      }
    }
    init()
  }, [unwrappedParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender,
          birthDate: new Date(birthDate).toISOString(),
          phone,
          emergencyContact,
          emergencyPhone,
          categoryId,
          shirtSize,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '报名失败')
      }

      setSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '报名失败')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-center">
              <div className="text-7xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold mb-2">报名成功！</h1>
              <p className="text-white/90">请妥善保存您的号码布信息</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <InfoItem label="选手姓名" value={success.athlete?.name} />
                <InfoItem label="号码布" value={`#${success.bibNumber}`} highlight />
                <InfoItem label="报名组别" value={success.category?.name} />
                <InfoItem label="衣服尺码" value={success.shirtSize} />
                <InfoItem label="手机号码" value={success.athlete?.phone} />
                <InfoItem label="性别" value={success.athlete?.gender === 'MALE' ? '男' : success.athlete?.gender === 'FEMALE' ? '女' : '其他'} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>📌 温馨提示：</strong>比赛当天请携带身份证件签到，领取号码布和参赛包。
                  号码布需全程佩戴于胸前，计时系统依赖号码布识别选手身份。
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/events/${eventId}`}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-center"
                >
                  返回赛事详情
                </Link>
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  回到首页
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={eventId ? `/events/${eventId}` : '/'}
            className="inline-flex items-center text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            ← 返回
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
            <h1 className="text-2xl font-bold text-slate-900">选手报名</h1>
            {event && (
              <p className="text-sm text-slate-500 mt-1">{event.name}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <section>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 text-indigo-600">
                个人信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="请输入真实姓名"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    性别 *
                  </label>
                  <div className="flex gap-2">
                    {GENDERS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGender(g.value)}
                        className={`flex-1 px-4 py-2.5 border rounded-lg font-medium transition-colors ${
                          gender === g.value
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    出生日期 *
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    手机号码 *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="用于接收赛事通知"
                    required
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 text-indigo-600">
                紧急联系人
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    紧急联系人姓名 *
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    紧急联系人电话 *
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4 text-indigo-600">
                报名选项
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    比赛组别 *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    required
                  >
                    {event?.categories.map((cat) => {
                      const isFull = cat._count.registrations >= cat.capacity
                      return (
                        <option key={cat.id} value={cat.id} disabled={isFull}>
                          {cat.name} - {cat.distance}KM (¥{cat.price}) [{cat._count.registrations}/{cat.capacity}]
                          {isFull ? ' - 已满' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    衣服尺码 *
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {SHIRT_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setShirtSize(size)}
                        className={`py-2.5 border rounded-lg font-medium text-sm transition-colors ${
                          shirtSize === size
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                href={eventId ? `/events/${eventId}` : '/'}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? '提交中...' : '确认报名'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string
  value?: string | number
  highlight?: boolean
}) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200' : 'bg-slate-50'}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? 'text-indigo-700' : 'text-slate-900'}`}>
        {value || '-'}
      </p>
    </div>
  )
}
