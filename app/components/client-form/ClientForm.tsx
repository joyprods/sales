// app/components/client-form/ClientForm.tsx
'use client';

import { useState, useEffect } from 'react';
import SearchableSelect from '../SearchableSelect';
import ConfirmModal from '../vendor-form/ConfirmModal';
import SubmittingModal from '../vendor-form/SubmittingModal';

// ── Dropdown Constants from Sheet ───────────────────────────────────────────
const CLIENT_CATEGORIES = [
  '5 star Hotels',
  'Restaurants & Cafes - Local',
  'Restaurants & Cafes - Outstation',
  'HORECA Distributors',
  'Retail Distributors',
  'Chain Outlets - Multiple Cities',
  'Caterers & Banquets',
  'Private Label',
  'Corporates',
  'Chain Outlets - Local',
  'Others'
];

const SALES_POCS = [
  'H1', 'H2', 'R2', 'R1', 'DH1', 'DH2', 'BH1', 'JOY', 'R3', 'R4', 'SO1', 'SO2', 'R5', 'R6', 'H3', 'P1', 'G1', 'R7', 'R8', 'GUJ1', 'NSM1', 'MH1', 'SC1', 'SC2', 'SC3'
];

const CLASSES = ['CB', 'PB'];

const CREDIT_TYPES = ['ADVANCE', 'BILL TO BILL', 'CASH ON DELIVERY', 'CREDIT'];

const CRM_POCS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];

const AREAS = [
  'AEROCITY', 'AGRIPADA', 'AHMEDABAD', 'AHMEDNAGAR', 'AIROLI', 'ALIBAUG', 'AMBERNATH', 'AMRITSAR',
  'ANDHERI EAST', 'ANDHERI WEST', 'ANDRA PRADESH', 'ASHOK NAGAR', 'ASHOK VIHAR', 'ASSAM', 'AURANGABAD',
  'BADLAPUR', 'BANASHANKARI', 'BANDRA EAST', 'BANDRA WEST', 'BANGALORE', 'BELAPUR', 'BELGAUM',
  'BHANDUP WEST', 'BHAYANDAR EAST', 'BHAYANDAR WEST', 'BHIWANDI', 'BHOPAL', 'BIHAR', 'BKC - BANDRA EAST',
  'BORIVALI EAST', 'BORIVALI WEST', 'BREACH CANDY', 'BRIGADE ROAD', 'BROOKEFIELD', 'BTM LAYOUT',
  'BYCULLA EAST', 'CHANDAPURA', 'CHANDIGARH', 'CHARNI ROAD EAST', 'CHARNI ROAD WEST', 'CHATTISGARH',
  'CHEMBUR EAST', 'CHEMBUR WEST', 'CHENNAI', 'CHINCHPOKLI', 'CHORD ROAD', 'CHOWPATTY', 'CHUNABHATTI',
  'CHURCHGATE', 'COLABA', 'DADAR', 'GHATKOPAR EAST', 'GHATKOPAR WEST', 'GOREGAON EAST', 'GOREGAON WEST',
  'KANDIVALI EAST', 'KANDIVALI WEST', 'KHAR WEST', 'MALAD EAST', 'MALAD WEST', 'MULUND EAST',
  'MULUND WEST', 'POWAI', 'SANTACRUZ EAST', 'SANTACRUZ WEST', 'THANE WEST', 'VASHI', 'VILE PARLE EAST',
  'VILE PARLE WEST', 'WORLI'
];

// ── Form Empty State ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  // Section 1: Basic details
  clientCategory: '',
  partyName: '',
  salesPoc: '',
  hasMsme: 'No',
  msmeNumber: '',

  // Section 2: Contact Person Details
  contactPersonPurchase: '',
  contactNumberPurchase: '',
  emailIdPurchase: '',
  contactPersonAccounts: '',
  mobileNumberAccounts: '',
  emailIdAccounts: '',
  contactPerson3: '',
  contactNumber3: '',
  emailId3: '',

  // Section 3: Location, Address & Route
  area: '',
  city: '',
  customerType: 'HORECA',
  class: 'PB',
  localOrOutstation: 'LOCAL',
  billingAddress: '',
  gstNo: '',
  googleLocationLinks: '',
  shippingAddressSame: true,
  shippingAddress: '',
  pinCode: '',

  // Section 4: Finance & Operations
  panNumber: '',
  salesPocContactNo: '',
  creditType: 'ADVANCE',
  crmPoc: 'P1',
  secondaryUpperLimitInDays: '',
  fssaiNumber: '',
  freightToBeAdded: 'No'
};

// ── Section Indicators ──────────────────────────────────────────────────────
const STEPS = [
  { id: 0, name: 'Basic Info', icon: '📋' },
  { id: 1, name: 'Contacts', icon: '📞' },
  { id: 2, name: 'Logistics', icon: '📍' },
  { id: 3, name: 'Financials', icon: '💳' }
];

export default function ClientForm({
  onSuccess
}: {
  onSuccess?: (partyName: string, clientType: 'LOCAL' | 'OUTSTATION') => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [areasList, setAreasList] = useState<string[]>(AREAS);
  const [originalAreas, setOriginalAreas] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  
  // Load dynamic areas and cities on mount
  useEffect(() => {
    async function loadAreasAndCities() {
      try {
        const areasRes = await fetch('/api/areas');
        if (areasRes.ok) {
          const areasData = await areasRes.json();
          if (Array.isArray(areasData)) {
            const merged = Array.from(new Set([...AREAS, ...areasData])).sort();
            setAreasList(merged);
            setOriginalAreas(merged);
          }
        }
      } catch (err) {
        console.error('Error loading dynamic areas:', err);
      }

      try {
        const citiesRes = await fetch('/api/cities');
        if (citiesRes.ok) {
          const citiesData = await citiesRes.json();
          if (Array.isArray(citiesData)) {
            setCitiesList(citiesData.sort());
          }
        }
      } catch (err) {
        console.error('Error loading dynamic cities:', err);
      }
    }
    loadAreasAndCities();
  }, []);

  // Submit modal and warning modals states
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [showFssaiWarning, setShowFssaiWarning] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  // Restore draft form progress if session expired previously
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('draft_client_form');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          setForm(parsed);
          // Set to final step so they can click submit easily
          setCurrentStep(3);
          localStorage.removeItem('draft_client_form');
          setRestoreMessage('Your form progress has been restored! Please review and submit it again.');
          setTimeout(() => {
            setRestoreMessage('');
          }, 8000);
        }
      }
    } catch (err) {
      console.error('Failed to restore draft form:', err);
    }
  }, []);

  // Auto copy billing to shipping address
  useEffect(() => {
    if (form.shippingAddressSame) {
      setForm((prev) => ({ ...prev, shippingAddress: prev.billingAddress }));
    }
  }, [form.billingAddress, form.shippingAddressSame]);

  // Handle Form Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Helper setter for error
  const setError = (field: string, msg: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };

  // Helper to clear error
  const clearError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── Validation Helpers ─────────────────────────────────────────────────────
  const validatePhone = (field: string, val: string, isRequired: boolean = true) => {
    if (!val) {
      if (isRequired) setError(field, 'Phone number is required');
      return;
    }
    // Accepting telephone/mobile number formats (6 to 15 digits)
    if (!/^\d{6,15}$/.test(val)) {
      setError(field, 'Must be between 6 and 15 digits');
    } else {
      clearError(field);
    }
  };

  const validateEmail = (field: string, val: string, isRequired: boolean = true) => {
    if (!val) {
      if (isRequired) setError(field, 'Email address is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError(field, 'Invalid email format (e.g. name@domain.com)');
    } else {
      clearError(field);
    }
  };

  const validatePinCode = (val: string) => {
    if (!val) {
      setError('pinCode', 'PIN Code is required');
      return;
    }
    if (!/^\d{6}$/.test(val)) {
      setError('pinCode', 'PIN code must be exactly 6 digits');
    } else {
      clearError('pinCode');
    }
  };

  const validateGst = (val: string) => {
    if (!val) {
      if (form.class === 'PB') {
        setError('gstNo', 'GSTIN is required for PB Class');
      } else {
        clearError('gstNo');
      }
      return;
    }
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(val)) {
      setError('gstNo', 'Invalid GSTIN structure (e.g. 22AAAAA0000A1Z5)');
    } else {
      clearError('gstNo');
    }
  };

  const validatePan = (val: string) => {
    if (!val) {
      clearError('panNumber');
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(val)) {
      setError('panNumber', 'Invalid PAN structure (e.g. ABCDE1234F)');
    } else {
      clearError('panNumber');
    }
  };

  const validateFssai = (val: string) => {
    if (!val) {
      setError('fssaiNumber', 'FSSAI License number is required');
      return;
    }
    if (!/^\d{14}$/.test(val)) {
      setError('fssaiNumber', 'FSSAI number must be exactly 14 digits');
    } else {
      clearError('fssaiNumber');
    }
  };

  const validateUrl = (field: string, val: string) => {
    if (!val) return;
    try {
      new URL(val);
      clearError(field);
    } catch (_) {
      setError(field, 'Please enter a valid URL (include http:// or https://)');
    }
  };

  // ── Step-Specific Validation Checks ────────────────────────────────────────
  const validateStep = (stepIdx: number): boolean => {
    const errors: Record<string, string> = {};

    if (stepIdx === 0) {
      if (!form.clientCategory) errors.clientCategory = 'Client category is required';
      if (!form.partyName.trim()) errors.partyName = 'Party name is required';
      if (!form.salesPoc) errors.salesPoc = 'Sales POC is required';
      if (form.hasMsme === 'Yes' && !form.msmeNumber.trim()) {
        errors.msmeNumber = 'MSME number is required';
      }
    } 
    else if (stepIdx === 1) {
      if (!form.contactPersonPurchase.trim()) errors.contactPersonPurchase = 'Purchase contact person is required';
      
      if (!form.contactNumberPurchase) errors.contactNumberPurchase = 'Purchase contact number is required';
      else if (!/^\d{6,15}$/.test(form.contactNumberPurchase)) {
        errors.contactNumberPurchase = 'Must be between 6 and 15 digits';
      }
      
      // Email ID (Purchase) is not compulsory
      if (form.emailIdPurchase && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailIdPurchase)) {
        errors.emailIdPurchase = 'Invalid email format';
      }

      if (!form.contactPersonAccounts.trim()) errors.contactPersonAccounts = 'Accounts contact person is required';
      
      if (!form.mobileNumberAccounts) errors.mobileNumberAccounts = 'Accounts contact number is required';
      else if (!/^\d{6,15}$/.test(form.mobileNumberAccounts)) {
        errors.mobileNumberAccounts = 'Must be between 6 and 15 digits';
      }

      // Email ID (Accounts) is not compulsory
      if (form.emailIdAccounts && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailIdAccounts)) {
        errors.emailIdAccounts = 'Invalid email format';
      }

      // Optional contacts 3
      if (form.contactNumber3 && !/^\d{6,15}$/.test(form.contactNumber3)) {
        errors.contactNumber3 = 'Must be between 6 and 15 digits';
      }
      if (form.emailId3 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId3)) {
        errors.emailId3 = 'Invalid email format';
      }
    } 
    else if (stepIdx === 2) {
      if (!form.area) errors.area = 'Area selection is required';
      
      const isNewArea = form.area && !originalAreas.includes(form.area);
      if (isNewArea && !form.city) {
        errors.city = 'City selection is required for a new area';
      }
      
      if (!form.customerType) errors.customerType = 'Customer type is required';
      if (!form.class) errors.class = 'Class selection is required';
      if (!form.localOrOutstation) errors.localOrOutstation = 'Local/Outstation selection is required';
      if (!form.billingAddress.trim()) errors.billingAddress = 'Billing address is required';
      if (!form.shippingAddress.trim()) errors.shippingAddress = 'Shipping address is required';
      
      if (!form.pinCode) errors.pinCode = 'PIN Code is required';
      else if (!/^\d{6}$/.test(form.pinCode)) {
        errors.pinCode = 'PIN Code must be exactly 6 digits';
      }
      
      if (form.class === 'PB') {
        if (!form.gstNo) errors.gstNo = 'GST Number is required for PB Class';
        else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(form.gstNo)) {
          errors.gstNo = 'Invalid GSTIN structure';
        }
      } else {
        if (form.gstNo && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(form.gstNo)) {
          errors.gstNo = 'Invalid GSTIN structure';
        }
      }

      if (form.googleLocationLinks) {
        try {
          new URL(form.googleLocationLinks);
        } catch (_) {
          errors.googleLocationLinks = 'Please enter a valid URL';
        }
      }
    } 
    else if (stepIdx === 3) {
      if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.panNumber)) {
        errors.panNumber = 'Invalid PAN structure';
      }

      if (!form.creditType) errors.creditType = 'Credit type is required';
      if (!form.crmPoc) errors.crmPoc = 'CRM POC is required';

      if (form.creditType === 'CREDIT' && !form.secondaryUpperLimitInDays) {
        errors.secondaryUpperLimitInDays = 'Credit limit in days is required for CREDIT type';
      }

      if (!form.fssaiNumber) errors.fssaiNumber = 'FSSAI number is required';
      else if (!/^\d{14}$/.test(form.fssaiNumber)) {
        errors.fssaiNumber = 'Must be exactly 14 digits';
      }

      if (!form.freightToBeAdded) errors.freightToBeAdded = 'Freight setting is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigations
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form submit core execution
  const doSubmit = async () => {
    setSubmitStatus('loading');
    setSubmitMessage('Adding client to Google Sheets...');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.status === 401) {
        try {
          localStorage.setItem('draft_client_form', JSON.stringify(form));
        } catch (e) {
          console.error('Failed to save draft form:', e);
        }
        window.location.href = '/login?session_expired=true';
        return;
      }

      const data = await res.json();
      if (!res.ok || data.error || data.ok === false) {
        throw new Error(data.message || data.error || data.code || 'Failed to submit client');
      }

      setSubmitStatus('success');
      setSubmitMessage('Client registered successfully in the Google Sheet! Redirecting to pricing...');
      
      // Reset form and redirect after successful submission
      setTimeout(() => {
        const clientName = form.partyName;
        const cType = form.localOrOutstation as 'LOCAL' | 'OUTSTATION';
        setForm(EMPTY_FORM);
        setFieldErrors({});
        setCurrentStep(0);
        setSubmitStatus('idle');
        if (onSuccess) {
          onSuccess(clientName, cType);
        }
      }, 2000);
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitMessage(err.message || 'Failed to save client details. Please try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent premature submission from earlier steps (e.g. when pressing Enter in inputs)
    if (currentStep < STEPS.length - 1) {
      handleNext();
      return;
    }

    if (!validateStep(currentStep)) return;

    // Check FSSAI warnings or triggers
    if (!form.fssaiNumber || !/^\d{14}$/.test(form.fssaiNumber)) {
      setShowFssaiWarning(true);
      return;
    }

    doSubmit();
  };

  // Field error display inline component
  const FieldError = ({ field }: { field: string }) => {
    const errorMsg = fieldErrors[field];
    if (!errorMsg) return null;
    return (
      <p className='mt-1 text-xs text-destructive font-medium flex items-center gap-1 animate-in fade-in duration-200'>
        <span>⚠</span> {errorMsg}
      </p>
    );
  };

  return (
    <div className='max-w-4xl mx-auto space-y-8'>
      {restoreMessage && (
        <div className='p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300'>
          <div className='flex items-center gap-2 font-medium'>
            <span>✨ {restoreMessage}</span>
          </div>
          <button 
            type='button'
            onClick={() => setRestoreMessage('')} 
            className='text-xs font-semibold hover:underline bg-transparent border-none cursor-pointer text-emerald-600 dark:text-emerald-400'
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Stepper Component ────────────────────────────────────────────────── */}
      <div className='card py-5 px-6'>
        <div className='flex items-start justify-between relative'>
          {/* Progress bar line background */}
          <div className='absolute top-[18px] left-[18px] right-[18px] h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0' />
          {/* Active progress bar line fill */}
          <div 
            className='absolute top-[18px] left-[18px] h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300' 
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div key={step.id} className='flex flex-col items-center z-10 relative'>
                <div
                  className={`
                    size-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300
                    ${isCompleted ? 'bg-primary text-white scale-105' : ''}
                    ${isActive ? 'bg-white dark:bg-slate-900 border-2 border-primary text-primary scale-110' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400' : ''}
                  `}
                >
                  {/* Keep original icon always (no checkmark replaces it) */}
                  {step.icon}
                </div>
                <span
                  className={`
                    text-xs font-semibold mt-2 hidden sm:inline tracking-tight
                    ${isActive ? 'text-primary' : 'text-slate-500'}
                    ${isCompleted ? 'text-slate-700' : ''}
                  `}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* ── Step 0: Basic Details ─────────────────────────────────────────── */}
        {currentStep === 0 && (
          <div className='card space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
            <div className='flex items-center gap-3 border-b border-border pb-4'>
              <span className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm'>
                📋
              </span>
              <h2 className='heading-md'>Basic Client Information</h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='form-group'>
                <label className='label'>Client Category *</label>
                <SearchableSelect
                  value={form.clientCategory}
                  options={CLIENT_CATEGORIES}
                  placeholder='Search category...'
                  emptyLabel='Select client category'
                  label='Client Category'
                  onChange={(val) => {
                    setForm((p) => ({ ...p, clientCategory: val }));
                    clearError('clientCategory');
                  }}
                />
                <FieldError field='clientCategory' />
              </div>

              <div className='form-group'>
                <label className='label'>Party Name *</label>
                <input
                  name='partyName'
                  placeholder='Enter party name / organization'
                  className={`input ${fieldErrors.partyName ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                  value={form.partyName}
                  onChange={handleChange}
                />
                <FieldError field='partyName' />
              </div>

              <div className='form-group'>
                <label className='label'>Sales POC *</label>
                <SearchableSelect
                  value={form.salesPoc}
                  options={SALES_POCS}
                  placeholder='Search Sales POC...'
                  emptyLabel='Select Sales POC'
                  label='Sales POC'
                  onChange={(val) => {
                    setForm((p) => ({ ...p, salesPoc: val }));
                    clearError('salesPoc');
                  }}
                />
                <FieldError field='salesPoc' />
              </div>

              {/* MSME Checker */}
              <div className='form-group'>
                <label className='label'>Does the Client have MSME registration?</label>
                <div className='flex items-center gap-6 mt-2'>
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='hasMsme'
                        value={opt}
                        checked={form.hasMsme === opt}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            hasMsme: e.target.value,
                            msmeNumber: e.target.value === 'No' ? '' : prev.msmeNumber
                          }))
                        }
                        className='w-4 h-4 accent-primary cursor-pointer'
                      />
                      <span className='text-sm font-medium text-foreground'>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.hasMsme === 'Yes' && (
                <div className='form-group md:col-span-2 animate-in fade-in slide-in-from-top-1 duration-200'>
                  <label className='label'>MSME Number *</label>
                  <input
                    name='msmeNumber'
                    placeholder='Enter MSME Registration number'
                    className={`input ${fieldErrors.msmeNumber ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                    value={form.msmeNumber}
                    onChange={handleChange}
                  />
                  <FieldError field='msmeNumber' />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 1: Contact Information ──────────────────────────────────── */}
        {currentStep === 1 && (
          <div className='card space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
            <div className='flex items-center gap-3 border-b border-border pb-4'>
              <span className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm'>
                📞
              </span>
              <h2 className='heading-md'>Contact Information</h2>
            </div>

            <div className='space-y-6'>
              {/* Purchase Contact */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground/80'>1. Contact Person (Purchase) *</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='form-group'>
                    <label className='label'>Full Name *</label>
                    <input
                      name='contactPersonPurchase'
                      placeholder='Enter Purchase contact name'
                      className={`input ${fieldErrors.contactPersonPurchase ? 'border-destructive' : ''}`}
                      value={form.contactPersonPurchase}
                      onChange={handleChange}
                    />
                    <FieldError field='contactPersonPurchase' />
                  </div>
                  <div className='form-group'>
                    <label className='label'>Mobile Number *</label>
                    <input
                      name='contactNumberPurchase'
                      maxLength={15}
                      placeholder='Mobile/Telephone number'
                      className={`input ${fieldErrors.contactNumberPurchase ? 'border-destructive' : ''}`}
                      value={form.contactNumberPurchase}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setForm((prev) => ({ ...prev, contactNumberPurchase: val }));
                        clearError('contactNumberPurchase');
                      }}
                      onBlur={() => validatePhone('contactNumberPurchase', form.contactNumberPurchase)}
                    />
                    <FieldError field='contactNumberPurchase' />
                  </div>
                  <div className='form-group'>
                    <label className='label'>Email ID</label>
                    <input
                      name='emailIdPurchase'
                      placeholder='purchase@company.com'
                      className={`input ${fieldErrors.emailIdPurchase ? 'border-destructive' : ''}`}
                      value={form.emailIdPurchase}
                      onChange={handleChange}
                      onBlur={() => validateEmail('emailIdPurchase', form.emailIdPurchase, false)}
                    />
                    <FieldError field='emailIdPurchase' />
                  </div>
                </div>
              </div>

              <hr className='border-border/60' />

              {/* Accounts Contact */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground/80'>2. Contact Person (Accounts) *</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='form-group'>
                    <label className='label'>Full Name *</label>
                    <input
                      name='contactPersonAccounts'
                      placeholder='Enter Accounts contact name'
                      className={`input ${fieldErrors.contactPersonAccounts ? 'border-destructive' : ''}`}
                      value={form.contactPersonAccounts}
                      onChange={handleChange}
                    />
                    <FieldError field='contactPersonAccounts' />
                  </div>
                  <div className='form-group'>
                    <label className='label'>Mobile Number *</label>
                    <input
                      name='mobileNumberAccounts'
                      maxLength={15}
                      placeholder='Mobile/Telephone number'
                      className={`input ${fieldErrors.mobileNumberAccounts ? 'border-destructive' : ''}`}
                      value={form.mobileNumberAccounts}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setForm((prev) => ({ ...prev, mobileNumberAccounts: val }));
                        clearError('mobileNumberAccounts');
                      }}
                      onBlur={() => validatePhone('mobileNumberAccounts', form.mobileNumberAccounts)}
                    />
                    <FieldError field='mobileNumberAccounts' />
                  </div>
                  <div className='form-group'>
                    <label className='label'>Email ID</label>
                    <input
                      name='emailIdAccounts'
                      placeholder='accounts@company.com'
                      className={`input ${fieldErrors.emailIdAccounts ? 'border-destructive' : ''}`}
                      value={form.emailIdAccounts}
                      onChange={handleChange}
                      onBlur={() => validateEmail('emailIdAccounts', form.emailIdAccounts, false)}
                    />
                    <FieldError field='emailIdAccounts' />
                  </div>
                </div>
              </div>

              <hr className='border-border/60' />

              {/* Contact 3 */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground/80'>3. Contact Person 3</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='form-group'>
                    <label className='label'>Full Name</label>
                    <input
                      name='contactPerson3'
                      placeholder='Secondary contact name'
                      className='input'
                      value={form.contactPerson3}
                      onChange={handleChange}
                    />
                  </div>
                  <div className='form-group'>
                    <label className='label'>Mobile Number</label>
                    <input
                      name='contactNumber3'
                      maxLength={15}
                      placeholder='Mobile/Telephone number'
                      className={`input ${fieldErrors.contactNumber3 ? 'border-destructive' : ''}`}
                      value={form.contactNumber3}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setForm((prev) => ({ ...prev, contactNumber3: val }));
                        clearError('contactNumber3');
                      }}
                      onBlur={() => validatePhone('contactNumber3', form.contactNumber3, false)}
                    />
                    <FieldError field='contactNumber3' />
                  </div>
                  <div className='form-group'>
                    <label className='label'>Email ID</label>
                    <input
                      name='emailId3'
                      placeholder='other@company.com'
                      className={`input ${fieldErrors.emailId3 ? 'border-destructive' : ''}`}
                      value={form.emailId3}
                      onChange={handleChange}
                      onBlur={() => validateEmail('emailId3', form.emailId3, false)}
                    />
                    <FieldError field='emailId3' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Address & Logistics ──────────────────────────────────── */}
        {currentStep === 2 && (
          <div className='card space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
            <div className='flex items-center gap-3 border-b border-border pb-4'>
              <span className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm'>
                📍
              </span>
              <h2 className='heading-md'>Location, Address & Logistics</h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='form-group'>
                <label className='label'>Area *</label>
                <SearchableSelect
                  value={form.area}
                  onChange={(val) => {
                    setForm((p) => {
                      const isNew = val && !originalAreas.includes(val);
                      return {
                        ...p,
                        area: val,
                        city: isNew ? p.city : ''
                      };
                    });
                    clearError('area');
                    clearError('city');
                    if (val && !areasList.includes(val)) {
                      setAreasList((prev) => Array.from(new Set([...prev, val])).sort());
                    }
                  }}
                  options={areasList}
                  placeholder='Search area...'
                  emptyLabel='Select Area'
                  label='Area'
                  allowCustom={true}
                />
                <FieldError field='area' />
              </div>

              {form.area && !originalAreas.includes(form.area) ? (
                <div className='form-group animate-in fade-in slide-in-from-top-2 duration-200'>
                  <label className='label font-semibold text-primary'>City for New Area *</label>
                  <SearchableSelect
                    value={form.city}
                    onChange={(val) => {
                      setForm((p) => ({ ...p, city: val }));
                      clearError('city');
                      if (val && !citiesList.includes(val)) {
                        setCitiesList((prev) => Array.from(new Set([...prev, val])).sort());
                      }
                    }}
                    options={citiesList}
                    placeholder='Select or type new city...'
                    emptyLabel='Select City'
                    label='City'
                    allowCustom={true}
                  />
                  <FieldError field='city' />
                </div>
              ) : (
                <div className='hidden md:block' />
              )}

              <div className='form-group'>
                <label className='label'>Customer Type *</label>
                <SearchableSelect
                  value={form.customerType}
                  options={['HORECA', 'RETAIL', 'Others']}
                  placeholder='Search type...'
                  emptyLabel='Select Customer Type'
                  label='Customer Type'
                  onChange={(val) => {
                    setForm((p) => ({ ...p, customerType: val }));
                    clearError('customerType');
                  }}
                />
                <FieldError field='customerType' />
              </div>

              <div className='form-group'>
                <label className='label'>Class *</label>
                <SearchableSelect
                  value={form.class}
                  options={CLASSES}
                  placeholder='Search class...'
                  emptyLabel='Select Class'
                  label='Class'
                  onChange={(val) => {
                    setForm((p) => ({ ...p, class: val }));
                    clearError('class');
                  }}
                />
                <FieldError field='class' />
              </div>

              <div className='form-group'>
                <label className='label'>Client Type (Local / Outstation) *</label>
                <SearchableSelect
                  value={form.localOrOutstation}
                  options={['LOCAL', 'OUTSTATION']}
                  placeholder='Select type...'
                  emptyLabel='Select Local/Outstation'
                  label='Local/Outstation'
                  onChange={(val) => {
                    setForm((p) => ({ ...p, localOrOutstation: val }));
                    clearError('localOrOutstation');
                  }}
                />
                <FieldError field='localOrOutstation' />
              </div>

              {/* GSTIN field is always visible, mandatory only for PB Class */}
              <div className='form-group'>
                <label className='label font-semibold text-primary'>GST Number {form.class === 'PB' ? '*' : ''}</label>
                <input
                  name='gstNo'
                  maxLength={15}
                  placeholder='Enter 15-digit GSTIN (e.g. 22AAAAA0000A1Z5)'
                  className={`input border-primary/40 ${fieldErrors.gstNo ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                  value={form.gstNo}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setForm((p) => ({ ...p, gstNo: clean }));
                    clearError('gstNo');
                  }}
                  onBlur={() => validateGst(form.gstNo)}
                />
                <FieldError field='gstNo' />
              </div>

              <div className='form-group md:col-span-2'>
                <label className='label'>Billing Address *</label>
                <textarea
                  name='billingAddress'
                  rows={3}
                  placeholder='Full billing/registered address...'
                  className={`input min-h-[92px] py-3 ${fieldErrors.billingAddress ? 'border-destructive' : ''}`}
                  value={form.billingAddress}
                  onChange={handleChange}
                />
                <FieldError field='billingAddress' />
              </div>

              {/* Shipping address auto copy switch */}
              <div className='form-group md:col-span-2'>
                <label className='flex items-center gap-2 cursor-pointer select-none'>
                  <input
                    type='checkbox'
                    name='shippingAddressSame'
                    checked={form.shippingAddressSame}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        shippingAddressSame: e.target.checked,
                        shippingAddress: e.target.checked ? prev.billingAddress : ''
                      }));
                      clearError('shippingAddress');
                    }}
                    className='w-4 h-4 accent-primary rounded cursor-pointer'
                  />
                  <span className='text-sm font-semibold text-foreground/90'>Shipping Address is same as Billing Address</span>
                </label>
              </div>

              <div className='form-group md:col-span-2'>
                <label className={`label ${form.shippingAddressSame ? 'opacity-40' : ''}`}>Shipping Address *</label>
                <textarea
                  name='shippingAddress'
                  rows={3}
                  placeholder='Full shipping/delivery address...'
                  disabled={form.shippingAddressSame}
                  className={`input min-h-[92px] py-3 ${form.shippingAddressSame ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''} ${fieldErrors.shippingAddress ? 'border-destructive' : ''}`}
                  value={form.shippingAddress}
                  onChange={handleChange}
                />
                <FieldError field='shippingAddress' />
              </div>

              <div className='form-group'>
                <label className='label'>PIN Code *</label>
                <input
                  name='pinCode'
                  maxLength={6}
                  placeholder='Enter 6-digit PIN code'
                  className={`input ${fieldErrors.pinCode ? 'border-destructive' : ''}`}
                  value={form.pinCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setForm((p) => ({ ...p, pinCode: clean }));
                    clearError('pinCode');
                  }}
                  onBlur={() => validatePinCode(form.pinCode)}
                />
                <FieldError field='pinCode' />
              </div>

              <div className='form-group'>
                <label className='label'>Google Location Link</label>
                <input
                  name='googleLocationLinks'
                  placeholder='https://maps.google.com/...'
                  className={`input ${fieldErrors.googleLocationLinks ? 'border-destructive' : ''}`}
                  value={form.googleLocationLinks}
                  onChange={handleChange}
                  onBlur={() => validateUrl('googleLocationLinks', form.googleLocationLinks)}
                />
                <FieldError field='googleLocationLinks' />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Financial & Operations ───────────────────────────────── */}
        {currentStep === 3 && (
          <div className='card space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'>
            <div className='flex items-center gap-3 border-b border-border pb-4'>
              <span className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm'>
                💳
              </span>
              <h2 className='heading-md'>Financials & Credits</h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='form-group'>
                <label className='label'>PAN Number</label>
                <input
                  name='panNumber'
                  maxLength={10}
                  placeholder='ABCDE1234F'
                  className={`input ${fieldErrors.panNumber ? 'border-destructive' : ''}`}
                  value={form.panNumber}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setForm((p) => ({ ...p, panNumber: clean }));
                    clearError('panNumber');
                  }}
                  onBlur={() => validatePan(form.panNumber)}
                />
                <FieldError field='panNumber' />
              </div>

              <div className='form-group'>
                <label className='label'>Credit Type *</label>
                <SearchableSelect
                  value={form.creditType}
                  options={CREDIT_TYPES}
                  placeholder='Search credit type...'
                  emptyLabel='Select Credit Type'
                  label='Credit Type'
                  onChange={(val) => {
                    setForm((p) => ({
                      ...p,
                      creditType: val,
                      secondaryUpperLimitInDays: val === 'CREDIT' ? p.secondaryUpperLimitInDays : ''
                    }));
                    clearError('creditType');
                    clearError('secondaryUpperLimitInDays');
                  }}
                />
                <FieldError field='creditType' />
              </div>

              <div className='form-group'>
                <label className='label'>CRM POC *</label>
                <SearchableSelect
                  value={form.crmPoc}
                  options={CRM_POCS}
                  placeholder='Search CRM POC...'
                  emptyLabel='Select CRM POC'
                  label='CRM POC'
                  onChange={(val) => {
                    setForm((p) => ({ ...p, crmPoc: val }));
                    clearError('crmPoc');
                  }}
                />
                <FieldError field='crmPoc' />
              </div>

              {/* Show Secondary Upper Limit in Days only if Credit Type is CREDIT */}
              {form.creditType === 'CREDIT' && (
                <div className='form-group md:col-span-2 animate-in fade-in slide-in-from-top-1 duration-200'>
                  <label className='label font-semibold text-primary'>Secondary Upper Limit (In Days) *</label>
                  <input
                    type='number'
                    name='secondaryUpperLimitInDays'
                    min='0'
                    placeholder='Enter credit limit terms in days'
                    className={`input border-primary/40 ${fieldErrors.secondaryUpperLimitInDays ? 'border-destructive' : ''}`}
                    value={form.secondaryUpperLimitInDays}
                    onChange={(e) => {
                      const clean = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value));
                      setForm((p) => ({ ...p, secondaryUpperLimitInDays: String(clean) }));
                      clearError('secondaryUpperLimitInDays');
                    }}
                  />
                  <FieldError field='secondaryUpperLimitInDays' />
                </div>
              )}

              <div className='form-group'>
                <label className='label'>FSSAI Number *</label>
                <input
                  name='fssaiNumber'
                  maxLength={14}
                  placeholder='Enter 14-digit FSSAI licence number'
                  className={`input ${fieldErrors.fssaiNumber ? 'border-destructive' : ''}`}
                  value={form.fssaiNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setForm((p) => ({ ...p, fssaiNumber: clean }));
                    clearError('fssaiNumber');
                  }}
                  onBlur={() => validateFssai(form.fssaiNumber)}
                />
                <FieldError field='fssaiNumber' />
              </div>

              <div className='form-group'>
                <label className='label'>Freight to be Added? *</label>
                <SearchableSelect
                  value={form.freightToBeAdded}
                  options={['Yes', 'No']}
                  placeholder='Search freight setting...'
                  emptyLabel='Select Freight setting'
                  label='Freight'
                  onChange={(val) => {
                    setForm((p) => ({ ...p, freightToBeAdded: val }));
                    clearError('freightToBeAdded');
                  }}
                />
                <FieldError field='freightToBeAdded' />
              </div>
            </div>
          </div>
        )}

        {/* ── Form Actions ───────────────────────────────────────────────────── */}
        <div className='flex items-center justify-between gap-4 mt-6'>
          <button
            type='button'
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`btn-secondary h-12 px-6 rounded-lg font-medium transition ${
              currentStep === 0 ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''
            }`}
          >
            ← Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              key='btn-continue'
              type='button'
              onClick={handleNext}
              className='btn-primary h-12 px-8 rounded-lg font-semibold transition'
            >
              Continue →
            </button>
          ) : (
            <button
              key='btn-submit'
              type='submit'
              className='btn-primary bg-primary hover:bg-primary/90 h-12 px-10 rounded-lg font-semibold transition'
            >
              Submit Client Details
            </button>
          )}
        </div>
      </form>

      {/* ── Submitting status feedback modal ────────────────────────────────── */}
      <SubmittingModal
        show={submitStatus !== 'idle'}
        status={
          submitStatus === 'loading'
            ? 'loading'
            : submitStatus === 'success'
              ? 'success'
              : 'error'
        }
        title="Client Added Successfully"
        loadingTitle="Registering Client..."
        messages={[
          'Validating details…',
          'Adding client to Google Sheets...',
          'Updating client database...',
          'Finalizing…'
        ]}
        message={submitMessage}
        onClose={() => setSubmitStatus('idle')}
      />

      {/* ── FSSAI Warning Modal ────────────────────────────────────────────── */}
      <ConfirmModal
        show={showFssaiWarning}
        variant='warning'
        title='FSSAI Details Incomplete'
        description='Your FSSAI Licence number seems empty or incomplete. FSSAI is generally compulsory for client registration. Do you want to submit anyway?'
        confirmLabel='Yes, Submit Anyway'
        cancelLabel='Go Back'
        onClose={() => setShowFssaiWarning(false)}
        onConfirm={() => {
          setShowFssaiWarning(false);
          doSubmit();
        }}
      />
    </div>
  );
}
