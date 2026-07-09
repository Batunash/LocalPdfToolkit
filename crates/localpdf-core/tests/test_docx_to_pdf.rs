mod common;

use localpdf_core::convert::docx_to_pdf::{docx_to_pdf, DocxToPdfOpts};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_docx_to_pdf_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let dummy_docx = dummy_pdf.with_extension("dummy.docx");
    
    // Create a minimal dummy file
    fs::write(&dummy_docx, "dummy content").unwrap();

    let output_path = dummy_docx.with_extension("pdf");

    let opts = DocxToPdfOpts {
        input_file: dummy_docx.clone(),
        output_path: output_path.clone(),
        page_size: localpdf_core::convert::docx_to_pdf::PageSize::A4,
        overwrite: true,
    };

    let result = docx_to_pdf(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
    let _ = fs::remove_file(dummy_docx);
}

#[test]
fn test_docx_to_pdf_missing_file() {
    let opts = DocxToPdfOpts {
        input_file: PathBuf::from("nonexistent.docx"),
        output_path: PathBuf::from("out.pdf"),
        page_size: localpdf_core::convert::docx_to_pdf::PageSize::A4,
        overwrite: true,
    };

    let result = docx_to_pdf(&opts, &|_| ());
    assert!(result.is_err());
}
