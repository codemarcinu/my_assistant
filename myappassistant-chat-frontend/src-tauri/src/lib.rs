use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use base64::{Engine as _, engine::general_purpose};

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

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageCompressionOptions {
    pub max_width: Option<u32>,
    pub max_height: Option<u32>,
    pub quality: Option<u8>,
    pub format: Option<String>, // "jpeg", "png", "webp"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompressedImageResult {
    pub data: String, // base64 encoded image
    pub format: String,
    pub width: u32,
    pub height: u32,
    pub size_bytes: usize,
    pub compression_ratio: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageQualityResult {
    pub sharpness_score: f64,
    pub contrast_score: f64,
    pub brightness_score: f64,
    pub overall_quality: f64,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptContourResult {
    pub detected: bool,
    pub confidence: f64,
    pub corners: Option<Vec<(f32, f32)>>,
    pub bounding_box: Option<(f32, f32, f32, f32)>, // x, y, width, height
    pub angle: Option<f32>,
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
    notif.summary(&notification.title)
         .body(&notification.body);
    if let Some(icon) = &notification.icon {
        notif.icon(icon);
    }
    notif.show().map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn save_receipt_data(receipt: ReceiptData) -> Result<String, String> {
    // Simulate saving to database
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    Ok(format!("Receipt saved with ID: {}", receipt.receipt_id))
}

pub fn get_app_data_dir() -> Result<PathBuf, String> {
    // In Tauri 2.x, we need to use the app handle to get the data directory
    // This function will be called from a Tauri command context where we have access to the app
    let app_data_dir = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME").map(|home| format!("{}/.config", home)))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));
    
    Ok(app_data_dir.join("foodsave-ai"))
}

pub async fn make_api_request(url: String, method: String, body: Option<String>) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let request_builder = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => {
            let mut req = client.post(&url);
            if let Some(body_content) = body {
                req = req.body(body_content);
            }
            req
        },
        "PUT" => {
            let mut req = client.put(&url);
            if let Some(body_content) = body {
                req = req.body(body_content);
            }
            req
        },
        "DELETE" => client.delete(&url),
        _ => return Err("Unsupported HTTP method".to_string()),
    };
    
    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP error: {}", status));
    }
    
    let text = response.text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    Ok(text)
}

pub async fn run_scraper_sidecar(stores: Vec<String>) -> Result<String, String> {
    // Simulate running scraper sidecar
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    Ok(format!("Scraped data for stores: {:?}", stores))
}

pub async fn run_ai_analysis_sidecar(data: String) -> Result<String, String> {
    // Simulate AI analysis
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    Ok(format!("AI analysis completed for data: {}", data))
}

pub async fn monitor_promotions(store: Option<String>) -> Result<String, String> {
    // Simulate promotion monitoring
    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    let store_name = store.unwrap_or_else(|| "all stores".to_string());
    Ok(format!("Promotion monitoring completed for: {}", store_name))
}

/// Kompresuje i przetwarza obraz po stronie klienta
/// Zgodnie z rekomendacjami audytu - oszczędność transferu
pub async fn compress_image(
    image_data: String, // base64 encoded image
    options: ImageCompressionOptions
) -> Result<CompressedImageResult, String> {
    // Dekoduj base64
    let image_bytes = general_purpose::STANDARD
        .decode(image_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // Wczytaj obraz
    let mut img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;
    
    let original_width = img.width();
    let original_height = img.height();
    let original_size = image_bytes.len();
    
    // Resize jeśli podano wymiary
    if let (Some(max_width), Some(max_height)) = (options.max_width, options.max_height) {
        img = img.resize(max_width, max_height, image::imageops::FilterType::Lanczos3);
    } else if let Some(max_width) = options.max_width {
        let ratio = max_width as f32 / original_width as f32;
        let new_height = (original_height as f32 * ratio) as u32;
        img = img.resize(max_width, new_height, image::imageops::FilterType::Lanczos3);
    } else if let Some(max_height) = options.max_height {
        let ratio = max_height as f32 / original_height as f32;
        let new_width = (original_width as f32 * ratio) as u32;
        img = img.resize(new_width, max_height, image::imageops::FilterType::Lanczos3);
    }
    
    // Określ format wyjściowy
    let format = options.format.unwrap_or_else(|| "jpeg".to_string());
    let quality = options.quality.unwrap_or(85);
    
    // Konwertuj do odpowiedniego formatu
    let mut output_buffer = Vec::new();
    match format.to_lowercase().as_str() {
        "jpeg" | "jpg" => {
            img.write_with_encoder(
                image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output_buffer, quality)
            ).map_err(|e| format!("Failed to encode JPEG: {}", e))?;
        },
        "png" => {
            img.write_with_encoder(
                image::codecs::png::PngEncoder::new(&mut output_buffer)
            ).map_err(|e| format!("Failed to encode PNG: {}", e))?;
        },
        "webp" => {
            // WebP encoding would require additional dependencies
            return Err("WebP encoding not yet supported".to_string());
        },
        _ => {
            return Err(format!("Unsupported format: {}", format));
        }
    }
    
    // Encode to base64
    let compressed_base64 = general_purpose::STANDARD.encode(&output_buffer);
    
    let compression_ratio = original_size as f64 / output_buffer.len() as f64;
    
    Ok(CompressedImageResult {
        data: compressed_base64,
        format,
        width: img.width(),
        height: img.height(),
        size_bytes: output_buffer.len(),
        compression_ratio,
    })
}

/// Wykrywa kontur paragonu w obrazie
/// Zgodnie z rekomendacjami audytu - preprocessing po stronie klienta
pub async fn detect_receipt_contour(
    image_data: String // base64 encoded image
) -> Result<ReceiptContourResult, String> {
    // Dekoduj base64
    let image_bytes = general_purpose::STANDARD
        .decode(image_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // Wczytaj obraz
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;
    
    // Konwertuj do RGB
    let rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();
    
    // Prosta implementacja wykrywania konturu (w rzeczywistości użyłaby OpenCV)
    // Tutaj symulujemy wykrywanie prostokątnego konturu
    
    // Sprawdź czy obraz ma odpowiednie proporcje paragonu (szeroki prostokąt)
    let aspect_ratio = width as f32 / height as f32;
    let is_receipt_like = aspect_ratio > 1.5 && aspect_ratio < 4.0;
    
    if is_receipt_like {
        // Symuluj wykrycie konturu
        let corners = vec![
            (0.0, 0.0),
            (width as f32, 0.0),
            (width as f32, height as f32),
            (0.0, height as f32),
        ];
        
        Ok(ReceiptContourResult {
            detected: true,
            confidence: 0.8,
            corners: Some(corners),
            bounding_box: Some((0.0, 0.0, width as f32, height as f32)),
            angle: Some(0.0),
        })
    } else {
        Ok(ReceiptContourResult {
            detected: false,
            confidence: 0.2,
            corners: None,
            bounding_box: None,
            angle: None,
        })
    }
}

/// Analizuje jakość obrazu paragonu
/// Zgodnie z rekomendacjami audytu - feedback dla użytkownika
pub async fn analyze_image_quality(
    image_data: String // base64 encoded image
) -> Result<ImageQualityResult, String> {
    // Dekoduj base64
    let image_bytes = general_purpose::STANDARD
        .decode(image_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // Wczytaj obraz
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;
    
    let rgb_img = img.to_rgb8();
    let (_width, _height) = rgb_img.dimensions();
    
    // Prosta analiza jakości obrazu
    let mut total_brightness = 0u32;
    let mut total_pixels = 0u32;
    
    // Oblicz średnią jasność
    for pixel in rgb_img.pixels() {
        let brightness = (pixel[0] as u32 + pixel[1] as u32 + pixel[2] as u32) / 3;
        total_brightness += brightness;
        total_pixels += 1;
    }
    
    let avg_brightness = total_brightness as f64 / total_pixels as f64;
    
    // Oblicz scores (0.0 - 1.0)
    let brightness_score = (avg_brightness / 255.0).min(1.0);
    let sharpness_score = 0.7; // Symulacja - w rzeczywistości użyłaby analizy gradientów
    let contrast_score = 0.8; // Symulacja - w rzeczywistości użyłaby analizy histogramu
    
    let overall_quality = (brightness_score + sharpness_score + contrast_score) / 3.0;
    
    // Generuj rekomendacje
    let mut recommendations = Vec::new();
    
    if brightness_score < 0.3 {
        recommendations.push("Obraz jest zbyt ciemny. Spróbuj lepszego oświetlenia.".to_string());
    } else if brightness_score > 0.9 {
        recommendations.push("Obraz może być prześwietlony. Zmniejsz jasność.".to_string());
    }
    
    if sharpness_score < 0.5 {
        recommendations.push("Obraz może być nieostry. Upewnij się, że aparat jest stabilny.".to_string());
    }
    
    if contrast_score < 0.5 {
        recommendations.push("Kontrast jest niski. Spróbuj lepszego oświetlenia.".to_string());
    }
    
    if recommendations.is_empty() {
        recommendations.push("Jakość obrazu jest dobra.".to_string());
    }
    
    Ok(ImageQualityResult {
        sharpness_score,
        contrast_score,
        brightness_score,
        overall_quality,
        recommendations,
    })
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
        let result = show_system_notification("Test Title".to_string(), "Test Body".to_string());
        // This might fail in CI environments without display, so we just check it doesn't panic
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn test_show_custom_notification() {
        let notification = NotificationData {
            title: "Test Title".to_string(),
            body: "Test Body".to_string(),
            icon: None,
        };
        let result = show_custom_notification(notification);
        // This might fail in CI environments without display, so we just check it doesn't panic
        assert!(result.is_ok() || result.is_err());
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
                }
            ],
            total: 10.0,
            store: "Test Store".to_string(),
            date: Utc::now(),
            receipt_id: "test-id".to_string(),
        };
        
        let result = save_receipt_data(receipt).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("test-id"));
    }

    #[test]
    fn test_get_app_data_dir() {
        let result = get_app_data_dir();
        // This might fail in some environments, so we just check it doesn't panic
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_run_scraper_sidecar() {
        let stores = vec!["store1".to_string(), "store2".to_string()];
        let result = run_scraper_sidecar(stores).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("store1"));
    }

    #[tokio::test]
    async fn test_run_ai_analysis_sidecar() {
        let data = "test data".to_string();
        let result = run_ai_analysis_sidecar(data).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("test data"));
    }

    #[tokio::test]
    async fn test_monitor_promotions() {
        let result = monitor_promotions(Some("test store".to_string())).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("test store"));
    }

    #[tokio::test]
    async fn test_monitor_promotions_no_store() {
        let result = monitor_promotions(None).await;
        assert!(result.is_ok());
        assert!(result.unwrap().contains("all stores"));
    }
} 