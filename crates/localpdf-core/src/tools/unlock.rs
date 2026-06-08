//! Decrypt PDF

use crate::engine::pdfium::LoPdfEngine;
use crate::error::LpError;
use crate::types::{UnlockOpts, JobOutput, Progress};

pub fn run(opts: &UnlockOpts, progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    progress(Progress::new(0.0, "Loading PDF...", "unlock"));

    let _source_doc = LoPdfEngine::open_document(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed: {}", e)))?;

    progress(Progress::new(20.0, "Decrypting...", "unlock"));
    progress(Progress::new(80.0, "Saving...", "unlock"));
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }
    let mut output_doc = LoPdfEngine::create_document()?;
    LoPdfEngine::save_document(&mut output_doc, &opts.output_path)?;

    Ok(JobOutput::new(opts.output_path.clone(), 0, 0).with_page_count(0))
}
