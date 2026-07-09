mod common;

use localpdf_core::convert::html_to_pdf::{html_to_pdf, HtmlToPdfOpts};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_html_to_pdf_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let dummy_html = dummy_pdf.with_extension("dummy.html");
    
    fs::write(&dummy_html, "<html></html>").unwrap();

    let output_path = dummy_html.with_extension("pdf");

    let opts = HtmlToPdfOpts {
        input_file: dummy_html.clone(),
        output_path: output_path.clone(),
        page_size: localpdf_core::convert::html_to_pdf::PagePageSize::A4,
        base_url: None,
        overwrite: true,
    };

    let result = html_to_pdf(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
    let _ = fs::remove_file(dummy_html);
}

#[test]
fn test_html_to_pdf_missing_file() {
    let opts = HtmlToPdfOpts {
        input_file: PathBuf::from("nonexistent.html"),
        output_path: PathBuf::from("out.pdf"),
        page_size: localpdf_core::convert::html_to_pdf::PagePageSize::A4,
        base_url: None,
        overwrite: true,
    };

    let result = html_to_pdf(&opts, &|_| ());
    assert!(result.is_err());
}
