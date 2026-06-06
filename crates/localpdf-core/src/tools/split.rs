//! Split a PDF into multiple files

use crate::engine::pdfium::get_pdfium;
use crate::error::LpError;
use crate::types::{SplitOpts, SplitStrategy, PageRange, JobOutput, Progress};
use std::path::PathBuf;
use std::time::Instant;

/// Split a PDF according to the specified strategy
pub fn run(
    opts: &SplitOpts,
    progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    let start = Instant::now();
    let pdfium = get_pdfium();

    progress(Progress::new(0.0, "Loading PDF for split...", "split"));

    let source_doc = pdfium.load_pdf_from_file(&opts.input_file, None)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.pages().count();
    progress(Progress::new(10.0, &format!("PDF has {} pages", page_count), "split"));

    // Ensure output directory exists
    std::fs::create_dir_all(&opts.output_dir).map_err(LpError::Io)?;

    let outputs = match &opts.strategy {
        SplitStrategy::ByRanges => {
            split_by_ranges(&opts.input_file, &opts.output_dir, &opts.ranges, page_count, pdfium, progress)
        }
        SplitStrategy::ByEvery(n) => {
            split_by_every(&opts.input_file, &opts.output_dir, *n, page_count, pdfium, progress)
        }
        SplitStrategy::BySize(target_size) => {
            split_by_size(&opts.input_file, &opts.output_dir, *target_size, page_count, pdfium, progress)
        }
    }?;

    let processing_time = start.elapsed().as_millis() as u64;

    progress(Progress::new(100.0, "Split complete!", "split"));

    Ok(outputs)
}

fn split_by_ranges(
    input: &PathBuf,
    output_dir: &PathBuf,
    ranges: &Option<Vec<PageRange>>,
    page_count: usize,
    pdfium: &pdfium_render::prelude::Pdfium,
    progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    let ranges = ranges.as_ref()
        .ok_or_else(|| LpError::InvalidParams("ranges required for ByRanges strategy".to_string()))?;

    let mut outputs = Vec::new();

    for (idx, range) in ranges.iter().enumerate() {
        let progress_pct = (idx as f32 / ranges.len() as f32) * 100.0;
        progress(Progress::new(
            progress_pct,
            &format!("Extracting pages {}-{}", range.start, range.end),
            "split",
        ));

        let output_path = output_dir.join(format!("part_{}_{}.pdf", idx + 1, range.start));

        let mut new_doc = pdfium.create_pdf(None, None, None)
            .expect("Failed to create PDF document");

        let source_doc = pdfium.load_pdf_from_file(input, None)?;
        let source_pages = source_doc.pages();

        for page_num in range.start..=range.end {
            if page_num as usize <= page_count {
                let page_idx = page_num as usize - 1;
                let page = source_pages.get(page_idx).ok_or_else(|| {
                    LpError::InvalidParams(format!("Page {} out of range", page_num))
                })?;
                new_doc.pages().add().set_contents(page.contents());
            }
        }

        new_doc.save(&output_path)?;

        outputs.push(JobOutput::new(
            output_path,
            std::fs::metadata(&output_path)?.len(),
            0, // individual timing not tracked
        ));
    }

    Ok(outputs)
}

fn split_by_every(
    input: &PathBuf,
    output_dir: &PathBuf,
    pages_per_file: u32,
    page_count: usize,
    pdfium: &pdfium_render::prelude::Pdfium,
    progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    let mut outputs = Vec::new();
    let num_parts = (page_count as f32 / pages_per_file as f32).ceil() as usize;

    for part in 0..num_parts {
        let progress_pct = (part as f32 / num_parts as f32) * 100.0;
        progress(Progress::new(
            progress_pct,
            &format!("Creating part {} of {}", part + 1, num_parts),
            "split",
        ));

        let output_path = output_dir.join(format!("part_{}.pdf", part + 1));

        let mut new_doc = pdfium.create_pdf(None, None, None)
            .expect("Failed to create PDF document");

        let source_doc = pdfium.load_pdf_from_file(input, None)?;
        let source_pages = source_doc.pages();

        let start_page = part * pages_per_file as usize;
        let end_page = std::cmp::min(start_page + pages_per_file as usize, page_count);

        for page_idx in start_page..end_page {
            let page = source_pages.get(page_idx);
            new_doc.pages().add().set_contents(page.contents());
        }

        new_doc.save(&output_path)?;

        outputs.push(JobOutput::new(
            output_path,
            std::fs::metadata(&output_path)?.len(),
            0,
        ));
    }

    Ok(outputs)
}

fn split_by_size(
    _input: &PathBuf,
    _output_dir: &PathBuf,
    _target_size: u64,
    _page_count: usize,
    _pdfium: &pdfium_render::prelude::Pdfium,
    _progress: &dyn Fn(Progress),
) -> Result<Vec<JobOutput>, LpError> {
    // TBD - requires estimating file size per page
    Err(LpError::InvalidParams(
        "split_by_size not yet implemented".to_string()
    ))
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