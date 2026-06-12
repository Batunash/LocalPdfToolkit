import React from 'react';
import { DropZone } from './DropZone';
import type { SelectedFile } from '../types';
import { useTranslation } from '../i18n';
import * as Icons from 'lucide-react';

interface BatchDropZoneProps {
  onFilesSelected: (files: SelectedFile[]) => void;
  acceptExtensions?: string[];
  descriptionText?: string;
}

export const BatchDropZone: React.FC<BatchDropZoneProps> = ({
  onFilesSelected,
  acceptExtensions = ['pdf'],
  descriptionText
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full">
      {/* Batch UI indicator */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
        <Icons.Copy className="w-3 h-3" />
        {t('common.batchMode' as any) || 'Batch Mode'}
      </div>
      
      <DropZone
        onFilesSelected={onFilesSelected}
        multiple={true}
        acceptExtensions={acceptExtensions}
        descriptionText={descriptionText || t('common.dropMultipleFiles' as any) || 'Drop multiple files here'}
      />
    </div>
  );
};
