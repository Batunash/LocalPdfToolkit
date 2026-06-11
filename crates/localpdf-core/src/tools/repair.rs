//! Repair corrupt PDF by rebuilding document structure

use crate::error::LpError;
use crate::types::{JobOutput, Progress, RepairOpts};
use lopdf::Document;
use std::time::Instant;

pub fn run(opts: &RepairOpts, progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "repair"));

    // Try to load the document
    // lopdf automatically attempts to repair minor issues on load
    let mut source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to load PDF: {}", e)))?;

    let page_count = source_doc.get_pages().len();
    progress(Progress::new(20.0, &format!("PDF has {} pages, attempting repair...", page_count), "repair"));

    // Repair strategies:
    // 1. Rebuild cross-reference table (lopdf does this on save)
    // 2. Compress streams to fix corruption
    // 3. Remove obsolete objects
    // 4. Reconstruct document catalog if needed

    // Strategy 1: Compress all streams (helps with some corruption)
    progress(Progress::new(40.0, "Compressing streams...", "repair"));
    source_doc.compress();

    // Strategy 2: Prune unused objects
    progress(Progress::new(60.0, "Pruning unused objects...", "repair"));
    source_doc.prune_objects();

    // Note: Full repair implementation would:
    // - Parse raw PDF structure to identify issues
    // - Rebuild damaged object tables
    // - Attempt to extract and recover page content
    // - Handle truncated files
    //
    // For lopdf 0.34, the best we can do is:
    // - Load (which auto-repairs some issues)
    // - Re-save (which rebuilds xref table)
    // - Compress streams (fixes some corruption)

    progress(Progress::new(80.0, "Saving repaired PDF...", "repair"));

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    // Save with linearization disabled for better repair chances
    source_doc.save(&opts.output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save repaired PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "Repair complete!", "repair"));

    Ok(JobOutput::new(opts.output_path.clone(), file_size, processing_time).with_page_count(page_count as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = RepairOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}