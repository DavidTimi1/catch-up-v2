"use client";

import { use, useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Hand, PenTool, Send, ChevronLeft, ChevronRight, Sparkles, Loader2, History, X } from "@/components/icons";
import {
  ReaderPage,
  addInteraction,
  updatePageUrl,
  updateLastOpened,
  updateNotebookTitle,
  Interaction
} from "@/lib/db/localReaderDb";
import { useNotebook, usePages, useHistory } from "@/lib/hooks/useReaderData";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFilesToCloudinary } from "@/lib/uploadClient";
import { TTSController } from "@/components/TTSController";
import { useModal } from "@/components/providers/modal-provider";
import { useToast } from "@/components/providers/toast-provider";
import { AlertModal } from "@/components/AlertModal";
import { InteractionPreviewModal } from "@/components/InteractionPreviewModal";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function ReaderViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showModal } = useModal();
  const { toast } = useToast();

  const { data: notebook, isLoading: isLoadingNotebook, setData: setNotebook } = useNotebook(id);
  const { data: pages, isLoading: isLoadingPages } = usePages(id);
  const { data: historyItems, isLoading: isLoadingHistory, refetch: loadHistory } = useHistory(id);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Tools state
  const [mode, setMode] = useState<'view' | 'draw'>('view');
  const [highlightType, setHighlightType] = useState<'free-form' | 'box' | 'full-page'>('box');

  // History State
  const [showHistory, setShowHistory] = useState(false);

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // PDF states
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(1);
  const pdfZoom = 1.5;
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('Catchup-highlight-type');
    setTimeout(() => {
      if (saved && ['free-form', 'box', 'full-page'].includes(saved)) {
        setHighlightType(saved as 'free-form' | 'box' | 'full-page');
      } else if (window.innerWidth < 768) {
        setHighlightType('box');
      }
    });
  }, []);

  const handleSetHighlightType = (t: 'free-form' | 'box' | 'full-page') => {
    setHighlightType(t);
    localStorage.setItem('Catchup-highlight-type', t);
  };

  useEffect(() => {
    // Update last opened timestamp
    updateLastOpened(id).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (notebook?.title) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitleInput(notebook.title);
    }
  }, [notebook?.title]);

  const handleTitleSave = async () => {
    if (!titleInput.trim() || titleInput === notebook?.title) {
      setIsEditingTitle(false);
      setTitleInput(notebook?.title || "");
      return;
    }
    await updateNotebookTitle(id, titleInput);
    setNotebook(prev => prev ? { ...prev, title: titleInput.trim() } : null);
    setIsEditingTitle(false);
    toast("Notebook renamed", "success");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitleInput(notebook?.title || "");
    }
  };

  const currentPage = pages[currentIndex];

  const previewUrl = useMemo(() => {
    if (!currentPage) return null;
    return URL.createObjectURL(currentPage.fileBlob);
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    let isMounted = true;
    if (currentPage && currentPage.mimeType === "application/pdf" && previewUrl) {
      pdfjsLib.getDocument({ url: previewUrl }).promise.then(doc => {
        if (isMounted) {
          setPdfDoc(doc);
          setPdfNumPages(doc.numPages);
          setPdfCurrentPage(1);
        }
      }).catch(err => {
        console.error("Error loading PDF", err);
      });
    } else {
      setTimeout(() => {
        if (isMounted) setPdfDoc(null);
      });
    }
    return () => { isMounted = false; };
  }, [currentPage, previewUrl]);

  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    let isSubscribed = true;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pdfCurrentPage);
        const viewport = page.getViewport({ scale: pdfZoom });
        const canvas = pdfCanvasRef.current;
        if (!canvas || !isSubscribed) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
      } catch (err) {
        console.error("PDF Render Error", err);
      }
    };
    renderPage();
    return () => { isSubscribed = false; };
  }, [pdfDoc, pdfCurrentPage, pdfZoom]);

  const handlePrev = useCallback(() => {
    if (pdfDoc && pdfCurrentPage > 1) {
      setPdfCurrentPage(p => p - 1);
    } else if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setPdfCurrentPage(1);
    }
  }, [pdfDoc, pdfCurrentPage, currentIndex]);

  const handleNext = useCallback(() => {
    if (pdfDoc && pdfCurrentPage < pdfNumPages) {
      setPdfCurrentPage(p => p + 1);
    } else if (currentIndex < pages.length - 1) {
      setCurrentIndex(c => c + 1);
      setPdfCurrentPage(1);
    }
  }, [pdfDoc, pdfCurrentPage, pdfNumPages, currentIndex, pages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode === 'draw') return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (mode === 'draw' || touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    touchStartX.current = null;
  };

  const openInteractionPreview = (interaction: Interaction & { pageOrder: number }) => {
    if (showHistory) setShowHistory(false);
    showModal(
      <InteractionPreviewModal
        interaction={interaction}
        onJumpToPage={(pageOrder) => {
          setCurrentIndex(pageOrder);
          setPdfCurrentPage(1);
        }}
      />
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans overflow-hidden">
      <header className="h-16 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-stone-950 z-30">
        <div className="flex items-center min-w-0 flex-1 mr-4">
          <Link href="/reader" className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full mr-2 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>

          {isEditingTitle ? (
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="bg-stone-100 dark:bg-stone-800 border-emerald-500 text-stone-900 dark:text-white h-8 max-w-[200px] md:max-w-md font-bold font-heading"
            />
          ) : isLoadingNotebook ? (
            <Skeleton className="h-6 w-32 md:w-48" />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="font-bold font-heading truncate max-w-[150px] sm:max-w-[250px] md:max-w-md cursor-text hover:text-emerald-400 transition-colors"
              title="Click to rename"
            >
              {notebook?.title || "Loading..."}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg mr-2">
            <button
              onClick={() => setMode('view')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-colors ${mode === 'view' ? 'bg-stone-200 dark:bg-stone-600 text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}`}
            >
              <Hand size={16} /> <span className="hidden sm:inline text-sm font-medium">View</span>
            </button>
            <button
              onClick={() => setMode('draw')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-colors ${mode === 'draw' ? 'bg-emerald-600 text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'}`}
            >
              <PenTool size={16} /> <span className="hidden sm:inline text-sm font-medium">Highlight</span>
            </button>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-full transition-colors flex items-center justify-center relative ${showHistory ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700'}`}
          >
            <History size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Tools Action Bar */}
      <div className="sm:hidden flex items-center justify-between p-2 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0 z-20">
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg w-full max-w-[200px]">
          <button
            onClick={() => setMode('view')}
            className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${mode === 'view' ? 'bg-stone-200 dark:bg-stone-600 text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400'}`}
          >
            <Hand size={16} />
          </button>
          <button
            onClick={() => setMode('draw')}
            className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${mode === 'draw' ? 'bg-emerald-600 text-white' : 'text-stone-500 dark:text-stone-400'}`}
          >
            <PenTool size={16} />
          </button>
        </div>

        {mode === 'draw' && (
          <select
            value={highlightType}
            onChange={(e) => handleSetHighlightType(e.target.value as 'free-form' | 'box' | 'full-page')}
            className="bg-stone-800 border-none text-sm rounded-md py-1.5 px-2 outline-none cursor-pointer max-w-[120px]"
          >
            <option value="box">Box</option>
            <option value="free-form">Free Draw</option>
            <option value="full-page">Full Page</option>
          </select>
        )}
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <main
          className="flex-1 relative overflow-hidden bg-stone-50 dark:bg-stone-900 flex justify-center h-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mode === 'view' && (
            <>
              <div
                className="absolute left-0 top-0 bottom-0 w-[15%] max-w-[80px] z-10 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={handlePrev}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-[15%] max-w-[80px] z-10 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={handleNext}
              />
            </>
          )}

          {isLoadingPages ? (
            <div className="flex flex-col items-center justify-center h-full w-full bg-stone-50 dark:bg-stone-900 gap-4">
              <Skeleton className="w-full max-w-2xl h-[70vh] rounded-2xl" />
            </div>
          ) : currentPage && previewUrl ? (
            <div className="relative w-full h-full shadow-2xl flex items-center justify-center bg-stone-100 dark:bg-stone-800">
              {currentPage.mimeType === "application/pdf" ? (
                <div className="overflow-auto w-full h-full flex justify-center items-start p-4 relative">
                  <div className="relative inline-block shadow-2xl">
                    <canvas ref={pdfCanvasRef} className="bg-white block" />
                    <HighlightCanvas
                      mode={mode}
                      highlightType={highlightType}
                      page={currentPage}
                      subId={`pdf-${pdfCurrentPage}`}
                      onInteractionComplete={loadHistory}
                      getPdfBlob={async () => {
                        return new Promise<Blob | null>(res => pdfCanvasRef.current?.toBlob(res, "image/jpeg", 0.9));
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="overflow-auto w-full h-full flex justify-center items-center p-4 relative">
                  <div className="relative inline-block shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} className="max-w-full max-h-[80vh] object-contain bg-white block" alt="Page preview" draggable={false} />
                    <HighlightCanvas
                      mode={mode}
                      highlightType={highlightType}
                      page={currentPage}
                      onInteractionComplete={loadHistory}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-stone-500">
              {pages.length === 0 ? "No pages in this notebook." : "Loading page..."}
            </div>
          )}

          {pages.length > 1 && (
            <>
              <button
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-stone-800/80 hover:bg-stone-700 disabled:opacity-30 rounded-full backdrop-blur-md transition-all z-20 shadow-lg border border-stone-700"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                disabled={currentIndex === pages.length - 1}
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-stone-800/80 hover:bg-stone-700 disabled:opacity-30 rounded-full backdrop-blur-md transition-all z-20 shadow-lg border border-stone-700"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {pdfDoc && pdfNumPages > 1 ? (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-stone-800/90 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-stone-700 z-20 shadow-xl pointer-events-auto">
              <button disabled={pdfCurrentPage === 1} onClick={handlePrev} className="p-1 hover:text-white disabled:opacity-30"><ChevronLeft size={18} /></button>
              <span className="min-w-[80px] text-center">Page {pdfCurrentPage} of {pdfNumPages}</span>
              <button disabled={pdfCurrentPage === pdfNumPages} onClick={handleNext} className="p-1 hover:text-white disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          ) : pages.length > 0 ? (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-800/80 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider backdrop-blur-md border border-stone-700 z-20">
              FILE {currentIndex + 1} OF {pages.length}
            </div>
          ) : null}
        </main>

        {/* History Panel (Desktop Sidebar) */}
        {showHistory && (
          <aside className="hidden sm:flex flex-col w-80 bg-stone-50 dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800 z-30 shrink-0 h-full animate-in slide-in-from-right-4">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900">
              <h3 className="font-bold font-heading flex items-center gap-2">
                <History size={18} className="text-emerald-500" /> Interaction History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingHistory ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))
              ) : historyItems.length === 0 ? (
                <p className="text-stone-500 text-sm text-center mt-10">No interactions recorded yet.</p>
              ) : (
                historyItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => openInteractionPreview(item)}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 rounded-xl hover:border-emerald-500/50 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group shadow-sm"
                  >
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200 line-clamp-2 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      &quot;{item.prompt}&quot;
                    </p>
                    <p className="text-xs text-stone-500 line-clamp-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.readableAnswer}
                      </ReactMarkdown>
                    </p>
                    <p className="text-[10px] text-stone-600 font-bold uppercase tracking-wider mt-2">
                      Page {item.pageOrder + 1} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* History Panel (Mobile Bottom Sheet) */}
        {showHistory && (
          <div className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-50 dark:bg-stone-950 w-full h-[70vh] rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-full">
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900 rounded-t-3xl">
                <h3 className="font-bold font-heading flex items-center gap-2">
                  <History size={18} className="text-emerald-500" /> History
                </h3>
                <button onClick={() => setShowHistory(false)} className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingHistory ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))
                ) : historyItems.length === 0 ? (
                  <p className="text-stone-500 text-sm text-center mt-10">No interactions yet.</p>
                ) : (
                  historyItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => openInteractionPreview(item)}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 rounded-xl hover:border-emerald-500/50 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shadow-sm"
                    >
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 line-clamp-2 mb-1">&quot;{item.prompt}&quot;</p>
                      <p className="text-xs text-stone-500 line-clamp-2">{item.readableAnswer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightCanvas({ mode, highlightType, page, subId, getPdfBlob, onInteractionComplete }: { mode: 'view' | 'draw', highlightType: 'free-form' | 'box' | 'full-page', page: ReaderPage, subId?: string, getPdfBlob?: () => Promise<Blob | null>, onInteractionComplete?: () => void }) {
  const { showModal } = useModal();
  const isOnline = useNetworkStatus();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [rect, setRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [path, setPath] = useState<{ x: number, y: number }[]>([]);

  const [showPrompt, setShowPrompt] = useState(false);
  const [promptPos, setPromptPos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState<{ readableAnswer: string, ttsAnswer: string } | null>(null);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setRect(null);
      setPath([]);
      setShowPrompt(false);
      setLatestAnswer(null);
      clearCanvas();
    });
  }, [page.id, subId, clearCanvas]);

  const drawRect = useCallback((x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }, [clearCanvas]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw') return;
    if (highlightType === 'full-page') {
      const canvas = canvasRef.current;
      if (canvas) {
        setRect({ x: 0, y: 0, w: canvas.width, h: canvas.height });
        drawRect(0, 0, canvas.width, canvas.height);
        setPromptPos({ x: canvas.width / 2, y: canvas.height / 2 });
        setShowPrompt(true);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsDrawing(true);
    setShowPrompt(false);
    if (highlightType === 'box') {
      setRect({ x, y, w: 0, h: 0 });
    } else {
      setPath([{ x, y }]);
      clearCanvas();
    }
  };

  const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;

    if (highlightType === 'box' && rect) {
      const newRect = { ...rect, w: x - rect.x, h: y - rect.y };
      setRect(newRect);
      drawRect(newRect.x, newRect.y, newRect.w, newRect.h);
    } else if (highlightType === 'free-form') {
      const newPath = [...path, { x, y }];
      setPath(newPath);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        clearCanvas();
        ctx.beginPath();
        ctx.moveTo(newPath[0].x, newPath[0].y);
        for (let i = 1; i < newPath.length; i++) {
          ctx.lineTo(newPath[i].x, newPath[i].y);
        }
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    let endX = 0;
    let endY = 0;

    if (highlightType === 'box' && rect) {
      endX = rect.x + rect.w;
      endY = Math.max(rect.y, rect.y + rect.h) + 10;
    } else if (highlightType === 'free-form' && path.length > 0) {
      const last = path[path.length - 1];
      endX = last.x;
      endY = last.y + 10;
    }

    setPromptPos({ x: endX, y: endY });
    setShowPrompt(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      setCanvasSize({ width: canvas.width, height: canvas.height });
      if (rect) drawRect(rect.x, rect.y, rect.w, rect.h);
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [rect, drawRect]);

  const [promptText, setPromptText] = useState("");

  const handleSubmit = async (action: 'explain' | 'ask') => {
    const query = action === 'explain' ? "Explain this" : promptText;
    if (!query) return;

    setIsSubmitting(true);
    try {
      let fileUrl = page.originalUrl;
      let sendMimeType = page.mimeType;

      if (getPdfBlob) {
        const blob = await getPdfBlob();
        if (!blob) throw new Error("Could not extract PDF page");
        const file = new File([blob], "page.jpg", { type: "image/jpeg" });
        const uploaded = await uploadFilesToCloudinary([file]);
        if (uploaded && uploaded.length > 0) fileUrl = uploaded[0].url;
        sendMimeType = "image/jpeg";
      } else if (!fileUrl) {
        const file = new File([page.fileBlob], "upload", { type: page.mimeType });
        const uploaded = await uploadFilesToCloudinary([file]);
        if (uploaded && uploaded.length > 0) {
          fileUrl = uploaded[0].url;
          await updatePageUrl(page.id, fileUrl);
        }
      }

      if (!fileUrl) throw new Error("Failed to upload context image.");

      let attempt = 0;
      let data;
      while (attempt < 2) {
        try {
          const res = await fetch('/api/reader/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUrl,
              mimeType: sendMimeType,
              prompt: query,
              highlightRect: rect,
              highlightType,
            }),
          });
          data = await res.json();
          if (!data.success) throw new Error(data.error);
          break;
        } catch (e) {
          attempt++;
          if (attempt >= 2) throw e;
          console.log("Retrying AI explanation...", e);
        }
      }

      await addInteraction({
        pageId: page.id,
        highlightRect: rect ? { x: rect.x, y: rect.y, width: rect.w, height: rect.h, type: highlightType } : { x: 0, y: 0, width: 0, height: 0, type: highlightType },
        prompt: query,
        readableAnswer: data.readableAnswer,
        ttsAnswer: data.ttsAnswer,
        isAudio: false,
      });

      if (onInteractionComplete) onInteractionComplete();

      setLatestAnswer({ readableAnswer: data.readableAnswer, ttsAnswer: data.ttsAnswer });
      setShowPrompt(false);
      setPromptText("");
    } catch (err) {
      console.error(err);
      showModal(<AlertModal title="AI Interaction Failed" message={err instanceof Error ? err.message : String(err)} />, "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-10 touch-none ${mode === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
        onMouseDown={startDraw}
        onMouseMove={doDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={doDraw}
        onTouchEnd={endDraw}
      />

      {latestAnswer && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-stone-900 border border-emerald-500/50 shadow-2xl rounded-xl p-4 w-11/12 max-w-2xl text-sm animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-800">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2"><Sparkles size={16} /> AI Explanation</h4>
            <div className="flex items-center gap-2">
              <TTSController textToSpeak={latestAnswer.ttsAnswer || latestAnswer.readableAnswer} />
              <button onClick={() => setLatestAnswer(null)} className="text-stone-500 hover:text-white">✕</button>
            </div>
          </div>
          <div className="text-stone-300 leading-relaxed max-h-48 overflow-y-auto pr-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {latestAnswer?.readableAnswer}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {showPrompt && mode === 'draw' && !isSubmitting && (
        <div
          className="absolute z-30 bg-stone-900 border border-stone-700 shadow-2xl rounded-2xl p-4 w-72 flex flex-col gap-3 backdrop-blur-md animate-in zoom-in-95 duration-200"
          style={{
            left: Math.min(Math.max(10, promptPos.x), canvasSize.width - 290),
            top: Math.min(Math.max(10, promptPos.y), canvasSize.height - 150),
          }}
        >
          <Button
            className="w-full bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSubmit('explain')}
            disabled={!isOnline}
          >
            <Sparkles size={16} className="mr-2" /> {isOnline ? "Explain this" : "AI Unavailable Offline"}
          </Button>

          <div className="flex gap-2 items-center">
            <Input
              placeholder={isOnline ? "Ask a specific question..." : "Offline mode..."}
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              className="bg-stone-800 border-stone-700 text-stone-200 placeholder:text-stone-500 h-10 disabled:opacity-50"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit('ask') }}
              disabled={!isOnline}
            />
            <Button 
              size="icon" 
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => handleSubmit('ask')}
              disabled={!isOnline}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-stone-900 p-6 rounded-2xl flex flex-col items-center gap-4 border border-emerald-500/30 shadow-2xl">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-emerald-400 font-medium">Analyzing document...</p>
          </div>
        </div>
      )}
    </>
  );
}
