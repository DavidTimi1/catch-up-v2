"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Book, Trash2, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getNotebooks, createNotebook, addPage, deleteNotebook, Notebook } from "@/lib/db/localReaderDb";
import { useModal } from "@/components/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function ReaderGallery() {
  const router = useRouter();
  const { showModal, hideModal } = useModal();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchNotebooks = async () => {
      try {
        const data = await getNotebooks();
        if (isMounted) setNotebooks(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchNotebooks();
    return () => { isMounted = false; };
  }, []);

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
          setLoading(true);
          const data = await getNotebooks();
          setNotebooks(data);
          setLoading(false);
        }}
      />, 
      "Confirm Deletion"
    );
  };

  const handleCreateNew = () => {
    showModal(
      <CreateNotebookModal 
        onSuccess={(id) => {
          hideModal();
          router.push(`/reader/${id}`);
        }} 
      />,
      "New Notebook"
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-12 relative overflow-hidden">
      {/* Background Motifs */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden flex items-center justify-center">
        <Sparkles className="absolute top-20 right-20 w-64 h-64 -rotate-12" strokeWidth={0.5} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow border border-stone-200 text-stone-500 hover:text-stone-800">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl font-heading font-bold text-stone-800">Interactive Reader</h1>
              <p className="text-stone-500 font-sans text-lg mt-1">Your offline notebook gallery.</p>
            </div>
          </div>
          <Button 
            onClick={handleCreateNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Plus size={20} />
            New Notebook
          </Button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Loading notebooks...</p>
          </div>
        ) : notebooks.length === 0 ? (
          <div className="text-center bg-white border border-stone-200/60 rounded-3xl p-16 shadow-sm">
            <div className="bg-stone-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Book size={40} className="text-stone-300" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-3">No Notebooks Yet</h2>
            <p className="text-stone-500 max-w-md mx-auto mb-8">
              Start by creating your first offline notebook. You can upload PDFs or images to read and interact with natively.
            </p>
            <Button onClick={handleCreateNew} className="bg-stone-800 hover:bg-stone-900 text-white rounded-lg px-8">
              Create First Notebook
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {notebooks.map((nb, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={nb.id}
              >
                <Link href={`/reader/${nb.id}`} className="group block h-full">
                  <div className="bg-white border border-stone-200/60 shadow-sm hover:shadow-lg rounded-2xl p-6 transition-all h-full relative flex flex-col hover:-translate-y-1">
                    <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                      <Book size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-stone-800 mb-2 truncate" title={nb.title}>{nb.title}</h3>
                    <p className="text-stone-400 text-sm mt-auto">
                      {new Date(nb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    
                    <button
                      onClick={(e) => handleDelete(e, nb.id)}
                      className="absolute top-4 right-4 bg-white border border-stone-100 text-stone-400 rounded-full p-2 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors opacity-0 group-hover:opacity-100"
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
    </div>
  );
}

function CreateNotebookModal({ onSuccess }: { onSuccess: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!title.trim() || files.length === 0) return;
    setIsSaving(true);
    try {
      const notebookId = await createNotebook(title.trim());
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await addPage(notebookId, file, file.type, i);
      }
      onSuccess(notebookId);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to create notebook. " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700">Notebook Title</label>
        <Input 
          placeholder="e.g., Physics Midterm Prep" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-stone-700">Upload PDFs / Images</label>
        <input 
          type="file" 
          multiple 
          accept="image/*,application/pdf"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) setFiles(Array.from(e.target.files));
          }}
          className="hidden"
        />
        <Button 
          variant="outline" 
          className="w-full border-dashed border-2 h-16 text-stone-500"
          onClick={() => fileInputRef.current?.click()}
        >
          {files.length > 0 ? `${files.length} file(s) selected` : "Click to select files"}
        </Button>
        {files.length > 0 && (
          <ul className="text-xs text-stone-500 space-y-1 mt-2 max-h-32 overflow-y-auto">
            {files.map((f, i) => <li key={i} className="truncate">• {f.name}</li>)}
          </ul>
        )}
      </div>

      {errorMsg && <p className="text-sm font-medium text-red-500">{errorMsg}</p>}

      <Button 
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
        disabled={isSaving || !title.trim() || files.length === 0}
        onClick={handleSave}
      >
        {isSaving ? "Creating..." : "Create Offline Notebook"}
      </Button>
    </div>
  );
}
