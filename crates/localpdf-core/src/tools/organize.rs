//! Reorder and/or rotate pages in a PDF

use crate::error::LpError;
use crate::types::{JobOutput, OrganizeOpts, Progress};
use lopdf::Document;
use std::time::Instant;

/// Reorder and/or rotate pages in a PDF
pub fn run(
    opts: &OrganizeOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "organize"));

    let source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.get_pages().len();
    progress(Progress::new(20.0, format!("Organizing {} pages", page_count), "organize"));

    // Build the page order
    let order: Vec<u32> = if let Some(ref page_order) = opts.page_order {
        // Filter to valid page numbers (1-indexed)
        page_order
            .iter()
            .filter(|&&p| p >= 1 && p <= page_count as u32)
            .copied()
            .collect()
    } else {
        // Keep original order
        (1..=page_count as u32).collect()
    };

    // Create a new document with reordered pages
    let mut output_doc = Document::with_version("1.7");
    let source_pages = source_doc.get_pages();
    let mut page_refs: Vec<lopdf::Object> = Vec::new();

    for &page_num in &order {
        if let Some(&page_obj_id) = source_pages.get(&page_num)
            && let Ok(page_obj) = source_doc.get_object(page_obj_id) {
                let new_id = output_doc.new_object_id();
                let mut new_page = page_obj.clone();

                // Apply rotation if specified
                if let Some(ref rotations) = opts.page_rotations
                    && let Some(&rotation) = rotations.get(&page_num) {
                        // Set the Rotate entry in the page dictionary
                        if let Ok(dict) = new_page.as_dict_mut() {
                            dict.set(b"Rotate", lopdf::Object::Integer(rotation as i64));
                        }
                    }

                output_doc.objects.insert(new_id, new_page);
                page_refs.push(lopdf::Object::Reference(new_id));
            }
    }

    // Create Pages dictionary
    let mut pages_dict = lopdf::Dictionary::new();
    pages_dict.set(b"Type", lopdf::Object::Name(b"Pages".to_vec()));
    pages_dict.set(b"Kids", lopdf::Object::Array(page_refs.clone()));
    pages_dict.set(b"Count", lopdf::Object::Integer(page_refs.len() as i64));

    let pages_id = output_doc.add_object(pages_dict);

    // Create Catalog
    let mut catalog = lopdf::Dictionary::new();
    catalog.set(b"Type", lopdf::Object::Name(b"Catalog".to_vec()));
    catalog.set(b"Pages", lopdf::Object::Reference(pages_id));

    let catalog_id = output_doc.add_object(catalog);
    output_doc.trailer.set(b"Root", lopdf::Object::Reference(catalog_id));

    progress(Progress::new(90.0, "Saving output...", "organize"));

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

    progress(Progress::new(100.0, "Pages organized!", "organize"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(page_refs.len() as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = OrganizeOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            page_order: None,
            page_rotations: None,
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}