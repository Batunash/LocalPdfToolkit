use clap::{Parser, Subcommand, ValueEnum};
use clap_complete::{generate, Shell};
use std::io;
use std::path::PathBuf;
use std::time::Instant;

/// LocalPDF Toolkit - A modern, offline PDF utility tool
#[derive(Parser)]
#[command(name = "localpdf")]
#[command(author = "Batuhan")]
#[command(version = "0.1.0")]
#[command(about = "Local PDF Toolkit - Offline PDF utilities", long_about = None)]
struct Cli {
    /// Enable verbose output
    #[arg(short, long, global = true)]
    verbose: bool,

    /// Quiet mode - only show errors
    #[arg(short, long, global = true)]
    quiet: bool,

    /// Output file path
    #[arg(short, long, global = true)]
    output: Option<PathBuf>,

    /// JSON output mode
    #[arg(long, global = true)]
    json: bool,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate shell completions
    Completions {
        /// Shell type to generate completions for
        #[arg(value_enum)]
        shell: ShellType,
    },
    /// Merge multiple PDF files into one
    Merge {
        /// Input PDF files
        #[arg(required = true)]
        inputs: Vec<PathBuf>,
    },
    /// Split a PDF into multiple files
    Split {
        /// Input PDF file
        input: PathBuf,
        /// Split mode
        #[arg(short, long, default_value = "ranges")]
        mode: SplitMode,
        /// Page ranges (e.g., 1-3,5,7-10)
        #[arg(short, long)]
        ranges: Option<String>,
    },
    /// Remove pages from a PDF
    Remove {
        /// Input PDF file
        input: PathBuf,
        /// Pages to remove
        #[arg(short, long)]
        pages: String,
    },
    /// Extract specific pages from a PDF
    Extract {
        /// Input PDF file
        input: PathBuf,
        /// Pages to extract
        #[arg(short, long)]
        pages: String,
    },
    /// Compress a PDF to reduce file size
    Compress {
        /// Input PDF file
        input: PathBuf,
        /// Compression level
        #[arg(short, long, default_value = "balanced")]
        level: CompressionLevel,
    },
    /// Rotate PDF pages
    Rotate {
        /// Input PDF file
        input: PathBuf,
        /// Rotation angle in degrees
        #[arg(short, long, default_value = "90")]
        angle: u32,
    },
    /// Add password protection to PDF
    Protect {
        /// Input PDF file
        input: PathBuf,
        /// Password for encryption
        #[arg(short, long)]
        password: String,
    },
    /// Remove password from PDF
    Unlock {
        /// Input PDF file
        input: PathBuf,
        /// Password for decryption
        #[arg(short, long)]
        password: String,
    },
    /// Perform OCR on a scanned PDF
    Ocr {
        /// Input PDF file
        input: PathBuf,
        /// OCR language
        #[arg(short, long, default_value = "eng")]
        language: String,
    },
    /// Show PDF information
    Info {
        /// Input PDF file
        input: PathBuf,
    },
    /// Convert PDF to another format or vice versa
    Convert {
        /// Input file
        input: PathBuf,
        /// Target format
        #[arg(short, long)]
        to: ConvertFormat,
    },
}

#[derive(ValueEnum, Clone, Debug)]
enum ShellType {
    Bash,
    Zsh,
    Fish,
    PowerShell,
}

#[derive(ValueEnum, Clone, Debug)]
enum SplitMode {
    Ranges,
    EveryN,
    BySize,
}

#[derive(ValueEnum, Clone, Debug)]
enum CompressionLevel {
    Extreme,
    High,
    Balanced,
    Low,
}

#[derive(ValueEnum, Clone, Debug)]
enum ConvertFormat {
    Docx,
    Xlsx,
    Pptx,
    Html,
    Jpg,
    Png,
    Pdf,
}

fn print_completions(shell: ShellType) {
    use clap::CommandFactory;
    let mut cmd = Cli::command();
    let shell = match shell {
        ShellType::Bash => Shell::Bash,
        ShellType::Zsh => Shell::Zsh,
        ShellType::Fish => Shell::Fish,
        ShellType::PowerShell => Shell::PowerShell,
    };
    generate(shell, &mut cmd, "localpdf", &mut io::stdout());
}

fn print_success(message: &str, quiet: bool) {
    if !quiet {
        println!("OK: {}", message);
    }
}

fn measure_time<F: FnOnce() -> anyhow::Result<()>>(quiet: bool, f: F) -> anyhow::Result<()> {
    let start = Instant::now();
    f()?;
    let duration = start.elapsed();
    if !quiet {
        println!("Completed in {:.2?}", duration);
    }
    Ok(())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Completions { shell } => {
            print_completions(shell);
        }
        Commands::Merge { inputs } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Merging {} files...", inputs.len()), cli.quiet);
                Ok(())
            })?;
        }
        Commands::Split { input, mode, ranges } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Splitting: {}", input.display()), cli.quiet);
                println!("Mode: {:?}", mode);
                if let Some(r) = ranges {
                    println!("Ranges: {}", r);
                }
                Ok(())
            })?;
        }
        Commands::Remove { input, pages } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Removing pages: {}", input.display()), cli.quiet);
                println!("Pages: {}", pages);
                Ok(())
            })?;
        }
        Commands::Extract { input, pages } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Extracting pages: {}", input.display()), cli.quiet);
                println!("Pages: {}", pages);
                Ok(())
            })?;
        }
        Commands::Compress { input, level } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Compressing: {}", input.display()), cli.quiet);
                println!("Level: {:?}", level);
                Ok(())
            })?;
        }
        Commands::Rotate { input, angle } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Rotating: {}", input.display()), cli.quiet);
                println!("Angle: {} deg", angle);
                Ok(())
            })?;
        }
        Commands::Protect { input, password: _ } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Protecting: {}", input.display()), cli.quiet);
                Ok(())
            })?;
        }
        Commands::Unlock { input, password: _ } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Unlocking: {}", input.display()), cli.quiet);
                Ok(())
            })?;
        }
        Commands::Ocr { input, language } => {
            measure_time(cli.quiet, || {
                print_success(&format!("OCR: {}", input.display()), cli.quiet);
                println!("Language: {}", language);
                Ok(())
            })?;
        }
        Commands::Info { input } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Info: {}", input.display()), cli.quiet);
                Ok(())
            })?;
        }
        Commands::Convert { input, to } => {
            measure_time(cli.quiet, || {
                print_success(&format!("Converting: {}", input.display()), cli.quiet);
                println!("To: {:?}", to);
                Ok(())
            })?;
        }
    }

    Ok(())
}
