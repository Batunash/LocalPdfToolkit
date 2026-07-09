import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';
import { PdfRangeVisualizer } from '../components/PdfRangeVisualizer';
import { RangeInputEditor } from '../components/RangeInputEditor';
import type { PageRange } from '../components/RangeInputEditor';
import * as Icons from 'lucide-react';

interface ToolProps {
  onBack: () => void;
}

// 1. Remove Pages Tool
export const RemoveTool: React.FC<ToolProps> = ({ onBack }) => {
  const [rangeList, setRangeList] = useState<PageRange[]>([{ id: '1', from: 1, to: 1 }]);
  const { t } = useTranslation();

  const getRangesString = () => rangeList.map(r => r.from === r.to ? `${r.from}` : `${r.from}-${r.to}`).join(', ');

  const handleRun = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    const file = files[0];
    const outputPath = `${tempDir}\\removed_${Date.now()}.pdf`;
    
    setProgress(50, 'Deleting specific pages...');
    const result = await tauriAdapter.removePages(file.path, outputPath, getRangesString(), true);
    setProgress(100, 'Page removal complete!');
    return result;
  };

  return (
    <ToolWrapper
      toolId="remove"
      title={t('categories.organize') + " > " + t('tools.remove.title')}
      description={t('tools.remove.desc')}
      onRun={handleRun}
      onBack={onBack}
      optionsPanel={(files) => (
        <div className="space-y-2">
          <label className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold block">{t('options.pageRanges')}</label>
          <RangeInputEditor 
            ranges={rangeList} 
            onChange={setRangeList} 
            maxPages={files.length > 0 ? files[0]?.pages : undefined}
          />
          {files.length > 0 && files[0] && (
            <PdfRangeVisualizer
              filePath={files[0].path}
              selectedRanges={getRangesString()}
            />
          )}
        </div>
      )}
    />
  );
};

// 2. Repair PDF Tool
export const RepairTool: React.FC<ToolProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const handleRun = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    const file = files[0];
    const outputPath = `${tempDir}\\repaired_${Date.now()}.pdf`;
    
    setProgress(50, 'Rebuilding damaged PDF structure...');
    const result = await tauriAdapter.repair(file.path, outputPath, true);
    setProgress(100, 'Repair complete!');
    return result;
  };

  return (
    <ToolWrapper
      toolId="repair"
      title={t('categories.ocr') + " > " + t('tools.repair.title')}
      description={t('tools.repair.desc')}
      onRun={handleRun}
      onBack={onBack}
      optionsPanel={
        <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block mb-1">
            {t('options.repairDescTitle')}
          </span>
          <p className="text-zinc-450 dark:text-zinc-500 text-[10px] mt-1.5 leading-relaxed font-medium">
            {t('options.repairDesc')}
          </p>
        </div>
      }
    />
  );
};

// 3. Watermark Tool
export const WatermarkTool: React.FC<ToolProps> = ({ onBack }) => {
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [position, setPosition] = useState<'center' | 'diagonal' | 'custom'>('center');
  const [opacity, setOpacity] = useState<number>(0.3);
  const [fontSize, setFontSize] = useState<number>(50);
  const [color, setColor] = useState<string>('#6b7280');
  const { t } = useTranslation();

  const handleRun = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    
    if (!text) throw new Error(t('common.watermarkEmpty'));

    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    const file = files[0];
    const outputPath = `${tempDir}\\watermarked_${Date.now()}.pdf`;
    
    setProgress(50, 'Stamping text watermark...');
    const result = await tauriAdapter.watermark(
      file.path,
      outputPath,
      text,
      position,
      opacity,
      undefined,
      fontSize,
      color,
      true
    );
    setProgress(100, 'Watermark stamped successfully!');
    return result;
  };

  return (
    <ToolWrapper
      toolId="watermark"
      title={t('sidebar.edit') + " > " + t('tools.watermark.title')}
      description={t('tools.watermark.desc')}
      onRun={handleRun}
      onBack={onBack}
      optionsPanel={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.watermarkText')}</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-805 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.watermarkPosition')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPosition('center')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  position === 'center'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-350 dark:border-zinc-700'
                    : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                <div className="w-3 h-3 border border-current flex items-center justify-center"><div className="w-1.5 h-0.5 bg-current"></div></div>
                {t('options.center')}
              </button>
              <button
                type="button"
                onClick={() => setPosition('diagonal')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  position === 'diagonal'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-350 dark:border-zinc-700'
                    : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30'
                }`}
              >
                <div className="w-3 h-3 border border-current relative overflow-hidden"><div className="absolute inset-0 m-auto w-4 h-0.5 bg-current rotate-45"></div></div>
                {t('options.diagonal')}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
              <span>{t('options.opacity')}</span>
              <span>{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-700 dark:accent-zinc-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.fontSize')}</label>
              <input
                type="number"
                min={10}
                max={120}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-805 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block mb-1">{t('options.color')}</label>
              <div className="flex items-center gap-2 mb-2">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#000000'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full cursor-pointer transition-all ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-950 ring-zinc-400' : 'hover:scale-110 shadow-sm'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 p-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded outline-none cursor-pointer"
                />
                <span className="text-[10px] text-zinc-400 font-mono uppercase">{color}</span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};

// 4. Page Numbers Tool
export const PageNumbersTool: React.FC<ToolProps> = ({ onBack }) => {
  const [position, setPosition] = useState<'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'bottom_center'>('bottom_center');
  const [format, setFormat] = useState<string>('Simple');
  const [fontSize, setFontSize] = useState<number>(12);
  const { t } = useTranslation();

  const handleRun = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    const file = files[0];
    const outputPath = `${tempDir}\\numbered_${Date.now()}.pdf`;
    
    setProgress(50, 'Injecting page numbers...');
    const result = await tauriAdapter.pageNumbers(
      file.path,
      outputPath,
      position,
      format === 'Fraction' ? 'Fraction' : 'Simple',
      1,
      fontSize,
      true
    );
    setProgress(100, 'Page numbering complete!');
    return result;
  };

  return (
    <ToolWrapper
      toolId="page_numbers"
      title={t('sidebar.edit') + " > " + t('tools.page_numbers.title')}
      description={t('tools.page_numbers.desc')}
      onRun={handleRun}
      onBack={onBack}
      optionsPanel={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block mb-2">{t('options.position')}</label>
            <div className="w-full max-w-[200px] aspect-[1/1.4] mx-auto bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl relative p-3">
              {/* Top Left */}
              <button type="button" onClick={() => setPosition('top_left')} className={`absolute top-2 left-2 w-8 h-8 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${position === 'top_left' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-transparent'}`}><span className="text-[10px] font-bold">1</span></button>
              {/* Top Right */}
              <button type="button" onClick={() => setPosition('top_right')} className={`absolute top-2 right-2 w-8 h-8 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${position === 'top_right' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-transparent'}`}><span className="text-[10px] font-bold">1</span></button>
              {/* Bottom Left */}
              <button type="button" onClick={() => setPosition('bottom_left')} className={`absolute bottom-2 left-2 w-8 h-8 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${position === 'bottom_left' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-transparent'}`}><span className="text-[10px] font-bold">1</span></button>
              {/* Bottom Right */}
              <button type="button" onClick={() => setPosition('bottom_right')} className={`absolute bottom-2 right-2 w-8 h-8 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${position === 'bottom_right' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-transparent'}`}><span className="text-[10px] font-bold">1</span></button>
              {/* Bottom Center */}
              <button type="button" onClick={() => setPosition('bottom_center')} className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${position === 'bottom_center' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-transparent'}`}><span className="text-[10px] font-bold">1</span></button>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <Icons.FileText className="w-16 h-16 text-zinc-500" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.numberFormat')}</label>
            <select
              value={format}
              onChange={(e: any) => setFormat(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
            >
              <option value="Simple">{t('options.singleNumber')}</option>
              <option value="Fraction">{t('options.pageFraction')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.fontSize')}</label>
            <input
              type="number"
              min={8}
              max={24}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-805 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
            />
          </div>
        </div>
      }
    />
  );
};

// 5. Crop PDF Tool
export const CropTool: React.FC<ToolProps> = ({ onBack }) => {
  const [left, setLeft] = useState<number>(20);
  const [top, setTop] = useState<number>(20);
  const [right, setRight] = useState<number>(20);
  const [bottom, setBottom] = useState<number>(20);
  const [unit, setUnit] = useState<'percentage' | 'points'>('points');
  const { t } = useTranslation();

  const handleRun = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    const file = files[0];
    const outputPath = `${tempDir}\\cropped_${Date.now()}.pdf`;
    
    setProgress(50, 'Cropping page margins...');
    const result = await tauriAdapter.crop(file.path, outputPath, left, top, right, bottom, unit, true);
    setProgress(100, 'Cropping complete!');
    return result;
  };

  return (
    <ToolWrapper
      toolId="crop"
      title={t('sidebar.edit') + " > " + t('tools.crop.title')}
      description={t('tools.crop.desc')}
      onRun={handleRun}
      onBack={onBack}
      optionsPanel={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.marginsUnit')}</label>
            <select
              value={unit}
              onChange={(e: any) => setUnit(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
            >
              <option value="points">{t('options.points')}</option>
              <option value="percentage">{t('options.percentage')}</option>
            </select>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
            <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold block mb-1">{t('options.cropMargins')}</span>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">{t('options.top')}</span>
                <input
                  type="number"
                  min={0}
                  value={top}
                  onChange={(e) => setTop(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-805 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">{t('options.bottom')}</span>
                <input
                  type="number"
                  min={0}
                  value={bottom}
                  onChange={(e) => setBottom(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-850 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">{t('options.left')}</span>
                <input
                  type="number"
                  min={0}
                  value={left}
                  onChange={(e) => setLeft(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-850 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-500 font-bold">{t('options.right')}</span>
                <input
                  type="number"
                  min={0}
                  value={right}
                  onChange={(e) => setRight(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-850 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 mt-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="relative w-24 aspect-[1/1.4] bg-white border-2 border-zinc-300 dark:border-zinc-700 shadow-sm rounded-sm overflow-hidden">
                <div 
                  className="absolute bg-indigo-500/20 border border-indigo-500 transition-all duration-300"
                  style={{
                    top: `${Math.min(45, unit === 'percentage' ? top : top / 5)}%`,
                    bottom: `${Math.min(45, unit === 'percentage' ? bottom : bottom / 5)}%`,
                    left: `${Math.min(45, unit === 'percentage' ? left : left / 5)}%`,
                    right: `${Math.min(45, unit === 'percentage' ? right : right / 5)}%`
                  }}
                >
                  <div className="w-full h-full border border-indigo-500/30 border-dashed" />
                </div>
              </div>
              <span className="text-[9px] text-zinc-400 font-bold uppercase mt-2">Live Preview</span>
            </div>
          </div>
        </div>
      }
    />
  );
};
