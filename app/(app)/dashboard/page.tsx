// app/(app)/dashboard/page.tsx
import ClientForm from '@/components/client-form/ClientForm';

export default function DashboardPage() {
  return (
    <>
      <div className='mb-8'>
        <h1 className='heading-lg mb-2'>Client Master Form</h1>
        <p className='text-muted-foreground'>
          Fill in the details below to add a new client to the master database.
        </p>
      </div>

      <ClientForm />
    </>
  );
}

