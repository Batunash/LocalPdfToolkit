import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SplitTool } from './SplitTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    split: vi.fn(),
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
      <button onClick={() => onChange([{ id: '1', from: 2, to: 4 }])}>Change Range</button>
    </div>
  )
}));

vi.mock('../components/PdfRangeVisualizer', () => ({
  PdfRangeVisualizer: ({ selectedRanges }: any) => (
    <div data-testid="mock-pdf-visualizer">{selectedRanges}</div>
  )
}));

describe('SplitTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and switches modes', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });

    render(<SplitTool onBack={mockOnBack} />);
    
    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Default mode is by_every
    expect(screen.getByText('options.splitInterval')).toBeDefined();
    
    // Change N pages
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '3' } });
    expect(screen.getByDisplayValue('3')).toBeDefined();

    // Switch to ranges
    fireEvent.click(screen.getByText('options.customRanges'));
    expect(screen.getByText('options.pageRanges')).toBeDefined();
    expect(screen.getByTestId('mock-range-editor')).toBeDefined();
    expect(screen.getByTestId('mock-pdf-visualizer')).toBeDefined();
    
    // Test visualizing the range string
    expect(screen.getByTestId('mock-pdf-visualizer').textContent).toBe('1-2');

    // Change range using mock
    fireEvent.click(screen.getByText('Change Range'));
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-pdf-visualizer').textContent).toBe('2-4');
    });

    // Switch back to every N pages
    fireEvent.click(screen.getByText('options.everyNPages'));
    expect(screen.getByText('options.splitInterval')).toBeDefined();
  });

  it('calls handleSplit with by_every mode', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.split).mockResolvedValue(['/temp/split_123/part1.pdf']);

    render(<SplitTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '5' } });

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.split).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\split_\d+/),
        'by_every',
        undefined,
        5,
        true
      );
      expect(screen.getByText('common.completed')).toBeDefined();
    });
  });

  it('calls handleSplit with by_ranges mode', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.split).mockResolvedValue(['/temp/split_123/part1.pdf']);

    render(<SplitTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Switch to ranges
    fireEvent.click(screen.getByText('options.customRanges'));

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.split).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\split_\d+/),
        'by_ranges',
        '1-2',
        undefined,
        true
      );
      expect(screen.getByText('common.completed')).toBeDefined();
    });
  });

  it('handles invalid nPages input gracefully', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });

    render(<SplitTool onBack={mockOnBack} />);
    
    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '-5' } });
    
    // Should clamp to 1
    expect(screen.getByDisplayValue('1')).toBeDefined();

    fireEvent.change(input, { target: { value: 'abc' } });
    
    // Should fallback to 1
    expect(screen.getByDisplayValue('1')).toBeDefined();
  });
});
