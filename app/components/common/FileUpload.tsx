// app/components/common/FileUpload.tsx
import { compressImage } from '@/lib/fileUtils';
import {
  UploadCloudIcon,
  XIcon,
  FileImageIcon,
  CheckCircleIcon
} from 'lucide-react';
import { useRef, useState } from 'react';

interface FileUploadProps {
  value: string | null; // URL after upload
  onChange: (url: string | null) => void;
  accept?: string;
  fileType: 'gst' | 'fssai_license';
}

function FileUpload({
  value,
  onChange,
  fileType,
  accept = 'image/*'
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processAndUpload = async (file: File) => {
    try {
      setUploading(true);
      setFileName(file.name);

      // Show instant local preview while uploading
      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(previewUrl);

      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file, 1024, 0.6);
      }

      const arrayBuffer = await processedFile.arrayBuffer();
      const byteArray = Array.from(new Uint8Array(arrayBuffer));

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          byteArray,
          fileName: processedFile.name,
          fileType
        })
      });

      const data = await res.json();

      if (data?.fileURL || data?.fileData?.fileURL) {
        const url = data.fileURL || data.fileData.fileURL;
        onChange(url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setLocalPreview(null);
      setFileName(null);
      onChange(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    await processAndUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setFileName(null);
    onChange(null);
  };

  const isUploaded = !!value;
  const previewSrc = localPreview || value;

  return (
    <div
      onClick={() => !isUploaded && !uploading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!uploading && !isUploaded) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative w-full rounded-lg border overflow-hidden
        transition-all duration-200
        ${
          isUploaded
            ? 'border-primary/30 border-solid cursor-default'
            : uploading
              ? 'border-primary/20 border-dashed cursor-wait'
              : isDragging
                ? 'border-primary border-dashed scale-[1.01] bg-primary/5'
                : 'border-primary/30 border-dashed hover:border-primary hover:border-solid hover:bg-primary/[0.03] cursor-pointer bg-input'
        }
      `}
    >
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        className='hidden'
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
      />

      {/* ── Uploading State ── shimmer + preview */}
      {uploading && (
        <div className='flex items-center gap-3 px-4 py-3'>
          {/* Blurred preview thumbnail while uploading */}
          <div className='relative h-12 w-12 rounded-md overflow-hidden shrink-0 bg-muted'>
            {localPreview && (
              <img
                src={localPreview}
                alt='preview'
                className='h-full w-full object-cover blur-[1px] scale-105 opacity-70'
              />
            )}
            {/* Spinner overlay */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <svg
                className='h-5 w-5 animate-spin text-primary'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='3'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                />
              </svg>
            </div>
          </div>

          <div className='flex-1 min-w-0 space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-sm text-muted-foreground truncate max-w-[160px]'>
                {fileName || 'Uploading...'}
              </p>
              <span className='text-xs text-primary font-medium animate-pulse'>
                Uploading
              </span>
            </div>
            {/* Shimmer progress bar */}
            <div className='h-1.5 w-full rounded-full bg-muted overflow-hidden'>
              <div className='h-full bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]' />
            </div>
          </div>
        </div>
      )}

      {/* ── Uploaded State ── thumbnail + filename */}
      {!uploading && isUploaded && (
        <div className='flex items-center gap-3 px-4 py-3 bg-primary/[0.03]'>
          {/* Image thumbnail */}
          <div className='relative h-12 w-12 rounded-md overflow-hidden shrink-0 border border-primary/20 bg-muted'>
            {previewSrc ? (
              <img
                src={previewSrc}
                alt='uploaded'
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='h-full w-full flex items-center justify-center'>
                <FileImageIcon className='h-5 w-5 text-primary/60' />
              </div>
            )}
            {/* Small success badge */}
            <div className='absolute -bottom-1 -right-1 bg-white rounded-full'>
              <CheckCircleIcon className='h-4 w-4 text-emerald-500' />
            </div>
          </div>

          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-foreground'>
              Uploaded successfully
            </p>
            <p className='text-xs text-muted-foreground mt-0.5 truncate'>
              {fileName || 'Image ready'}
            </p>
          </div>

          <button
            type='button'
            onClick={handleClear}
            className='shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors'
          >
            <XIcon className='h-3.5 w-3.5' />
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {!uploading && !isUploaded && (
        <div className='flex items-center gap-3 px-4 py-3'>
          <div
            className={`
            flex items-center justify-center h-9 w-9 rounded-md shrink-0
            transition-colors duration-200
            ${isDragging ? 'bg-primary/15' : 'bg-muted'}
          `}
          >
            <UploadCloudIcon
              className={`h-4 w-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm text-muted-foreground'>
              <span className='font-medium text-primary'>Click to upload</span>{' '}
              or drag & drop
            </p>
            <p className='text-xs text-muted-foreground/70 mt-0.5'>
              PNG, JPG, WEBP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
