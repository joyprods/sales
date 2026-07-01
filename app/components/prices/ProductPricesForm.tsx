// app/components/prices/ProductPricesForm.tsx
'use client';

import { useState, useEffect } from 'react';
import SearchableSelect from '../SearchableSelect';
import SubmittingModal from '../vendor-form/SubmittingModal';
import { Search, Info, Save, RotateCcw, MapPin, Truck, HelpCircle } from 'lucide-react';

interface ProductPrice {
  name: string;
  price: number | null;
  isActive: boolean;
}

export default function ProductPricesForm() {
  // Client selection states
  const [clientType, setClientType] = useState<'LOCAL' | 'OUTSTATION'>('LOCAL');
  const [clientsGrouped, setClientsGrouped] = useState<Record<'LOCAL' | 'OUTSTATION', string[]>>({
    LOCAL: [],
    OUTSTATION: []
  });
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(false);

  // Product prices states
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [updatedPrices, setUpdatedPrices] = useState<Record<string, string>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Feedback states
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string>('');

  // 1. Fetch active clients grouped by Local/Outstation on mount
  useEffect(() => {
    async function loadClients() {
      setIsLoadingClients(true);
      try {
        const res = await fetch('/api/prices?action=getClients');
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch clients list');
        const data = await res.json();
        if (data && (data.LOCAL || data.OUTSTATION)) {
          setClientsGrouped({
            LOCAL: Array.isArray(data.LOCAL) ? data.LOCAL : [],
            OUTSTATION: Array.isArray(data.OUTSTATION) ? data.OUTSTATION : []
          });
        }
      } catch (err) {
        console.error('Error loading clients:', err);
      } finally {
        setIsLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  // 2. Clear client selection when switching between Local and Outstation
  const handleTypeChange = (type: 'LOCAL' | 'OUTSTATION') => {
    setClientType(type);
    setSelectedClient('');
    setProducts([]);
    setUpdatedPrices({});
    setSearchQuery('');
  };

  // 3. Fetch product prices when selected client changes
  useEffect(() => {
    if (!selectedClient) {
      setProducts([]);
      setUpdatedPrices({});
      return;
    }

    async function loadPrices() {
      setIsLoadingPrices(true);
      try {
        const res = await fetch(
          `/api/prices?action=getPrices&clientName=${encodeURIComponent(selectedClient)}&clientType=${clientType}`
        );
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error('Failed to load product pricing');
        const data = await res.json();
        
        if (data.ok && Array.isArray(data.products)) {
          setProducts(data.products);
          
          // Pre-populate input values with existing prices
          const initialPrices: Record<string, string> = {};
          data.products.forEach((p: ProductPrice) => {
            initialPrices[p.name] = p.price !== null ? p.price.toString() : '';
          });
          setUpdatedPrices(initialPrices);
        } else {
          throw new Error(data.message || 'Invalid product pricing data returned');
        }
      } catch (err: any) {
        console.error('Error loading prices:', err);
        setSubmitStatus('error');
        setSubmitMessage(err.message || 'Failed to load client prices. Please try again.');
      } finally {
        setIsLoadingPrices(false);
      }
    }

    loadPrices();
  }, [selectedClient, clientType]);

  // 4. Handle input changes for price fields
  const handlePriceChange = (productName: string, val: string) => {
    // Allow empty string or valid decimals/integers
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setUpdatedPrices((prev) => ({
        ...prev,
        [productName]: val
      }));
    }
  };

  // 5. Submit updated prices to the backend API
  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setSubmitStatus('loading');
    setSubmitMessage(`Saving custom prices for ${selectedClient}...`);

    // Clean up prices mapping to submit
    const cleanedPrices: Record<string, number | string> = {};
    for (const prodName in updatedPrices) {
      if (updatedPrices.hasOwnProperty(prodName)) {
        const rawVal = updatedPrices[prodName].trim();
        // If empty, pass as empty string to reset the price in sheet
        cleanedPrices[prodName] = rawVal === '' ? '' : parseFloat(rawVal);
      }
    }

    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientType,
          clientName: selectedClient,
          prices: cleanedPrices
        })
      });

      if (res.status === 401) {
        // Save state to localStorage as a fallback draft
        try {
          localStorage.setItem('draft_pricing_client', selectedClient);
          localStorage.setItem('draft_pricing_type', clientType);
          localStorage.setItem('draft_pricing_values', JSON.stringify(updatedPrices));
        } catch (e) {
          console.error('Failed to save pricing draft:', e);
        }
        window.location.href = '/login?session_expired=true';
        return;
      }

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.message || data.error || 'Failed to save prices');
      }

      setSubmitStatus('success');
      setSubmitMessage('Prices updated successfully in the Google Sheet!');
      
      // Reload current prices from the server to sync state
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 2500);
    } catch (err: any) {
      console.error('Error saving prices:', err);
      setSubmitStatus('error');
      setSubmitMessage(err.message || 'Failed to update prices. Please check connection and try again.');
    }
  };

  // 6. Restore local pricing draft if it exists (session recovery)
  useEffect(() => {
    try {
      const savedClient = localStorage.getItem('draft_pricing_client');
      const savedType = localStorage.getItem('draft_pricing_type');
      const savedValues = localStorage.getItem('draft_pricing_values');

      if (savedClient && savedType && savedValues) {
        setClientType(savedType as 'LOCAL' | 'OUTSTATION');
        setSelectedClient(savedClient);
        setUpdatedPrices(JSON.parse(savedValues));

        localStorage.removeItem('draft_pricing_client');
        localStorage.removeItem('draft_pricing_type');
        localStorage.removeItem('draft_pricing_values');
      }
    } catch (e) {
      console.error('Error restoring pricing draft:', e);
    }
  }, []);

  // Filter products based on search query (always show active products only)
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && p.isActive;
  });

  return (
    <div className='max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300'>
      
      {/* ── Client Selection Card ─────────────────────────────────────────── */}
      <div className='card space-y-6'>
        <div className='flex items-center gap-3 border-b border-border pb-4'>
          <span className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm'>
            🏬
          </span>
          <h2 className='heading-md'>Select Client to Set Prices</h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Client Type Toggle */}
          <div className='form-group'>
            <label className='label'>Client Category</label>
            <div className='grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-border/40'>
              <button
                type='button'
                onClick={() => handleTypeChange('LOCAL')}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  clientType === 'LOCAL'
                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <MapPin size={16} />
                <span>Local Clients</span>
              </button>
              <button
                type='button'
                onClick={() => handleTypeChange('OUTSTATION')}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  clientType === 'OUTSTATION'
                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Truck size={16} />
                <span>Outstation Clients</span>
              </button>
            </div>
          </div>

          {/* Searchable Client Selector */}
          <div className='form-group'>
            <label className='label'>Client Name *</label>
            {isLoadingClients ? (
              <div className='h-11 flex items-center justify-center border border-input rounded-lg bg-background text-sm text-muted-foreground gap-2'>
                <span className='h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin' />
                Loading clients database...
              </div>
            ) : (
              <SearchableSelect
                value={selectedClient}
                options={clientsGrouped[clientType]}
                placeholder={`Search active ${clientType.toLowerCase()} clients...`}
                emptyLabel={`No active ${clientType.toLowerCase()} clients found`}
                label='Client Name'
                onChange={(val) => setSelectedClient(val)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Product Prices Grid ───────────────────────────────────────────── */}
      {selectedClient && (
        <form onSubmit={handleSavePrices} className='space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
          
          {/* Filters & Search Header */}
          <div className='card py-4 px-6 flex items-center justify-between gap-4'>
            {/* Search Input */}
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' size={18} />
              <input
                type='text'
                placeholder='Search products by name...'
                className='input pl-10'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className='hidden sm:flex items-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border border-border/50 font-medium'>
              <span>Showing {filteredProducts.length} active products</span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoadingPrices ? (
            <div className='card p-16 flex flex-col items-center justify-center text-muted-foreground gap-4'>
              <span className='h-8 w-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin' />
              <p className='font-semibold text-sm'>Loading client price matrix from spreadsheet...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className='card p-12 text-center text-muted-foreground space-y-2'>
              <HelpCircle className='mx-auto text-slate-300' size={40} />
              <h3 className='font-bold text-slate-700 dark:text-slate-300'>No Products Found</h3>
              <p className='text-sm max-w-sm mx-auto'>
                {searchQuery 
                  ? `No product matches your search query "${searchQuery}".`
                  : 'No products are currently available in this list.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Grid Layout */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {filteredProducts.map((p) => {
                  const currentPrice = p.price;
                  const newPrice = updatedPrices[p.name] || '';

                  return (
                    <div 
                      key={p.name}
                      className='card p-5 space-y-4 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-all duration-300'
                    >
                      {/* Product Info */}
                      <div className='flex items-start justify-between gap-3'>
                        <div className='space-y-1'>
                          <h4 className='font-bold text-foreground text-sm md:text-base leading-tight'>
                            {p.name}
                          </h4>
                          {/* Historical price display */}
                          {currentPrice !== null ? (
                            <p className='text-xs font-semibold text-primary/80 flex items-center gap-1'>
                              <span>🏷️ Current Price:</span>
                              <span className='font-bold text-foreground'>₹{currentPrice}</span>
                            </p>
                          ) : (
                            <p className='text-xs font-medium text-muted-foreground italic'>
                              No previous price set
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price Input Field */}
                      <div className='form-group'>
                        <div className='relative'>
                          <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm'>
                            ₹
                          </span>
                          <input
                            type='text'
                            inputMode='decimal'
                            placeholder={currentPrice !== null ? currentPrice.toString() : 'Set price...'}
                            className='input pl-8 pr-12 font-semibold text-sm'
                            value={newPrice}
                            onChange={(e) => handlePriceChange(p.name, e.target.value)}
                          />
                          {newPrice !== '' && (
                            <button
                              type='button'
                              onClick={() => handlePriceChange(p.name, '')}
                              className='absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer'
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save / Submit Bar */}
              <div className='card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm'>
                <div className='flex items-start gap-2.5 max-w-lg'>
                  <Info className='shrink-0 text-primary mt-0.5' size={18} />
                  <p className='text-xs text-muted-foreground leading-relaxed'>
                    Saving updates the price columns in the Client spreadsheet. Leaving an input empty resets or clears the custom price for that product on Google Sheets.
                  </p>
                </div>
                <button
                  type='submit'
                  className='btn-primary flex items-center justify-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto h-12 px-6'
                >
                  <Save size={18} />
                  <span>Save Pricing Changes</span>
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Standard Submitting / Success / Error modal overlays */}
      <SubmittingModal
        show={submitStatus !== 'idle'}
        status={
          submitStatus === 'loading'
            ? 'loading'
            : submitStatus === 'success'
              ? 'success'
              : 'error'
        }
        message={submitMessage}
        onClose={() => setSubmitStatus('idle')}
      />
    </div>
  );
}
