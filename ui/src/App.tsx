import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { useAppStore } from './store/useAppStore';

// Organize pages
import { MergePdf } from './pages/organize/MergePdf';
import { SplitPdf } from './pages/organize/SplitPdf';
import { RemovePages } from './pages/organize/RemovePages';
import { ExtractPages } from './pages/organize/ExtractPages';
import { OrganizePdf } from './pages/organize/OrganizePdf';
import { CompressPdf } from './pages/organize/CompressPdf';

// Edit pages
import { RotatePdf } from './pages/edit/RotatePdf';
import { Watermark } from './pages/edit/Watermark';
import { PageNumbers } from './pages/edit/PageNumbers';
import { CropPdf } from './pages/edit/CropPdf';

// OCR pages
import { OcrPdf } from './pages/ocr/OcrPdf';
import { RepairPdf } from './pages/ocr/RepairPdf';

// Security pages
import { ProtectPdf } from './pages/security/ProtectPdf';
import { UnlockPdf } from './pages/security/UnlockPdf';

// Convert pages
import { ConvertPdf } from './pages/convert/ConvertPdf';
import { PdfInfo } from './pages/convert/PdfInfo';
import { PdfThumbnail } from './pages/convert/PdfThumbnail';

// Utility pages
import { CleanupTemp } from './pages/utility/CleanupTemp';

// Tool page components placeholder
const pages = {
  organize: {
    merge: MergePdf,
    split: SplitPdf,
    remove: RemovePages,
    extract: ExtractPages,
    organize: OrganizePdf,
    compress: CompressPdf,
  },
  edit: {
    rotate: RotatePdf,
    watermark: Watermark,
    'page-numbers': PageNumbers,
    crop: CropPdf,
  },
  ocr: {
    pdf: OcrPdf,
    repair: RepairPdf,
  },
  security: {
    protect: ProtectPdf,
    unlock: UnlockPdf,
  },
  convert: {
    pdf: ConvertPdf,
    info: PdfInfo,
    thumbnails: PdfThumbnail,
  },
  utility: {
    cleanup: CleanupTemp,
  },
};

export default function App() {
  const { theme, setActiveTool } = useAppStore();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/organize/merge" replace />} />

          {/* Organize */}
          <Route path="/organize/merge" element={<PageWrapper tool="Merge PDF"><MergePdf /></PageWrapper>} />
          <Route path="/organize/split" element={<PageWrapper tool="Split PDF"><SplitPdf /></PageWrapper>} />
          <Route path="/organize/remove" element={<PageWrapper tool="Remove Pages"><RemovePages /></PageWrapper>} />
          <Route path="/organize/extract" element={<PageWrapper tool="Extract Pages"><ExtractPages /></PageWrapper>} />
          <Route path="/organize/organize" element={<PageWrapper tool="Organize Pages"><OrganizePdf /></PageWrapper>} />
          <Route path="/organize/compress" element={<PageWrapper tool="Compress PDF"><CompressPdf /></PageWrapper>} />

          {/* Edit */}
          <Route path="/edit/rotate" element={<PageWrapper tool="Rotate PDF"><RotatePdf /></PageWrapper>} />
          <Route path="/edit/watermark" element={<PageWrapper tool="Watermark"><Watermark /></PageWrapper>} />
          <Route path="/edit/page-numbers" element={<PageWrapper tool="Page Numbers"><PageNumbers /></PageWrapper>} />
          <Route path="/edit/crop" element={<PageWrapper tool="Crop PDF"><CropPdf /></PageWrapper>} />

          {/* OCR */}
          <Route path="/ocr/pdf" element={<PageWrapper tool="OCR PDF"><OcrPdf /></PageWrapper>} />
          <Route path="/ocr/repair" element={<PageWrapper tool="Repair PDF"><RepairPdf /></PageWrapper>} />

          {/* Security */}
          <Route path="/security/protect" element={<PageWrapper tool="Protect PDF"><ProtectPdf /></PageWrapper>} />
          <Route path="/security/unlock" element={<PageWrapper tool="Unlock PDF"><UnlockPdf /></PageWrapper>} />

          {/* Convert */}
          <Route path="/convert/pdf" element={<PageWrapper tool="Convert PDF"><ConvertPdf /></PageWrapper>} />
          <Route path="/convert/info" element={<PageWrapper tool="PDF Info"><PdfInfo /></PageWrapper>} />
          <Route path="/convert/thumbnails" element={<PageWrapper tool="PDF Thumbnails"><PdfThumbnail /></PageWrapper>} />

          {/* Utility */}
          <Route path="/utility/cleanup" element={<PageWrapper tool="Cleanup Temp"><CleanupTemp /></PageWrapper>} />
        </Routes>
      </main>
    </div>
  );
}

interface PageWrapperProps {
  tool: string;
  children: React.ReactNode;
}

function PageWrapper({ tool, children }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">{tool}</h1>
          <p className="text-text-secondary mt-1">Process your PDF files quickly and securely.</p>
        </header>
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </div>
    </motion.div>
  );
}