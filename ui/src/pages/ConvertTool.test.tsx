import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvertTool } from './ConvertTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    convert: vi.fn(),
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

describe('ConvertTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for PDF input and switches formats', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });

    render(<ConvertTool onBack={mockOnBack} />);
    
    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    // Check formats
    fireEvent.click(screen.getByText('formats.excel'));
    fireEvent.click(screen.getByText('formats.powerpoint'));
    fireEvent.click(screen.getByText('formats.html'));
    fireEvent.click(screen.getByText('formats.png'));
    
    fireEvent.click(screen.getByText('formats.word'));
    
    // Switch to jpg to see options
    fireEvent.click(screen.getByText('formats.jpeg'));
    
    // Check DPI
    expect(screen.getByText('options.resolution')).toBeDefined();
    fireEvent.click(screen.getByText('150 DPI'));
    fireEvent.click(screen.getByText('450 DPI'));
    fireEvent.click(screen.getByText('300 DPI'));
    
    // Check Quality
    expect(screen.getByText('options.jpegQuality')).toBeDefined();
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });
  });

  it('renders correctly for non-PDF input', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.docx']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });

    render(<ConvertTool onBack={mockOnBack} />);
    
    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.docx')).toBeDefined();
    });

    // Only PDF format should be visible and disabled
    const pdfBtn = screen.getByText('formats.pdf');
    expect(pdfBtn).toBeDefined();
    expect(pdfBtn.closest('button')).toHaveProperty('disabled', true);
  });

  it('calls handleConvert with PDF input and jpg format', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.convert).mockResolvedValue('/temp/converted_123.jpg');

    render(<ConvertTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    fireEvent.click(screen.getByText('formats.jpeg'));
    fireEvent.click(screen.getByText('450 DPI'));

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '90' } });

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.convert).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\converted_\d+\.jpg/),
        'jpg',
        450,
        90,
        true
      );
      expect(screen.getByText('common.completed')).toBeDefined();
    });
  });

  it('calls handleConvert with non-PDF input', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.docx']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024 });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.convert).mockResolvedValue('/temp/converted_123.pdf');

    render(<ConvertTool onBack={mockOnBack} />);

    const dropzones = screen.getAllByText('common.browse');
    fireEvent.click(dropzones[0]);
    
    await waitFor(() => {
      expect(screen.getByText('test.docx')).toBeDefined();
    });

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.convert).toHaveBeenCalledWith(
        '/test.docx',
        expect.stringMatching(/\\converted_\d+\.pdf/),
        'pdf',
        300,
        85,
        true
      );
    });
  });
});
