import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Eye } from 'lucide-react';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PdfPreviewProps {
  filePath: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ filePath, isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !filePath) return;

    const renderPage = async () => {
      if (!canvasRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load the PDF
        const arrayBuffer = await fetch(filePath).then(res => res.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setTotalPages(pdf.numPages);

        // Render the current page
        const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!canvas || !context) {
        setIsLoading(false);
        return;
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvas,
        canvasContext: context,
        viewport: viewport,
      }).promise;
      } catch (err) {
        console.error('Failed to render PDF:', err);
        setError('Failed to load PDF preview');
      } finally {
        setIsLoading(false);
      }
    };

    renderPage();
  }, [filePath, currentPage, scale, isOpen]);

  // Reset to page 1 when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setScale(1.0);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 w-[600px] h-[500px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-[50]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                PDF Preview
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />
            <button
              onClick={() => setScale(1.0)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-center text-zinc-400">
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="shadow-lg rounded bg-white"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};