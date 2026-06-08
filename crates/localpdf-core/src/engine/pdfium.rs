//! LoPDF engine wrapper for core PDF operations
//!
//! This module provides a pure Rust PDF implementation using lopdf.
//! For rendering pages to images, PDFium is recommended but requires
//! the PDFium binary to be installed separately.

use lopdf::Document;
use crate::error::LpError;
use std::path::Path;

/// High-level LoPDF engine wrapper
pub struct LoPdfEngine;

impl LoPdfEngine {
    /// Open a PDF document from a file path
    pub fn open_document(path: &Path) -> Result<Document, LpError> {
        Document::load(path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to load PDF: {}", e)))
    }

    /// Open a PDF document from bytes
    pub fn open_document_from_bytes(bytes: &[u8]) -> Result<Document, LpError> {
        Document::load_mem(bytes)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to load PDF from memory: {}", e)))
    }

    /// Create a new empty PDF document
    pub fn create_document() -> Result<Document, LpError> {
        Ok(Document::with_version("1.7"))
    }

    /// Save a document to a file
    pub fn save_document(doc: &mut Document, path: &Path) -> Result<(), LpError> {
        doc.save(path)
            .map(|_| ())
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))
    }

    /// Save a document to a buffer
    pub fn save_to_buffer(doc: &mut Document) -> Result<Vec<u8>, LpError> {
        // Save to a temp file and read back
        let temp_dir = tempfile::tempdir().map_err(|e| {
            LpError::PdfCorrupt(format!("Failed to create temp dir: {}", e))
        })?;
        let temp_path = temp_dir.path().join("temp.pdf");

        doc.save(&temp_path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))?;

        std::fs::read(&temp_path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to read buffer: {}", e)))
    }

    /// Get page count
    pub fn page_count(doc: &Document) -> usize {
        doc.get_pages().len()
    }

    /// Get page object IDs
    pub fn get_page_object_ids(doc: &Document) -> Vec<lopdf::ObjectId> {
        doc.get_pages()
            .into_iter()
            .map(|(_, id)| id)
            .collect()
    }

    /// Rebuild cross-reference table (for repair)
    pub fn rebuild_xref(_doc: &mut Document) -> Result<(), LpError> {
        // lopdf 0.34 doesn't expose rebuild_xref publicly
        // Full implementation would reconstruct xref from object_graph
        // For now, this is a placeholder
        Ok(())
    }

    /// Compress document streams
    pub fn compress_streams(doc: &mut Document) {
        doc.compress();
    }

    /// Check if document is encrypted
    pub fn is_encrypted(doc: &Document) -> bool {
        doc.is_encrypted()
    }

    /// Decrypt document - loads with password (stub)
    pub fn decrypt(path: &Path, _password: &str) -> Result<Document, LpError> {
        // Full implementation would use lopdf::LoadOptions with password
        // lopdf 0.34 auto-decrypts with empty password on load
        // For user-password PDFs, need LoadOptions with password (when available)
        Document::load(path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to decrypt PDF: {}", e)))
    }

    /// Encrypt document with password (stub - full implementation requires_OBJECTS)
    pub fn encrypt(
        _doc: &mut Document,
        _user_password: &[u8],
        _owner_password: Option<&[u8]>,
    ) -> Result<(), LpError> {
        // Note: lopdf doesn't have a simple encrypt API
        // Full implementation would create encryption dictionary and encrypt objects
        // For now, this is a placeholder that returns an error
        Err(LpError::PdfCorrupt("Encryption not yet implemented".to_string()))
    }

    /// Get page dimensions given object info
    pub fn get_page_size(_page_obj: (lopdf::ObjectId, &[u8])) -> (f32, f32) {
        // Default to A4 size - full implementation would parse MediaBox
        (595.0, 842.0)
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