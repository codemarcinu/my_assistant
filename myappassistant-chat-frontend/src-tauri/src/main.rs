// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod lib;
use lib::*;

#[tauri::command]
fn greet(name: &str) -> String {
    lib::greet(name)
}

#[tauri::command]
async fn process_receipt_image(path: String) -> Result<lib::ReceiptData, String> {
    lib::process_receipt_image(path).await
}

#[tauri::command]
fn show_system_notification(title: String, body: String) -> Result<(), String> {
    lib::show_system_notification(title, body)
}

#[tauri::command]
fn show_custom_notification(notification: lib::NotificationData) -> Result<(), String> {
    lib::show_custom_notification(notification)
}

#[tauri::command]
async fn save_receipt_data(receipt: lib::ReceiptData) -> Result<String, String> {
    lib::save_receipt_data(receipt).await
}

#[tauri::command]
fn get_app_data_dir() -> Result<std::path::PathBuf, String> {
    lib::get_app_data_dir()
}

#[tauri::command]
async fn make_api_request(url: String, method: String, body: Option<String>) -> Result<String, String> {
    lib::make_api_request(url, method, body).await
}

#[tauri::command]
async fn run_scraper_sidecar(stores: Vec<String>) -> Result<String, String> {
    lib::run_scraper_sidecar(stores).await
}

#[tauri::command]
async fn run_ai_analysis_sidecar(data: String) -> Result<String, String> {
    lib::run_ai_analysis_sidecar(data).await
}

#[tauri::command]
async fn monitor_promotions(store: Option<String>) -> Result<String, String> {
    lib::monitor_promotions(store).await
}

#[tauri::command]
async fn compress_image(image_data: String, options: lib::ImageCompressionOptions) -> Result<lib::CompressedImageResult, String> {
    lib::compress_image(image_data, options).await
}

#[tauri::command]
async fn detect_receipt_contour(image_data: String) -> Result<lib::ReceiptContourResult, String> {
    lib::detect_receipt_contour(image_data).await
}

#[tauri::command]
async fn analyze_image_quality(image_data: String) -> Result<lib::ImageQualityResult, String> {
    lib::analyze_image_quality(image_data).await
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            process_receipt_image,
            show_system_notification,
            show_custom_notification,
            save_receipt_data,
            get_app_data_dir,
            make_api_request,
            run_scraper_sidecar,
            run_ai_analysis_sidecar,
            monitor_promotions,
            compress_image,
            detect_receipt_contour,
            analyze_image_quality,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 