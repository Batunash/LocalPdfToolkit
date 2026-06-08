//! Convert images to PDF

use crate::engine::pdfium::LoPdfEngine;
use crate::error::LpError;
use crate::types::{JobOutput, Progress};
use std::path::PathBuf;

/// Options for image to PDF conversion
#[derive(Debug, Clone)]
pub struct ImageToPdfOpts {
    pub input_files: Vec<PathBuf>,
    pub output_path: PathBuf,
    pub page_size: String,
    pub margin: f64,
    pub overwrite: bool,
}

/// Convert images to a single PDF
pub fn images_to_pdf(
    opts: &ImageToPdfOpts,
    _progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    // Note: Full implementation would use printpdf to create PDF from images
    let _ = LoPdfEngine::create_document()?;

    Ok(JobOutput::new(
        opts.output_path.clone(),
        0,
        0,
    ))
}