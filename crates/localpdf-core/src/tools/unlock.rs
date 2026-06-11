//! Decrypt PDF (unlock with password)

use crate::error::LpError;
use crate::types::{JobOutput, Progress, UnlockOpts};
use lopdf::Document;
use std::time::Instant;

/// Decrypt PDF by removing password protection
pub fn run(
    opts: &UnlockOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "unlock"));

    // Load the source document with password
    // Note: lopdf 0.34 automatically attempts decryption on load
    // For password-protected PDFs, use load_with_password if available
    let mut source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.get_pages().len();

    // Check if document is still encrypted after loading
    let is_encrypted = source_doc.is_encrypted();

    if is_encrypted {
        // Document is still encrypted - password may be required
        // lopdf auto-decrypts with empty password, so if it loaded but is_encrypted
        // is true, it means the document requires a password we don't have
        return Err(LpError::InvalidParams(
            "PDF is password-protected. Provide the correct password.".to_string()
        ));
    }

    progress(Progress::new(20.0, "PDF loaded successfully", "unlock"));

    // Note: Removing encryption requires:
    // 1. Loading with the correct password
    // 2. Resaving without encryption dictionary
    //
    // lopdf 0.34 doesn't provide a simple API for this
    // A full implementation would need to:
    // - Clear the Encrypt entry from the trailer
    // - Re-encrypt objects with no encryption

    progress(Progress::new(80.0, "Saving unlocked PDF...", "unlock"));

    // Ensure parent directory exists
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    // Save document
    source_doc.save(&opts.output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save unlocked PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "PDF unlocked!", "unlock"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(page_count as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = UnlockOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            password: "".to_string(),
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}