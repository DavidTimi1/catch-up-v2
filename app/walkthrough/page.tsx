"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadFilesToCloudinary } from "@/lib/uploadClient";
import { saveFileToCache } from "@/lib/localCache";
import { AlertModal } from "@/components/AlertModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, Loader2, BookOpen, X, Calculator, Circle, Square, Infinity as InfinityIcon, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useModal } from "@/components/providers/modal-provider";

export default function Home() {
  const router = useRouter();
  const { showModal } = useModal();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Manage object URLs cleanly
  const previewUrls = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    // Cleanup URLs when unmounted or files change
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    // Check 10MB total limit
    const totalSize = [...files, ...newFiles].reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      showModal(<AlertModal title="Upload Limit Exceeded" message="The total size of your files cannot exceed 10MB." />, "Error");
      e.target.value = "";
      return;
    }
    
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeImage = (idxToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const previewImage = (file: File, url: string) => {
    showModal(
      file.type === "application/pdf" ? (
        <iframe src={url} className="w-full h-[80vh] rounded-md border-0" />
      ) : (
        <img src={url} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-md" />
      ),
      "File Preview"
    );
  };

  const handleStartLesson = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    try {
      // 1. Upload to Cloudinary Client-Side
      const uploadedFiles = await uploadFilesToCloudinary(files);

      // 2. Cache original files locally using returned publicIds
      await Promise.all(
        uploadedFiles.map((upFile, idx) => saveFileToCache(upFile.publicId, files[idx]))
      );

      // 3. Send URLs to Backend
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, uploadedFiles }),
      });
      const data = await res.json();
      
      if (data.success && data.lessonId) {
        router.push(`/lesson/${data.lessonId}`);
      } else {
        showModal(<AlertModal title="Failed to Create" message={data.error || "Unknown error"} />, "Error");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showModal(<AlertModal title="Error" message={err instanceof Error ? err.message : "An error occurred during upload."} />, "Error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Mathematical / Geometric Background Motifs */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden flex items-center justify-center">
        <Calculator className="absolute top-10 left-10 w-48 h-48 rotate-12" strokeWidth={1} />
        <Circle className="absolute bottom-20 right-10 w-64 h-64 -rotate-45" strokeWidth={0.5} />
        <Square className="absolute top-1/4 right-1/4 w-32 h-32 rotate-45" strokeWidth={0.5} />
        <InfinityIcon className="absolute bottom-1/4 left-1/4 w-56 h-56 -rotate-12" strokeWidth={0.5} />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl z-10"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2 text-stone-800">
            <BookOpen size={48} strokeWidth={1.5} />
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-stone-800 tracking-tight">Math Pace</h1>
          </div>
          <p className="text-stone-500 font-sans text-lg italic">Break down your calculations, step by step.</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-stone-200/60 shadow-xl rounded-2xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-stone-800 mb-2">New Note Walkthrough</h2>
            <p className="text-stone-500 text-sm">Upload pictures of your notes or calculations. AI will process them into an interactive lesson.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Lesson Title</label>
              <Input 
                placeholder="e.g., Intro to Calculus - Week 3" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white border-stone-300 text-stone-800 placeholder:text-stone-400 focus-visible:ring-stone-400 rounded-lg shadow-sm h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Upload Notes</label>
              <div className="border-2 border-dashed border-stone-300 bg-stone-50/50 rounded-xl p-8 text-center hover:bg-stone-100 transition-colors cursor-pointer relative overflow-hidden group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,application/pdf"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="relative z-10 pointer-events-none">
                  <UploadCloud className="mx-auto text-stone-400 mb-3 group-hover:text-stone-600 transition-colors" size={32} />
                  <p className="text-sm font-medium text-stone-600">
                    Click or drag images or PDFs here
                  </p>
                </div>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {files.map((file, idx) => (
                    <div 
                      key={idx} 
                      className="relative h-20 w-20 rounded-lg border border-stone-200 shadow-sm group cursor-pointer bg-white flex items-center justify-center overflow-hidden"
                      onClick={() => previewImage(file, previewUrls[idx])}
                    >
                      {file.type === "application/pdf" ? (
                        <FileText className="text-stone-400" size={32} />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={previewUrls[idx]} alt="preview" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                      <button
                        onClick={(e) => removeImage(idx, e)}
                        className="absolute -top-2 -right-2 bg-white border border-stone-200 text-stone-500 rounded-full p-1 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors opacity-0 group-hover:opacity-100 z-30"
                        title="Remove file"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-stone-800 hover:bg-stone-900 text-white h-12 text-lg font-bold rounded-xl shadow-md mt-4 transition-all active:scale-[0.98]"
              onClick={handleStartLesson}
              disabled={loading || files.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Notes...
                </>
              ) : (
                "Start Lesson"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
