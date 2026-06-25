// app/components/Footer.tsx

'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t border-border/60 bg-card/40 mt-auto py-6'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground/80'>
        <p>Joymex Foods Pvt Ltd © {currentYear}.</p>
        <p className='mt-1.5'>Developed by Digital Craft Solutions ❤️</p>
      </div>
    </footer>
  );
}
