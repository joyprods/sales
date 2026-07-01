// app/(app)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import ClientForm from '@/components/client-form/ClientForm';
import ProductPricesForm from '@/components/prices/ProductPricesForm';
import { UserPlus, IndianRupee, ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<'home' | 'client' | 'prices'>('home');

  if (activeView === 'home') {
    return (
      <div className='max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 py-4'>
        {/* Welcome Header */}
        <div className='text-center space-y-3 mb-10'>
          <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight text-foreground'>
            Joymex Sales Portal
          </h1>
          <p className='text-muted-foreground text-sm md:text-base max-w-md mx-auto'>
            Select an action below to manage the master client database or configure product pricing.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          
          {/* Card 1: Add New Client */}
          <button
            onClick={() => setActiveView('client')}
            className='group text-left card p-8 border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer space-y-6 focus:outline-none focus:ring-2 focus:ring-primary/20'
          >
            <div className='w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110'>
              <UserPlus size={28} />
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-bold text-foreground group-hover:text-primary transition-colors'>
                Add New Client
              </h2>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                Register a new client in the master database. Fill in category, contact details, logistics, area, and taxation information.
              </p>
            </div>
            <div className='pt-2 flex items-center text-xs font-bold text-primary group-hover:translate-x-1.5 transition-transform'>
              <span>Open Client Form</span>
              <span className='ml-1.5'>→</span>
            </div>
          </button>

          {/* Card 2: Add Product Prices */}
          <button
            onClick={() => setActiveView('prices')}
            className='group text-left card p-8 border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer space-y-6 focus:outline-none focus:ring-2 focus:ring-primary/20'
          >
            <div className='w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110'>
              <IndianRupee size={28} />
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-bold text-foreground group-hover:text-primary transition-colors'>
                Add Product Prices
              </h2>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                Set or update custom product prices for Local and Outstation clients. Compares, resizes, and writes directly to pricing sheets.
              </p>
            </div>
            <div className='pt-2 flex items-center text-xs font-bold text-primary group-hover:translate-x-1.5 transition-transform'>
              <span>Open Pricing Form</span>
              <span className='ml-1.5'>→</span>
            </div>
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Navigation Header */}
      <div className='flex items-center justify-between gap-4 border-b border-border/40 pb-5 mb-2'>
        <button
          onClick={() => setActiveView('home')}
          className='flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer bg-slate-100 dark:bg-slate-800/60 px-3.5 py-2 rounded-lg border border-border/45'
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>

        <span className='text-xs font-bold text-muted-foreground bg-slate-50 dark:bg-slate-900 border border-border/30 px-3 py-1.5 rounded-full'>
          {activeView === 'client' ? 'Client Registration' : 'Pricing Matrix'}
        </span>
      </div>

      {/* Render selected view */}
      {activeView === 'client' ? (
        <div className='animate-in fade-in duration-300'>
          <ClientForm />
        </div>
      ) : (
        <div className='animate-in fade-in duration-300'>
          <ProductPricesForm />
        </div>
      )}
    </div>
  );
}
