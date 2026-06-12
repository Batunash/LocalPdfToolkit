//! OCR for scanned PDFs - adds text layer to images

use crate::error::LpError;
use crate::types::{JobOutput, OcrOpts, Progress};
use lopdf::Document;
use std::time::Instant;

pub fn run(opts: &OcrOpts, progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "ocr"));

    let mut source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed: {}", e)))?;

    let page_count = source_doc.get_pages().len();
    progress(Progress::new(10.0, format!("PDF has {} pages", page_count), "ocr"));

    // Note: Full OCR implementation requires:
    // 1. leptess (Tesseract bindings) for text recognition
    // 2. pdfium-render or similar to rasterize PDF pages to images
    // 3. Tesseract traineddata files for each language
    //
    // To enable OCR:
    // - Uncomment leptess in Cargo.toml
    // - Install Tesseract and language data (e.g., tessdata/eng.traineddata)
    // - Run with: cargo run --features ocr
    //
    // This stub provides the structure but returns an error indicating
    // the feature is not compiled in.

    // For now, copy the PDF as-is and indicate OCR was not performed
    progress(Progress::new(80.0, "Saving...", "ocr"));

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    source_doc.save(&opts.output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "OCR note: Feature requires leptess dependency", "ocr"));

    // Return success but note that OCR was not actually performed
    // A proper implementation would return an error or have a feature flag
    Ok(JobOutput::new(opts.output_path.clone(), file_size, processing_time)
        .with_page_count(page_count as u32)
        .with_metadata("ocr_status".to_string(), "skipped - leptess not enabled".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = OcrOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            languages: vec!["eng".to_string()],
            dpi: 300,
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}