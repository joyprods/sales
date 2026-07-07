// app/(app)/dashboard/page.tsx
'use client';

import { useState } from 'react';
import ClientForm from '@/components/client-form/ClientForm';
import ProductPricesForm from '@/components/prices/ProductPricesForm';
import SearchableSelect from '@/components/SearchableSelect';
import { UserPlus, IndianRupee, ArrowLeft, Edit } from 'lucide-react';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<'home' | 'client' | 'prices' | 'edit-client'>('home');
  const [initialClient, setInitialClient] = useState<string>('');
  const [initialClientType, setInitialClientType] = useState<'LOCAL' | 'OUTSTATION'>('LOCAL');

  // Edit Client States
  const [clientsList, setClientsList] = useState<string[]>([]);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);

  const handleClientAdded = (partyName: string, clientType: 'LOCAL' | 'OUTSTATION') => {
    setInitialClient(partyName);
    setInitialClientType(clientType);
    setActiveView('prices');
  };

  const handleStartEdit = async () => {
    setActiveView('edit-client');
    setSelectedClientName('');
    setClientDetails(null);
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/clients');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      const allClients = data.All ? data.All.map((c: any) => c.name) : [];
      setClientsList(allClients.sort());
    } catch (err) {
      console.error('Failed to load clients list:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleClientSelected = async (name: string) => {
    setSelectedClientName(name);
    if (!name) {
      setClientDetails(null);
      return;
    }
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/clients?name=${encodeURIComponent(name)}`);
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const result = await res.json();
      if (result.ok) {
        setClientDetails(result.data);
      } else {
        console.error('Failed to load client details:', result.message);
      }
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleClientUpdated = (partyName: string, clientType: 'LOCAL' | 'OUTSTATION') => {
    setActiveView('home');
    setSelectedClientName('');
    setClientDetails(null);
  };

  if (activeView === 'home') {
    return (
      <div className='max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 py-4'>
        {/* Welcome Header */}
        <div className='text-center space-y-3 mb-10'>
          <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight text-foreground'>
            Joymex Client Portal
          </h1>
          <p className='text-muted-foreground text-sm md:text-base max-w-md mx-auto'>
            Select an action below to manage the master client database or configure product pricing.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          
          {/* Card 1: Add New Client */}
          <button
            onClick={() => {
              setInitialClient('');
              setInitialClientType('LOCAL');
              setActiveView('client');
            }}
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

          {/* Card 2: Edit Existing Client */}
          <button
            onClick={handleStartEdit}
            className='group text-left card p-8 border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer space-y-6 focus:outline-none focus:ring-2 focus:ring-primary/20'
          >
            <div className='w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110'>
              <Edit size={28} />
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-bold text-foreground group-hover:text-primary transition-colors'>
                Edit Existing Client
              </h2>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                Search and modify master records for existing clients. Any missing mandatory fields will be caught and updated.
              </p>
            </div>
            <div className='pt-2 flex items-center text-xs font-bold text-primary group-hover:translate-x-1.5 transition-transform'>
              <span>Open Edit Form</span>
              <span className='ml-1.5'>→</span>
            </div>
          </button>

          {/* Card 3: Add Product Prices */}
          <button
            onClick={() => {
              setInitialClient('');
              setInitialClientType('LOCAL');
              setActiveView('prices');
            }}
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
          {activeView === 'client' ? 'Client Registration' : activeView === 'edit-client' ? 'Edit Client Details' : 'Pricing Matrix'}
        </span>
      </div>

      {/* Render selected view */}
      {activeView === 'client' ? (
        <div className='animate-in fade-in duration-300'>
          <ClientForm onSuccess={handleClientAdded} />
        </div>
      ) : activeView === 'edit-client' ? (
        <div className='animate-in fade-in duration-300 space-y-6 max-w-4xl mx-auto'>
          <div className='card p-6 space-y-4'>
            <h2 className='heading-md flex items-center gap-2'>
              ✏️ Select Client to Edit
            </h2>
            <p className='text-sm text-muted-foreground'>
              Choose a client from the master database to load their current details and start editing.
            </p>
            <div className='max-w-md'>
              {isLoadingList ? (
                <div className='h-11 flex items-center justify-center border border-input rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-muted-foreground gap-2 animate-pulse'>
                  <span className='h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin' />
                  Loading client list...
                </div>
              ) : (
                <SearchableSelect
                  value={selectedClientName}
                  options={clientsList}
                  placeholder='Search client name...'
                  emptyLabel='No clients found'
                  label='Client Name'
                  onChange={handleClientSelected}
                />
              )}
            </div>
          </div>

          {isLoadingDetails && (
            <div className='card p-8 flex flex-col items-center justify-center gap-3 text-slate-500 min-h-[200px]'>
              <span className='h-8 w-8 border-3 border-primary/25 border-t-primary rounded-full animate-spin' />
              <p className='text-sm font-semibold animate-pulse'>Fetching client data from Google Sheets...</p>
            </div>
          )}

          {!isLoadingDetails && clientDetails && (
            <div className='animate-in fade-in slide-in-from-top-2 duration-300'>
              <ClientForm
                mode='edit'
                initialData={clientDetails}
                originalPartyName={selectedClientName}
                onSuccess={handleClientUpdated}
              />
            </div>
          )}

          {!isLoadingDetails && !clientDetails && selectedClientName && (
            <div className='card p-8 text-center text-destructive border-destructive/20 bg-destructive/5'>
              ⚠️ Failed to load details for client: {selectedClientName}. Please try again.
            </div>
          )}
        </div>
      ) : (
        <div className='animate-in fade-in duration-300'>
          <ProductPricesForm initialClient={initialClient} initialClientType={initialClientType} />
        </div>
      )}
    </div>
  );
}
