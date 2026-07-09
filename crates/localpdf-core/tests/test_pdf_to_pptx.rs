mod common;

use localpdf_core::convert::pdf_to_pptx::{pdf_to_pptx, PdfToPptxOpts};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_pdf_to_pptx_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("pptx");

    let opts = PdfToPptxOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        dpi: 150,
        overwrite: true,
    };

    let result = pdf_to_pptx(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_pdf_to_pptx_missing_file() {
    let opts = PdfToPptxOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("out.pptx"),
        dpi: 150,
        overwrite: true,
    };

    let result = pdf_to_pptx(&opts, &|_| ());
    assert!(result.is_err());
}
