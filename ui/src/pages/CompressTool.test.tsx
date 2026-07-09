import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompressTool } from './CompressTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    compress: vi.fn(),
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

describe('CompressTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 1, sizeBytes: 1024, isEncrypted: false });

    render(<CompressTool onBack={mockOnBack} />);
    
    // Select file to show options
    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    expect(screen.getByText('categories.organize > options.compressionLevel')).toBeDefined();
    
    // Check if levels are rendered
    expect(screen.getByText('options.compressExtreme')).toBeDefined();
    expect(screen.getByText('options.compressHigh')).toBeDefined();
    expect(screen.getByText('options.compressBalanced')).toBeDefined();
    expect(screen.getByText('options.compressLow')).toBeDefined();
  });

  it('changes compression level when clicked', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 1, sizeBytes: 1024, isEncrypted: false });

    render(<CompressTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Default is balanced
    expect(screen.getByText('~50%')).toBeDefined();

    // Click Maximum
    fireEvent.click(screen.getByText('options.compressExtreme'));
    expect(screen.getByText('~85%')).toBeDefined();

    // Click High
    fireEvent.click(screen.getByText('options.compressHigh'));
    expect(screen.getByText('~70%')).toBeDefined();

    // Click Low
    fireEvent.click(screen.getByText('options.compressLow'));
    expect(screen.getByText('~20%')).toBeDefined();
  });

  it('calls handleCompress and uses tauriAdapter correctly', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 1, sizeBytes: 1024, isEncrypted: false });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.compress).mockResolvedValue('/temp/compressed_123.pdf');

    render(<CompressTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.getTempDir).toHaveBeenCalled();
      expect(tauriAdapter.compress).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\compressed_\d+\.pdf/),
        'balanced',
        true
      );
      expect(screen.getByText('common.completed')).toBeDefined();
    });
  });

  it('uses different compression level in handleCompress', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 1, sizeBytes: 1024, isEncrypted: false });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.compress).mockResolvedValue('/temp/compressed_123.pdf');

    render(<CompressTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Change to high
    fireEvent.click(screen.getByText('options.compressHigh'));

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.compress).toHaveBeenCalledWith(
        '/test.pdf',
        expect.any(String),
        'high',
        true
      );
    });
  });
});
