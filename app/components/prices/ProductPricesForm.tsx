// app/components/prices/ProductPricesForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Truck, 
  Search, 
  Save, 
  Info, 
  HelpCircle,
  Filter
} from 'lucide-react';
import SearchableSelect from '../SearchableSelect';
import SubmittingModal from '../vendor-form/SubmittingModal';

export default function ProductPricesForm() {
  const [clientType, setClientType] = useState<'LOCAL' | 'OUTSTATION'>('LOCAL');
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  // Pricing matrix states loaded all at once
  const [productsList, setProductsList] = useState<string[]>([]);
  const [clientsList, setClientsList] = useState<string[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, Record<string, number>>>({});
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  
  // Local input prices states
  const [updatedPrices, setUpdatedPrices] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal / Feedback states
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string>('');

  // 1. Fetch entire pricing matrix on mount and tab switch
  useEffect(() => {
    async function loadAllPricingData() {
      setIsLoadingAll(true);
      setSelectedClient('');
      setUpdatedPrices({});
      setSearchQuery('');
      setSelectedCategory('ALL');
      try {
        const res = await fetch(`/api/prices?action=getAllPrices&clientType=${clientType}`);
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error('Failed to load pricing matrix');
        const data = await res.json();
        
        if (data.ok) {
          setProductsList(data.products || []);
          setClientsList(data.clients || []);
          setPriceMap(data.priceMap || {});
          setCategoriesMap(data.categories || {});
        } else {
          throw new Error(data.message || 'Invalid product pricing data returned');
        }
      } catch (err: any) {
        console.error('Error loading pricing matrix:', err);
        setSubmitStatus('error');
        setSubmitMessage(err.message || 'Failed to load pricing matrix. Please try again.');
      } finally {
        setIsLoadingAll(false);
      }
    }
    
    loadAllPricingData();
  }, [clientType]);

  // 2. Tab change handler
  const handleTypeChange = (type: 'LOCAL' | 'OUTSTATION') => {
    setClientType(type);
  };

  // 3. Populate inputs instantly when selected client changes (0ms delay)
  useEffect(() => {
    if (!selectedClient) {
      setUpdatedPrices({});
      return;
    }

    const clientPrices = priceMap[selectedClient] || {};
    const initialPrices: Record<string, string> = {};
    productsList.forEach((prodName) => {
      const price = clientPrices[prodName];
      initialPrices[prodName] = price !== undefined && price !== null ? price.toString() : '';
    });
    setUpdatedPrices(initialPrices);
  }, [selectedClient, productsList, priceMap]);

  // 4. Handle input changes for price fields
  const handlePriceChange = (productName: string, val: string) => {
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

    const cleanedPrices: Record<string, number | string> = {};
    for (const prodName in updatedPrices) {
      if (updatedPrices.hasOwnProperty(prodName)) {
        const rawVal = updatedPrices[prodName].trim();
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

      // Update local priceMap state in memory to reflect the new prices instantly
      setPriceMap((prev) => {
        const newClientPrices: Record<string, number> = {};
        for (const prodName in cleanedPrices) {
          const val = cleanedPrices[prodName];
          if (val !== '') {
            newClientPrices[prodName] = val as number;
          }
        }
        return {
          ...prev,
          [selectedClient]: newClientPrices
        };
      });

      setSubmitStatus('success');
      setSubmitMessage('Prices updated successfully in the Google Sheet!');
      
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

  // Extract unique categories from productsList using categoriesMap
  const uniqueCategories = Array.from(
    new Set(
      productsList.map((prodName) => categoriesMap[prodName] || 'Uncategorized')
    )
  ).sort();

  // Filter products based on search query and category selection
  const filteredProducts = productsList.filter((prodName) => {
    const matchesSearch = prodName.toLowerCase().includes(searchQuery.toLowerCase());
    const category = categoriesMap[prodName] || 'Uncategorized';
    const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;
    return matchesSearch && matchesCategory;
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
            {isLoadingAll ? (
              <div className='h-11 flex items-center justify-center border border-input rounded-lg bg-background text-sm text-muted-foreground gap-2 animate-pulse'>
                <span className='h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin' />
                Loading pricing matrix...
              </div>
            ) : (
              <SearchableSelect
                value={selectedClient}
                options={clientsList}
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
          
          {/* Filters & Search Header (Sticky at top below layout header) */}
          <div className='sticky top-[73px] md:top-[89px] z-20 card py-4 px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border border-border/70 transition-all duration-200'>
            {/* Search & Category Inputs */}
            <div className='flex flex-col sm:flex-row items-stretch gap-3 flex-1 max-w-2xl'>
              {/* Search Input */}
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' size={18} />
                <input
                  type='text'
                  placeholder='Search products...'
                  className='input pl-10 h-10 text-sm w-full'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Dropdown */}
              <div className='relative w-full sm:w-60 shrink-0 font-medium'>
                <Filter className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' size={16} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='input pl-10 pr-8 h-10 text-sm cursor-pointer bg-white dark:bg-slate-900 font-semibold w-full appearance-none border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='none' stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24' width='16' height='16' xmlns='http://www.w3.org/2000/svg'><path d='m6 9 6 6 6-6'/></svg>")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <option value='ALL'>All Categories</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sticky Top Action Buttons */}
            <div className='flex items-center justify-between md:justify-end gap-3 shrink-0'>
              <div className='hidden sm:flex items-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-lg border border-border/50 font-medium'>
                <span>{filteredProducts.length} active products</span>
              </div>
              <button
                type='submit'
                className='btn-primary flex items-center justify-center gap-2 h-10 px-5 text-sm shadow-sm cursor-pointer w-full sm:w-auto'
              >
                <Save size={15} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
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
                {filteredProducts.map((prodName) => {
                  const currentPrice = priceMap[selectedClient]?.[prodName];
                  const newPrice = updatedPrices[prodName] || '';

                  return (
                    <div 
                      key={prodName}
                      className='card p-5 space-y-4 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-all duration-300 flex flex-col justify-between'
                    >
                      {/* Product Info */}
                      <div className='flex items-start justify-between gap-3'>
                        <div className='space-y-2.5 w-full'>
                          {/* Category Badge */}
                          <div className='flex'>
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 shadow-sm'>
                              📁 {categoriesMap[prodName] || 'Uncategorized'}
                            </span>
                          </div>
                          <h4 className='font-bold text-foreground text-sm md:text-base leading-tight'>
                            {prodName}
                          </h4>
                          {/* Historical price display */}
                          {currentPrice !== undefined && currentPrice !== null ? (
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
                      <div className='form-group mt-2'>
                        <div className='relative'>
                          <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm'>
                            ₹
                          </span>
                          <input
                            type='text'
                            inputMode='decimal'
                            placeholder={currentPrice !== undefined && currentPrice !== null ? currentPrice.toString() : 'Set price...'}
                            className='input pl-8 pr-12 font-semibold text-sm'
                            value={newPrice}
                            onChange={(e) => handlePriceChange(prodName, e.target.value)}
                          />
                          {newPrice !== '' && (
                            <button
                              type='button'
                              onClick={() => handlePriceChange(prodName, '')}
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
        loadingTitle="Saving Prices..."
        title="Prices Saved"
        messages={[
          'Validating prices...',
          'Saving custom prices...',
          'Writing to spreadsheet...',
          'Finalizing...'
        ]}
        message={submitMessage}
        onClose={() => setSubmitStatus('idle')}
      />
    </div>
  );
}
