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
            .map_err(|e| LpError::LoPdf(e))
    }

    /// Load a document from memory
    pub fn load_from_memory(bytes: &[u8]) -> Result<Document, LpError> {
        Document::load_mem(bytes)
            .map_err(|e| LpError::LoPdf(e))
    }

    /// Save a document to a file
    pub fn save(doc: &Document, path: &Path) -> Result<(), LpError> {
        doc.save(path)
            .map_err(|e| LpError::LoPdf(e))
    }

    /// Save a document to memory
    pub fn save_to_memory(doc: &Document) -> Result<Vec<u8>, LpError> {
        let mut buffer = Vec::new();
        doc.save_to_buffer(&mut buffer)
            .map_err(|e| LpError::LoPdf(e))?;
        Ok(buffer)
    }

    /// Rebuild cross-reference table (for repair)
    pub fn rebuild_xref(doc: &mut Document) -> Result<(), LpError> {
        doc.rebuild_xref()
            .map_err(|e| LpError::LoPdf(e))
    }

    /// Get page object IDs
    pub fn get_page_objs(doc: &Document) -> Vec<(lopdf::ObjectId, &'static [u8])> {
        doc.get_pages()
            .into_iter()
            .map(|(k, v)| (k, v))
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

    /// Decrypt document
    pub fn decrypt(doc: &mut Document, password: &[u8]) -> Result<(), LpError> {
        doc.decrypt(password)
            .map_err(|e| LpError::LoPdf(e))
    }

    /// Encrypt document with AES-256
    pub fn encrypt(
        doc: &mut Document,
        user_password: &[u8],
        owner_password: Option<&[u8]>,
        _permissions: crate::types::EncryptionPermissions,
    ) -> Result<(), LpError> {
        let owner = owner_password.unwrap_or(user_password);
        doc.encrypt(user_password, owner, lopdf::EncryptionAlgorithm::AES256)
            .map_err(|e| LpError::LoPdf(e))
    }

    /// Get document version
    pub fn get_version(doc: &Document) -> String {
        format!("{}.{}", doc.version / 10, doc.version % 10)
    }
}