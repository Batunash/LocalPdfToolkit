import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MergeTool } from './MergeTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

// Mock dependencies
vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    merge: vi.fn(),
    selectFile: vi.fn(),
    getPdfInfo: vi.fn(),
    getSavePath: vi.fn(),
  },
}));

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../components/SortableFileList', () => ({
  SortableFileList: ({ files, onReorder }: any) => (
    <div data-testid="mock-sortable-list">
      {files.map((f: any) => f.name).join(', ')}
      <button onClick={() => onReorder([])}>Clear Order</button>
    </div>
  )
}));

describe('MergeTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MergeTool onBack={mockOnBack} />);
    expect(screen.getByText('categories.organize > options.standardAppend')).toBeDefined();
    expect(screen.getByText('options.standardAppendDesc')).toBeDefined();
  });

  it('calls handleMerge and uses tauriAdapter correctly', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test1.pdf', '/test2.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 1, sizeBytes: 1024, isEncrypted: false });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.merge).mockResolvedValue('/temp/merged_123.pdf');

    render(<MergeTool onBack={mockOnBack} />);

    // Add files to hit the process button
    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]); // click the first browse text
    
    // Wait for sortable list to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-sortable-list')).toBeDefined();
    });

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.getTempDir).toHaveBeenCalled();
      expect(tauriAdapter.merge).toHaveBeenCalledWith(
        ['/test1.pdf', '/test2.pdf'],
        expect.stringMatching(/\\merged_\d+\.pdf/),
        true
      );
      expect(screen.getByText('common.completed')).toBeDefined();
    });
  });

  it('calls onReorder inside optionsPanel', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test1.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 1, sizeBytes: 1024, isEncrypted: false });

    render(<MergeTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);

    await waitFor(() => {
      expect(screen.getByTestId('mock-sortable-list')).toBeDefined();
    });

    const clearBtn = screen.getByText('Clear Order');
    fireEvent.click(clearBtn);

    // After clearing order, the list should not be shown
    await waitFor(() => {
      expect(screen.queryByTestId('mock-sortable-list')).toBeNull();
    });
  });
});
