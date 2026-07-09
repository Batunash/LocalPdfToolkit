mod common;

use localpdf_core::convert::pdf_to_html::{pdf_to_html, PdfToHtmlOpts};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_pdf_to_html_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("html");

    let opts = PdfToHtmlOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        embed_css: true,
        preserve_images: true,
        overwrite: true,
    };

    let result = pdf_to_html(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_pdf_to_html_missing_file() {
    let opts = PdfToHtmlOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("out.html"),
        embed_css: true,
        preserve_images: true,
        overwrite: true,
    };

    let result = pdf_to_html(&opts, &|_| ());
    assert!(result.is_err());
}
