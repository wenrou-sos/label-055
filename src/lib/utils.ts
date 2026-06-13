export function formatTime(ms: number): string {
  if (ms < 0) return '--:--:--'
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function calculateAge(birthDate: Date | string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    REGISTRATION_OPEN: '报名中',
    REGISTRATION_CLOSED: '报名截止',
    IN_PROGRESS: '进行中',
    COMPLETED: '已结束',
  }
  return statusMap[status] || status
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    REGISTRATION_OPEN: 'bg-green-100 text-green-800',
    REGISTRATION_CLOSED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

export function getGenderText(gender: string): string {
  const genderMap: Record<string, string> = {
    MALE: '男',
    FEMALE: '女',
    OTHER: '其他',
  }
  return genderMap[gender] || gender
}

export function getShirtSizeText(size: string): string {
  return size
}

export function generateOrdinal(n: number): string {
  if (n <= 0) return '-'
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
