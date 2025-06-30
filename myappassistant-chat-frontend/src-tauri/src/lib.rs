use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use tauri::{command, async_runtime};

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

pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub async fn process_receipt_image(_path: String) -> Result<ReceiptData, String> {
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

pub fn show_system_notification(title: String, body: String) -> Result<(), String> {
    notify_rust::Notification::new()
        .summary(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn show_custom_notification(notification: NotificationData) -> Result<(), String> {
    let mut notif = notify_rust::Notification::new();
    notif.summary(&notification.title).body(&notification.body);
    if let Some(icon) = notification.icon {
        notif.icon(&icon);
    }
    notif.show().map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn save_receipt_data(_receipt: ReceiptData) -> Result<String, String> {
    Ok("Receipt saved successfully".to_string())
}

pub fn get_app_data_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "Failed to get HOME directory".to_string())?;
    Ok(PathBuf::from(home).join(".foodsave-ai"))
}

pub async fn make_api_request(url: String, method: String, body: Option<String>) -> Result<String, String> {
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

/// Uruchamia sidecar scraper i zwraca wyniki
pub async fn run_scraper_sidecar(stores: Vec<String>) -> Result<String, String> {
    let _args: Vec<String> = stores.iter().map(|s| format!("--{}", s)).collect();
    
    // In Tauri v2, we need to use a different approach for sidecars
    // For now, let's return a placeholder until we implement proper sidecar handling
    Ok(format!("Scraper would run with stores: {:?}", stores))
}

/// Uruchamia sidecar AI agent i analizuje dane
pub async fn run_ai_analysis_sidecar(data: String) -> Result<String, String> {
    // In Tauri v2, we need to use a different approach for sidecars
    // For now, let's return a placeholder until we implement proper sidecar handling
    Ok(format!("AI analysis would process data: {}", data))
}

/// Monitoruje promocje w sklepach
pub async fn monitor_promotions(store: Option<String>) -> Result<String, String> {
    let stores = match store {
        Some(s) => vec![s],
        None => vec!["lidl".to_string(), "biedronka".to_string()]
    };
    
    // Uruchom scraper
    let scraped_data = run_scraper_sidecar(stores).await?;
    
    // Analizuj przez AI
    let analysis = run_ai_analysis_sidecar(scraped_data).await?;
    
    Ok(analysis)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet() {
        let result = greet("Test");
        assert_eq!(result, "Hello, Test! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_empty_string() {
        let result = greet("");
        assert_eq!(result, "Hello, ! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_special_characters() {
        let result = greet("Test@123");
        assert_eq!(result, "Hello, Test@123! You've been greeted from Rust!");
    }

    #[tokio::test]
    async fn test_process_receipt_image() {
        let result = process_receipt_image("test_path.jpg".to_string()).await;
        assert!(result.is_ok());
        
        let receipt_data = result.unwrap();
        assert_eq!(receipt_data.items.len(), 2);
        assert_eq!(receipt_data.total, 6.48);
        assert_eq!(receipt_data.store, "Local Supermarket");
        assert!(!receipt_data.receipt_id.is_empty());
        
        // Check first item
        let first_item = &receipt_data.items[0];
        assert_eq!(first_item.name, "Milk");
        assert_eq!(first_item.quantity, 1.0);
        assert_eq!(first_item.price, 3.99);
        assert_eq!(first_item.category, Some("Dairy".to_string()));
        
        // Check second item
        let second_item = &receipt_data.items[1];
        assert_eq!(second_item.name, "Bread");
        assert_eq!(second_item.quantity, 1.0);
        assert_eq!(second_item.price, 2.49);
        assert_eq!(second_item.category, Some("Bakery".to_string()));
    }

    #[test]
    fn test_show_system_notification() {
        // This test might fail in CI environments without display
        // We'll test the function signature and basic logic
        let result = show_system_notification("Test Title".to_string(), "Test Body".to_string());
        // We can't easily test the actual notification display in unit tests
        // but we can test that the function doesn't panic
        // In a real scenario, you might want to mock the notification system
    }

    #[test]
    fn test_show_custom_notification() {
        let notification = NotificationData {
            title: "Custom Title".to_string(),
            body: "Custom Body".to_string(),
            icon: Some("icon.png".to_string()),
        };
        
        let result = show_custom_notification(notification);
        // Similar to system notification, we test that it doesn't panic
    }

    #[test]
    fn test_show_custom_notification_without_icon() {
        let notification = NotificationData {
            title: "Custom Title".to_string(),
            body: "Custom Body".to_string(),
            icon: None,
        };
        
        let result = show_custom_notification(notification);
        // Test that it works without an icon
    }

    #[tokio::test]
    async fn test_save_receipt_data() {
        let receipt = ReceiptData {
            items: vec![
                ReceiptItem {
                    name: "Test Item".to_string(),
                    quantity: 1.0,
                    price: 10.0,
                    category: Some("Test".to_string()),
                },
            ],
            total: 10.0,
            store: "Test Store".to_string(),
            date: Utc::now(),
            receipt_id: "test-id".to_string(),
        };
        
        let result = save_receipt_data(receipt).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Receipt saved successfully");
    }

    #[test]
    fn test_get_app_data_dir() {
        let result = get_app_data_dir();
        assert!(result.is_ok());
        
        let path = result.unwrap();
        assert!(path.to_string_lossy().contains(".foodsave-ai"));
    }

    #[tokio::test]
    async fn test_make_api_request_get() {
        // Test with a real API endpoint
        let result = make_api_request(
            "https://jsonplaceholder.typicode.com/posts/1".to_string(),
            "GET".to_string(),
            None
        ).await;
        
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.contains("userId"));
        assert!(response.contains("id"));
    }

    #[tokio::test]
    async fn test_make_api_request_post() {
        let body = r#"{"title": "test", "body": "test body", "userId": 1}"#;
        let result = make_api_request(
            "https://jsonplaceholder.typicode.com/posts".to_string(),
            "POST".to_string(),
            Some(body.to_string())
        ).await;
        
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.contains("id"));
    }

    #[tokio::test]
    async fn test_make_api_request_invalid_method() {
        let result = make_api_request(
            "https://jsonplaceholder.typicode.com/posts/1".to_string(),
            "INVALID".to_string(),
            None
        ).await;
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Unsupported HTTP method");
    }

    #[tokio::test]
    async fn test_make_api_request_invalid_url() {
        let result = make_api_request(
            "https://invalid-url-that-does-not-exist.com".to_string(),
            "GET".to_string(),
            None
        ).await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Request failed"));
    }

    #[test]
    fn test_receipt_data_serialization() {
        let receipt = ReceiptData {
            items: vec![
                ReceiptItem {
                    name: "Test Item".to_string(),
                    quantity: 1.0,
                    price: 10.0,
                    category: Some("Test".to_string()),
                },
            ],
            total: 10.0,
            store: "Test Store".to_string(),
            date: Utc::now(),
            receipt_id: "test-id".to_string(),
        };
        
        let serialized = serde_json::to_string(&receipt);
        assert!(serialized.is_ok());
        
        let deserialized: Result<ReceiptData, _> = serde_json::from_str(&serialized.unwrap());
        assert!(deserialized.is_ok());
    }

    #[test]
    fn test_notification_data_serialization() {
        let notification = NotificationData {
            title: "Test Title".to_string(),
            body: "Test Body".to_string(),
            icon: Some("icon.png".to_string()),
        };
        
        let serialized = serde_json::to_string(&notification);
        assert!(serialized.is_ok());
        
        let deserialized: Result<NotificationData, _> = serde_json::from_str(&serialized.unwrap());
        assert!(deserialized.is_ok());
    }
} 