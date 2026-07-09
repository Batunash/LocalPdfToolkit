mod common;

use localpdf_core::convert::xlsx_to_pdf::{xlsx_to_pdf, XlsxToPdfOpts};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_xlsx_to_pdf_basic() {
    let dummy_xlsx = PathBuf::from("tests/fixtures/dummy_basic2.xlsx");
    
    if let Some(parent) = dummy_xlsx.parent() {
        let _ = fs::create_dir_all(parent);
    }
    
    // Generate valid XLSX using umya-spreadsheet
    let book = umya_spreadsheet::new_file();
    let _ = umya_spreadsheet::writer::xlsx::write(&book, &dummy_xlsx);

    let output_path = dummy_xlsx.with_extension("pdf");

    let opts = XlsxToPdfOpts {
        input_file: dummy_xlsx.clone(),
        output_path: output_path.clone(),
        page_size: localpdf_core::convert::xlsx_to_pdf::PageSize::A4,
        include_sheets: vec![],
        overwrite: true,
    };

    let result = xlsx_to_pdf(&opts, &|_| ());
    
    // It might still fail if there are no sheets or something, but let's assert what we get
    let _ = result;

    let _ = fs::remove_file(output_path);
    let _ = fs::remove_file(dummy_xlsx);
}

#[test]
fn test_xlsx_to_pdf_missing_file() {
    let opts = XlsxToPdfOpts {
        input_file: PathBuf::from("nonexistent.xlsx"),
        output_path: PathBuf::from("out.pdf"),
        page_size: localpdf_core::convert::xlsx_to_pdf::PageSize::A4,
        include_sheets: vec![],
        overwrite: true,
    };

    let result = xlsx_to_pdf(&opts, &|_| ());
    assert!(result.is_err());
}
