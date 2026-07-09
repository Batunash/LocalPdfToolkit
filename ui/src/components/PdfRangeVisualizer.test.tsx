import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PdfRangeVisualizer } from './PdfRangeVisualizer';
import { tauriAdapter } from '../adapters/tauriAdapter';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {}
}));

// Mock PdfThumbnail since it is tested separately
vi.mock('./PdfThumbnail', () => ({
  PdfThumbnail: ({ pageNum }: any) => <div data-testid={`thumbnail-${pageNum}`}>Thumbnail {pageNum}</div>
}));

// Mock tauriAdapter
vi.mock('../adapters/tauriAdapter', () => ({
  tauriAdapter: {
    readFile: vi.fn(),
    isTauri: vi.fn()
  }
}));

import * as pdfjsLib from 'pdfjs-dist';

describe('PdfRangeVisualizer', () => {
  let mockPdf: any;

  beforeEach(() => {
    mockPdf = { numPages: 20 };
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({ promise: Promise.resolve(mockPdf) } as any);
    vi.mocked(tauriAdapter.readFile).mockResolvedValue(new Uint8Array([1, 2, 3]));
    vi.mocked(tauriAdapter.isTauri).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing if filePath is empty', () => {
    const { container } = render(<PdfRangeVisualizer filePath="" selectedRanges="1-5" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing if selectedRanges is empty', () => {
    const { container } = render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('parses ranges and renders thumbnails correctly', async () => {
    render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="1-5, 6, 7-10" />);
    
    // Initially shows loading
    expect(screen.getByText('Parsing Document...')).toBeDefined();

    // Wait for async load to finish
    await waitFor(() => {
      expect(screen.queryByText('Parsing Document...')).toBeNull();
    });

    // Check if the ranges were parsed and thumbnails rendered
    expect(screen.getByText('Range 1')).toBeDefined();
    expect(screen.getByTestId('thumbnail-1')).toBeDefined();
    expect(screen.getByTestId('thumbnail-5')).toBeDefined();

    expect(screen.getByText('Range 2')).toBeDefined();
    expect(screen.getByTestId('thumbnail-6')).toBeDefined();
    // Range 2 has start === end, so only one thumbnail

    expect(screen.getByText('Range 3')).toBeDefined();
    expect(screen.getByTestId('thumbnail-7')).toBeDefined();
    expect(screen.getByTestId('thumbnail-10')).toBeDefined();
  });

  it('handles invalid range parsing gracefully', async () => {
    render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="invalid-range, 1-abc, -" />);
    
    // Wait for load
    await waitFor(() => {
      expect(screen.queryByText('Parsing Document...')).toBeNull();
    });
    
    // No ranges should be rendered because parseInt will be NaN for these
    expect(screen.queryByText(/Range/)).toBeNull();
  });

  it('caps invalid bounds to available pages', async () => {
    render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="0-50" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Parsing Document...')).toBeNull();
    });

    // 0 should be capped to 1
    expect(screen.getByTestId('thumbnail-1')).toBeDefined();
    // 50 should be capped to 20
    expect(screen.getByTestId('thumbnail-20')).toBeDefined();
  });

  it('handles readFile error', async () => {
    vi.mocked(tauriAdapter.readFile).mockRejectedValue(new Error('File read failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="1-5" />);
    
    await waitFor(() => {
      expect(screen.getByText('File read failed')).toBeDefined();
    });

    consoleError.mockRestore();
  });

  it('handles getDocument error', async () => {
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.reject(new Error('Invalid PDF format'))
    } as any);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="1-5" />);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid PDF format')).toBeDefined();
    });

    consoleError.mockRestore();
  });

  it('handles empty file data in Tauri mode', async () => {
    vi.mocked(tauriAdapter.readFile).mockResolvedValue(new Uint8Array(0));
    vi.mocked(tauriAdapter.isTauri).mockReturnValue(true);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="1-5" />);
    
    await waitFor(() => {
      expect(screen.getByText('Could not read file')).toBeDefined();
    });

    consoleError.mockRestore();
  });

  it('mocks 10 pages when file is empty in Mock mode', async () => {
    vi.mocked(tauriAdapter.readFile).mockResolvedValue(new Uint8Array(0));
    vi.mocked(tauriAdapter.isTauri).mockReturnValue(false);

    render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="1-15" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Parsing Document...')).toBeNull();
    });

    // Since mock mode sets numPages to 10, the end page should be capped to 10 instead of 15
    // But in mock mode, pdfDoc will be null, so it renders the fallback span, not the PdfThumbnail
    
    // The fallback span should contain '10'
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    // Check that we didn't render PdfThumbnail because pdfDoc is null
    expect(screen.queryByTestId('thumbnail-1')).toBeNull();
  });

  it('aborts render if unmounted during async operation', async () => {
    let resolveRead: any;
    vi.mocked(tauriAdapter.readFile).mockReturnValue(new Promise(resolve => resolveRead = resolve));
    
    const { unmount } = render(<PdfRangeVisualizer filePath="test.pdf" selectedRanges="1-5" />);
    
    unmount();
    
    await act(async () => {
      resolveRead(new Uint8Array([1]));
    });
    
    // We can't directly check state since it's unmounted, but we should not get an act warning
  });
});
