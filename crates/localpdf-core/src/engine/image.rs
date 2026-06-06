//! Image processing helpers

use image::{DynamicImage, ImageOutputFormat};
use std::path::Path;
use crate::error::LpError;

/// Helper for image operations
pub struct ImageHelper;

impl ImageHelper {
    /// Decode an image from a file
    pub fn decode(path: &Path) -> Result<DynamicImage, LpError> {
        image::open(path)
            .map_err(|e| LpError::Image(e))
    }

    /// Decode an image from bytes
    pub fn decode_bytes(bytes: &[u8]) -> Result<DynamicImage, LpError> {
        image::load_from_memory(bytes)
            .map_err(|e| LpError::Image(e))
    }

    /// Encode an image to JPEG
    pub fn encode_jpeg(
        img: &DynamicImage,
        path: &Path,
        quality: u8,
    ) -> Result<(), LpError> {
        img.write_to(
            &mut std::fs::File::create(path)?,
            ImageOutputFormat::Jpeg(quality),
        )
        .map_err(|e| LpError::Image(e))
    }

    /// Encode an image to PNG
    pub fn encode_png(img: &DynamicImage, path: &Path) -> Result<(), LpError> {
        img.save(path)
            .map_err(|e| LpError::Image(e))
    }

    /// Encode an image to bytes
    pub fn encode_to_bytes(
        img: &DynamicImage,
        format: ImageOutputFormat,
    ) -> Result<Vec<u8>, LpError> {
        let mut buffer = Vec::new();
        img.write_to(&mut buffer, format)
            .map_err(|e| LpError::Image(e))?;
        Ok(buffer)
    }

    /// Resize an image maintaining aspect ratio
    pub fn resize_filter(
        img: &DynamicImage,
        width: u32,
        height: u32,
    ) -> DynamicImage {
        img.resize_exact(width, height, image::imageops::FilterType::Lanczos3)
    }

    /// Get image dimensions
    pub fn dimensions(img: &DynamicImage) -> (u32, u32) {
        img.dimensions()
    }

    /// Convert to RGBA
    pub fn to_rgba8(img: &DynamicImage) -> image::RgbaImage {
        img.to_rgba8()
    }

    /// Convert to RGB
    pub fn to_rgb8(img: &DynamicImage) -> image::RgbImage {
        img.to_rgb8()
    }
}