//! Repair corrupt PDF

use crate::engine::pdfium::LoPdfEngine;
use crate::error::LpError;
use crate::types::{RepairOpts, JobOutput, Progress};

pub fn run(opts: &RepairOpts, progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    progress(Progress::new(0.0, "Loading PDF...", "repair"));

    let mut source_doc = LoPdfEngine::open_document(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed: {}", e)))?;

    progress(Progress::new(20.0, "Attempting repair...", "repair"));
    LoPdfEngine::rebuild_xref(&mut source_doc).ok();

    progress(Progress::new(80.0, "Saving...", "repair"));
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }
    LoPdfEngine::save_document(&mut source_doc, &opts.output_path)?;

    Ok(JobOutput::new(opts.output_path.clone(), 0, 0).with_page_count(0))
}
