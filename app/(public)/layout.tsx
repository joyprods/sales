// app/(public)/layout.tsx
import PublicHeader from '@/components/PublicHeader';

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col bg-background'>
      <PublicHeader />
      <main className='flex flex-1 flex-col items-center justify-start sm:justify-center px-4 pt-16 pb-8 sm:py-12 from-background via-background to-secondary/20'>
        <div className='w-full max-w-md'>{children}</div>
      </main>
    </div>
  );
}
