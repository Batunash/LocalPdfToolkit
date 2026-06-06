//! PDFium engine wrapper for high-level PDF operations

use pdfium_render::prelude::*;
use std::sync::OnceLock;
use crate::error::LpError;

/// Global PDFium instance singleton
static PDFIUM: OnceLock<Pdfium> = OnceLock::new();

pub fn get_pdfium() -> &'static Pdfium {
    PDFIUM.get_or_init(|| {
        Pdfium::new(Pdfium::load_pdfium())
    })
}

/// High-level PDFium engine wrapper
pub struct PdfiumEngine;

impl PdfiumEngine {
    /// Open a PDF document from a file path
    pub fn open_document(path: &std::path::Path) -> Result<PdfDocument, LpError> {
        let pdfium = get_pdfium();
        pdfium
            .load_pdf_from_file(path, None)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to load PDF: {}", e)))
    }

    /// Open a PDF document from bytes
    pub fn open_document_from_bytes(bytes: &[u8]) -> Result<PdfDocument, LpError> {
        let pdfium = get_pdfium();
        pdfium
            .load_pdf_from_all(bytes, None)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to load PDF: {}", e)))
    }

    /// Render a PDF page to an image
    pub fn render_page(
        page: &PdfPage,
        dpi: u32,
        format: ImageFormat,
        quality: Option<u8>,
    ) -> Result<PdfBitmap, LpError> {
        let mut render_settings = PdfPageRenderSettings::new(dpi);
        render_settings.set_format(format);
        if let Some(quality) = quality {
            render_settings.set_jpeg_quality(quality);
        }

        page.render_with_settings(&render_settings)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to render page: {}", e)))
    }

    /// Create a new PDF document
    pub fn create_document(page_width: f32, page_height: f32) -> PdfDocument {
        let pdfium = get_pdfium();
        pdfium.create_new_pdf()
            .expect("Failed to create PDF document")
    }

    /// Save a document to a file
    pub fn save_document(doc: &PdfDocument, path: &std::path::Path) -> Result<(), LpError> {
        doc.save_to_file(path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))
    }

    /// Get document metadata
    pub fn get_metadata(doc: &PdfDocument) -> Result<PdfMetadata, LpError> {
        doc.metadata()
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to get PDF metadata: {}", e)))
    }

    /// Get page count
    pub fn page_count(doc: &PdfDocument) -> usize {
        doc.pages().count()
    }

    /// Get page dimensions
    pub fn get_page_size(page: &PdfPage) -> (f32, f32) {
        let size = page.size();
        (size.width, size.height)
    }
}

/// PDF compression settings
pub struct CompressSettings {
    pub jpeg_quality: u8,
    pub png_compression: u8,
    pub deflate_level: u8,
    pub linearize: bool,
}

impl Default for CompressSettings {
    fn default() -> Self {
        Self {
            jpeg_quality: 80,
            png_compression: 6,
            deflate_level: 6,
            linearize: true,
        }
    }
}