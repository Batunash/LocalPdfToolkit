//! LocalPDF CLI - Command-line PDF toolkit

mod cli;

use anyhow::Result;
use clap::Parser;
use cli::{Cli, Commands};

fn main() -> Result<()> {
    human_panic::setup_panic!();
    let args = Cli::parse();

    match args.command {
        Commands::Merge(opts) => cli::run_merge(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Split(opts) => cli::run_split(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Remove(opts) => cli::run_remove(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Extract(opts) => cli::run_extract(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Organize(opts) => cli::run_organize(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Compress(opts) => cli::run_compress(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Rotate(opts) => cli::run_rotate(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Watermark(opts) => cli::run_watermark(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::PageNumbers(opts) => cli::run_page_numbers(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Crop(opts) => cli::run_crop(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Ocr(opts) => cli::run_ocr(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Protect(opts) => cli::run_protect(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Unlock(opts) => cli::run_unlock(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Repair(opts) => cli::run_repair(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Convert(opts) => cli::run_convert(opts, args.verbose, args.quiet, args.json, args.overwrite),
        Commands::Info(opts) => cli::run_info(opts, args.verbose, args.quiet, args.json),
    }
}