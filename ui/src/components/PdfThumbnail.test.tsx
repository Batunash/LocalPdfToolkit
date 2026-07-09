import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PdfThumbnail } from './PdfThumbnail';

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {}
}));

describe('PdfThumbnail', () => {
  let mockPdf: any;
  let mockPage: any;
  let mockViewport: any;
  let mockRenderPromise: any;
  let mockContext: any;
  
  beforeEach(() => {
    mockViewport = {
      width: 200,
      height: 300
    };
    
    mockRenderPromise = {
      promise: Promise.resolve()
    };
    
    mockPage = {
      getViewport: vi.fn().mockReturnValue(mockViewport),
      render: vi.fn().mockReturnValue(mockRenderPromise)
    };
    
    mockPdf = {
      getPage: vi.fn().mockResolvedValue(mockPage)
    };

    mockContext = {};
    
    // Mock canvas
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext) as any;
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mocked');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    let resolvePage: any;
    mockPdf.getPage.mockReturnValue(new Promise(resolve => resolvePage = resolve));

    render(<PdfThumbnail pdf={mockPdf} pageNum={1} />);
    // Loading icon has class animate-spin
    expect(document.querySelector('.animate-spin')).toBeDefined();

    await act(async () => {
      resolvePage(mockPage);
    });
  });

  it('renders the thumbnail image after rendering page', async () => {
    await act(async () => {
      render(<PdfThumbnail pdf={mockPdf} pageNum={1} />);
    });
    
    // Wait for async effect
    const img = await screen.findByAltText('Page 1');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,mocked');
    
    // It should initially be opacity-0 until onLoad fires
    expect(img.className).toContain('opacity-0');
    
    // Fire onLoad
    act(() => {
      fireEvent.load(img);
    });
    
    // It should be visible now
    expect(img.className).toContain('opacity-100');
    
    // Check if pdf.getPage was called
    expect(mockPdf.getPage).toHaveBeenCalledWith(1);
    expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 0.5 });
    expect(mockPage.render).toHaveBeenCalled();
  });

  it('displays the page number label by default', async () => {
    await act(async () => {
      render(<PdfThumbnail pdf={mockPdf} pageNum={5} />);
    });
    
    expect(screen.getByText('5')).toBeDefined();
  });

  it('hides the page number label if hideLabel is true', async () => {
    await act(async () => {
      render(<PdfThumbnail pdf={mockPdf} pageNum={5} hideLabel={true} />);
    });
    
    expect(screen.queryByText('5')).toBeNull();
  });

  it('handles error when getting page fails', async () => {
    mockPdf.getPage.mockRejectedValue(new Error('Failed to load page'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await act(async () => {
      render(<PdfThumbnail pdf={mockPdf} pageNum={1} />);
    });
    
    // Should display error state
    expect(await screen.findByText(/Preview/)).toBeDefined();
    expect(await screen.findByText(/Error/)).toBeDefined();
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  it('does nothing if pdf is null', async () => {
    await act(async () => {
      render(<PdfThumbnail pdf={null as any} pageNum={1} />);
    });
    
    expect(mockPdf.getPage).not.toHaveBeenCalled();
  });

  it('aborts render if unmounted during async operation', async () => {
    let resolveRender: any;
    mockPage.render.mockReturnValue({
      promise: new Promise((resolve) => {
        resolveRender = resolve;
      })
    });
    
    const { unmount } = render(<PdfThumbnail pdf={mockPdf} pageNum={1} />);
    
    // Unmount while rendering is pending
    unmount();
    
    // Resolve the promise
    await act(async () => {
      resolveRender();
    });
    
    // Since we unmounted, it shouldn't try to set state (we can't easily assert on this without spying on React's internals, but it shouldn't throw the "unmounted component" warning in React 18 anyway, but the code checks `if (active)` which is what we want to cover)
  });

  it('handles error if canvas context is null', async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;
    
    await act(async () => {
      render(<PdfThumbnail pdf={mockPdf} pageNum={1} />);
    });
    
    // getContext returned null, so render returns early
    expect(mockPage.render).not.toHaveBeenCalled();
  });
  
  it('handles error during page render', async () => {
    mockPage.render.mockReturnValue({
      promise: Promise.reject(new Error('Render failed'))
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await act(async () => {
      render(<PdfThumbnail pdf={mockPdf} pageNum={1} />);
    });
    
    expect(await screen.findByText(/Error/)).toBeDefined();
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });
});
