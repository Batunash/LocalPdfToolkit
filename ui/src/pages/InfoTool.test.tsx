import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InfoTool } from './InfoTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getPdfInfo: vi.fn(),
    selectFile: vi.fn(),
  },
}));

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('InfoTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<InfoTool onBack={mockOnBack} />);
    expect(screen.getByText('options.properties')).toBeDefined();
    expect(screen.getByText('options.selectAnalyze')).toBeDefined();
  });

  it('handles empty files gracefully', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue([]);
    render(<InfoTool onBack={mockOnBack} />);
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);
    await waitFor(() => {
      expect(tauriAdapter.getPdfInfo).not.toHaveBeenCalled();
    });
  });

  it('displays metadata successfully for unprotected file', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({
      pages: 15,
      sizeBytes: 1024 * 1024 * 2.5, // 2.5 MB
      isEncrypted: false,
      title: 'Test Title',
      author: 'Test Author',
      creator: 'Test Creator',
      producer: 'Test Producer',
    });

    render(<InfoTool onBack={mockOnBack} />);
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
      expect(screen.getByText('15')).toBeDefined();
      expect(screen.getByText('2.5 MB')).toBeDefined();
      expect(screen.getByText('None (Unprotected)')).toBeDefined();
      expect(screen.getByText('Test Title')).toBeDefined();
      expect(screen.getByText('Test Author')).toBeDefined();
      expect(screen.getByText('Test Creator')).toBeDefined();
      expect(screen.getByText('Test Producer')).toBeDefined();
    });

    // Refresh file
    const refreshBtn = screen.getByText('options.refreshFile');
    fireEvent.click(refreshBtn);
    expect(screen.getByText('options.selectAnalyze')).toBeDefined();
  });

  it('displays metadata successfully for encrypted file and missing properties', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test2.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({
      pages: 1,
      sizeBytes: 0, // 0 Bytes
      isEncrypted: true,
      // title, author, creator, producer missing
    });

    render(<InfoTool onBack={mockOnBack} />);
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('test2.pdf')).toBeDefined();
      expect(screen.getByText('0 Bytes')).toBeDefined();
      expect(screen.getByText('AES Password Encrypted')).toBeDefined();
      expect(screen.getByText('Untitled')).toBeDefined();
      expect(screen.getByText('Unknown')).toBeDefined();
      expect(screen.getAllByText('Not Specified')).toHaveLength(2);
    });
  });

  it('handles errors when retrieving metadata', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/error.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockRejectedValue(new Error('Failed to read PDF'));

    render(<InfoTool onBack={mockOnBack} />);
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('common.failed')).toBeDefined();
      expect(screen.getByText('Error: Failed to read PDF')).toBeDefined();
    });

    // Retry
    const retryBtn = screen.getByText('common.retry');
    fireEvent.click(retryBtn);
    expect(screen.getByText('options.selectAnalyze')).toBeDefined();
  });
  
  it('shows loading state while retrieving metadata', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/loading.pdf']);
    
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(tauriAdapter.getPdfInfo)
      .mockResolvedValueOnce({ pages: 1, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' })
      .mockReturnValueOnce(promise as any);

    render(<InfoTool onBack={mockOnBack} />);
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);

    // Now isLoading is true and the promise hasn't resolved
    await waitFor(() => {
      expect(screen.getByText('common.processing')).toBeDefined();
    });

    // Cleanup
    resolvePromise({ pages: 1, sizeBytes: 1024 });
  });

  it('handles errors when retrieving metadata with empty string error', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/error.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockRejectedValue({ toString: () => '' });

    render(<InfoTool onBack={mockOnBack} />);
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('common.failed')).toBeDefined();
      expect(screen.getByText('Failed to retrieve PDF metadata.')).toBeDefined();
    });
  });
});
