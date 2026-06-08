#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;

use commands::organize::{pdf_merge, pdf_split, pdf_remove_pages, pdf_extract_pages, pdf_organize, pdf_compress};
use commands::edit::{pdf_rotate, pdf_watermark, pdf_page_numbers, pdf_crop};
use commands::security::{pdf_protect, pdf_unlock};
use commands::ocr::{pdf_ocr, pdf_repair};
use commands::convert::{convert_any, pdf_info, pdf_thumbnail};
use commands::utility::{get_temp_dir, clean_temp, app_version};
use state::AppState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            pdf_merge,
            pdf_split,
            pdf_remove_pages,
            pdf_extract_pages,
            pdf_organize,
            pdf_compress,
            pdf_rotate,
            pdf_watermark,
            pdf_page_numbers,
            pdf_crop,
            pdf_ocr,
            pdf_protect,
            pdf_unlock,
            pdf_repair,
            convert_any,
            pdf_info,
            pdf_thumbnail,
            get_temp_dir,
            clean_temp,
            app_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}