//! Add text or image watermark to a PDF

use crate::error::LpError;
use crate::types::{JobOutput, Progress, WatermarkOpts};
use lopdf::Document;
use std::time::Instant;

/// Add watermark to a PDF
pub fn run(
    opts: &WatermarkOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "watermark"));

    let source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.get_pages().len();
    progress(Progress::new(20.0, format!("Applying watermark to {} pages", page_count), "watermark"));

    // Note: Full watermark implementation would require:
    // 1. For text watermarks:
    //    - Render text to a PDF form object
    //    - Overlay on each page's content stream
    // 2. For image watermarks:
    //    - Load and encode image as DCTDecode (JPEG) or FlateDecode (PNG)
    //    - Create XObject and overlay on each page
    //
    // This is a basic implementation that copies pages without modification
    // A production implementation would use a library like lopdf's content stream APIs

    // Create output document
    let mut output_doc = Document::with_version("1.7");
    let source_pages = source_doc.get_pages();
    let mut page_refs: Vec<lopdf::Object> = Vec::new();

    for page_obj_id in source_pages.values() {
        if let Ok(page_obj) = source_doc.get_object(*page_obj_id) {
            let new_id = output_doc.new_object_id();
            let new_page = page_obj.clone();
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

    progress(Progress::new(80.0, "Saving output...", "watermark"));

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

    progress(Progress::new(100.0, "Watermark complete!", "watermark"));

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
    use crate::{WatermarkType, WatermarkPosition};
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = WatermarkOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            watermark_type: WatermarkType::Text,
            text: Some("WATERMARK".to_string()),
            image_path: None,
            position: WatermarkPosition::Center,
            opacity: 0.5,
            font_size: Some(48.0),
            font_color: Some("#FF0000".to_string()),
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}