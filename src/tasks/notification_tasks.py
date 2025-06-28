"""
Notification tasks for FoodSave AI
Handles WebSocket notifications and user alerts.
"""

import json
from typing import Dict, Any, Optional
from datetime import datetime
from celery.utils.log import get_task_logger

from src.worker import celery_app

logger = get_task_logger(__name__)


@celery_app.task
def send_websocket_notification(
    user_id: str, 
    event_type: str, 
    data: Dict[str, Any],
    room: Optional[str] = None
) -> Dict[str, Any]:
    """
    Wysyła powiadomienie przez WebSocket.
    
    Args:
        user_id: ID użytkownika
        event_type: Typ zdarzenia (np. 'receipt_processed', 'error')
        data: Dane do wysłania
        room: Pokój WebSocket (opcjonalne)
    
    Returns:
        Dict z wynikiem operacji
    """
    try:
        # TODO: Implement actual WebSocket notification logic
        # For now, we'll just log the notification
        
        notification = {
            "user_id": user_id,
            "event_type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat(),
            "room": room
        }
        
        logger.info(f"WebSocket notification: {json.dumps(notification, indent=2)}")
        
        # In a real implementation, you would:
        # 1. Get the WebSocket connection for the user
        # 2. Send the notification
        # 3. Handle connection errors
        
        return {
            "status": "SUCCESS",
            "message": "Notification sent",
            "notification": notification
        }
        
    except Exception as e:
        logger.error(f"Error sending WebSocket notification: {e}")
        return {
            "status": "FAILURE",
            "error": str(e)
        }


@celery_app.task
def send_receipt_completion_notification(
    user_id: str,
    task_id: str,
    receipt_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Wysyła powiadomienie o zakończeniu przetwarzania paragonu.
    
    Args:
        user_id: ID użytkownika
        task_id: ID zadania Celery
        receipt_data: Dane przetworzonego paragonu
    
    Returns:
        Dict z wynikiem operacji
    """
    try:
        notification_data = {
            "task_id": task_id,
            "status": "completed",
            "receipt": {
                "filename": receipt_data.get("filename"),
                "store": receipt_data.get("analysis", {}).get("store_name"),
                "total": receipt_data.get("analysis", {}).get("total_amount"),
                "items_count": len(receipt_data.get("analysis", {}).get("items", [])),
                "processing_time": receipt_data.get("processing_time")
            }
        }
        
        return send_websocket_notification.delay(
            user_id=user_id,
            event_type="receipt_processed",
            data=notification_data,
            room=f"user_{user_id}"
        )
        
    except Exception as e:
        logger.error(f"Error sending receipt completion notification: {e}")
        return {
            "status": "FAILURE",
            "error": str(e)
        }


@celery_app.task
def send_receipt_error_notification(
    user_id: str,
    task_id: str,
    error_message: str,
    filename: str
) -> Dict[str, Any]:
    """
    Wysyła powiadomienie o błędzie przetwarzania paragonu.
    
    Args:
        user_id: ID użytkownika
        task_id: ID zadania Celery
        error_message: Wiadomość błędu
        filename: Nazwa pliku
    
    Returns:
        Dict z wynikiem operacji
    """
    try:
        notification_data = {
            "task_id": task_id,
            "status": "error",
            "error": error_message,
            "filename": filename,
            "timestamp": datetime.now().isoformat()
        }
        
        return send_websocket_notification.delay(
            user_id=user_id,
            event_type="receipt_error",
            data=notification_data,
            room=f"user_{user_id}"
        )
        
    except Exception as e:
        logger.error(f"Error sending receipt error notification: {e}")
        return {
            "status": "FAILURE",
            "error": str(e)
        }


@celery_app.task
def send_system_notification(
    user_id: str,
    message: str,
    notification_type: str = "info"
) -> Dict[str, Any]:
    """
    Wysyła ogólne powiadomienie systemowe.
    
    Args:
        user_id: ID użytkownika
        message: Wiadomość
        notification_type: Typ powiadomienia (info, warning, error, success)
    
    Returns:
        Dict z wynikiem operacji
    """
    try:
        notification_data = {
            "message": message,
            "type": notification_type,
            "timestamp": datetime.now().isoformat()
        }
        
        return send_websocket_notification.delay(
            user_id=user_id,
            event_type="system_notification",
            data=notification_data,
            room=f"user_{user_id}"
        )
        
    except Exception as e:
        logger.error(f"Error sending system notification: {e}")
        return {
            "status": "FAILURE",
            "error": str(e)
        } 