//! CLI argument definitions and command runners

use clap::{Parser, Subcommand, ValueEnum};
use localpdf_core::*;
use localpdf_core::tools;
use std::path::PathBuf;
use std::time::Instant;

/// LocalPDF - Zero-dependency PDF toolkit
#[derive(Parser)]
#[command(name = "localpdf")]
#[command(author = "Batuhan")]
#[command(version = "0.1.0")]
#[command(about = "A zero-dependency PDF toolkit with CLI and GUI")]
#[command(long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,

    /// Enable verbose output
    #[arg(global = true, short = 'v', long)]
    pub verbose: bool,

    /// Suppress all output (exit code only)
    #[arg(global = true, short = 'q', long)]
    pub quiet: bool,

    /// Output result as JSON
    #[arg(global = true, short = 'J', long)]
    pub json: bool,

    /// Overwrite output file if it exists
    #[arg(global = true, long)]
    pub overwrite: bool,

    /// Disable ANSI color output
    #[arg(global = true, long)]
    pub no_color: bool,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Merge multiple PDFs into one
    Merge(MergeOptions),

    /// Split a PDF into multiple files
    Split(SplitOptions),

    /// Remove specific pages from a PDF
    Remove(RemoveOptions),

    /// Extract pages into a new PDF
    Extract(ExtractOptions),

    /// Reorder and/or rotate pages
    Organize(OrganizeOptions),

    /// Reduce PDF file size
    Compress(CompressOptions),

    /// Rotate pages
    Rotate(RotateOptions),

    /// Add text or image watermark
    Watermark(WatermarkOptions),

    /// Add page numbers
    PageNumbers(PageNumberOptions),

    /// Crop page margins
    Crop(CropOptions),

    /// Apply OCR to scanned PDFs
    Ocr(OcrOptions),

    /// Encrypt PDF with password
    Protect(ProtectOptions),

    /// Remove password from PDF
    Unlock(UnlockOptions),

    /// Attempt to repair corrupt PDF
    Repair(RepairOptions),

    /// Convert between formats
    Convert(ConvertOptions),

    /// Display PDF metadata
    Info(InfoOptions),

    /// Generate shell completions
    Completions(CompletionsOptions),

    /// Update localpdf CLI to the latest version
    Update,
}

// === Completions ===
#[derive(Parser)]
pub struct CompletionsOptions {
    /// Shell type to generate completions for
    #[arg(value_enum)]
    pub shell: ShellType,
}

#[derive(ValueEnum, Clone, Debug)]
pub enum ShellType {
    Bash,
    Zsh,
    Fish,
    PowerShell,
}

// === Merge ===
#[derive(Parser)]
pub struct MergeOptions {
    /// Input PDF files
    #[arg(required = true)]
    pub input_files: Vec<PathBuf>,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,
}

// === Split ===
#[derive(Parser)]
pub struct SplitOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output directory
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Split by page ranges (e.g., "1-5,6-10,11-")
    #[arg(long)]
    pub ranges: Option<String>,

    /// Split every N pages
    #[arg(long)]
    pub every: Option<u32>,

    /// Split by target size (e.g., "5MB")
    #[arg(long)]
    pub size: Option<String>,
}

// === Remove ===
#[derive(Parser)]
pub struct RemoveOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Page numbers to remove (1-indexed, comma-separated)
    #[arg(required = true)]
    pub pages: String,
}

// === Extract ===
#[derive(Parser)]
pub struct ExtractOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Page numbers to extract (1-indexed, comma-separated)
    #[arg(required = true)]
    pub pages: String,
}

// === Organize ===
#[derive(Parser)]
pub struct OrganizeOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Page order (1-indexed, comma-separated)
    #[arg(long)]
    pub order: Option<String>,

    /// Rotate specific pages, format: "page:angle,..."
    #[arg(long)]
    pub rotate: Option<String>,
}

// === Compress ===
#[derive(Parser)]
pub struct CompressOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Compression level
    #[arg(short = 'l', long, default_value = "balanced")]
    pub level: CompressionLevelArg,
}

#[derive(ValueEnum, Clone, Copy)]
pub enum CompressionLevelArg {
    Maximum,
    High,
    Balanced,
    Low,
}

// === Rotate ===
#[derive(Parser)]
pub struct RotateOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Rotation angle in degrees
    #[arg(short = 'r', long, default_value = "90")]
    pub angle: u32,

    /// Pages to rotate (optional, all if not specified)
    #[arg(long)]
    pub pages: Option<String>,
}

// === Watermark ===
#[derive(Parser)]
pub struct WatermarkOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Watermark text
    #[arg(short = 't', long)]
    pub text: Option<String>,

    /// Watermark image path
    #[arg(long)]
    pub image: Option<PathBuf>,
}

// === Page Numbers ===
#[derive(Parser)]
pub struct PageNumberOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Position (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right)
    #[arg(long, default_value = "bottom-center")]
    pub position: String,

    /// Format (simple, fraction, or custom like "Page {n}")
    #[arg(long, default_value = "simple")]
    pub format: String,
}

// === Crop ===
#[derive(Parser)]
pub struct CropOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Top margin
    #[arg(long)]
    pub top: Option<f32>,

    /// Bottom margin
    #[arg(long)]
    pub bottom: Option<f32>,

    /// Left margin
    #[arg(long)]
    pub left: Option<f32>,

    /// Right margin
    #[arg(long)]
    pub right: Option<f32>,
}

// === OCR ===
#[derive(Parser)]
pub struct OcrOptions {
    /// Input PDF file (scanned)
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// OCR languages (e.g., eng, tur, eng+tur)
    #[arg(long, default_value = "eng")]
    pub lang: String,

    /// DPI for OCR
    #[arg(long, default_value = "300")]
    pub dpi: u32,
}

// === Protect ===
#[derive(Parser)]
pub struct ProtectOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// User password
    #[arg(short = 'u', long)]
    pub user_password: String,

    /// Owner password (defaults to user password)
    #[arg(short = 'O', long)]
    pub owner_password: Option<String>,
}

// === Unlock ===
#[derive(Parser)]
pub struct UnlockOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Password
    #[arg(short = 'p', long)]
    pub password: String,
}

// === Repair ===
#[derive(Parser)]
pub struct RepairOptions {
    /// Input PDF file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,
}

// === Convert ===
#[derive(Parser)]
pub struct ConvertOptions {
    /// Input file
    pub input_file: PathBuf,

    /// Output file path
    #[arg(short = 'o', long)]
    pub output: Option<PathBuf>,

    /// Target format
    #[arg(short = 't', long)]
    pub to: FormatArg,

    /// DPI for image output
    #[arg(long, default_value = "150")]
    pub dpi: u32,
}

#[derive(ValueEnum, Clone)]
pub enum FormatArg {
    Pdf,
    Docx,
    Xlsx,
    Pptx,
    Jpg,
    Png,
    Html,
}

// === Info ===
#[derive(Parser)]
pub struct InfoOptions {
    /// Input PDF file
    pub input_file: PathBuf,
}

// === Runner functions ===

pub fn run_merge(
    opts: MergeOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        PathBuf::from("merged.pdf")
    });

    let merge_opts = MergeOpts {
        input_files: opts.input_files,
        output_path,
        overwrite,
    };

    let result = tools::merge::run(&merge_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_split(
    opts: SplitOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_dir = opts.output.clone().unwrap_or_else(|| {
        PathBuf::from("split_output")
    });

    let strategy = if let Some(ranges_str) = opts.ranges {
        // Parse ranges - simplified implementation
        // Note: Full range parsing would parse strings like "1-3,5,7-9"
        let _ = ranges_str; // Ranges parsed but not fully implemented in split tool
        SplitStrategy::ByRanges
    } else if let Some(n) = opts.every {
        SplitStrategy::ByEvery(n)
    } else {
        SplitStrategy::ByEvery(10) // default
    };

    let split_opts = SplitOpts {
        input_file: opts.input_file,
        output_dir,
        strategy,
        ranges: None, // Ranges feature not fully implemented in split tool
        overwrite,
    };

    let result = tools::split::run(&split_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_remove(
    opts: RemoveOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("removed");
        p.set_extension("pdf");
        p
    });

    let pages: Vec<u32> = opts.pages
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    let remove_opts = RemoveOpts {
        input_file: opts.input_file,
        output_path,
        pages_to_remove: pages,
        overwrite,
    };

    let result = tools::remove_pages::run(&remove_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_extract(
    opts: ExtractOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("extracted");
        p.set_extension("pdf");
        p
    });

    let pages: Vec<u32> = opts.pages
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    let extract_opts = ExtractOpts {
        input_file: opts.input_file,
        output_path,
        pages_to_extract: pages,
        overwrite,
    };

    let result = tools::extract_pages::run(&extract_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_organize(
    opts: OrganizeOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("organized");
        p.set_extension("pdf");
        p
    });

    let page_order = opts.order.as_ref().map(|s| {
        s.split(',')
            .filter_map(|p| p.trim().parse().ok())
            .collect()
    });

    let organize_opts = OrganizeOpts {
        input_file: opts.input_file,
        output_path,
        page_order,
        page_rotations: None, // parse from rotate arg
        overwrite,
    };

    let result = tools::organize::run(&organize_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_compress(
    opts: CompressOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("compressed");
        p.set_extension("pdf");
        p
    });

    let level = match opts.level {
        CompressionLevelArg::Maximum => CompressionLevel::Maximum,
        CompressionLevelArg::High => CompressionLevel::High,
        CompressionLevelArg::Balanced => CompressionLevel::Balanced,
        CompressionLevelArg::Low => CompressionLevel::Low,
    };

    let compress_opts = CompressOpts {
        input_file: opts.input_file,
        output_path,
        level,
        overwrite,
    };

    let result = tools::compress::run(&compress_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_rotate(
    opts: RotateOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("rotated");
        p.set_extension("pdf");
        p
    });

    let angle = match opts.angle {
        90 => RotationAngle::Deg90,
        180 => RotationAngle::Deg180,
        270 => RotationAngle::Deg270,
        _ => return Err("Angle must be 90, 180, or 270".into()),
    };

    let rotate_opts = RotateOpts {
        input_file: opts.input_file,
        output_path,
        pages: None,
        rotation: angle,
        overwrite,
    };

    let result = tools::rotate::run(&rotate_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_watermark(
    opts: WatermarkOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("watermarked");
        p.set_extension("pdf");
        p
    });

    let watermark_opts = WatermarkOpts {
        input_file: opts.input_file,
        output_path,
        watermark_type: if opts.text.is_some() {
            WatermarkType::Text
        } else {
            WatermarkType::Image
        },
        text: opts.text,
        image_path: opts.image,
        position: WatermarkPosition::Center,
        opacity: 0.5,
        font_size: Some(48.0),
        font_color: Some("#000000".to_string()),
        overwrite,
    };

    let result = tools::watermark::run(&watermark_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_page_numbers(
    opts: PageNumberOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("numbered");
        p.set_extension("pdf");
        p
    });

    let position = match opts.position.as_str() {
        "top-left" => PageNumPosition::TopLeft,
        "top-center" => PageNumPosition::TopCenter,
        "top-right" => PageNumPosition::TopRight,
        "bottom-left" => PageNumPosition::BottomLeft,
        "bottom-center" => PageNumPosition::BottomCenter,
        "bottom-right" => PageNumPosition::BottomRight,
        _ => PageNumPosition::BottomCenter,
    };

    let format = match opts.format.as_str() {
        "simple" => PageNumFormat::Simple,
        "fraction" => PageNumFormat::Fraction,
        custom => PageNumFormat::Custom(custom.to_string()),
    };

    let page_num_opts = PageNumOpts {
        input_file: opts.input_file,
        output_path,
        position,
        format,
        font_size: None,
        font_color: None,
        overwrite,
    };

    let result = tools::page_numbers::run(&page_num_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_crop(
    opts: CropOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("cropped");
        p.set_extension("pdf");
        p
    });

    let crop_opts = CropOpts {
        input_file: opts.input_file,
        output_path,
        margins: CropMargins {
            top: opts.top.unwrap_or(0.0),
            bottom: opts.bottom.unwrap_or(0.0),
            left: opts.left.unwrap_or(0.0),
            right: opts.right.unwrap_or(0.0),
        },
        unit: CropUnit::Points,
        overwrite,
    };

    let result = tools::crop::run(&crop_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_ocr(
    opts: OcrOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("ocr");
        p.set_extension("pdf");
        p
    });

    let languages: Vec<String> = opts.lang
        .split('+')
        .map(|s| s.trim().to_string())
        .collect();

    let ocr_opts = OcrOpts {
        input_file: opts.input_file,
        output_path,
        languages,
        dpi: opts.dpi,
        overwrite,
    };

    let result = tools::ocr::run(&ocr_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_protect(
    opts: ProtectOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("protected");
        p.set_extension("pdf");
        p
    });

    let protect_opts = ProtectOpts {
        input_file: opts.input_file,
        output_path,
        user_password: opts.user_password,
        owner_password: opts.owner_password,
        permissions: EncryptionPermissions::default(),
        overwrite,
    };

    let result = tools::protect::run(&protect_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_unlock(
    opts: UnlockOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("unlocked");
        p.set_extension("pdf");
        p
    });

    let unlock_opts = UnlockOpts {
        input_file: opts.input_file,
        output_path,
        password: opts.password,
        overwrite,
    };

    let result = tools::unlock::run(&unlock_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_repair(
    opts: RepairOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_file_name("repaired");
        p.set_extension("pdf");
        p
    });

    let repair_opts = RepairOpts {
        input_file: opts.input_file,
        output_path,
        overwrite,
    };

    let result = tools::repair::run(&repair_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_convert(
    opts: ConvertOptions,
    verbose: bool,
    quiet: bool,
    json_output: bool,
    overwrite: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let output_path = opts.output.clone().unwrap_or_else(|| {
        let mut p = opts.input_file.clone();
        p.set_extension(match opts.to {
            FormatArg::Pdf => "pdf",
            FormatArg::Docx => "docx",
            FormatArg::Xlsx => "xlsx",
            FormatArg::Pptx => "pptx",
            FormatArg::Jpg => "jpg",
            FormatArg::Png => "png",
            FormatArg::Html => "html",
        });
        p
    });

    let target_format = match opts.to {
        FormatArg::Pdf => TargetFormat::Pdf,
        FormatArg::Docx => TargetFormat::Docx,
        FormatArg::Xlsx => TargetFormat::Xlsx,
        FormatArg::Pptx => TargetFormat::Pptx,
        FormatArg::Jpg => TargetFormat::Jpg,
        FormatArg::Png => TargetFormat::Png,
        FormatArg::Html => TargetFormat::Html,
    };

    let convert_opts = ConvertOpts {
        input_file: opts.input_file,
        output_path,
        target_format,
        options: ConversionOptions {
            dpi: Some(opts.dpi),
            quality: None,
            page_range: None,
        },
        overwrite,
    };

    let result = tools::convert::run(&convert_opts, &|progress| {
        if verbose && !quiet {
            println!("[{}] {}", progress.stage, progress.message);
        }
    });

    handle_result(result, json_output, quiet)
}

pub fn run_info(
    opts: InfoOptions,
    verbose: bool,
    quiet: bool,
    _json_output: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let start = Instant::now();

    // Get PDF info using the core library
    let info_result = localpdf_core::get_pdf_info(&opts.input_file);

    let result = match info_result {
        Ok(info) => {
            if !quiet {
                println!("Info for: {:?}", opts.input_file);
                println!();
                println!("File Size:      {}", info.file_size_formatted);
                println!("Pages:          {}", info.page_count);
                println!("PDF Version:    {}", info.pdf_version);
                println!("Encrypted:      {}", if info.encrypted { "Yes" } else { "No" });

                // Show page sizes
                if !info.page_sizes.is_empty() {
                    if info.page_sizes.len() == 1 {
                        let size = &info.page_sizes[0];
                        println!("Page Size:      {:.0} x {:.0} {}", size.width, size.height, size.unit);
                    } else {
                        println!("Page Sizes:     {} pages", info.page_sizes.len());
                    }
                }

                // Show metadata if available
                if let Some(ref creator) = info.creator {
                    println!("Creator:        {}", creator);
                }
                if let Some(ref producer) = info.producer {
                    println!("Producer:       {}", producer);
                }

                println!();
            }
            Ok(())
        }
        Err(e) => {
            if !quiet {
                eprintln!("Error reading PDF: {}", e);
            }
            Err(e.into())
        }
    };

    let elapsed = start.elapsed();
    if verbose && !quiet {
        println!("Took {}s", elapsed.as_secs_f32());
    }

    result
}

// === Result handling ===

fn handle_result<T: std::fmt::Debug>(
    result: Result<T, LpError>,
    json_output: bool,
    quiet: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    match result {
        Ok(output) => {
            if json_output {
                println!("{:?}", output);
            } else if !quiet {
                println!("✓ Success");
                println!("{:?}", output);
            }
            Ok(())
        }
        Err(e) => {
            if json_output {
                println!(r#"{{"error": "{}"}}"#, e);
            } else if !quiet {
                eprintln!("✗ Error: {}", e);
            }
            Err(e.into())
        }
    }
}