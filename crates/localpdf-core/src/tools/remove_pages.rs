//! Remove specific pages from a PDF

use crate::error::LpError;
use crate::types::{JobOutput, Progress, RemoveOpts};
use lopdf::Document;
use std::collections::HashSet;
use std::time::Instant;

/// Remove specified pages from a PDF
pub fn run(
    opts: &RemoveOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "remove_pages"));

    let source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.get_pages().len();
    let pages_to_remove: HashSet<u32> = opts.pages_to_remove
        .iter()
        .filter(|&&p| p >= 1 && p <= page_count as u32)
        .copied()
        .collect();

    let pages_to_keep = page_count - pages_to_remove.len();
    progress(Progress::new(20.0, format!("Keeping {} of {} pages", pages_to_keep, page_count), "remove_pages"));

    let mut output_doc = source_doc.clone();
    
    // lopdf's delete_pages expects a slice of page numbers (1-indexed)
    let pages_to_remove_vec: Vec<u32> = pages_to_remove.into_iter().collect();
    output_doc.delete_pages(&pages_to_remove_vec);
    // Optionally prune unused objects
    output_doc.prune_objects();

    progress(Progress::new(80.0, "Saving output...", "remove_pages"));

    // Ensure parent directory exists
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    output_doc.save(&opts.output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "Pages removed!", "remove_pages"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(pages_to_keep as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = RemoveOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            pages_to_remove: vec![1],
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}