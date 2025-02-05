"use client"

import { useState, useRef } from 'react'
import { Progress } from './progress'
import { cn } from '@/lib/utils'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
  accept?: string
  className?: string
}

export function FileUpload({ 
  onUpload, 
  isUploading = false, 
  accept,
  className 
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadProgress(0)
    try {
      await onUpload(file)
      setUploadProgress(100)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <label
        htmlFor="file-upload"
        className={cn(
          "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
          "hover:bg-secondary/50 transition-colors",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-2 text-gray-500" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept ? accept.replace('/*', ' files') : 'Any file type supported'}
          </p>
        </div>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          disabled={isUploading}
        />
      </label>

      {isUploading && (
        <div className="w-full">
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}
    </div>
  )
}
