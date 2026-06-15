import '@testing-library/jest-dom/vitest'
import React, { type ComponentProps } from 'react'

type MockLinkProps = {
  href: string
  children: React.ReactNode
} & ComponentProps<'a'>

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: MockLinkProps) =>
    React.createElement('a', { href, ...rest }, children),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
