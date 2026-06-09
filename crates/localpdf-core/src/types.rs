use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Options for merging multiple PDFs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeOpts {
    pub input_files: Vec<PathBuf>,
    pub output_path: PathBuf,
    pub overwrite: bool,
}

/// Options for splitting a PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitOpts {
    pub input_file: PathBuf,
    pub output_dir: PathBuf,
    pub strategy: SplitStrategy,
    pub ranges: Option<Vec<PageRange>>,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SplitStrategy {
    ByRanges,
    ByEvery(u32),
    BySize(u64), // bytes
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageRange {
    pub start: u32,
    pub end: u32,
}

/// Options for removing pages from a PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoveOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub pages_to_remove: Vec<u32>, // 1-indexed page numbers
    pub overwrite: bool,
}

/// Options for extracting pages to a new PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub pages_to_extract: Vec<u32>, // 1-indexed page numbers
    pub overwrite: bool,
}

/// Options for organizing (reordering/rotating) pages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizeOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub page_order: Option<Vec<u32>>, // 1-indexed, permutation
    pub page_rotations: Option<std::collections::HashMap<u32, u32>>, // page -> rotation (0/90/180/270)
    pub overwrite: bool,
}

/// Options for compressing a PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub level: CompressionLevel,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum CompressionLevel {
    Maximum,
    High,
    Balanced,
    Low,
}

/// Options for rotating pages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotateOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub pages: Option<Vec<u32>>, // 1-indexed, None = all pages
    pub rotation: RotationAngle,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum RotationAngle {
    Deg90,
    Deg180,
    Deg270,
}

/// Options for adding watermark
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatermarkOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub watermark_type: WatermarkType,
    pub text: Option<String>,
    pub image_path: Option<PathBuf>,
    pub position: WatermarkPosition,
    pub opacity: f32, // 0.0 - 1.0
    pub font_size: Option<f32>,
    pub font_color: Option<String>, // hex color
    pub overwrite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WatermarkType {
    Text,
    Image,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WatermarkPosition {
    Center,
    Diagonal,
    Custom { x: f32, y: f32 },
}

/// Options for adding page numbers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageNumOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub position: PageNumPosition,
    pub format: PageNumFormat,
    pub font_size: Option<f32>,
    pub font_color: Option<String>,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageNumPosition {
    TopLeft,
    TopCenter,
    TopRight,
    BottomLeft,
    BottomCenter,
    BottomRight,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PageNumFormat {
    Simple, // "1", "2", "3"...
    Fraction, // "1/10", "2/10"...
    Custom(String), // e.g., "Page {n}"
}

/// Options for cropping PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CropOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub margins: CropMargins,
    pub unit: CropUnit,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CropMargins {
    pub top: f32,
    pub bottom: f32,
    pub left: f32,
    pub right: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CropUnit {
    Points,
    Percentage,
}

/// Options for OCR
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub languages: Vec<String>, // e.g., ["eng", "tur"]
    pub dpi: u32,
    pub overwrite: bool,
}

/// Options for password protection (encryption)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtectOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub user_password: String,
    pub owner_password: Option<String>,
    pub permissions: EncryptionPermissions,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EncryptionPermissions {
    pub print: bool,
    pub modify: bool,
    pub extract: bool,
    pub annotate: bool,
}

/// Options for unlocking (decrypting) a PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnlockOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub password: String,
    pub overwrite: bool,
}

/// Options for repairing a PDF
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepairOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub overwrite: bool,
}

/// Options for format conversion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvertOpts {
    pub input_file: PathBuf,
    pub output_path: PathBuf,
    pub target_format: TargetFormat,
    pub options: ConversionOptions,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TargetFormat {
    Pdf,
    Docx,
    Xlsx,
    Pptx,
    Jpg,
    Png,
    Html,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ConversionOptions {
    pub dpi: Option<u32>,
    pub quality: Option<u32>,
    pub page_range: Option<Vec<u32>>,
}

/// Options for getting PDF info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathOpts {
    pub input_file: PathBuf,
}

/// Options for generating thumbnails
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailOpts {
    pub input_file: PathBuf,
    pub pages: Vec<u32>, // 1-indexed
    pub dpi: u32,
}

/// Output from a job operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobOutput {
    pub output_path: PathBuf,
    pub file_size: u64,
    pub processing_time_ms: u64,
    pub page_count: Option<u32>,
    pub metadata: std::collections::HashMap<String, String>,
}

impl JobOutput {
    pub fn new(output_path: PathBuf, file_size: u64, processing_time_ms: u64) -> Self {
        Self {
            output_path,
            file_size,
            processing_time_ms,
            page_count: None,
            metadata: std::collections::HashMap::new(),
        }
    }

    pub fn with_page_count(mut self, page_count: u32) -> Self {
        self.page_count = Some(page_count);
        self
    }

    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }
}

/// Progress update during long operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Progress {
    pub percent: f32,
    pub message: String,
    pub stage: String,
}

impl Progress {
    pub fn new(percent: f32, message: impl Into<String>, stage: impl Into<String>) -> Self {
        Self {
            percent,
            message: message.into(),
            stage: stage.into(),
        }
    }
}

/// PDF metadata for info command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfInfo {
    pub file_path: PathBuf,
    pub file_size: u64,
    pub file_size_formatted: String,
    pub page_count: u32,
    pub page_sizes: Vec<PageSize>,
    pub encrypted: bool,
    pub pdf_version: String,
    pub creator: Option<String>,
    pub producer: Option<String>,
    pub creation_date: Option<String>,
    pub modification_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PageSize {
    pub width: f32,
    pub height: f32,
    pub unit: String, // "points"
}