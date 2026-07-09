import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProtectTool } from './ProtectTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    protect: vi.fn(),
    selectFile: vi.fn(),
    getPdfInfo: vi.fn(),
  },
}));

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ProtectTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and calls protect with correct options', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.protect).mockResolvedValue('/temp/protected.pdf');

    render(<ProtectTool onBack={mockOnBack} />);

    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    const passwordInput = screen.getByPlaceholderText('options.enterPassword');
    
    // Test showing password
    const allButtons = screen.getAllByRole('button');
    const toggleEye = allButtons.find(b => b.className.includes('absolute right-3'));
    if (toggleEye) {
      fireEvent.click(toggleEye);
      expect(passwordInput.getAttribute('type')).toBe('text');
      fireEvent.click(toggleEye);
      expect(passwordInput.getAttribute('type')).toBe('password');
    }

    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    // Toggle permissions (allowPrint is true by default, others false)
    // Find checkboxes by their visually hidden input or by label
    const printCheckbox = screen.getAllByRole('checkbox', { hidden: true })[0];
    const modifyCheckbox = screen.getAllByRole('checkbox', { hidden: true })[1];
    const copyCheckbox = screen.getAllByRole('checkbox', { hidden: true })[2];
    const annotateCheckbox = screen.getAllByRole('checkbox', { hidden: true })[3];

    fireEvent.click(printCheckbox); // false
    fireEvent.click(modifyCheckbox); // true
    fireEvent.click(copyCheckbox); // true
    fireEvent.click(annotateCheckbox); // true

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.protect).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\protected_\d+\.pdf/),
        'secret',
        undefined,
        false, // allowPrint
        true,  // allowModify
        true,  // allowCopy
        true,  // allowAnnotate
        true
      );
    });
  });

  it('throws error when password is empty', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: false, title: '', author: '', creator: '', producer: '' });

    render(<ProtectTool onBack={mockOnBack} />);

    const dropzone = screen.getAllByText('common.browse')[0];
    fireEvent.click(dropzone);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeDefined();
    });

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/common\.passwordEmpty/)).toBeDefined();
    });
  });
});
