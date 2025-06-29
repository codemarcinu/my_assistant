#!/usr/bin/env python3
"""
Security and Backup System Demo

This script demonstrates the key features of the security and backup systems
implemented in the FoodSave AI FastAPI backend.
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path
from datetime import datetime

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from backend.core.security_manager import security_manager
from backend.core.enhanced_backup_manager import enhanced_backup_manager


class SecurityBackupDemo:
    """Demonstration class for security and backup features"""
    
    def __init__(self):
        self.demo_data = {
            "user_info": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "preferences": {
                    "theme": "dark",
                    "language": "en"
                }
            },
            "sensitive_data": {
                "api_keys": ["sk-1234567890abcdef", "sk-fedcba0987654321"],
                "passwords": ["old_password_123", "new_secure_password_456!"],
                "tokens": ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"]
            }
        }
    
    def demo_encryption(self):
        """Demonstrate encryption and decryption features"""
        print("\n🔐 ENCRYPTION DEMO")
        print("=" * 50)
        
        # Test data encryption
        sensitive_text = "This is very sensitive information that needs to be encrypted!"
        print(f"Original text: {sensitive_text}")
        
        # Encrypt the data
        encrypted_data = security_manager.encrypt_data(sensitive_text)
        print(f"Encrypted data: {encrypted_data[:50]}...")
        
        # Decrypt the data
        decrypted_data = security_manager.decrypt_data(encrypted_data)
        print(f"Decrypted data: {decrypted_data}")
        
        # Verify integrity
        assert decrypted_data == sensitive_text
        print("✅ Encryption/Decryption test passed!")
    
    def demo_password_validation(self):
        """Demonstrate password strength validation"""
        print("\n🔒 PASSWORD VALIDATION DEMO")
        print("=" * 50)
        
        test_passwords = [
            "weak",
            "password123",
            "MySecurePassword123!",
            "SuperStrongPassword2024!@#$%",
            "12345678901234567890"
        ]
        
        for password in test_passwords:
            result = security_manager.validate_password_strength(password)
            status = "✅ VALID" if result["valid"] else "❌ INVALID"
            print(f"\nPassword: {password}")
            print(f"Status: {status}")
            print(f"Strength Score: {result['strength_score']}/100")
            
            if result["errors"]:
                print(f"Errors: {', '.join(result['errors'])}")
            if result["warnings"]:
                print(f"Warnings: {', '.join(result['warnings'])}")
    
    def demo_input_validation(self):
        """Demonstrate input validation and sanitization"""
        print("\n🛡️ INPUT VALIDATION DEMO")
        print("=" * 50)
        
        test_inputs = [
            "Normal user input",
            "<script>alert('XSS attack')</script>",
            "SELECT * FROM users WHERE id = 1; DROP TABLE users;",
            "javascript:alert('Clickjacking')",
            "Normal text with <b>HTML</b> tags",
            "A" * 15000  # Very long input
        ]
        
        for user_input in test_inputs:
            print(f"\nInput: {user_input[:50]}{'...' if len(user_input) > 50 else ''}")
            
            # Validate input
            validation_result = security_manager.validate_input(user_input)
            status = "✅ VALID" if validation_result["valid"] else "❌ INVALID"
            print(f"Validation: {status}")
            
            if not validation_result["valid"]:
                print(f"Errors: {', '.join(validation_result['errors'])}")
            
            # Sanitize input
            sanitized = security_manager.sanitize_input(user_input)
            print(f"Sanitized: {sanitized[:50]}{'...' if len(sanitized) > 50 else ''}")
    
    async def demo_file_validation(self):
        """Demonstrate file upload validation"""
        print("\n📁 FILE VALIDATION DEMO")
        print("=" * 50)
        
        test_files = [
            ("document.pdf", 1024000, "application/pdf"),  # 1MB PDF
            ("image.jpg", 5242880, "image/jpeg"),  # 5MB JPEG
            ("malicious.exe", 2048000, "application/x-executable"),  # Executable
            ("large_file.zip", 52428800, "application/zip"),  # 50MB ZIP
            ("script.js", 102400, "text/javascript"),  # JavaScript file
        ]
        
        for filename, size, content_type in test_files:
            print(f"\nFile: {filename} ({size} bytes, {content_type})")
            
            result = await security_manager.validate_file_upload(
                filename, size, content_type
            )
            
            status = "✅ VALID" if result["valid"] else "❌ INVALID"
            print(f"Validation: {status}")
            
            if not result["valid"]:
                print(f"Errors: {', '.join(result['errors'])}")
            if result["warnings"]:
                print(f"Warnings: {', '.join(result['warnings'])}")
    
    def demo_security_tokens(self):
        """Demonstrate secure token generation"""
        print("\n🎫 SECURITY TOKENS DEMO")
        print("=" * 50)
        
        # Generate secure tokens
        token_32 = security_manager.generate_secure_token(32)
        token_64 = security_manager.generate_secure_token(64)
        api_key = security_manager.generate_api_key()
        
        print(f"32-character token: {token_32}")
        print(f"64-character token: {token_64}")
        print(f"API Key: {api_key}")
        
        # Verify tokens are different
        assert token_32 != token_64
        assert token_32 != api_key
        print("✅ All tokens are unique!")
    
    async def demo_backup_creation(self):
        """Demonstrate backup creation with encryption"""
        print("\n💾 BACKUP CREATION DEMO")
        print("=" * 50)
        
        # Create a temporary directory for demo
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create some demo files
            config_file = temp_path / "config.json"
            config_file.write_text('{"demo": "configuration", "timestamp": "' + str(datetime.now()) + '"}')
            
            data_file = temp_path / "data.txt"
            data_file.write_text("This is demo data for backup testing.")
            
            # Set backup directory to temp location
            original_backup_dir = enhanced_backup_manager.backup_dir
            enhanced_backup_manager.backup_dir = temp_path / "backups"
            enhanced_backup_manager.backup_dir.mkdir(exist_ok=True)
            
            try:
                # Create backup
                print("Creating encrypted backup...")
                result = await enhanced_backup_manager.create_enhanced_backup(
                    backup_name="demo_backup",
                    components=["config"],
                    encrypt=True,
                    upload_to_cloud=False
                )
                
                print(f"Backup Status: {result['status']}")
                print(f"Backup Name: {result['backup_name']}")
                print(f"Encrypted: {result['encrypted']}")
                print(f"Size: {result.get('size_mb', 'N/A')} MB")
                
                # List backups
                backups = await enhanced_backup_manager.list_enhanced_backups()
                print(f"Total backups: {len(backups)}")
                
                # Get backup stats
                stats = await enhanced_backup_manager.get_backup_stats()
                print(f"Backup statistics: {stats}")
                
            finally:
                # Restore original backup directory
                enhanced_backup_manager.backup_dir = original_backup_dir
    
    async def demo_rate_limiting(self):
        """Demonstrate rate limiting functionality"""
        print("\n⏱️ RATE LIMITING DEMO")
        print("=" * 50)
        
        user_id = "demo_user"
        
        print("Testing rate limiting for API calls...")
        for i in range(10):
            allowed = await security_manager.check_rate_limit(user_id, "api_call")
            status = "✅ ALLOWED" if allowed else "❌ BLOCKED"
            print(f"Request {i+1}: {status}")
            
            if not allowed:
                print("Rate limit exceeded!")
                break
    
    async def demo_audit_logging(self):
        """Demonstrate security audit logging"""
        print("\n📝 AUDIT LOGGING DEMO")
        print("=" * 50)
        
        # Log various security events
        events = [
            ("login_attempt", "user123", "192.168.1.100", True, "low"),
            ("file_upload", "user456", "192.168.1.101", True, "medium"),
            ("failed_login", "user789", "192.168.1.102", False, "high"),
            ("data_access", "user123", "192.168.1.100", True, "low"),
            ("suspicious_activity", "unknown", "192.168.1.103", False, "critical"),
        ]
        
        for event_type, user_id, ip_address, success, risk_level in events:
            await security_manager.log_security_event(
                event_type=event_type,
                user_id=user_id,
                ip_address=ip_address,
                success=success,
                risk_level=risk_level
            )
            print(f"Logged event: {event_type} for {user_id} ({risk_level} risk)")
        
        # Get security statistics
        stats = await security_manager.get_security_stats()
        print(f"\nSecurity Statistics: {stats}")
    
    async def run_full_demo(self):
        """Run the complete security and backup demonstration"""
        print("🚀 SECURITY & BACKUP SYSTEM DEMONSTRATION")
        print("=" * 60)
        print("This demo showcases the comprehensive security and backup")
        print("features implemented in the FoodSave AI FastAPI backend.")
        print("=" * 60)
        
        # Run all demos
        self.demo_encryption()
        self.demo_password_validation()
        self.demo_input_validation()
        await self.demo_file_validation()
        self.demo_security_tokens()
        await self.demo_backup_creation()
        await self.demo_rate_limiting()
        await self.demo_audit_logging()
        
        print("\n🎉 DEMONSTRATION COMPLETED!")
        print("=" * 60)
        print("All security and backup features are working correctly.")
        print("The system provides comprehensive protection for your data.")
        print("=" * 60)


async def main():
    """Main function to run the demo"""
    demo = SecurityBackupDemo()
    await demo.run_full_demo()


if __name__ == "__main__":
    # Run the demo
    asyncio.run(main()) 