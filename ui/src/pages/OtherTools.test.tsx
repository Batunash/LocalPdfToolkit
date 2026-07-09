import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RemoveTool, RepairTool, WatermarkTool, PageNumbersTool, CropTool } from './OtherTools';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    removePages: vi.fn(),
    repair: vi.fn(),
    watermark: vi.fn(),
    pageNumbers: vi.fn(),
    crop: vi.fn(),
    selectFile: vi.fn(),
    getPdfInfo: vi.fn(),
  },
}));

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../components/PdfRangeVisualizer', () => ({
  PdfRangeVisualizer: () => <div data-testid="pdf-range-visualizer" />
}));

describe('OtherTools', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RemoveTool', () => {
    it('renders and calls removePages', async () => {
      vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
      vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });
      vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
      vi.mocked(tauriAdapter.removePages).mockResolvedValue('/temp/removed.pdf');

      render(<RemoveTool onBack={mockOnBack} />);
      
      const dropzone = screen.getAllByText('common.browse')[0];
      fireEvent.click(dropzone);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeDefined();
      });

      const processBtn = screen.getByText('common.process');
      fireEvent.click(processBtn);

      await waitFor(() => {
        expect(tauriAdapter.removePages).toHaveBeenCalledWith('/test.pdf', expect.stringMatching(/\\removed_\d+\.pdf/), '1', true);
      });
    });
  });

  describe('RepairTool', () => {
    it('renders and calls repair', async () => {
      vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
      vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });
      vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
      vi.mocked(tauriAdapter.repair).mockResolvedValue('/temp/repaired.pdf');

      render(<RepairTool onBack={mockOnBack} />);
      
      const dropzone = screen.getAllByText('common.browse')[0];
      fireEvent.click(dropzone);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeDefined();
      });

      const processBtn = screen.getByText('common.process');
      fireEvent.click(processBtn);

      await waitFor(() => {
        expect(tauriAdapter.repair).toHaveBeenCalledWith('/test.pdf', expect.stringMatching(/\\repaired_\d+\.pdf/), true);
      });
    });
  });

  describe('WatermarkTool', () => {
    it('renders and calls watermark with correct options', async () => {
      vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
      vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });
      vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
      vi.mocked(tauriAdapter.watermark).mockResolvedValue('/temp/watermarked.pdf');

      render(<WatermarkTool onBack={mockOnBack} />);
      
      const dropzone = screen.getAllByText('common.browse')[0];
      fireEvent.click(dropzone);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeDefined();
      });

      // Change text
      const input = screen.getByDisplayValue('CONFIDENTIAL');
      fireEvent.change(input, { target: { value: 'DRAFT' } });

      fireEvent.change(input, { target: { value: 'DRAFT' } });

      // Change position to diagonal
      const diagonalBtn = screen.getByText('options.diagonal');
      fireEvent.click(diagonalBtn);

      // Change opacity
      const opacitySlider = screen.getByRole('slider');
      fireEvent.change(opacitySlider, { target: { value: '0.5' } });

      // Change font size
      const fontSizeInput = screen.getByDisplayValue('50');
      fireEvent.change(fontSizeInput, { target: { value: '70' } });
      
      // Change color
      const colorInput = screen.getByDisplayValue('#6b7280');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      // Also click one of the preset color buttons
      const buttons = screen.getAllByRole('button');
      const presetColor = buttons.find(b => b.className.includes('w-5 h-5 rounded-full'));
      if (presetColor) fireEvent.click(presetColor);

      const processBtn = screen.getByText('common.process');
      fireEvent.click(processBtn);

      await waitFor(() => {
        expect(tauriAdapter.watermark).toHaveBeenCalled();
        const args = vi.mocked(tauriAdapter.watermark).mock.calls[0];
        expect(args[0]).toBe('/test.pdf');
        expect(args[2]).toBe('DRAFT');
        expect(args[3]).toBe('diagonal');
        expect(args[4]).toBe(0.5);
        expect(args[6]).toBe(70);
      });
    });

    it('throws error when text is empty', async () => {
      vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
      vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });

      render(<WatermarkTool onBack={mockOnBack} />);
      
      const dropzone = screen.getAllByText('common.browse')[0];
      fireEvent.click(dropzone);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeDefined();
      });

      const input = screen.getByDisplayValue('CONFIDENTIAL');
      fireEvent.change(input, { target: { value: '' } });

      const processBtn = screen.getByText('common.process');
      fireEvent.click(processBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/common\.watermarkEmpty/)).toBeDefined();
      });
    });
  });

  describe('PageNumbersTool', () => {
    it('renders and calls pageNumbers with correct options', async () => {
      vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
      vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });
      vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
      vi.mocked(tauriAdapter.pageNumbers).mockResolvedValue('/temp/numbered.pdf');

      render(<PageNumbersTool onBack={mockOnBack} />);
      
      const dropzone = screen.getAllByText('common.browse')[0];
      fireEvent.click(dropzone);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeDefined();
      });

      // We need to find the buttons for positions. We can select by looking for '1' span inside buttons
      const ones = screen.getAllByText('1');
      // The 5th '1' should be bottom_center, let's click top_left (0th)
      fireEvent.click(ones[0]); // top_left
      fireEvent.click(ones[1]); // top_right
      fireEvent.click(ones[2]); // bottom_left
      fireEvent.click(ones[3]); // bottom_right
      fireEvent.click(ones[4]); // bottom_center

      // Change format
      const selectFormat = screen.getByDisplayValue('options.singleNumber');
      fireEvent.change(selectFormat, { target: { value: 'Fraction' } });

      // Change font size
      const fontSizeInput = screen.getByDisplayValue('12');
      fireEvent.change(fontSizeInput, { target: { value: '16' } });

      const processBtn = screen.getByText('common.process');
      fireEvent.click(processBtn);

      await waitFor(() => {
        expect(tauriAdapter.pageNumbers).toHaveBeenCalledWith('/test.pdf', expect.stringMatching(/\\numbered_\d+\.pdf/), 'bottom_center', 'Fraction', 1, 16, true);
      });
    });
  });

  describe('CropTool', () => {
    it('renders and calls crop with correct options', async () => {
      vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
      vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });
      vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
      vi.mocked(tauriAdapter.crop).mockResolvedValue('/temp/cropped.pdf');

      render(<CropTool onBack={mockOnBack} />);
      
      const dropzone = screen.getAllByText('common.browse')[0];
      fireEvent.click(dropzone);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeDefined();
      });

      // Change margins
      const inputs = screen.getAllByDisplayValue('20');
      fireEvent.change(inputs[0], { target: { value: '30' } }); // top
      fireEvent.change(inputs[1], { target: { value: '40' } }); // bottom
      fireEvent.change(inputs[2], { target: { value: '10' } }); // left
      fireEvent.change(inputs[3], { target: { value: '15' } }); // right

      // Change unit
      const unitSelect = screen.getByDisplayValue('options.points');
      fireEvent.change(unitSelect, { target: { value: 'percentage' } });

      const processBtn = screen.getByText('common.process');
      fireEvent.click(processBtn);

      await waitFor(() => {
        expect(tauriAdapter.crop).toHaveBeenCalledWith('/test.pdf', expect.stringMatching(/\\cropped_\d+\.pdf/), 10, 30, 15, 40, 'percentage', true);
      });
    });
  });
});
