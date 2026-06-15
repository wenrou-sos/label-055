import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import React from 'react'
import Results from '@/app/events/[id]/results/page'

const mockEvent = {
  id: 'event-1',
  name: '测试马拉松',
  categories: [
    { id: 'cat-1', name: '全马' },
    { id: 'cat-2', name: '半马' },
  ],
  status: 'ongoing',
}

const mockResults = [
  {
    registrationId: 'reg-1',
    athleteId: 'ath-1',
    athleteName: '张三',
    bibNumber: 1001,
    gender: 'male',
    age: 30,
    categoryId: 'cat-1',
    categoryName: '全马',
    chipTime: 3600000,
    gunTime: 3610000,
    splitTimes: [],
    overallRank: 1,
    categoryRank: 1,
    genderRank: 1,
    finished: true,
  },
  {
    registrationId: 'reg-2',
    athleteId: 'ath-2',
    athleteName: '李四',
    bibNumber: 1002,
    gender: 'female',
    age: 28,
    categoryId: 'cat-1',
    categoryName: '全马',
    chipTime: 3700000,
    gunTime: 3710000,
    splitTimes: [],
    overallRank: 2,
    categoryRank: 2,
    genderRank: 1,
    finished: true,
  },
  {
    registrationId: 'reg-3',
    athleteId: 'ath-3',
    athleteName: '王五',
    bibNumber: 1003,
    gender: 'male',
    age: 35,
    categoryId: 'cat-2',
    categoryName: '半马',
    chipTime: null,
    gunTime: null,
    splitTimes: [],
    overallRank: null,
    categoryRank: null,
    genderRank: null,
    finished: false,
  },
]

function createMockFetch(eventData: typeof mockEvent, resultsData: typeof mockResults) {
  return vi.fn((url: string | URL) => {
    const urlStr = String(url)
    if (urlStr.includes('/results')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(resultsData),
      } as Response)
    }
    if (urlStr.includes('/api/events/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(eventData),
      } as Response)
    }
    return Promise.reject(new Error(`Unknown URL: ${urlStr}`))
  })
}

describe('成绩页面 - 刷新行为测试', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    fetchSpy = createMockFetch(mockEvent, mockResults)
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('组件挂载后只请求 2 次数据（事件详情 + 成绩列表），不会无限循环', async () => {
    const paramsPromise = Promise.resolve({ id: 'event-1' })

    render(<Results params={paramsPromise} />)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    const fetchUrls = fetchSpy.mock.calls.map((c: [string | URL]) => String(c[0]))
    expect(fetchUrls).toContain('/api/events/event-1')
    expect(fetchUrls).toContain('/api/events/event-1/results')

    expect(screen.getByText('测试马拉松')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
  })

  it('渲染完成后等待一段时间，不再发起额外请求（无无限刷新）', async () => {
    const paramsPromise = Promise.resolve({ id: 'event-1' })

    render(<Results params={paramsPromise} />)

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument()
    })

    const callCountAfterRender = fetchSpy.mock.calls.length

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    expect(fetchSpy).toHaveBeenCalledTimes(callCountAfterRender)
  })

  it('赛事 ID 变化时才重新请求数据', async () => {
    const paramsPromise = Promise.resolve({ id: 'event-1' })

    const { rerender } = render(<Results params={paramsPromise} />)

    await waitFor(() => {
      expect(screen.getByText('测试马拉松')).toBeInTheDocument()
    })

    const firstCallCount = fetchSpy.mock.calls.length
    expect(firstCallCount).toBe(2)

    const event2 = { ...mockEvent, id: 'event-2', name: '赛事二', categories: [] }
    fetchSpy.mockImplementation((url: string | URL) => {
      const urlStr = String(url)
      if (urlStr.includes('/results')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(event2),
      } as Response)
    })

    const newParamsPromise = Promise.resolve({ id: 'event-2' })
    rerender(<Results params={newParamsPromise} />)

    await waitFor(() => {
      expect(screen.getByText('赛事二')).toBeInTheDocument()
    })

    const newCallCount = fetchSpy.mock.calls.length
    expect(newCallCount - firstCallCount).toBe(2)
  })

  it('显示正确数量的完赛选手和进行中选手', async () => {
    const paramsPromise = Promise.resolve({ id: 'event-1' })

    render(<Results params={paramsPromise} />)

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument()
    })

    expect(screen.getByText(/完赛选手\s*2/)).toBeInTheDocument()
    expect(screen.getByText(/进行中\s*1/)).toBeInTheDocument()
  })

  it('未完赛选手不显示证书按钮', async () => {
    const paramsPromise = Promise.resolve({ id: 'event-1' })

    render(<Results params={paramsPromise} />)

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument()
    })

    const certButtons = screen.queryAllByText('🎖️ 证书')
    expect(certButtons.length).toBe(2)
  })

  it('即使 params Promise 被重新创建（引用变化），只要 id 相同就不会重复请求', async () => {
    const paramsPromise1 = Promise.resolve({ id: 'event-1' })

    const { rerender } = render(<Results params={paramsPromise1} />)

    await waitFor(() => {
      expect(screen.getByText('测试马拉松')).toBeInTheDocument()
    })

    const callCountAfterFirst = fetchSpy.mock.calls.length

    const paramsPromise2 = Promise.resolve({ id: 'event-1' })
    rerender(<Results params={paramsPromise2} />)

    await act(async () => {
      await Promise.resolve()
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(fetchSpy).toHaveBeenCalledTimes(callCountAfterFirst)
  })
})
