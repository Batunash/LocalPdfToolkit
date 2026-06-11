//! Merge multiple PDFs into one

use crate::error::LpError;
use crate::types::{JobOutput, MergeOpts, Progress};
use lopdf::Document;
use std::time::Instant;

/// Merge multiple PDF files into a single PDF
pub fn run(
    opts: &MergeOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    if opts.input_files.is_empty() {
        return Err(LpError::InvalidParams("At least one input file required".to_string()));
    }

    progress(Progress::new(0.0, "Initializing merge...", "merge"));

    let total_files = opts.input_files.len();
    let mut total_pages: usize = 0;

    // Pre-calculate page counts
    let mut doc_info: Vec<(std::path::PathBuf, usize)> = Vec::new();
    for input_path in &opts.input_files {
        let source_doc = Document::load(input_path)
            .map_err(|e| LpError::PdfCorrupt(format!(
                "Failed to load '{}': {}",
                input_path.display(),
                e
            )))?;
        let page_count = source_doc.get_pages().len();
        total_pages += page_count;
        doc_info.push((input_path.clone(), page_count));
    }

    progress(Progress::new(30.0, "Creating merged document...", "merge"));

    // Use printpdf for creating the merged document (simpler API)
    // For now, create output using lopdf's direct object manipulation
    let mut merged_doc = Document::with_version("1.7");

    // Build the page tree structure manually
    // First, create a Pages object
    let mut all_page_objects: Vec<(lopdf::ObjectId, lopdf::Object)> = Vec::new();

    // Process each document
    for (doc_idx, (input_path, _page_count)) in doc_info.iter().enumerate() {
        progress(Progress::new(
            30.0 + (doc_idx as f32 / total_files as f32) * 50.0,
            &format!("Merging {} of {}: {} pages", doc_idx + 1, total_files, _page_count),
            "merge",
        ));

        let source_doc = Document::load(input_path)
            .map_err(|e| LpError::PdfCorrupt(format!(
                "Failed to load '{}': {}",
                input_path.display(),
                e
            )))?;

        // Get all page object IDs
        let page_ids: Vec<lopdf::ObjectId> = source_doc.get_pages()
            .values()
            .copied()
            .collect();

        // Copy page objects to merged document
        for page_obj_id in page_ids {
            if let Ok(page_obj) = source_doc.get_object(page_obj_id) {
                let new_id = merged_doc.new_object_id();
                // Clone the page object
                let new_page = page_obj.clone();
                // We'll update the parent reference later
                all_page_objects.push((new_id, new_page));
            }
        }

        // Note: Resources (fonts, images) are embedded in page content streams
        // A full implementation would copy resource dictionaries as well
    }

    // Create Pages dictionary
    let mut kids_array = Vec::new();
    for (page_id, _page_obj) in &all_page_objects {
        kids_array.push(lopdf::Object::Reference(*page_id));
    }

    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set(b"Type", lopdf::Object::Name(b"Pages".to_vec()));
    pages_dict.set(b"Kids", lopdf::Object::Array(kids_array));
    pages_dict.set(b"Count", lopdf::Object::Integer(all_page_objects.len() as i64));

    let pages_id = merged_doc.add_object(pages_dict);

    // Update page parent references
    for (page_id, _page_obj) in &mut all_page_objects {
        if let Ok(obj) = merged_doc.get_object_mut(*page_id) {
            if let Ok(dict) = obj.as_dict_mut() {
                dict.set(b"Parent", lopdf::Object::Reference(pages_id));
            }
        }
    }

    // Create Catalog
    let mut catalog_dict = lopdf::Dictionary::new();
    catalog_dict.set(b"Type", lopdf::Object::Name(b"Catalog".to_vec()));
    catalog_dict.set(b"Pages", lopdf::Object::Reference(pages_id));

    let catalog_id = merged_doc.add_object(catalog_dict);
    merged_doc.trailer.set(b"Root", lopdf::Object::Reference(catalog_id));

    progress(Progress::new(90.0, "Saving merged PDF...", "merge"));

    // Ensure parent directory exists
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    // Save document with incremental update for cleaner output
    merged_doc.save(&opts.output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save merged PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "Merge complete!", "merge"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(total_pages as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_empty_input_fails() {
        let opts = MergeOpts {
            input_files: vec![],
            output_path: PathBuf::from("output.pdf"),
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}