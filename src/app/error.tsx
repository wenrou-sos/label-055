'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">页面加载出错</h2>
        <p className="text-slate-600 mb-2">
          {error.message || '发生了未知错误'}
        </p>
        <p className="text-sm text-slate-400 mb-6">
          请检查数据库连接是否正常，或稍后重试
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            重新加载
          </button>
          <Link
            href="/"
            className="px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors border border-slate-300"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  )
}
