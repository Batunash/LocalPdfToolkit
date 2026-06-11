import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import * as Icons from 'lucide-react';
import type { SelectedFile } from '../types';

interface SortableFileListProps {
  files: SelectedFile[];
  onReorder: (files: SelectedFile[]) => void;
}

export const SortableFileList: React.FC<SortableFileListProps> = ({ files, onReorder }) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedFiles = Array.from(files);
    const [movedFile] = reorderedFiles.splice(sourceIndex, 1);
    reorderedFiles.splice(destinationIndex, 0, movedFile);

    onReorder(reorderedFiles);
  };

  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="file-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {files.map((file, index) => (
                <Draggable key={file.path} draggableId={file.path} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${
                        snapshot.isDragging 
                          ? 'bg-zinc-50 dark:bg-zinc-800/80 border-indigo-400 dark:border-indigo-500 shadow-xl scale-[1.02] z-50' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <Icons.GripVertical className="w-4 h-4" />
                      </div>
                      
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                        <span className="text-xs font-black">{index + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-zinc-800 dark:text-zinc-200 text-xs font-bold truncate pr-2">
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-[10px] mt-0.5 font-medium truncate">
                          {file.pages && <span>{file.pages} pages</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
