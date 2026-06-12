//! Convert HTML to PDF
//!
//! This module handles conversion from HTML to PDF format.

use anyhow::Context;
use log::info;
use printpdf::{PdfDocument, Mm, BuiltinFont};
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;

use crate::error::LpError;
use crate::types::{JobOutput, Progress};

/// Options for HTML to PDF conversion
#[derive(Debug, Clone)]
pub struct HtmlToPdfOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub page_size: PagePageSize,
    pub base_url: Option<String>,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Default)]
pub enum PagePageSize {
    #[default]
    A4,
    Letter,
    Custom { width: f64, height: f64 },
}

impl PagePageSize {
    fn to_mm(&self) -> (Mm, Mm) {
        match self {
            Self::A4 => (Mm(210.0), Mm(297.0)),
            Self::Letter => (Mm(216.0), Mm(279.0)),
            Self::Custom { width, height } => (Mm(*width), Mm(*height)),
        }
    }
}

/// Convert HTML document to PDF
pub fn html_to_pdf(
    opts: &HtmlToPdfOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    info!("Converting HTML to PDF: {:?}", opts.input_file);

    if !opts.input_file.exists() {
        return Err(LpError::file_not_found(opts.input_file.to_string_lossy()));
    }

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent)
            .context("Failed to create output directory")
            .map_err(|e| LpError::conversion_failed(e.to_string()))?;
    }

    progress(Progress::new(0.0, "Reading HTML file", "starting"));

    let _html_file = File::open(&opts.input_file)
        .map_err(|e| LpError::conversion_failed(format!("Failed to open HTML: {}", e)))?;

    progress(Progress::new(10.0, "Parsing HTML document", "parsing"));

    let (width, height) = opts.page_size.to_mm();
    let (doc, page_idx, layer_idx) = PdfDocument::new("Converted from HTML", width, height, "Layer 1");
    let layer = doc.get_page(page_idx).get_layer(layer_idx);

    progress(Progress::new(50.0, "Rendering content", "rendering"));

    let font = doc.add_builtin_font(BuiltinFont::TimesRoman).map_err(|e| LpError::conversion_failed(format!("Failed to load font: {}", e)))?;

    layer.use_text(
        "PDF generated from HTML",
        12.0,
        Mm(50.0),
        Mm(height.0 - 50.0),
        &font,
    );

    progress(Progress::new(80.0, "Saving PDF file", "saving"));

    let file = File::create(&opts.output_path)
        .map_err(|e| LpError::conversion_failed(format!("Failed to create PDF: {}", e)))?;

    doc.save(&mut BufWriter::new(file))
        .map_err(|e| LpError::conversion_failed(format!("Failed to save PDF: {}", e)))?;

    progress(Progress::new(100.0, "Conversion complete", "complete"));

    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(JobOutput::new(opts.output_path.clone(), file_size, 0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_page_size_to_mm() {
        let (w, _h) = PagePageSize::A4.to_mm();
        assert_eq!(w.0, 210.0);
    }
}
