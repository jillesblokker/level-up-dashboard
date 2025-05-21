import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import React from 'react'

// Mock next/font
vi.mock('next/font/google', () => ({
  Inter: () => ({
    style: {
      fontFamily: 'mocked-font',
    },
  }),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, width, height }: { src: string; alt: string; className?: string; width?: number; height?: number }) => {
    return React.createElement('img', { src, alt, className, width, height })
  },
}))

// Mock next-auth
// vi.mock('next-auth/react', () => ({
//   signIn: vi.fn(),
//   signOut: vi.fn(),
//   useSession: vi.fn(() => ({
//     data: null,
//     status: 'unauthenticated',
//   })),
// }))

// Mock app/actions/auth
vi.mock('@/app/actions/auth', () => ({
  skipAuth: vi.fn(),
}))

// Mock Supabase client
// ... existing code ... 