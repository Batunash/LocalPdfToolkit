//! Image processing helpers

use image::{DynamicImage, GenericImageView};
use std::path::Path;
use crate::error::LpError;

/// Helper for image operations
pub struct ImageHelper;

impl ImageHelper {
    /// Decode an image from a file
    pub fn decode(path: &Path) -> Result<DynamicImage, LpError> {
        image::open(path)
            .map_err(LpError::Image)
    }

    /// Decode an image from bytes
    pub fn decode_bytes(bytes: &[u8]) -> Result<DynamicImage, LpError> {
        image::load_from_memory(bytes)
            .map_err(LpError::Image)
    }

    /// Encode an image to JPEG
    pub fn encode_jpeg(
        img: &DynamicImage,
        path: &Path,
        _quality: u8,
    ) -> Result<(), LpError> {
        img.save_with_format(path, image::ImageFormat::Jpeg)
            .map_err(LpError::Image)
    }

    /// Encode an image to PNG
    pub fn encode_png(img: &DynamicImage, path: &Path) -> Result<(), LpError> {
        img.save_with_format(path, image::ImageFormat::Png)
            .map_err(LpError::Image)
    }

    /// Encode an image to bytes
    pub fn encode_to_bytes(
        img: &DynamicImage,
        format: image::ImageFormat,
    ) -> Result<Vec<u8>, LpError> {
        let mut buffer = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buffer), format)
            .map_err(LpError::Image)?;
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