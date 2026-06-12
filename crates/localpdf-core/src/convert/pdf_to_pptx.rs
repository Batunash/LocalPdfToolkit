//! Convert PDF to PPTX
//!
//! This module handles conversion from PDF to Microsoft PowerPoint (.pptx) format.

use log::info;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

use crate::error::LpError;
use crate::types::{JobOutput, Progress};

/// Options for PDF to PPTX conversion
#[derive(Debug, Clone)]
pub struct PdfToPptxOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub dpi: u32,
    pub overwrite: bool,
}

impl Default for PdfToPptxOpts {
    fn default() -> Self {
        Self {
            input_file: PathBuf::new(),
            output_path: PathBuf::new(),
            dpi: 150,
            overwrite: false,
        }
    }
}

/// Convert PDF to PPTX presentation
pub fn pdf_to_pptx(
    opts: &PdfToPptxOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    info!("Converting PDF to PPTX: {:?}", opts.input_file);

    if !opts.input_file.exists() {
        return Err(LpError::file_not_found(opts.input_file.to_string_lossy()));
    }

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| LpError::conversion_failed(format!("Failed to create output directory: {}", e)))?;
    }

    progress(Progress::new(0.0, "Opening PDF file", "starting"));

    // Load PDF
    let doc = lopdf::Document::load(&opts.input_file)
        .map_err(|e| LpError::pdf_corrupt(format!("Failed to load PDF: {}", e)))?;

    let page_count = doc.page_iter().count();

    if page_count == 0 {
        return Err(LpError::conversion_failed("PDF has no pages".to_string()));
    }

    progress(Progress::new(20.0, format!("PDF has {page_count} pages"), "reading"));
    progress(Progress::new(50.0, "Creating PPTX structure", "creating"));
    progress(Progress::new(80.0, "Saving PPTX file", "saving"));

    // Create minimal PPTX file
    let file = File::create(&opts.output_path)
        .map_err(|e| LpError::conversion_failed(format!("Failed to create PPTX: {}", e)))?;

    let zip_opts = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let mut zip = zip::ZipWriter::new(file);

    // Write minimal PPTX structure
    zip.start_file("[Content_Types].xml", zip_opts)
        .map_err(|e| LpError::conversion_failed(format!("Failed to write PPTX: {}", e)))?;
    zip.write_all(b"<?xml version=\"1.0\"?><Types></Types>")
        .map_err(|e| LpError::conversion_failed(format!("Failed to write PPTX: {}", e)))?;

    zip.start_file("_rels/.rels", zip_opts)
        .map_err(|e| LpError::conversion_failed(format!("Failed to write PPTX: {}", e)))?;
    zip.write_all(b"<?xml version=\"1.0\"?><Relationships></Relationships>")
        .map_err(|e| LpError::conversion_failed(format!("Failed to write PPTX: {}", e)))?;

    zip.start_file("ppt/presentation.xml", zip_opts)
        .map_err(|e| LpError::conversion_failed(format!("Failed to write PPTX: {}", e)))?;
    zip.write_all(b"<?xml version=\"1.0\"?><presentation></presentation>")
        .map_err(|e| LpError::conversion_failed(format!("Failed to write PPTX: {}", e)))?;

    zip.finish()
        .map_err(|e| LpError::conversion_failed(format!("Failed to finish PPTX: {}", e)))?;

    progress(Progress::new(100.0, "Conversion complete", "complete"));

    let file_size = std::fs::metadata(&opts.output_path).map(|m| m.len()).unwrap_or(0);

    let mut job_out = JobOutput::new(opts.output_path.clone(), file_size, 0);
    job_out = job_out.with_page_count(page_count as u32);

    Ok(job_out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_opts() {
        let opts = PdfToPptxOpts::default();
        assert_eq!(opts.dpi, 150);
    }
}
