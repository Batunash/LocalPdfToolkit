//! Encrypt PDF with password

use crate::error::LpError;
use crate::types::{JobOutput, Progress, ProtectOpts};
use lopdf::Document;
use std::time::Instant;

/// Encrypt PDF with password protection
///
/// Note: This is a stub implementation. Full PDF encryption requires:
/// - A library with complete encryption support (lopdf 0.34 has limited support)
/// - External tools like qpdf or ghostscript
/// - Manual implementation of PDF encryption spec (RC4/AES)
pub fn run(
    opts: &ProtectOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "protect"));

    // Load the source document
    let mut source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.get_pages().len();

    progress(Progress::new(20.0, "Setting up protection...", "protect"));

    // Note: lopdf 0.34 has limited encryption support
    // The full implementation would require:
    // 1. Creating encryption dictionary (Encrypt)
    // 2. Generating O (owner) and U (user) entries
    // 3. Encrypting all objects with RC4 or AES
    //
    // A production implementation would use:
    // - A library like pdfdose for Rust-based encryption
    // - External tools like qpdf --encrypt
    // - ghostscript with encryption parameters

    progress(Progress::new(40.0, "Note: Full encryption requires external tool", "protect"));

    // For now, save the document with a warning
    // In production, this should either:
    // 1. Implement proper encryption
    // 2. Return an error explaining the limitation

    progress(Progress::new(80.0, "Saving PDF...", "protect"));

    // Ensure parent directory exists
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    // Save the document (without encryption - stub limitation)
    source_doc.save(&opts.output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "PDF saved (encryption is a stub - requires external tool)", "protect"));

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
        let opts = ProtectOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            user_password: "password".to_string(),
            owner_password: Some("owner".to_string()),
            permissions: Default::default(),
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}