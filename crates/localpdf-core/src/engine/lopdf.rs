//! Low-level PDF manipulation helpers using lopdf

use lopdf::Document;
use crate::error::LpError;
use std::path::Path;

/// Helper for lopdf-based operations
pub struct LoPdfHelper;

impl LoPdfHelper {
    /// Load a document for low-level manipulation
    pub fn load(path: &Path) -> Result<Document, LpError> {
        Document::load(path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to load PDF: {}", e)))
    }

    /// Load a document from memory
    pub fn load_from_memory(bytes: &[u8]) -> Result<Document, LpError> {
        Document::load_mem(bytes)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to load PDF from memory: {}", e)))
    }

    /// Save a document to a file
    pub fn save(doc: &mut Document, path: &Path) -> Result<(), LpError> {
        doc.save(path)
            .map(|_| ())
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))
    }

    /// Save a document to memory via temp file
    pub fn save_to_memory(doc: &mut Document) -> Result<Vec<u8>, LpError> {
        let temp_dir = tempfile::tempdir()
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to create temp dir: {}", e)))?;
        let temp_path = temp_dir.path().join("temp.pdf");
        doc.save(&temp_path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))?;
        std::fs::read(&temp_path)
            .map_err(|e| LpError::PdfCorrupt(format!("Failed to read buffer: {}", e)))
    }

    /// Rebuild cross-reference table (for repair)
    pub fn rebuild_xref(_doc: &mut Document) -> Result<(), LpError> {
        // lopdf 0.34 doesn't expose rebuild_xref or mark_obsolete publicly
        // Full implementation would reconstruct xref from object_graph
        // For now, this is a placeholder
        Ok(())
    }

    /// Get page object IDs (returns Vec of ObjectIds)
    pub fn get_page_objs(doc: &Document) -> Vec<lopdf::ObjectId> {
        doc.get_pages().into_values()
            .collect()
    }

    /// Compress document streams
    pub fn compress_streams(doc: &mut Document) {
        doc.compress();
    }

    /// Remove duplicate font objects
    pub fn deduplicate_fonts(_doc: &mut Document) {
        // Implementation TBD - requires font object analysis
    }

    /// Get encryption info
    pub fn is_encrypted(doc: &Document) -> bool {
        doc.is_encrypted()
    }

    /// Decrypt document (stub - lopdf auto-decrypts with empty password on load)
    pub fn decrypt(_doc: &mut Document, _password: &[u8]) -> Result<(), LpError> {
        // lopdf 0.34 automatically attempts decryption on load
        // For password-protected files, use load_with_password or LoadOptions
        // This is a placeholder
        Err(LpError::PdfCorrupt("Decryption with password not yet implemented".to_string()))
    }

    /// Encrypt document (stub)
    pub fn encrypt(
        _doc: &mut Document,
        _user_password: &[u8],
        _owner_password: Option<&[u8]>,
        _permissions: crate::types::EncryptionPermissions,
    ) -> Result<(), LpError> {
        // lopdf 0.34 doesn't have a simple encrypt API
        // Full implementation would create encryption dictionary and encrypt objects
        Err(LpError::PdfCorrupt("Encryption not yet implemented".to_string()))
    }

    /// Get document version
    pub fn get_version(doc: &Document) -> String {
        // doc.version is a String in lopdf 0.34
        doc.version.clone()
    }
}
