"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Book, Trash2, ArrowLeft, Loader2, Library, Clock, Sparkles } from "@/components/icons";
import { motion } from "framer-motion";
import { createNotebook, addPage, deleteNotebook } from "@/lib/db/localReaderDb";
import { useNotebooks } from "@/lib/hooks/useReaderData";
import { useModal } from "@/components/providers/modal-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function ReaderGallery() {
  const router = useRouter();
  const { showModal } = useModal();
  const { toast } = useToast();
  const { data: notebooks, isLoading: loading, refetch: fetchNotebooks } = useNotebooks();

  const [activeTab, setActiveTab] = useState<'library' | 'recent' | 'new'>('library');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    showModal(
      <ConfirmModal
        title="Delete Notebook"
        message="Are you sure you want to delete this notebook? This action cannot be undone."
        confirmText="Delete"
        onConfirm={async () => {
          await deleteNotebook(id);
          toast("Notebook deleted", "success");
          fetchNotebooks();
        }}
      />,
      "Confirm Deletion"
    );
  };

  const handleOpenFiles = async () => {
    if (isProcessing) return;

    // Attempt File System Access API
    if ('showOpenFilePicker' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handles = await (window as any).showOpenFilePicker({
          multiple: true,
          types: [{
            description: 'Documents & Images',
            accept: {
              'application/pdf': ['.pdf'],
              'image/*': ['.png', '.jpg', '.jpeg', '.webp']
            }
          }]
        });

        setIsProcessing(true);
        const files: File[] = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          files.push(file);
        }
        await processAndCreateNotebook(files);
      } catch (err) {
        // User aborted or error
        setIsProcessing(false);
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error(err);
          // Fallback
          fileFallbackRef.current?.click();
        } else if (!(err instanceof Error)) {
          fileFallbackRef.current?.click();
        }
      }
    } else {
      // Fallback to standard input
      fileFallbackRef.current?.click();
    }
  };

  const handleFallbackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessing(true);
    const files = Array.from(e.target.files);
    await processAndCreateNotebook(files);
    // Reset input
    if (fileFallbackRef.current) fileFallbackRef.current.value = "";
  };

  const processAndCreateNotebook = async (files: File[]) => {
    try {
      toast(`Importing ${files.length} file(s)...`, "info");

      // Auto-generate title
      let title = "New Notebook";
      if (files.length === 1) {
        title = files[0].name.replace(/\.[^/.]+$/, ""); // strip extension
      } else {
        const date = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        title = `Session - ${date}`;
      }

      const notebookId = await createNotebook(title);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await addPage(notebookId, file, file.type, i);
      }

      toast("Notebook created successfully!", "success");
      router.push(`/reader/${notebookId}`);
    } catch (err) {
      console.error(err);
      toast("Failed to import files", "error");
      setIsProcessing(false);
    }
  };

  // Sorting logic based on tabs
  const sortedNotebooks = useMemo(() => {
    const list = [...notebooks];
    if (activeTab === 'recent') {
      return list.sort((a, b) => (b.lastOpenedAt || b.createdAt) - (a.lastOpenedAt || a.createdAt));
    }
    if (activeTab === 'new') {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    // library (default alphabetical or created)
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [notebooks, activeTab]);

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        ref={fileFallbackRef}
        onChange={handleFallbackFileSelect}
        className="hidden"
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-r border-stone-200 dark:border-stone-800 z-10 shrink-0 shadow-2xl">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors mb-6">
            <ArrowLeft size={20} /> Back to Home
          </Link>
          <h1 className="text-3xl font-heading font-bold text-stone-900 dark:text-white tracking-tight">Library</h1>
          <p className="text-stone-500 text-sm mt-1">Catchup Reader</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'library' ? 'bg-emerald-600 text-white font-medium shadow-md' : 'hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}
          >
            <Library size={20} /> All Documents
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'recent' ? 'bg-emerald-600 text-white font-medium shadow-md' : 'hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}
          >
            <Clock size={20} /> Read Recently
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'new' ? 'bg-emerald-600 text-white font-medium shadow-md' : 'hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}
          >
            <Sparkles size={20} /> Newly Added
          </button>
        </nav>

        <div className="p-4">
          <PWAInstallPrompt />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-stone-900 text-stone-900 dark:text-white shrink-0 shadow-md border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-heading font-bold">Library</h1>
          </div>
          <Button
            onClick={handleOpenFiles}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 px-4 text-sm"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} className="mr-1" /> Add</>}
          </Button>
        </header>

        {/* Mobile PWA Install */}
        <div className="md:hidden p-4 pb-0 shrink-0">
          <PWAInstallPrompt />
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex justify-end p-8 pb-0 shrink-0">
          <Button
            onClick={handleOpenFiles}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
          >
            {isProcessing ? <><Loader2 size={20} className="animate-spin" /> Importing...</> : <><Plus size={20} /> Open Files</>}
          </Button>
        </div>

        <div className="p-4 md:p-8 flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-24 md:pb-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 md:p-5 h-[180px] md:h-[220px] flex flex-col">
                  <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-xl mb-4 mx-auto md:mx-0" />
                  <Skeleton className="h-5 w-3/4 mb-2 mx-auto md:mx-0" />
                  <Skeleton className="h-4 w-1/2 mx-auto md:mx-0" />
                  <Skeleton className="h-3 w-1/3 mt-auto mx-auto md:mx-0" />
                </div>
              ))}
            </div>
          ) : sortedNotebooks.length === 0 ? (
            <div className="text-center bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 rounded-3xl p-10 md:p-16 shadow-sm max-w-xl mx-auto mt-10">
              <div className="bg-stone-50 dark:bg-stone-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Book size={40} className="text-stone-300 dark:text-stone-600" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-3">Your Library is Empty</h2>
              <p className="text-stone-500 dark:text-stone-400 mb-8">
                Start by opening a PDF or image file. It will be securely stored offline on this device.
              </p>
              <Button onClick={handleOpenFiles} disabled={isProcessing} className="bg-stone-800 dark:bg-stone-100 hover:bg-stone-900 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-lg px-8">
                {isProcessing ? "Processing..." : "Select Files"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pb-24 md:pb-0">
              {sortedNotebooks.map((nb, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={nb.id}
                  className="h-full"
                >
                  <Link href={`/reader/${nb.id}`} className="group block h-full">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-xl hover:border-emerald-200/50 dark:hover:border-emerald-500/30 rounded-2xl p-4 md:p-5 transition-all h-full relative flex flex-col">
                      <div className="bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                        <Book size={24} className="md:w-8 md:h-8" />
                      </div>
                      <h3 className="text-[15px] md:text-lg font-bold text-stone-800 dark:text-stone-100 mb-1 leading-tight line-clamp-2 text-center md:text-left" title={nb.title}>{nb.title}</h3>
                      <p className="text-stone-400 dark:text-stone-500 text-xs md:text-sm mt-auto text-center md:text-left">
                        {new Date(activeTab === 'recent' ? (nb.lastOpenedAt || nb.createdAt) : nb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>

                      <button
                        onClick={(e) => handleDelete(e, nb.id)}
                        className="absolute -top-2 -right-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 rounded-full p-2 shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-around pb-safe">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${activeTab === 'library' ? 'text-emerald-600' : 'text-stone-400 dark:text-stone-500'}`}
        >
          <Library size={20} />
          <span className="text-[10px] font-medium">Library</span>
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${activeTab === 'recent' ? 'text-emerald-600' : 'text-stone-400 dark:text-stone-500'}`}
        >
          <Clock size={20} />
          <span className="text-[10px] font-medium">Recent</span>
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${activeTab === 'new' ? 'text-emerald-600' : 'text-stone-400 dark:text-stone-500'}`}
        >
          <Sparkles size={20} />
          <span className="text-[10px] font-medium">New</span>
        </button>
      </nav>
    </div>
  );
}
