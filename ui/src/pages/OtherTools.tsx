import React, { useState } from 'react';
import { ToolWrapper } from '../components/ToolWrapper';
import type { SelectedFile } from '../types';
import { tauriAdapter } from '../adapters/tauriAdapter';
import { useTranslation } from '../i18n';

interface ToolProps {
  onBack: () => void;
}

// 1. Remove Pages Tool
export const RemoveTool: React.FC<ToolProps> = ({ onBack }) => {
  const [ranges, setRanges] = useState<string>('1');
  const { t } = useTranslation();

  const handleRun = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    if (files.length === 0) throw new Error('No file selected');
    setProgress(10, 'Getting temporary directory...');
    const tempDir = await tauriAdapter.getTempDir();
    const file = files[0];
    const outputPath = `${tempDir}\\removed_${Date.now()}.pdf`;
    
    setProgress(50, 'Deleting specific pages...');
    const result = await tauriAdapter.removePages(file.path, outputPath, ranges, true);
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
      optionsPanel={
        <div className="space-y-2">
          <label className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold block">{t('options.pageRanges')}</label>
          <input
            type="text"
            placeholder="e.g. 1, 3-5, 8"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-805 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
          />
          <span className="text-zinc-500 dark:text-zinc-500 text-[10px] block leading-normal mt-1.5 font-medium">
            {t('options.pageRangesDesc')}
          </span>
        </div>
      }
    />
  );
};

// 2. Repair PDF Tool
export const RepairTool: React.FC<ToolProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const handleRun = async (files: SelectedFile[], setProgress: (pct: number, msg?: string) => void) => {
    if (files.length === 0) throw new Error('No file selected');
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
    if (files.length === 0) throw new Error('No file selected');
    if (!text) throw new Error('Watermark text cannot be empty');

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
            <select
              value={position}
              onChange={(e: any) => setPosition(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
            >
              <option value="center">{t('options.center')}</option>
              <option value="diagonal">{t('options.diagonal')}</option>
            </select>
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
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.color')}</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 px-1.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none cursor-pointer"
              />
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
    if (files.length === 0) throw new Error('No file selected');
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
            <label className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold block">{t('options.position')}</label>
            <select
              value={position}
              onChange={(e: any) => setPosition(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-700"
            >
              <option value="bottom_center">{t('options.bottomCenter')}</option>
              <option value="bottom_left">{t('options.bottomLeft')}</option>
              <option value="bottom_right">{t('options.bottomRight')}</option>
              <option value="top_left">{t('options.topLeft')}</option>
              <option value="top_right">{t('options.topRight')}</option>
            </select>
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
    if (files.length === 0) throw new Error('No file selected');
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
          </div>
        </div>
      }
    />
  );
};
