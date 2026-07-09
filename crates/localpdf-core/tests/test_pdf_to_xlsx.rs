mod common;

use localpdf_core::convert::pdf_to_xlsx::{pdf_to_xlsx, PdfToXlsxOpts};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_pdf_to_xlsx_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("xlsx");

    let opts = PdfToXlsxOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        overwrite: true,
    };

    let result = pdf_to_xlsx(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_pdf_to_xlsx_missing_file() {
    let opts = PdfToXlsxOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("out.xlsx"),
        overwrite: true,
    };

    let result = pdf_to_xlsx(&opts, &|_| ());
    assert!(result.is_err());
}
