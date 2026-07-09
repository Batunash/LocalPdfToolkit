mod common;

use localpdf_core::convert::pdf_to_docx::{pdf_to_docx, PdfToDocxOpts};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_pdf_to_docx_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("docx");

    let opts = PdfToDocxOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        auto_ocr: false,
        ocr_languages: vec![],
        overwrite: true,
    };

    let result = pdf_to_docx(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_pdf_to_docx_missing_file() {
    let opts = PdfToDocxOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("out.docx"),
        auto_ocr: false,
        ocr_languages: vec![],
        overwrite: true,
    };

    let result = pdf_to_docx(&opts, &|_| ());
    assert!(result.is_err());
}
