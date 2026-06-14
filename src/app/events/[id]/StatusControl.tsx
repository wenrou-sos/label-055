'use client'

const STATUSES = [
  { value: 'REGISTRATION_OPEN', label: '报名中', color: 'bg-green-500 hover:bg-green-600' },
  { value: 'REGISTRATION_CLOSED', label: '报名截止', color: 'bg-gray-500 hover:bg-gray-600' },
  { value: 'IN_PROGRESS', label: '进行中', color: 'bg-blue-500 hover:bg-blue-600' },
  { value: 'COMPLETED', label: '已结束', color: 'bg-purple-500 hover:bg-purple-600' },
] as const

export default function StatusControl({
  eventId,
  currentStatus,
}: {
  eventId: string
  currentStatus: string
}) {
  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    window.location.reload()
  }

  return (
    <div className="space-y-2">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => updateStatus(s.value)}
          disabled={currentStatus === s.value}
          className={`w-full px-4 py-2.5 text-white font-medium rounded-lg transition-all text-sm ${
            currentStatus === s.value
              ? `${s.color} opacity-60 cursor-not-allowed ring-2 ring-offset-2 ring-slate-400`
              : `${s.color}`
          }`}
        >
          {currentStatus === s.value && '✓ '}
          {s.label}
        </button>
      ))}
    </div>
  )
}
