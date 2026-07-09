import React, { useState, useEffect, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { tauriAdapter } from '../adapters/tauriAdapter';
import * as Icons from 'lucide-react';
import { PdfThumbnail } from './PdfThumbnail';

// Set the worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfRangeVisualizerProps {
  filePath: string;
  selectedRanges: string;
}

export const PdfRangeVisualizer: React.FC<PdfRangeVisualizerProps> = ({ filePath, selectedRanges }) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rangeBlocks = useMemo(() => {
    if (!selectedRanges.trim()) return [];
    
    const parts = selectedRanges.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const blocks: {start: number, end: number, label: string}[] = [];
    
    parts.forEach((part, index) => {
      if (part.includes('-')) {
        const [s, e] = part.split('-');
        const start = parseInt(s);
        const end = parseInt(e);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          blocks.push({ start, end, label: `Range ${index + 1}` });
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num)) {
          blocks.push({ start: num, end: num, label: `Range ${index + 1}` });
        }
      }
    });
    return blocks;
  }, [selectedRanges]);

  useEffect(() => {
    let active = true;

    const loadPdfDoc = async () => {
      if (!filePath) return;
      setLoading(true);
      setError(null);
      setPdfDoc(null);
      setNumPages(0);

      try {
        const data = await tauriAdapter.readFile(filePath);
        if (data.length === 0) {
          if (!tauriAdapter.isTauri()) {
            if (active) {
              setNumPages(10); // Mock pages
            }
            return;
          }
          throw new Error('Could not read file');
        }

        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        
        if (active) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
        }
      } catch (err: any) {
        console.error('Error loading PDF Document:', err);
        if (active) setError(err.message || 'Failed to load PDF preview metadata');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPdfDoc();

    return () => {
      active = false;
    };
  }, [filePath]);

  if (!filePath || rangeBlocks.length === 0) return null;

  return (
    <div className="flex flex-col mt-4 w-full">
      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs text-center font-medium">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Icons.Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="ml-3 text-xs font-semibold text-zinc-500">Parsing Document...</span>
        </div>
      ) : (
        <div className="flex flex-wrap pb-4 gap-4 w-full">
          {rangeBlocks.map((block, idx) => {
            // Validate bounds
            const validStart = Math.max(1, Math.min(block.start, numPages || block.start));
            const validEnd = Math.max(1, Math.min(block.end, numPages || block.end));
            
            return (
              <div 
                key={idx} 
                className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm items-center justify-center"
              >
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-4">{block.label}</div>
                
                <div className="flex items-center gap-4">
                  {/* Start Thumbnail */}
                  {pdfDoc ? (
                    <div className="w-36 shrink-0 aspect-[1/1.414]">
                      <PdfThumbnail 
                        pdf={pdfDoc} 
                        pageNum={validStart} 
                        hideLabel={false}
                        className="w-full h-full rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="w-36 shrink-0 aspect-[1/1.414] bg-zinc-200 dark:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                      <span className="text-zinc-400 dark:text-zinc-500 font-bold text-lg">{validStart}</span>
                    </div>
                  )}

                  {validStart !== validEnd && (
                    <>
                      <div className="text-zinc-300 dark:text-zinc-600 font-black tracking-widest text-lg">
                        ...
                      </div>
                      
                      {/* End Thumbnail */}
                      {pdfDoc ? (
                        <div className="w-36 shrink-0 aspect-[1/1.414]">
                          <PdfThumbnail 
                            pdf={pdfDoc} 
                            pageNum={validEnd} 
                            hideLabel={false}
                            className="w-full h-full rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="w-36 shrink-0 aspect-[1/1.414] bg-zinc-200 dark:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                          <span className="text-zinc-400 dark:text-zinc-500 font-bold text-lg">{validEnd}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
