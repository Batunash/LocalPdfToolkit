mod cli;
mod update;

use clap::Parser;
use std::time::Instant;
use cli::{Cli, Commands};
use clap_complete::{generate, Shell};
use std::io;

fn print_success(message: &str, quiet: bool) {
    if !quiet {
        println!("OK: {}", message);
    }
}

fn measure_time<F: FnOnce() -> Result<(), Box<dyn std::error::Error>>>(quiet: bool, f: F) -> Result<(), Box<dyn std::error::Error>> {
    let start = Instant::now();
    f()?;
    let duration = start.elapsed();
    if !quiet {
        println!("Completed in {:.2?}", duration);
    }
    Ok(())
}

fn print_completions(shell: cli::ShellType) {
    use clap::CommandFactory;
    let mut cmd = Cli::command();
    let clap_shell = match shell {
        cli::ShellType::Bash => Shell::Bash,
        cli::ShellType::Zsh => Shell::Zsh,
        cli::ShellType::Fish => Shell::Fish,
        cli::ShellType::PowerShell => Shell::PowerShell,
    };
    generate(clap_shell, &mut cmd, "localpdf", &mut io::stdout());
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli_opts = Cli::parse();
    
    match cli_opts.command {
        Commands::Merge(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Merging {} files...", opts.input_files.len()), cli_opts.quiet);
                cli::run_merge(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Split(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Splitting: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_split(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Remove(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Removing pages: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_remove(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Extract(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Extracting pages: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_extract(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Organize(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Organizing: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_organize(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Compress(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Compressing: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_compress(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Rotate(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Rotating: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_rotate(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Watermark(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Watermarking: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_watermark(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::PageNumbers(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Page Numbers: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_page_numbers(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Crop(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Cropping: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_crop(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Protect(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Protecting: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_protect(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Unlock(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Unlocking: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_unlock(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Repair(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Repairing: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_repair(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Ocr(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("OCR: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_ocr(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Info(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Info: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_info(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json)?;
                Ok(())
            })?;
        }
        Commands::Convert(opts) => {
            measure_time(cli_opts.quiet, || {
                print_success(&format!("Converting: {}", opts.input_file.display()), cli_opts.quiet);
                cli::run_convert(opts, cli_opts.verbose, cli_opts.quiet, cli_opts.json, cli_opts.overwrite)?;
                Ok(())
            })?;
        }
        Commands::Completions(opts) => {
            print_completions(opts.shell);
        }
        Commands::Update => {
            measure_time(cli_opts.quiet, || {
                update::check_for_updates(cli_opts.quiet)?;
                Ok(())
            })?;
        }
    }

    Ok(())
}
