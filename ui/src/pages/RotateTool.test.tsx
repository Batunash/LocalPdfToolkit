import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RotateTool } from './RotateTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    rotate: vi.fn(),
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

vi.mock('../components/RangeInputEditor', () => ({
  RangeInputEditor: ({ onChange }: any) => (
    <div data-testid="mock-range-editor">
      <button onClick={() => onChange([{ id: '1', from: 1, to: 3 }, { id: '2', from: 5, to: 5 }])}>Change Range</button>
      <button onClick={() => onChange([{ id: '3', from: 0, to: 0 }])}>Invalid Range</button>
      <button onClick={() => onChange([])}>Empty Range</button>
    </div>
  )
}));

vi.mock('../components/PdfRangeVisualizer', () => ({
  PdfRangeVisualizer: ({ selectedRanges }: any) => (
    <div data-testid="mock-pdf-visualizer">{selectedRanges}</div>
  )
}));

describe('RotateTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and switches rotation angles', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false });

    render(<RotateTool onBack={mockOnBack} />);
    
    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    expect(screen.getByText('sidebar.edit > options.rotationAngle')).toBeDefined();
    
    // Switch angles
    fireEvent.click(screen.getByText('options.rotate180'));
    fireEvent.click(screen.getByText('options.rotate270'));
    fireEvent.click(screen.getByText('options.rotate90'));
  });

  it('calls handleRotate with all pages mode', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.rotate).mockResolvedValue('/temp/rotated_123.pdf');

    render(<RotateTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Default targetPages is all
    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.rotate).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\rotated_\d+/),
        null,
        90,
        true
      );
      expect(screen.getByText('common.completed')).toBeDefined();
    });
  });

  it('calls handleRotate with custom pages mode and valid ranges', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.rotate).mockResolvedValue('/temp/rotated_123.pdf');

    render(<RotateTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Switch to custom pages
    fireEvent.click(screen.getByText('options.specificPages'));
    
    // Change range using mock
    fireEvent.click(screen.getByText('Change Range'));

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      // 1-3 -> [1, 2, 3], 5-5 -> [5] (Wait, from=5 to=5 becomes "5" via getRangesString)
      // The mock splits "1-3, 5" and parsing adds [1, 2, 3, 5]
      expect(tauriAdapter.rotate).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\rotated_\d+/),
        [1, 2, 3, 5],
        90,
        true
      );
    });
    
    // Switch back to all pages
    fireEvent.click(screen.getByText('options.allPages'));
  });

  it('handles empty pageRangesStr gracefully', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.rotate).mockResolvedValue('/temp/rotated_123.pdf');

    render(<RotateTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    fireEvent.click(screen.getByText('options.specificPages'));
    
    // Create an empty range
    const emptyRangeBtn = screen.getByText('Empty Range');
    fireEvent.click(emptyRangeBtn);

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.rotate).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\rotated_\d+/),
        null, // When string is empty, pagesToRotate remains null
        90,
        true
      );
    });
  });

  it('handles invalid ranges in handleRotate gracefully', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.rotate).mockResolvedValue('/temp/rotated_123.pdf');

    render(<RotateTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    fireEvent.click(screen.getByText('options.specificPages'));
    fireEvent.click(screen.getByText('Invalid Range'));

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.rotate).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\rotated_\d+/),
        [],
        90,
        true
      );
    });
  });
});
