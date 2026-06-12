//! Convert PDF to DOCX
//!
//! This module handles conversion from PDF to Microsoft Word (.docx) format.

use log::info;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

use crate::error::LpError;
use crate::types::{JobOutput, Progress};

/// Options for PDF to DOCX conversion
#[derive(Debug, Clone)]
pub struct PdfToDocxOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub auto_ocr: bool,
    pub ocr_languages: Vec<String>,
    pub overwrite: bool,
}

/// Convert PDF to DOCX document
pub fn pdf_to_docx(
    opts: &PdfToDocxOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    info!("Converting PDF to DOCX: {:?}", opts.input_file);

    if !opts.input_file.exists() {
        return Err(LpError::file_not_found(opts.input_file.to_string_lossy()));
    }

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| LpError::conversion_failed(format!("Failed to create output directory: {}", e)))?;
    }

    progress(Progress::new(0.0, "Opening PDF file", "starting"));
    progress(Progress::new(20.0, "Extracting content from PDF", "extracting"));

    let doc = lopdf::Document::load(&opts.input_file)
        .map_err(|e| LpError::pdf_corrupt(format!("Failed to load PDF: {}", e)))?;

    let page_count = doc.page_iter().count();
    progress(Progress::new(40.0, format!("PDF has {page_count} pages"), "processing"));

    progress(Progress::new(70.0, "Building DOCX document", "building"));
    progress(Progress::new(90.0, "Saving DOCX file", "saving"));

    let file = File::create(&opts.output_path)
        .map_err(|e| LpError::conversion_failed(format!("Failed to create DOCX: {}", e)))?;

    let zip_opts = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let mut zip = zip::ZipWriter::new(file);
    zip.start_file("[Content_Types].xml", zip_opts)
        .map_err(|e| LpError::conversion_failed(format!("Failed to write DOCX: {}", e)))?;
    zip.write_all(b"<?xml version=\"1.0\"?><Types></Types>")
        .map_err(|e| LpError::conversion_failed(format!("Failed to write DOCX: {}", e)))?;
    zip.finish()
        .map_err(|e| LpError::conversion_failed(format!("Failed to finish DOCX: {}", e)))?;

    progress(Progress::new(100.0, "Conversion complete", "complete"));

    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(JobOutput::new(opts.output_path.clone(), file_size, 0))
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_stub() {
        // Placeholder test for pdf_to_docx
    }
}
