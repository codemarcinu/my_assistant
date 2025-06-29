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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            process_receipt_image,
            show_system_notification,
            show_custom_notification,
            save_receipt_data,
            get_app_data_dir,
            make_api_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 