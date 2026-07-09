mod common;

use localpdf_core::tools::ocr;
use localpdf_core::types::OcrOpts;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_ocr_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("ocr.pdf");

    let opts = OcrOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        languages: vec!["eng".to_string()],
        dpi: 300,
        overwrite: true,
    };

    let result = ocr::run(&opts, &|_| ());
    assert!(result.is_ok(), "OCR failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_ocr_missing_file_fails() {
    let opts = OcrOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        languages: vec!["eng".to_string()],
        dpi: 300,
        overwrite: false,
    };
    let result = ocr::run(&opts, &|_| ());
    assert!(result.is_err());
}
