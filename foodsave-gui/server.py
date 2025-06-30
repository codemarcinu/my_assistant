#!/usr/bin/env python3
"""
FoodSave AI GUI Server
Serwer dla intuicyjnego GUI zarządzania systemem FoodSave AI
"""

import os
import sys
import json
import subprocess
import asyncio
import threading
import time
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psutil
import requests
import shlex

app = Flask(__name__)
CORS(app)

# Konfiguracja
SCRIPT_DIR = Path(__file__).parent.parent
FOODSAVE_SCRIPT = SCRIPT_DIR / "foodsave-all.sh"
BACKEND_PORT = 8000
FRONTEND_PORT = 3000
OLLAMA_PORT = 11434

class FoodSaveManager:
    def __init__(self):
        self.script_path = FOODSAVE_SCRIPT
        self.processes = {}
        
    def run_script_command(self, command, timeout=300):
        """Uruchamia komendę w skrypcie foodsave-all.sh"""
        try:
            # Przygotuj komendę echo do przekazania do skryptu
            full_command = f'echo "{command}" | {self.script_path}'
            
            result = subprocess.run(
                full_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=SCRIPT_DIR
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'stdout': '',
                'stderr': 'Timeout - operacja trwała zbyt długo',
                'returncode': -1
            }
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def check_port_status(self, port):
        """Sprawdza status portu"""
        try:
            # Sprawdź czy port jest używany
            for conn in psutil.net_connections():
                if conn.laddr.port == port and conn.status == 'LISTEN':
                    return True
            return False
        except:
            return False
    
    def check_service_status(self, url, timeout=5):
        """Sprawdza status usługi HTTP"""
        try:
            response = requests.get(url, timeout=timeout)
            return response.status_code == 200
        except:
            return False
    
    def get_system_status(self):
        """Pobiera status wszystkich komponentów systemu"""
        status = {
            'backend': {
                'port': BACKEND_PORT,
                'url': f'http://localhost:{BACKEND_PORT}/health',
                'running': False,
                'healthy': False
            },
            'frontend': {
                'port': FRONTEND_PORT,
                'url': f'http://localhost:{FRONTEND_PORT}',
                'running': False,
                'healthy': False
            },
            'database': {
                'port': 5432,
                'running': False
            },
            'ai': {
                'port': OLLAMA_PORT,
                'url': f'http://localhost:{OLLAMA_PORT}/api/tags',
                'running': False,
                'healthy': False
            }
        }
        
        # Sprawdź backend
        status['backend']['running'] = self.check_port_status(BACKEND_PORT)
        if status['backend']['running']:
            status['backend']['healthy'] = self.check_service_status(status['backend']['url'])
        
        # Sprawdź frontend
        status['frontend']['running'] = self.check_port_status(FRONTEND_PORT)
        if status['frontend']['running']:
            status['frontend']['healthy'] = self.check_service_status(status['frontend']['url'])
        
        # Sprawdź bazę danych
        status['database']['running'] = self.check_port_status(5432)
        
        # Sprawdź AI
        status['ai']['running'] = self.check_port_status(OLLAMA_PORT)
        if status['ai']['running']:
            status['ai']['healthy'] = self.check_service_status(status['ai']['url'])
        
        return status
    
    def get_logs(self, log_type='all'):
        """Pobiera logi systemowe"""
        try:
            log_files = {
                'backend': ['logs/backend.log', 'logs/backend.log.1', 'logs/backend.log.2'],
                'frontend': ['myappassistant-chat-frontend/frontend.log'],
                'docker': ['logs/docker.log'],
                'all': ['logs/backend.log', 'logs/backend.log.1', 'logs/backend.log.2', 
                       'myappassistant-chat-frontend/frontend.log', 'logs/docker.log']
            }
            
            logs = []
            files_to_check = log_files.get(log_type, log_files['all'])
            
            for log_file in files_to_check:
                log_path = SCRIPT_DIR / log_file
                if log_path.exists():
                    try:
                        with open(log_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if content.strip():
                                logs.append(f"=== {log_file} ===\n{content}\n")
                    except Exception as e:
                        logs.append(f"=== {log_file} (błąd odczytu: {e}) ===\n")
            
            return '\n'.join(logs) if logs else 'Brak logów do wyświetlenia'
        except Exception as e:
            return f"Błąd podczas pobierania logów: {e}"
    
    def check_environment(self):
        """Sprawdza środowisko systemu"""
        try:
            result = self.run_script_command('8')  # Opcja sprawdzania środowiska
            
            # Jeśli skrypt zwrócił błąd, dodaj dodatkowe informacje diagnostyczne
            if not result['success']:
                # Dodaj podstawowe sprawdzenia systemowe
                system_info = self._get_system_info()
                port_info = self._get_port_info()
                docker_info = self._get_docker_info()
                
                detailed_info = f"""
🔧 DIAGNOSTYKA SYSTEMU FOODSAVE AI
{'='*50}

❌ BŁĄD PODCZAS SPRAWDZANIA ŚRODOWISKA
Błąd: {result['stderr']}

📋 INFORMACJE SYSTEMOWE:
{system_info}

🌐 SPRAWDZENIE PORTÓW:
{port_info}

🐳 INFORMACJE O DOCKER:
{docker_info}

💡 JAK NAPRAWIĆ PROBLEMY:

1. SPRAWDŹ CZY DOCKER JEST URUCHOMIONY:
   • Otwórz terminal i wpisz: docker --version
   • Jeśli nie działa: sudo systemctl start docker
   • Sprawdź czy użytkownik należy do grupy docker

2. SPRAWDŹ CZY PORTY SĄ WOLNE:
   • Port 8000 (backend): {self.check_port_status(8000) and '❌ ZAJĘTY' or '✅ WOLNY'}
   • Port 3000 (frontend): {self.check_port_status(3000) and '❌ ZAJĘTY' or '✅ WOLNY'}
   • Port 5432 (baza danych): {self.check_port_status(5432) and '❌ ZAJĘTY' or '✅ WOLNY'}

3. SPRAWDŹ UPRAWNIENIA:
   • Upewnij się, że masz uprawnienia do uruchamiania Docker
   • Sprawdź czy katalog projektu ma uprawnienia do zapisu

4. RESTART SYSTEMU:
   • Czasami restart komputera rozwiązuje problemy z Docker
   • Uruchom ponownie po restarcie

📞 POTRZEBUJESZ POMOCY?
• Sprawdź dokumentację: docs/README_DEVELOPMENT.md
• Uruchom ponownie diagnostykę po naprawach
• Skontaktuj się z zespołem wsparcia
"""
                return detailed_info
            
            # Jeśli skrypt działał poprawnie, zwróć jego wynik
            return result['stdout']
            
        except Exception as e:
            # W przypadku błędu, zwróć podstawowe informacje diagnostyczne
            system_info = self._get_system_info()
            port_info = self._get_port_info()
            docker_info = self._get_docker_info()
            
            return f"""
🔧 DIAGNOSTYKA SYSTEMU FOODSAVE AI
{'='*50}

❌ BŁĄD PODCZAS SPRAWDZANIA ŚRODOWISKA
Błąd: {str(e)}

📋 INFORMACJE SYSTEMOWE:
{system_info}

🌐 SPRAWDZENIE PORTÓW:
{port_info}

🐳 INFORMACJE O DOCKER:
{docker_info}

💡 JAK NAPRAWIĆ PROBLEMY:

1. SPRAWDŹ CZY DOCKER JEST URUCHOMIONY:
   • Otwórz terminal i wpisz: docker --version
   • Jeśli nie działa: sudo systemctl start docker
   • Sprawdź czy użytkownik należy do grupy docker

2. SPRAWDŹ CZY PORTY SĄ WOLNE:
   • Port 8000 (backend): {self.check_port_status(8000) and '❌ ZAJĘTY' or '✅ WOLNY'}
   • Port 3000 (frontend): {self.check_port_status(3000) and '❌ ZAJĘTY' or '✅ WOLNY'}
   • Port 5432 (baza danych): {self.check_port_status(5432) and '❌ ZAJĘTY' or '✅ WOLNY'}

3. SPRAWDŹ UPRAWNIENIA:
   • Upewnij się, że masz uprawnienia do uruchamiania Docker
   • Sprawdź czy katalog projektu ma uprawnienia do zapisu

4. RESTART SYSTEMU:
   • Czasami restart komputera rozwiązuje problemy z Docker
   • Uruchom ponownie po restarcie

📞 POTRZEBUJESZ POMOCY?
• Sprawdź dokumentację: docs/README_DEVELOPMENT.md
• Uruchom ponownie diagnostykę po naprawach
• Skontaktuj się z zespołem wsparcia
"""

    def _get_system_info(self):
        """Pobiera podstawowe informacje o systemie"""
        try:
            import platform
            import subprocess
            
            info = []
            info.append(f"• System operacyjny: {platform.system()} {platform.release()}")
            info.append(f"• Architektura: {platform.machine()}")
            info.append(f"• Python: {platform.python_version()}")
            
            # Sprawdź Docker
            try:
                docker_version = subprocess.run(['docker', '--version'], 
                                              capture_output=True, text=True, timeout=5)
                if docker_version.returncode == 0:
                    info.append(f"• Docker: {docker_version.stdout.strip()}")
                else:
                    info.append("• Docker: ❌ Nie zainstalowany lub nie działa")
            except:
                info.append("• Docker: ❌ Nie zainstalowany lub nie działa")
            
            # Sprawdź Node.js
            try:
                node_version = subprocess.run(['node', '--version'], 
                                            capture_output=True, text=True, timeout=5)
                if node_version.returncode == 0:
                    info.append(f"• Node.js: {node_version.stdout.strip()}")
                else:
                    info.append("• Node.js: ❌ Nie zainstalowany")
            except:
                info.append("• Node.js: ❌ Nie zainstalowany")
            
            return '\n'.join(info)
        except Exception as e:
            return f"Błąd podczas pobierania informacji systemowych: {e}"

    def _get_port_info(self):
        """Sprawdza status portów"""
        info = []
        ports = [
            (8000, "Backend (API)"),
            (3000, "Frontend (Web)"),
            (5432, "Baza danych (PostgreSQL)"),
            (11434, "AI Model (Ollama)")
        ]
        
        for port, name in ports:
            if self.check_port_status(port):
                info.append(f"• Port {port} ({name}): ❌ ZAJĘTY")
            else:
                info.append(f"• Port {port} ({name}): ✅ WOLNY")
        
        return '\n'.join(info)

    def _get_docker_info(self):
        """Pobiera informacje o Docker"""
        try:
            import subprocess
            
            info = []
            
            # Sprawdź czy Docker jest zainstalowany
            try:
                docker_version = subprocess.run(['docker', '--version'], 
                                              capture_output=True, text=True, timeout=5)
                if docker_version.returncode == 0:
                    info.append(f"• Docker zainstalowany: ✅ {docker_version.stdout.strip()}")
                else:
                    info.append("• Docker zainstalowany: ❌ NIE")
                    return '\n'.join(info)
            except:
                info.append("• Docker zainstalowany: ❌ NIE")
                return '\n'.join(info)
            
            # Sprawdź czy Docker działa
            try:
                docker_info = subprocess.run(['docker', 'info'], 
                                           capture_output=True, text=True, timeout=5)
                if docker_info.returncode == 0:
                    info.append("• Docker działa: ✅ TAK")
                else:
                    info.append("• Docker działa: ❌ NIE")
                    info.append("  → Uruchom: sudo systemctl start docker")
                    return '\n'.join(info)
            except:
                info.append("• Docker działa: ❌ NIE")
                info.append("  → Uruchom: sudo systemctl start docker")
                return '\n'.join(info)
            
            # Sprawdź kontenery
            try:
                containers = subprocess.run(['docker', 'ps', '--format', 'table {{.Names}}\t{{.Status}}'], 
                                          capture_output=True, text=True, timeout=5)
                if containers.returncode == 0 and containers.stdout.strip():
                    info.append("• Kontenery uruchomione: ✅ TAK")
                    info.append("  → Lista kontenerów:")
                    for line in containers.stdout.strip().split('\n')[1:]:  # Pomiń nagłówek
                        if line.strip():
                            info.append(f"    {line.strip()}")
                else:
                    info.append("• Kontenery uruchomione: ❌ BRAK")
            except:
                info.append("• Kontenery uruchomione: ❌ BRAK")
            
            return '\n'.join(info)
        except Exception as e:
            return f"Błąd podczas sprawdzania Docker: {e}"
    
    def start_development_mode(self):
        """Uruchamia tryb deweloperski"""
        try:
            # Najpierw zatrzymaj wszystkie usługi
            self.stop_all_services()
            time.sleep(2)
            
            # Uruchom tryb deweloperski
            result = self.run_script_command('1', timeout=600)
            return result
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def start_production_mode(self):
        """Uruchamia tryb produkcyjny"""
        try:
            # Najpierw zatrzymaj wszystkie usługi
            self.stop_all_services()
            time.sleep(2)
            
            # Uruchom tryb produkcyjny
            result = self.run_script_command('2', timeout=600)
            return result
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def start_tauri_app(self):
        """Uruchamia aplikację Tauri"""
        try:
            result = self.run_script_command('3', timeout=300)
            return result
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def start_tauri_dev(self):
        """Uruchamia aplikację Tauri w trybie deweloperskim"""
        try:
            # Sprawdź czy katalog frontend istnieje
            frontend_dir = SCRIPT_DIR / 'myappassistant-chat-frontend'
            if not frontend_dir.exists():
                return {
                    'success': False,
                    'stdout': '',
                    'stderr': 'Katalog myappassistant-chat-frontend nie istnieje',
                    'returncode': -1
                }
            
            # Sprawdź czy package.json istnieje
            package_json = frontend_dir / 'package.json'
            if not package_json.exists():
                return {
                    'success': False,
                    'stdout': '',
                    'stderr': 'Plik package.json nie istnieje w katalogu frontend',
                    'returncode': -1
                }
            
            # Uruchom npm run tauri dev
            result = subprocess.run(
                ['npm', 'run', 'tauri', 'dev'],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=frontend_dir
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'stdout': '',
                'stderr': 'Timeout - uruchamianie trwało zbyt długo',
                'returncode': -1
            }
        except FileNotFoundError:
            return {
                'success': False,
                'stdout': '',
                'stderr': 'npm nie jest zainstalowany lub nie jest dostępny w PATH',
                'returncode': -1
            }
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def build_tauri_app(self):
        """Buduje aplikację Tauri"""
        try:
            result = self.run_script_command('4', timeout=900)  # 15 minut na budowanie
            return result
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def stop_all_services(self):
        """Zatrzymuje wszystkie usługi"""
        try:
            print("Zatrzymuję wszystkie usługi FoodSave AI...")
            
            # Sprawdź czy jesteśmy w katalogu z docker-compose
            docker_compose_files = ['docker-compose.yml', 'docker-compose.yaml']
            compose_file = None
            
            for file in docker_compose_files:
                if (SCRIPT_DIR / file).exists():
                    compose_file = file
                    break
            
            if compose_file:
                print(f"Znaleziono plik docker-compose: {compose_file}")
                
                # Zatrzymaj kontenery Docker
                try:
                    compose_result = subprocess.run(
                        ['docker', 'compose', '-f', compose_file, 'down'],
                        capture_output=True,
                        text=True,
                        timeout=60,
                        cwd=SCRIPT_DIR
                    )
                    
                    if compose_result.returncode == 0:
                        print("Kontenery Docker zostały zatrzymane")
                        
                        # Zatrzymaj procesy frontendu
                        frontend_processes = []
                        
                        # Zatrzymaj procesy npm/next
                        for cmd in ['npm run dev', 'next dev', 'npx serve']:
                            try:
                                subprocess.run(['pkill', '-f', cmd], timeout=10)
                                frontend_processes.append(cmd)
                            except:
                                pass
                        
                        # Zatrzymaj aplikację Tauri
                        try:
                            subprocess.run(['pkill', '-f', 'FoodSave AI'], timeout=10)
                        except:
                            pass
                        
                        return {
                            'success': True,
                            'stdout': f"Usługi zostały zatrzymane pomyślnie.\nKontenery Docker: Zatrzymane\nProcesy frontendu: {len(frontend_processes)} zatrzymane",
                            'stderr': '',
                            'returncode': 0
                        }
                    else:
                        return {
                            'success': False,
                            'stdout': '',
                            'stderr': f"Błąd zatrzymywania kontenerów Docker: {compose_result.stderr}",
                            'returncode': compose_result.returncode
                        }
                        
                except subprocess.TimeoutExpired:
                    return {
                        'success': False,
                        'stdout': '',
                        'stderr': 'Timeout podczas zatrzymywania kontenerów Docker',
                        'returncode': -1
                    }
                except FileNotFoundError:
                    return {
                        'success': False,
                        'stdout': '',
                        'stderr': 'Docker Compose nie jest zainstalowany lub nie jest dostępny',
                        'returncode': -1
                    }
                except Exception as e:
                    return {
                        'success': False,
                        'stdout': '',
                        'stderr': f"Błąd podczas zatrzymywania kontenerów: {str(e)}",
                        'returncode': -1
                    }
            else:
                print("Nie znaleziono pliku docker-compose, próbuję skrypt...")
                
                # Fallback do skryptu
                result = self.run_script_command('7', timeout=60)
                return result
                
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def get_backups(self):
        """Pobiera listę kopii zapasowych"""
        try:
            backup_dir = SCRIPT_DIR / 'backups'
            if not backup_dir.exists():
                return 'Brak katalogu kopii zapasowych'
            
            backups = []
            for item in backup_dir.iterdir():
                if item.is_dir():
                    backups.append(f"📁 {item.name}")
                else:
                    backups.append(f"📄 {item.name}")
            
            return '\n'.join(backups) if backups else 'Brak kopii zapasowych'
        except Exception as e:
            return f"Błąd podczas pobierania kopii zapasowych: {e}"
    
    def create_backup(self):
        """Tworzy kopię zapasową"""
        try:
            # Użyj skryptu backup_cli.py jeśli istnieje
            backup_script = SCRIPT_DIR / 'scripts' / 'backup_cli.py'
            if backup_script.exists():
                result = subprocess.run(
                    [sys.executable, str(backup_script), '--create'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    cwd=SCRIPT_DIR
                )
                return {
                    'success': result.returncode == 0,
                    'stdout': result.stdout,
                    'stderr': result.stderr,
                    'location': 'backups/'
                }
            else:
                return {
                    'success': False,
                    'stdout': '',
                    'stderr': 'Skrypt backup_cli.py nie został znaleziony',
                    'location': None
                }
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'location': None
            }

# Inicjalizacja managera
manager = FoodSaveManager()

# Routes
@app.route('/')
def index():
    """Główna strona GUI"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """Serwuje pliki statyczne"""
    return send_from_directory('.', filename)

@app.route('/api/system/status')
def get_status():
    """Pobiera status systemu"""
    try:
        status = manager.get_system_status()
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/logs')
@app.route('/api/system/logs/<log_type>')
def get_logs(log_type='all'):
    """Pobiera logi systemowe"""
    try:
        logs = manager.get_logs(log_type)
        return jsonify({
            'success': True,
            'logs': logs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/check-environment')
def check_environment():
    """Sprawdza środowisko systemu"""
    try:
        details = manager.check_environment()
        return jsonify({
            'success': True,
            'details': details
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/start-dev', methods=['POST'])
def start_dev():
    """Uruchamia tryb deweloperski"""
    try:
        result = manager.start_development_mode()
        return jsonify({
            'success': result['success'],
            'message': result['stdout'] if result['success'] else result['stderr']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/start-prod', methods=['POST'])
def start_prod():
    """Uruchamia tryb produkcyjny"""
    try:
        result = manager.start_production_mode()
        return jsonify({
            'success': result['success'],
            'message': result['stdout'] if result['success'] else result['stderr']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/start-tauri', methods=['POST'])
def start_tauri():
    """Uruchamia aplikację Tauri"""
    try:
        result = manager.start_tauri_app()
        return jsonify({
            'success': result['success'],
            'message': 'Aplikacja Tauri uruchomiona pomyślnie' if result['success'] else 'Błąd uruchamiania aplikacji Tauri',
            'stdout': result['stdout'],
            'stderr': result['stderr'],
            'error': result['stderr'] if not result['success'] else None
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Błąd serwera',
            'error': str(e)
        }), 500

@app.route('/api/system/start-tauri-dev', methods=['POST'])
def start_tauri_dev():
    """Uruchamia aplikację Tauri w trybie deweloperskim"""
    try:
        result = manager.start_tauri_dev()
        return jsonify({
            'success': result['success'],
            'message': 'Tryb deweloperski Tauri uruchomiony pomyślnie' if result['success'] else 'Błąd uruchamiania trybu deweloperskiego',
            'stdout': result['stdout'],
            'stderr': result['stderr'],
            'error': result['stderr'] if not result['success'] else None
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Błąd serwera',
            'error': str(e)
        }), 500

@app.route('/api/system/build-tauri', methods=['POST'])
def build_tauri():
    """Buduje aplikację Tauri"""
    try:
        result = manager.build_tauri_app()
        return jsonify({
            'success': result['success'],
            'message': result['stdout'] if result['success'] else result['stderr'],
            'location': 'myappassistant-chat-frontend/src-tauri/target/release/bundle/appimage/'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/stop', methods=['POST'])
def stop_services():
    """Zatrzymuje wszystkie usługi"""
    try:
        result = manager.stop_all_services()
        return jsonify({
            'success': result['success'],
            'message': result['stdout'] if result['success'] else result['stderr']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/backups')
def get_backups():
    """Pobiera listę kopii zapasowych"""
    try:
        backups = manager.get_backups()
        return jsonify({
            'success': True,
            'backups': backups
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/system/backup', methods=['POST'])
def create_backup():
    """Tworzy kopię zapasową"""
    try:
        result = manager.create_backup()
        return jsonify({
            'success': result['success'],
            'message': result['stdout'] if result['success'] else result['stderr'],
            'location': result['location']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'foodsave-gui',
        'timestamp': time.time()
    })

@app.route('/api/system/rebuild-containers', methods=['POST'])
def rebuild_containers():
    """Przebudowuje kontenery Docker (build + up -d)"""
    try:
        compose_file = None
        for fname in ['docker-compose.yml', 'docker-compose.yaml']:
            path = SCRIPT_DIR / fname
            if path.exists():
                compose_file = str(path)
                break
        if not compose_file:
            return jsonify({
                'success': False,
                'error': 'Nie znaleziono pliku docker-compose.yml ani docker-compose.yaml'
            })
        # Build
        build_cmd = f'docker compose -f {shlex.quote(compose_file)} build'
        build_proc = subprocess.run(build_cmd, shell=True, capture_output=True, text=True, cwd=SCRIPT_DIR, timeout=900)
        # Up
        up_cmd = f'docker compose -f {shlex.quote(compose_file)} up -d'
        up_proc = subprocess.run(up_cmd, shell=True, capture_output=True, text=True, cwd=SCRIPT_DIR, timeout=300)
        success = build_proc.returncode == 0 and up_proc.returncode == 0
        return jsonify({
            'success': success,
            'build_stdout': build_proc.stdout,
            'build_stderr': build_proc.stderr,
            'up_stdout': up_proc.stdout,
            'up_stderr': up_proc.stderr,
            'build_returncode': build_proc.returncode,
            'up_returncode': up_proc.returncode
        })
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Operacja przekroczyła limit czasu (timeout)'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    print("🍽️ FoodSave AI GUI Server")
    print("=" * 40)
    print(f"Skrypt: {FOODSAVE_SCRIPT}")
    print(f"Katalog: {SCRIPT_DIR}")
    print("=" * 40)
    
    # Sprawdź czy skrypt istnieje
    if not FOODSAVE_SCRIPT.exists():
        print(f"❌ Błąd: Skrypt {FOODSAVE_SCRIPT} nie istnieje!")
        sys.exit(1)
    
    # Sprawdź uprawnienia do skryptu
    if not os.access(FOODSAVE_SCRIPT, os.X_OK):
        print(f"❌ Błąd: Brak uprawnień do wykonania {FOODSAVE_SCRIPT}")
        print("Uruchom: chmod +x foodsave-all.sh")
        sys.exit(1)
    
    print("✅ Skrypt jest dostępny i wykonalny")
    print("🚀 Uruchamiam serwer GUI na porcie 8080...")
    print("🌐 Otwórz przeglądarkę: http://localhost:8080")
    print("=" * 40)
    
    app.run(host='0.0.0.0', port=8080, debug=False) 