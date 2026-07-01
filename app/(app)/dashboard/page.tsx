// app/(app)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import ClientForm from '@/components/client-form/ClientForm';
import ProductPricesForm from '@/components/prices/ProductPricesForm';
import { UserPlus, IndianRupee } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'client' | 'prices'>('client');

  return (
    <>
      {/* Page Title Header */}
      <div className='mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='heading-lg mb-2'>
            {activeTab === 'client' ? 'Client Master Form' : 'Product Pricing Master'}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {activeTab === 'client' 
              ? 'Fill in the details below to add a new client to the master database.'
              : 'Configure custom product prices for your clients in the pricing sheets.'
            }
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className='flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 self-start md:self-center shrink-0 shadow-inner'>
          <button
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'client'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus size={16} />
            <span>Add New Client</span>
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'prices'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <IndianRupee size={16} />
            <span>Add Product Prices</span>
          </button>
        </div>
      </div>

      {/* Render active form component */}
      {activeTab === 'client' ? <ClientForm /> : <ProductPricesForm />}
    </>
  );
}
