use thiserror::Error;
use std::io;

/// Core error type for all LocalPDF operations
#[derive(Error, Debug)]
pub enum LpError {
    #[error("PDF file is corrupt and cannot be parsed: {0}")]
    PdfCorrupt(String),

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Wrong password provided for encrypted PDF")]
    WrongPassword,

    #[error("Insufficient disk space for output file")]
    DiskFull,

    #[error("Operation timed out after {} seconds", .0.as_secs())]
    Timeout(std::time::Duration),

    #[error("Conversion failed: {0}")]
    ConversionFailed(String),

    #[error("OCR failed: {0}")]
    OcrFailed(String),

    #[error("Invalid parameters: {0}")]
    InvalidParams(String),

    #[error("I/O error: {0}")]
    Io(#[from] io::Error),

    #[error("Image processing error: {0}")]
    Image(#[from] image::ImageError),

    #[error("PDFium error: {0}")]
    Pdfium(String),

    #[error("LoPDF error: {0}")]
    LoPdf(#[from] lopdf::Error),

    #[error("Generic error: {0}")]
    Generic(String),
}

impl LpError {
    pub fn pdf_corrupt(msg: impl Into<String>) -> Self {
        Self::PdfCorrupt(msg.into())
    }

    pub fn file_not_found(path: impl Into<String>) -> Self {
        Self::FileNotFound(path.into())
    }

    pub fn conversion_failed(msg: impl Into<String>) -> Self {
        Self::ConversionFailed(msg.into())
    }

    pub fn ocr_failed(msg: impl Into<String>) -> Self {
        Self::OcrFailed(msg.into())
    }
}