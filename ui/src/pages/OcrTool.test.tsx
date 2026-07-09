import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OcrTool } from './OcrTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    ocr: vi.fn(),
    selectFile: vi.fn(),
    getPdfInfo: vi.fn(),
  },
}));

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('OcrTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and changes language/dpi', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });

    render(<OcrTool onBack={mockOnBack} />);

    // Select file
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Default language is 'eng'
    expect(screen.getByText('options.langEng')).toBeDefined();
    
    // Change language to 'tur'
    const turBtn = screen.getByText('options.langTur');
    fireEvent.click(turBtn);
    
    // Default DPI is 300
    expect(screen.getByText('300 DPI')).toBeDefined();
    
    // Change DPI to 150
    const dpi150 = screen.getByText('150 DPI');
    fireEvent.click(dpi150);
  });

  it('calls handleOcr and uses tauriAdapter correctly', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.ocr).mockResolvedValue('/temp/ocr_123.pdf');

    render(<OcrTool onBack={mockOnBack} />);

    // Select file
    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Change language to 'eng+tur'
    const engTurBtn = screen.getByText('options.langEngTur');
    fireEvent.click(engTurBtn);

    // Change DPI to 450
    const dpi450 = screen.getByText('450 DPI');
    fireEvent.click(dpi450);

    // Click process
    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.ocr).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\ocr_\d+\.pdf/),
        'eng+tur',
        450,
        true
      );
      expect(screen.getByText('common.completed')).toBeDefined();
    });
  });
});
