//! Split a PDF into multiple files

use crate::error::LpError;
use crate::types::{JobOutput, Progress, SplitOpts, SplitStrategy, PageRange};
use lopdf::Document;
use std::path::Path;
use std::time::Instant;

/// Split a PDF according to the specified strategy
pub fn run(
    opts: &SplitOpts,
    progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF for split...", "split"));

    let source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.get_pages().len();
    progress(Progress::new(10.0, format!("PDF has {} pages", page_count), "split"));

    // Ensure output directory exists
    std::fs::create_dir_all(&opts.output_dir).map_err(LpError::Io)?;

    let outputs = match &opts.strategy {
        SplitStrategy::ByRanges => {
            split_by_ranges(&source_doc, &opts.input_file, &opts.output_dir, &opts.ranges, page_count, progress)
        }
        SplitStrategy::ByEvery(n) => {
            split_by_every(&source_doc, &opts.input_file, &opts.output_dir, *n, page_count, progress)
        }
        SplitStrategy::BySize(target_size) => {
            split_by_size(&source_doc, &opts.input_file, &opts.output_dir, *target_size, page_count, progress)
        }
    }?;

    let processing_time = start.elapsed().as_millis() as u64;
    let _ = processing_time; // Used for logging if needed

    progress(Progress::new(100.0, "Split complete!", "split"));

    Ok(outputs)
}

fn split_by_ranges(
    source_doc: &Document,
    input_file: &Path,
    output_dir: &Path,
    ranges: &Option<Vec<PageRange>>,
    page_count: usize,
    progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    let ranges = ranges.as_ref()
        .ok_or_else(|| LpError::InvalidParams("ranges required for ByRanges strategy".to_string()))?;

    let mut outputs = Vec::new();
    let total = ranges.len();

    for (idx, range) in ranges.iter().enumerate() {
        let progress_pct = (idx as f32 / total as f32) * 100.0;
        progress(Progress::new(
            progress_pct,
            format!("Extracting pages {}-{}", range.start, range.end),
            "split",
        ));

        let output_path = output_dir.join(format!("part_{}_{}_{}.pdf", idx + 1, range.start, range.end));

        // Extract the specified page range
        extract_page_range(source_doc, input_file, &output_path, range.start, range.end, page_count, progress)
            .map(|output| outputs.push(output))?;
    }

    Ok(outputs)
}

fn split_by_every(
    source_doc: &Document,
    input_file: &Path,
    output_dir: &Path,
    pages_per_file: u32,
    page_count: usize,
    progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    let mut outputs = Vec::new();
    let num_parts = (page_count as f32 / pages_per_file as f32).ceil() as usize;

    if num_parts == 0 {
        return Ok(outputs);
    }

    for part in 0..num_parts {
        let progress_pct = (part as f32 / num_parts as f32) * 100.0;
        progress(Progress::new(
            progress_pct,
            format!("Creating part {} of {}", part + 1, num_parts),
            "split",
        ));

        let start_page = (part * pages_per_file as usize) + 1;
        let end_page = ((part + 1) * pages_per_file as usize).min(page_count);
        let output_path = output_dir.join(format!("part_{}_{}.pdf", part + 1, end_page));

        extract_page_range(source_doc, input_file, &output_path, start_page as u32, end_page as u32, page_count, progress)
            .map(|output| outputs.push(output))?;
    }

    Ok(outputs)
}

fn split_by_size(
    source_doc: &Document,
    input_file: &Path,
    output_dir: &Path,
    _target_size: u64,
    page_count: usize,
    progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    // For simplicity, split by approximate page count based on average page size
    let avg_page_size = std::fs::metadata(input_file)
        .map(|m| m.len() / page_count as u64)
        .unwrap_or(10000); // Default 10KB per page

    let pages_per_file = if avg_page_size > 0 {
        (_target_size / avg_page_size).max(1) as u32
    } else {
        10
    };

    split_by_every(source_doc, input_file, output_dir, pages_per_file, page_count, progress)
}

/// Extract a range of pages from the source document
fn extract_page_range(
    source_doc: &Document,
    _input_file: &Path,
    output_path: &Path,
    start_page: u32,
    end_page: u32,
    total_pages: usize,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = std::time::Instant::now();

    progress(Progress::new(0.0, "Extracting pages...", "extract"));

    let mut output_doc = source_doc.clone();
    let mut pages_to_delete = Vec::new();

    for p in 1..=(total_pages as u32) {
        if p < start_page || p > end_page {
            pages_to_delete.push(p);
        }
    }

    output_doc.delete_pages(&pages_to_delete);
    output_doc.prune_objects();

    let page_count = end_page.saturating_sub(start_page) + 1;

    // Ensure output directory exists
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    // Save the extracted pages
    output_doc.save(output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save extracted PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    let progress_pct = 90.0;
    progress(Progress::new(progress_pct, format!("Saved {} pages", page_count), "extract"));

    Ok(JobOutput::new(
        output_path.to_path_buf(),
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
        let opts = SplitOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_dir: PathBuf::from("output"),
            strategy: SplitStrategy::ByEvery(10),
            ranges: None,
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}