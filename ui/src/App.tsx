import { useState } from 'react';
import type { PageId } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MergeTool } from './pages/MergeTool';
import { SplitTool } from './pages/SplitTool';
import { CompressTool } from './pages/CompressTool';
import { ProtectTool } from './pages/ProtectTool';
import { UnlockTool } from './pages/UnlockTool';
import { OcrTool } from './pages/OcrTool';
import { RotateTool } from './pages/RotateTool';
import { ConvertTool } from './pages/ConvertTool';
import { InfoTool } from './pages/InfoTool';
import {
  RemoveTool,
  RepairTool,
  WatermarkTool,
  PageNumbersTool,
  CropTool
} from './pages/OtherTools';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'merge':
        return <MergeTool onBack={handleBackToDashboard} />;
      case 'split':
        return <SplitTool onBack={handleBackToDashboard} />;
      case 'compress':
        return <CompressTool onBack={handleBackToDashboard} />;
      case 'protect':
        return <ProtectTool onBack={handleBackToDashboard} />;
      case 'unlock':
        return <UnlockTool onBack={handleBackToDashboard} />;
      case 'ocr':
        return <OcrTool onBack={handleBackToDashboard} />;
      case 'rotate':
        return <RotateTool onBack={handleBackToDashboard} />;
      case 'convert':
        return <ConvertTool onBack={handleBackToDashboard} />;
      case 'info':
        return <InfoTool onBack={handleBackToDashboard} />;
      case 'remove':
        return <RemoveTool onBack={handleBackToDashboard} />;
      case 'repair':
        return <RepairTool onBack={handleBackToDashboard} />;
      case 'watermark':
        return <WatermarkTool onBack={handleBackToDashboard} />;
      case 'page_numbers':
        return <PageNumbersTool onBack={handleBackToDashboard} />;
      case 'crop':
        return <CropTool onBack={handleBackToDashboard} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout activePage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default App;
