// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptData {
    pub items: Vec<ReceiptItem>,
    pub total: f64,
    pub store: String,
    pub date: DateTime<Utc>,
    pub receipt_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptItem {
    pub name: String,
    pub quantity: f64,
    pub price: f64,
    pub category: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationData {
    pub title: String,
    pub body: String,
    pub icon: Option<String>,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn process_receipt_image(_path: String) -> Result<ReceiptData, String> {
    // TODO: Implement actual OCR processing
    // For now, return mock data
    let receipt_data = ReceiptData {
        items: vec![
            ReceiptItem {
                name: "Milk".to_string(),
                quantity: 1.0,
                price: 3.99,
                category: Some("Dairy".to_string()),
            },
            ReceiptItem {
                name: "Bread".to_string(),
                quantity: 1.0,
                price: 2.49,
                category: Some("Bakery".to_string()),
            },
        ],
        total: 6.48,
        store: "Local Supermarket".to_string(),
        date: Utc::now(),
        receipt_id: uuid::Uuid::new_v4().to_string(),
    };
    
    Ok(receipt_data)
}

#[tauri::command]
fn show_system_notification(title: String, body: String) -> Result<(), String> {
    notify_rust::Notification::new()
        .summary(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn show_custom_notification(notification: NotificationData) -> Result<(), String> {
    let mut notif = notify_rust::Notification::new();
    notif.summary(&notification.title).body(&notification.body);
    
    if let Some(icon) = notification.icon {
        notif.icon(&icon);
    }
    
    notif.show().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn save_receipt_data(_receipt: ReceiptData) -> Result<String, String> {
    // TODO: Implement actual data saving
    // For now, just return success
    Ok("Receipt saved successfully".to_string())
}

#[tauri::command]
fn get_app_data_dir() -> Result<PathBuf, String> {
    // In Tauri v2, we need to use the path plugin
    // For now, return a default path
    let home = std::env::var("HOME").map_err(|_| "Failed to get HOME directory".to_string())?;
    Ok(PathBuf::from(home).join(".foodsave-ai"))
}

#[tauri::command]
async fn make_api_request(url: String, method: String, body: Option<String>) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let request = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => {
            let mut req = client.post(&url);
            if let Some(body_data) = body {
                req = req.body(body_data);
            }
            req
        },
        "PUT" => {
            let mut req = client.put(&url);
            if let Some(body_data) = body {
                req = req.body(body_data);
            }
            req
        },
        "DELETE" => client.delete(&url),
        _ => return Err("Unsupported HTTP method".to_string()),
    };
    
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    Ok(response_text)
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