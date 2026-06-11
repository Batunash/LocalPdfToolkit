//! Rotate pages in a PDF

use crate::error::LpError;
use crate::types::{JobOutput, Progress, RotateOpts, RotationAngle};
use lopdf::Document;
use std::time::Instant;

/// Rotate pages in a PDF
pub fn run(
    opts: &RotateOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "rotate"));

    let source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.get_pages().len();
    let pages_to_rotate: Option<std::collections::HashSet<u32>> = opts.pages.as_ref()
        .map(|pages| {
            pages.iter()
                .filter(|&&p| p >= 1 && p <= page_count as u32)
                .copied()
                .collect()
        });

    progress(Progress::new(20.0, &format!("Rotating pages",), "rotate"));

    // Calculate the rotation angle in degrees
    let rotation_degrees = match opts.rotation {
        RotationAngle::Deg90 => 90,
        RotationAngle::Deg180 => 180,
        RotationAngle::Deg270 => 270,
    };

    // Create a new document with rotated pages
    let mut output_doc = Document::with_version("1.7");
    let source_pages = source_doc.get_pages();
    let mut page_refs: Vec<lopdf::Object> = Vec::new();

    for (page_num, page_obj_id) in &source_pages {
        if let Ok(page_obj) = source_doc.get_object(*page_obj_id) {
            let new_id = output_doc.new_object_id();
            let mut new_page = page_obj.clone();

            // Apply rotation if this page is in the rotation list (or all pages if none specified)
            let should_rotate = match &pages_to_rotate {
                Some(pages) => pages.contains(page_num),
                None => true, // Rotate all pages
            };

            if should_rotate {
                // Get current rotation and add the new rotation
                let current_rotation = source_pages.get(page_num)
                    .and_then(|&id| source_doc.get_object(id).ok())
                    .and_then(|o| o.as_dict().ok())
                    .and_then(|d| d.get(b"Rotate").ok())
                    .and_then(|r| r.as_i64().ok())
                    .unwrap_or(0) as u32;

                let new_rotation = (current_rotation + rotation_degrees) % 360;

                if let Ok(dict) = new_page.as_dict_mut() {
                    dict.set(b"Rotate", lopdf::Object::Integer(new_rotation as i64));
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

    progress(Progress::new(80.0, "Saving output...", "rotate"));

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

    progress(Progress::new(100.0, "Rotation complete!", "rotate"));

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
        let opts = RotateOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            pages: None,
            rotation: RotationAngle::Deg90,
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}