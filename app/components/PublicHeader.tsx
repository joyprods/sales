// app/components/PublicHeader.tsx
'use client';

import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className='sticky top-0 z-40 bg-card border-b border-border shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 md:px-6 py-2 flex items-center justify-between'>
        {/* Logo and Brand */}
        <Link
          href='/'
          className='flex items-center gap-3 hover:opacity-80 transition-opacity'
        >
          <div className='flex-shrink-0'>
            <img
              src='/joy-products-logo.png'
              alt='Joymex Foods'
              className='h-12 w-12 md:h-14 md:w-14 object-contain'
            />
          </div>
          <div className=' sm:block'>
            <h1 className='text-lg md:text-xl font-bold text-foreground'>
              Joymex Foods
            </h1>
            <p className='text-xs text-muted-foreground'>Sales Management</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className='flex items-center gap-6'>
          {/* <Link
            href='/'
            className='text-sm font-medium text-foreground hover:text-primary transition-colors'
          >
            Home
          </Link> */}
          <Link
            href='/login'
            className='text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:shadow-lg transition-all'
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
