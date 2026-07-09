mod common;

use localpdf_core::tools::page_numbers;
use localpdf_core::types::{PageNumOpts, PageNumPosition, PageNumFormat};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_page_numbers_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("numbered.pdf");

    let opts = PageNumOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        position: PageNumPosition::BottomCenter,
        format: PageNumFormat::Simple,
        font_size: Some(12.0),
        font_color: Some("#000000".to_string()),
        overwrite: true,
    };

    let result = page_numbers::run(&opts, &|_| ());
    assert!(result.is_ok(), "Page numbers failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_page_numbers_missing_file_fails() {
    let opts = PageNumOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        position: PageNumPosition::BottomCenter,
        format: PageNumFormat::Simple,
        font_size: Some(12.0),
        font_color: Some("#000000".to_string()),
        overwrite: false,
    };
    let result = page_numbers::run(&opts, &|_| ());
    assert!(result.is_err());
}
