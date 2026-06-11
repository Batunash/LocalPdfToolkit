import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as Icons from 'lucide-react';

interface PdfThumbnailProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  className?: string;
  hideLabel?: boolean;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = React.memo(({ pdf, pageNum, className = '', hideLabel = false }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setThumbnail(null);
    setIsLoaded(false);
    setHasError(false);

    const renderPage = async () => {
      if (!pdf) return;
      
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        
        if (active) {
          setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch (err) {
        console.error(`Failed to render page ${pageNum}:`, err);
        if (active) setHasError(true);
      }
    };

    renderPage();

    return () => {
      active = false;
    };
  }, [pdf, pageNum]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all duration-300 ${className}`}
    >
      {!isLoaded && !hasError && (
        <Icons.Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
      )}
      
      {hasError && (
        <div className="flex flex-col items-center justify-center text-zinc-400 p-2 text-center">
          <Icons.ImageOff className="w-6 h-6 mb-1 opacity-50" />
          <span className="text-[10px] font-medium leading-tight">Preview<br/>Error</span>
        </div>
      )}

      {thumbnail && !hasError && (
        <img 
          src={thumbnail} 
          alt={`Page ${pageNum}`} 
          className={`w-full h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
      
      {!hideLabel && (
        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
          {pageNum}
        </div>
      )}
    </div>
  );
});
