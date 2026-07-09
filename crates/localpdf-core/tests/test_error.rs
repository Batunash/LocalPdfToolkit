mod common;

use localpdf_core::error::LpError;
use std::time::Duration;
use std::io;

#[test]
fn test_error_creation() {
    let err = LpError::pdf_corrupt("corrupt");
    assert!(matches!(err, LpError::PdfCorrupt(_)));
    assert_eq!(err.to_string(), "PDF file is corrupt and cannot be parsed: corrupt");

    let err2 = LpError::file_not_found("not_found.pdf");
    assert!(matches!(err2, LpError::FileNotFound(_)));
    assert_eq!(err2.to_string(), "File not found: not_found.pdf");

    let err3 = LpError::conversion_failed("conversion failed");
    assert!(matches!(err3, LpError::ConversionFailed(_)));
    assert_eq!(err3.to_string(), "Conversion failed: conversion failed");

    let err4 = LpError::ocr_failed("ocr failed");
    assert!(matches!(err4, LpError::OcrFailed(_)));
    assert_eq!(err4.to_string(), "OCR failed: ocr failed");
    
    let err_timeout = LpError::Timeout(Duration::from_secs(10));
    assert_eq!(err_timeout.to_string(), "Operation timed out after 10 seconds");
    
    let err_disk = LpError::DiskFull;
    assert_eq!(err_disk.to_string(), "Insufficient disk space for output file");
    
    let err_wrong_pass = LpError::WrongPassword;
    assert_eq!(err_wrong_pass.to_string(), "Wrong password provided for encrypted PDF");
    
    let err_invalid = LpError::InvalidParams("invalid".to_string());
    assert_eq!(err_invalid.to_string(), "Invalid parameters: invalid");
    
    let err_pdfium = LpError::Pdfium("pdfium".to_string());
    assert_eq!(err_pdfium.to_string(), "PDFium error: pdfium");
    
    let err_generic = LpError::Generic("generic".to_string());
    assert_eq!(err_generic.to_string(), "Generic error: generic");

    let err_io = LpError::Io(io::Error::new(io::ErrorKind::Other, "io error"));
    assert_eq!(err_io.to_string(), "I/O error: io error");
}
