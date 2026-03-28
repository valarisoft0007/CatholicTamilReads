"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadImageViaApi } from "@/lib/firebase/storage";

interface ImageUploadProps {
  currentUrl?: string;
  storagePath: string;
  onUpload: (url: string) => void;
}

export function ImageUpload({ currentUrl, storagePath, onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageViaApi(file, storagePath);
      setPreview(url);
      onUpload(url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        className="relative flex h-48 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-border hover:border-gold transition-colors"
      >
        {preview ? (
          <Image
            src={preview}
            alt="Cover preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="text-center text-sm text-muted">
            <p>Click to</p>
            <p>upload cover</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
