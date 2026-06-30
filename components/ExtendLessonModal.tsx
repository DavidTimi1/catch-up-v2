"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, X, FileText } from "@/components/icons";
import { useModal } from "@/components/providers/modal-provider";
import { uploadFilesToCloudinary } from "@/lib/uploadClient";
import { saveFileToCache } from "@/lib/localCache";
import { AlertModal } from "@/components/AlertModal";

interface ExtendLessonModalProps {
  lessonId: string;
  onSuccess: () => void;
}

export function ExtendLessonModal({ lessonId, onSuccess }: ExtendLessonModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { showModal, hideModal } = useModal();

  const previewUrls = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    const totalSize = [...files, ...newFiles].reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      showModal(<AlertModal title="Upload Limit Exceeded" message="The total size of your files cannot exceed 10MB." />);
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeImage = (idxToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleExtend = async () => {
    if (files.length === 0) return;

    setLoading(true);
    try {
      const uploadedFiles = await uploadFilesToCloudinary(files);

      await Promise.all(
        uploadedFiles.map((upFile, idx) => saveFileToCache(upFile.publicId, files[idx]))
      );

      const res = await fetch(`/api/lessons/${lessonId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadedFiles }),
      });
      const data = await res.json();

      if (data.success) {
        onSuccess();
        hideModal();
      } else {
        showModal(<AlertModal title="Extension Failed" message={data.error || "Unknown error"} />);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showModal(<AlertModal title="Error" message={err instanceof Error ? err.message : "An error occurred during upload."} />);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <p className="text-stone-500 dark:text-stone-400 mb-6 text-sm">Upload more notes. AI will pick up where it left off.</p>

      <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950/50 rounded-xl p-8 text-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer relative overflow-hidden group">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleImageUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
        <div className="relative z-10 pointer-events-none">
          <UploadCloud className="mx-auto text-stone-400 mb-3 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" size={32} />
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Click or drag images or PDFs here
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 max-h-[200px] overflow-y-auto p-2 border border-stone-200 dark:border-stone-800 rounded-lg">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="relative h-20 w-20 rounded-lg border border-stone-200 dark:border-stone-700 shadow-sm group bg-white dark:bg-stone-900 flex items-center justify-center overflow-hidden"
            >
              {file.type === "application/pdf" ? (
                <FileText className="text-stone-400" size={32} />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrls[idx]} alt="preview" className="h-full w-full object-cover" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute -top-2 -right-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-300 rounded-full p-1 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors z-30"
                title="Remove file"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        className="w-full bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-stone-300 dark:text-stone-900 text-white h-12 text-lg font-bold rounded-xl shadow-md mt-6 transition-all"
        onClick={handleExtend}
        disabled={loading || files.length === 0}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing Notes...
          </>
        ) : (
          "Add to Lesson"
        )}
      </Button>
    </div>
  );
}
