mod common;

use localpdf_core::convert::pdf_to_images::{pdf_to_images, PdfToImageOpts};
use std::path::PathBuf;

#[test]
fn test_pdf_to_images_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_dir = dummy_pdf.with_extension("images");

    let opts = PdfToImageOpts {
        input_file: dummy_pdf,
        output_dir: output_dir.clone(),
        format: "png".to_string(),
        dpi: 300,
        overwrite: true,
    };

    let result = pdf_to_images(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());
}
