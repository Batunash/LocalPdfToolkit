//! Crop PDF pages

use crate::error::LpError;
use crate::types::{CropOpts, CropUnit, JobOutput, Progress};
use lopdf::Document;
use std::time::Instant;

pub fn run(opts: &CropOpts, progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    let start = Instant::now();

    progress(Progress::new(0.0, "Loading PDF...", "crop"));

    let source_doc = Document::load(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed: {}", e)))?;

    let page_count = source_doc.get_pages().len();
    progress(Progress::new(20.0, &format!("Cropping {} pages", page_count), "crop"));

    // Create output document
    let mut output_doc = Document::with_version("1.7");
    let source_pages = source_doc.get_pages();
    let mut page_refs: Vec<lopdf::Object> = Vec::new();

    for (page_num, page_obj_id) in &source_pages {
        if let Ok(page_obj) = source_doc.get_object(*page_obj_id) {
            let new_id = output_doc.new_object_id();
            let mut new_page = page_obj.clone();

            // Apply crop box modification
            if let Ok(dict) = new_page.as_dict_mut() {
                // Get original page size via MediaBox
                let media_box = dict.get(b"MediaBox")
                    .ok()
                    .and_then(|o| o.as_array().ok())
                    .map(|arr| {
                        let coords: Vec<f64> = arr.iter().filter_map(|o| o.as_i64().ok().map(|i| i as f64)).collect();
                        if coords.len() >= 4 {
                            (coords[0], coords[1], coords[2], coords[3])
                        } else {
                            (0.0, 0.0, 595.0, 842.0) // Default A4
                        }
                    })
                    .unwrap_or((0.0, 0.0, 595.0, 842.0));

                let (ml, mb, mr, mt) = media_box;
                let width = mr - ml;
                let height = mt - mb;

                // Calculate crop margins in points
                let (top, bottom, left, right) = match opts.unit {
                    CropUnit::Points => {
                        (opts.margins.top as f64, opts.margins.bottom as f64, opts.margins.left as f64, opts.margins.right as f64)
                    }
                    CropUnit::Percentage => {
                        (
                            height * (opts.margins.top as f64 / 100.0),
                            height * (opts.margins.bottom as f64 / 100.0),
                            width * (opts.margins.left as f64 / 100.0),
                            width * (opts.margins.right as f64 / 100.0),
                        )
                    }
                };

                // Calculate new MediaBox (crop box)
                let new_ml = ml + left;
                let new_mb = mb + bottom;
                let new_mr = mr - right;
                let new_mt = mt - top;

                // Set CropBox
                let crop_box = lopdf::Object::Array(vec![
                    lopdf::Object::Real(new_ml as f32),
                    lopdf::Object::Real(new_mb as f32),
                    lopdf::Object::Real(new_mr as f32),
                    lopdf::Object::Real(new_mt as f32),
                ]);
                dict.set(b"CropBox", crop_box);
            }

            output_doc.objects.insert(new_id, new_page);
            page_refs.push(lopdf::Object::Reference(new_id));
            let _ = page_num; // Page number available for progress tracking
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

    progress(Progress::new(80.0, "Saving...", "crop"));

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    output_doc.save(&opts.output_path)
        .map(|_| ())
        .map_err(|e| LpError::PdfCorrupt(format!("Failed: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "Crop complete!", "crop"));

    Ok(JobOutput::new(opts.output_path.clone(), file_size, processing_time).with_page_count(page_refs.len() as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = CropOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            margins: CropMargins { top: 10.0, bottom: 10.0, left: 10.0, right: 10.0 },
            unit: CropUnit::Points,
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}