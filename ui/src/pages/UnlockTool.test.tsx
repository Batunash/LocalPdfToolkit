import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnlockTool } from './UnlockTool';
import { tauriAdapter } from '../adapters/tauriAdapter';

vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    getTempDir: vi.fn(),
    unlock: vi.fn(),
    selectFile: vi.fn(),
    getPdfInfo: vi.fn(),
  },
}));

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('UnlockTool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and calls unlock with correct password', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: true, title: '', author: '', creator: '', producer: '' });
    vi.mocked(tauriAdapter.getTempDir).mockResolvedValue('/temp');
    vi.mocked(tauriAdapter.unlock).mockResolvedValue('/temp/unlocked.pdf');

    render(<UnlockTool onBack={mockOnBack} />);

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

    const processBtn = screen.getByText('common.process');
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(tauriAdapter.unlock).toHaveBeenCalledWith(
        '/test.pdf',
        expect.stringMatching(/\\unlocked_\d+\.pdf/),
        'secret',
        true
      );
    });
  });

  it('throws error when password is empty', async () => {
    vi.mocked(tauriAdapter.selectFile).mockResolvedValue(['/test.pdf']);
    vi.mocked(tauriAdapter.getPdfInfo).mockResolvedValue({ pages: 10, sizeBytes: 1024, isEncrypted: true, title: '', author: '', creator: '', producer: '' });

    render(<UnlockTool onBack={mockOnBack} />);

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
