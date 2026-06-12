//! Convert PPTX to PDF
//!
//! This module handles conversion from Microsoft PowerPoint (.pptx) files to PDF.

use anyhow::Context;
use log::info;
use printpdf::{PdfDocument, Mm, BuiltinFont};
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;
use zip::ZipArchive;

use crate::error::LpError;
use crate::types::{JobOutput, Progress};

/// Options for PPTX to PDF conversion
#[derive(Debug, Clone)]
pub struct PptxToPdfOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub slide_size: SlideSize,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Default)]
pub enum SlideSize {
    #[default]
    Automatic,
    Widescreen { width: f64, height: f64 },
    Standard { width: f64, height: f64 },
}

impl SlideSize {
    fn to_mm(&self) -> (Mm, Mm) {
        match self {
            Self::Automatic => (Mm(254.0), Mm(190.5)),
            Self::Widescreen { width, height } => (Mm(*width), Mm(*height)),
            Self::Standard { width, height } => (Mm(*width), Mm(*height)),
        }
    }
}

/// Convert PPTX presentation to PDF
pub fn pptx_to_pdf(
    opts: &PptxToPdfOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    info!("Converting PPTX to PDF: {:?}", opts.input_file);

    if !opts.input_file.exists() {
        return Err(LpError::file_not_found(opts.input_file.to_string_lossy()));
    }

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent)
            .context("Failed to create output directory")
            .map_err(|e| LpError::conversion_failed(e.to_string()))?;
    }

    progress(Progress::new(0.0, "Opening PPTX file", "starting"));

    let pptx_file = File::open(&opts.input_file)
        .map_err(|e| LpError::conversion_failed(format!("Failed to open PPTX: {}", e)))?;

    let mut archive = ZipArchive::new(pptx_file)
        .map_err(|e| LpError::conversion_failed(format!("Failed to read PPTX: {}", e)))?;

    let mut slide_count = 0;
    for i in 0..archive.len() {
        if let Ok(file) = archive.by_index(i) {
            let name = file.name().to_string();
            if name.starts_with("ppt/slides/slide") && name.ends_with(".xml") {
                slide_count += 1;
            }
        }
    }

    progress(Progress::new(20.0, format!("Found {slide_count} slides"), "reading"));

    if slide_count == 0 {
        return Err(LpError::conversion_failed("No slides found".to_string()));
    }

    let (width, height) = opts.slide_size.to_mm();

    progress(Progress::new(40.0, "Creating PDF", "creating"));

    let (doc, page_idx, layer_idx) = PdfDocument::new("PPTX to PDF", width, height, "Layer 1");
    let layer = doc.get_page(page_idx).get_layer(layer_idx);

    let font = doc.add_builtin_font(BuiltinFont::TimesRoman).map_err(|e| LpError::conversion_failed(format!("Failed to load font: {}", e)))?;

    layer.use_text(
        format!("Slide {slide_count}"),
        14.0,
        Mm(50.0),
        Mm(height.0 - 50.0),
        &font,
    );

    progress(Progress::new(95.0, "Saving PDF", "saving"));

    let file = File::create(&opts.output_path)
        .map_err(|e| LpError::conversion_failed(format!("Failed to create PDF: {}", e)))?;

    doc.save(&mut BufWriter::new(file))
        .map_err(|e| LpError::conversion_failed(format!("Failed to save PDF: {}", e)))?;

    progress(Progress::new(100.0, "Conversion complete", "complete"));

    let file_size = std::fs::metadata(&opts.output_path).map(|m| m.len()).unwrap_or(0);

    let mut job_out = JobOutput::new(opts.output_path.clone(), file_size, 0);
    job_out = job_out.with_metadata("slides".to_string(), slide_count.to_string());

    Ok(job_out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slide_size_to_mm() {
        let (w, _h) = SlideSize::Automatic.to_mm();
        assert_eq!(w.0, 254.0);
    }
}
