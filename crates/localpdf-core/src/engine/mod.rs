//! PDF processing engine wrappers

pub mod pdfium;  // Now using lopdf implementation
pub mod lopdf;   // Low-level operations
pub mod image;   // Image processing

pub use pdfium::LoPdfEngine;
pub use lopdf::LoPdfHelper;
pub use image::ImageHelper;