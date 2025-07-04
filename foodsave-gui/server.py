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
import datetime
import platform
from flask import abort
import signal
import tempfile

app = Flask(__name__)
CORS(app)

# Konfiguracja
SCRIPT_DIR = Path(__file__).parent.parent
FOODSAVE_SCRIPT = SCRIPT_DIR / "foodsave-all.sh"
BACKEND_PORT = 8000
FRONTEND_PORT = 3000
OLLAMA_PORT = 11434

tauri_dev_process = None
TAURI_LOG_PATH = '/tmp/tauri_dev.log'

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
    
    def get_system_metrics(self):
        """Pobiera metryki systemowe w czasie rzeczywistym"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used = memory.used / (1024**3)  # GB
            memory_total = memory.total / (1024**3)  # GB
            
            # Disk
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_used = disk.used / (1024**3)  # GB
            disk_total = disk.total / (1024**3)  # GB
            
            # Network
            network = psutil.net_io_counters()
            network_bytes_sent = network.bytes_sent
            network_bytes_recv = network.bytes_recv
            
            # Load average (Linux only)
            load_avg = None
            try:
                load_avg = os.getloadavg()
            except:
                pass
            
            return {
                'timestamp': datetime.datetime.now().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': {
                    'percent': memory_percent,
                    'used_gb': round(memory_used, 2),
                    'total_gb': round(memory_total, 2)
                },
                'disk': {
                    'percent': disk_percent,
                    'used_gb': round(disk_used, 2),
                    'total_gb': round(disk_total, 2)
                },
                'network': {
                    'bytes_sent': network_bytes_sent,
                    'bytes_recv': network_bytes_recv
                },
                'load_average': load_avg
            }
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.datetime.now().isoformat()
            }
    
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
    
    def get_logs(self, log_type='all', level='all', search='', limit=1000):
        """Pobiera logi systemowe z filtrowaniem"""
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
                            lines = f.readlines()
                            
                            # Filtruj linie
                            filtered_lines = []
                            for line in lines:
                                # Filtrowanie po poziomie
                                if level != 'all':
                                    if level.upper() not in line.upper():
                                        continue
                                
                                # Filtrowanie po frazie
                                if search and search.lower() not in line.lower():
                                    continue
                                
                                filtered_lines.append(line)
                            
                            # Ogranicz liczbę linii
                            if limit > 0:
                                filtered_lines = filtered_lines[-limit:]
                            
                            if filtered_lines:
                                logs.append(f"=== {log_file} ===\n{''.join(filtered_lines)}\n")
                    except Exception as e:
                        logs.append(f"=== {log_file} (błąd odczytu: {e}) ===\n")
            
            return '\n'.join(logs) if logs else 'Brak logów do wyświetlenia'
        except Exception as e:
            return f"Błąd podczas pobierania logów: {e}"
    
    def run_diagnostics(self):
        """Uruchamia kompleksową diagnostykę systemu"""
        diagnostics = {
            'timestamp': datetime.datetime.now().isoformat(),
            'system_info': self._get_system_info(),
            'service_tests': self._test_services(),
            'connection_tests': self._test_connections(),
            'performance_tests': self._test_performance(),
            'recommendations': []
        }
        
        # Dodaj rekomendacje na podstawie wyników
        if not diagnostics['service_tests']['docker']:
            diagnostics['recommendations'].append("Docker nie jest uruchomiony. Uruchom: sudo systemctl start docker")
        
        if diagnostics['performance_tests']['cpu_high']:
            diagnostics['recommendations'].append("Wysokie użycie CPU. Sprawdź procesy używające dużo zasobów.")
        
        if diagnostics['performance_tests']['memory_high']:
            diagnostics['recommendations'].append("Wysokie użycie pamięci. Rozważ zamknięcie niepotrzebnych aplikacji.")
        
        return diagnostics
    
    def _get_system_info(self):
        """Pobiera informacje o systemie"""
        return {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'architecture': platform.architecture()[0],
            'processor': platform.processor(),
            'hostname': platform.node(),
            'uptime': time.time() - psutil.boot_time()
        }
    
    def _test_services(self):
        """Testuje usługi systemowe"""
        return {
            'docker': self._test_docker(),
            'postgres': self.check_port_status(5432),
            'redis': self.check_port_status(6379),
            'ollama': self.check_port_status(OLLAMA_PORT)
        }
    
    def _test_connections(self):
        """Testuje połączenia sieciowe"""
        return {
            'backend_api': self.check_service_status(f'http://localhost:{BACKEND_PORT}/health'),
            'frontend': self.check_service_status(f'http://localhost:{FRONTEND_PORT}'),
            'ollama_api': self.check_service_status(f'http://localhost:{OLLAMA_PORT}/api/tags')
        }
    
    def _test_performance(self):
        """Testuje wydajność systemu"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent
        
        return {
            'cpu_high': cpu_percent > 80,
            'memory_high': memory_percent > 85,
            'disk_high': disk_percent > 90,
            'cpu_percent': cpu_percent,
            'memory_percent': memory_percent,
            'disk_percent': disk_percent
        }
    
    def _test_docker(self):
        """Testuje Docker"""
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
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

2. SPRAWDŹ PORTY:
   • Backend (8000): netstat -tlnp | grep 8000
   • Frontend (3000): netstat -tlnp | grep 3000
   • Baza danych (5432): netstat -tlnp | grep 5432

3. SPRAWDŹ LOGI:
   • Backend: tail -f logs/backend.log
   • Docker: docker logs <container_name>

4. RESTART SYSTEMU:
   • ./stop_all.sh
   • ./run_all.sh
"""
                
                return {
                    'success': False,
                    'message': 'Błąd podczas sprawdzania środowiska',
                    'details': detailed_info,
                    'error': result['stderr']
                }
            
            return {
                'success': True,
                'message': 'Środowisko sprawdzone pomyślnie',
                'details': result['stdout']
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Błąd podczas sprawdzania środowiska: {e}',
                'details': '',
                'error': str(e)
            }
    
    def _get_system_info(self):
        """Pobiera podstawowe informacje o systemie"""
        try:
            info = []
            info.append(f"System: {platform.system()} {platform.release()}")
            info.append(f"Architektura: {platform.architecture()[0]}")
            info.append(f"Procesor: {platform.processor()}")
            info.append(f"Python: {platform.python_version()}")
            info.append(f"Uptime: {int(time.time() - psutil.boot_time())} sekund")
            return '\n'.join(info)
        except:
            return "Nie można pobrać informacji o systemie"
    
    def _get_port_info(self):
        """Sprawdza status portów"""
        try:
            ports = [8000, 3000, 5432, 11434]
            info = []
            for port in ports:
                status = "OTWARTY" if self.check_port_status(port) else "ZAMKNIĘTY"
                info.append(f"Port {port}: {status}")
            return '\n'.join(info)
        except:
            return "Nie można sprawdzić portów"
    
    def _get_docker_info(self):
        """Pobiera informacje o Docker"""
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                return f"Docker: {result.stdout.strip()}"
            else:
                return "Docker: NIE ZAINSTALOWANY"
        except:
            return "Docker: BŁĄD SPRAWDZANIA"
    
    def start_development_mode(self):
        """Uruchamia tryb deweloperski"""
        try:
            result = self.run_script_command('1')  # Opcja trybu deweloperskiego
            
            if result['success']:
                return {
                    'success': True,
                    'message': 'Tryb deweloperski uruchomiony pomyślnie',
                    'details': result['stdout']
                }
            else:
                return {
                    'success': False,
                    'message': 'Błąd podczas uruchamiania trybu deweloperskiego',
                    'details': result['stderr']
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Błąd: {e}',
                'details': ''
            }
    
    def start_production_mode(self):
        """Uruchamia tryb produkcyjny"""
        try:
            result = self.run_script_command('2')  # Opcja trybu produkcyjnego
            
            if result['success']:
                return {
                    'success': True,
                    'message': 'Tryb produkcyjny uruchomiony pomyślnie',
                    'details': result['stdout']
                }
            else:
                return {
                    'success': False,
                    'message': 'Błąd podczas uruchamiania trybu produkcyjnego',
                    'details': result['stderr']
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Błąd: {e}',
                'details': ''
            }
    
    def start_tauri_app(self):
        """Uruchamia aplikację Tauri"""
        try:
            result = self.run_script_command('3')  # Opcja aplikacji Tauri
            
            if result['success']:
                return {
                    'success': True,
                    'message': 'Aplikacja Tauri uruchomiona pomyślnie',
                    'details': result['stdout']
                }
            else:
                return {
                    'success': False,
                    'message': 'Błąd podczas uruchamiania aplikacji Tauri',
                    'details': result['stderr']
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Błąd: {e}',
                'details': ''
            }
    
    def start_tauri_dev(self):
        """Uruchamia tryb deweloperski Tauri (z logowaniem do pliku)"""
        global tauri_dev_process
        if tauri_dev_process and tauri_dev_process.poll() is None:
            return jsonify({'success': True, 'message': 'Tauri dev już działa!'}), 200
        try:
            tauri_dir = SCRIPT_DIR / "myappassistant-chat-frontend"
            log_file = open(TAURI_LOG_PATH, 'w')
            tauri_dev_process = subprocess.Popen(
                ['npm', 'run', 'tauri', 'dev'],
                cwd=tauri_dir,
                stdout=log_file,
                stderr=subprocess.STDOUT
            )
            return jsonify({'success': True, 'message': 'Tauri dev uruchomione w tle!'}), 200
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
    
    def build_tauri_app(self):
        """Buduje aplikację Tauri"""
        try:
            tauri_dir = SCRIPT_DIR / "myappassistant-chat-frontend"
            if not tauri_dir.exists():
                return {
                    'success': False,
                    'message': 'Katalog aplikacji Tauri nie istnieje',
                    'details': 'Sprawdź czy projekt jest poprawnie sklonowany'
                }
            
            # Uruchom build
            result = subprocess.run(
                ['npm', 'run', 'tauri', 'build'],
                cwd=tauri_dir,
                capture_output=True,
                text=True,
                timeout=600  # 10 minut timeout
            )
            
            if result.returncode == 0:
                return {
                    'success': True,
                    'message': 'Aplikacja Tauri zbudowana pomyślnie',
                    'details': result.stdout
                }
            else:
                return {
                    'success': False,
                    'message': 'Błąd podczas budowania aplikacji Tauri',
                    'details': result.stderr
                }
                
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'message': 'Timeout podczas budowania aplikacji',
                'details': 'Budowanie trwało zbyt długo (>10 minut)'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Błąd: {e}',
                'details': ''
            }
    
    def stop_all_services(self):
        """Zatrzymuje wszystkie usługi"""
        try:
            result = self.run_script_command('4')  # Opcja zatrzymania
            
            if result['success']:
                return {
                    'success': True,
                    'message': 'Wszystkie usługi zatrzymane pomyślnie',
                    'details': result['stdout']
                }
            else:
                return {
                    'success': False,
                    'message': 'Błąd podczas zatrzymywania usług',
                    'details': result['stderr']
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Błąd: {e}',
                'details': ''
            }
    
    def get_backups(self):
        """Pobiera listę backupów"""
        try:
            backup_dir = SCRIPT_DIR / "backups"
            if not backup_dir.exists():
                return []
            
            backups = []
            for item in backup_dir.iterdir():
                if item.is_dir():
                    # Sprawdź czy to katalog backupu
                    backup_info = {
                        'name': item.name,
                        'path': str(item),
                        'created': datetime.datetime.fromtimestamp(item.stat().st_mtime).isoformat(),
                        'size': self._get_dir_size(item)
                    }
                    backups.append(backup_info)
            
            # Sortuj po dacie utworzenia (najnowsze pierwsze)
            backups.sort(key=lambda x: x['created'], reverse=True)
            return backups
            
        except Exception as e:
            return []
    
    def _get_dir_size(self, path):
        """Oblicza rozmiar katalogu"""
        try:
            total = 0
            for dirpath, dirnames, filenames in os.walk(path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    total += os.path.getsize(filepath)
            return total
        except:
            return 0
    
    def create_backup(self):
        """Tworzy nowy backup"""
        try:
            result = self.run_script_command('5')  # Opcja tworzenia backupu
            
            if result['success']:
                return {
                    'success': True,
                    'message': 'Backup utworzony pomyślnie',
                    'details': result['stdout']
                }
            else:
                return {
                    'success': False,
                    'message': 'Błąd podczas tworzenia backupu',
                    'details': result['stderr']
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Błąd: {e}',
                'details': ''
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
            'data': status,
            'timestamp': datetime.datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        }), 500

@app.route('/api/system/metrics')
def get_metrics():
    """Pobiera metryki systemowe w czasie rzeczywistym"""
    try:
        metrics = manager.get_system_metrics()
        return jsonify({
            'success': True,
            'data': metrics
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/system/logs')
@app.route('/api/system/logs/<log_type>')
def get_logs(log_type='all'):
    """Pobiera logi z filtrowaniem"""
    try:
        level = request.args.get('level', 'all')
        search = request.args.get('search', '')
        limit = int(request.args.get('limit', 1000))
        
        logs = manager.get_logs(log_type, level, search, limit)
        return jsonify({
            'success': True,
            'data': logs,
            'filters': {
                'type': log_type,
                'level': level,
                'search': search,
                'limit': limit
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/system/diagnostics')
def run_diagnostics():
    """Uruchamia diagnostykę systemu"""
    try:
        diagnostics = manager.run_diagnostics()
        return jsonify({
            'success': True,
            'data': diagnostics
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/system/check-environment')
def check_environment():
    """Sprawdza środowisko systemu"""
    try:
        result = manager.check_environment()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': '',
            'error': str(e)
        }), 500

@app.route('/api/system/start-dev', methods=['POST'])
def start_dev():
    """Uruchamia tryb deweloperski"""
    try:
        result = manager.start_development_mode()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': ''
        }), 500

@app.route('/api/system/start-prod', methods=['POST'])
def start_prod():
    """Uruchamia tryb produkcyjny"""
    try:
        result = manager.start_production_mode()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': ''
        }), 500

@app.route('/api/system/start-tauri', methods=['POST'])
def start_tauri():
    """Uruchamia aplikację Tauri"""
    try:
        result = manager.start_tauri_app()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': ''
        }), 500

@app.route('/api/system/start-tauri-dev', methods=['POST'])
def start_tauri_dev():
    """Uruchamia tryb deweloperski Tauri (z logowaniem do pliku)"""
    global tauri_dev_process
    if tauri_dev_process and tauri_dev_process.poll() is None:
        return jsonify({'success': True, 'message': 'Tauri dev już działa!'}), 200
    try:
        tauri_dir = SCRIPT_DIR / "myappassistant-chat-frontend"
        log_file = open(TAURI_LOG_PATH, 'w')
        tauri_dev_process = subprocess.Popen(
            ['npm', 'run', 'tauri', 'dev'],
            cwd=tauri_dir,
            stdout=log_file,
            stderr=subprocess.STDOUT
        )
        return jsonify({'success': True, 'message': 'Tauri dev uruchomione w tle!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/system/build-tauri', methods=['POST'])
def build_tauri():
    """Buduje aplikację Tauri"""
    try:
        result = manager.build_tauri_app()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': ''
        }), 500

@app.route('/api/system/stop', methods=['POST'])
def stop_services():
    """Zatrzymuje wszystkie usługi"""
    try:
        result = manager.stop_all_services()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': ''
        }), 500

@app.route('/api/system/backups')
def get_backups():
    """Pobiera listę backupów"""
    try:
        backups = manager.get_backups()
        return jsonify({
            'success': True,
            'data': backups
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/system/backup', methods=['POST'])
def create_backup():
    """Tworzy nowy backup"""
    try:
        result = manager.create_backup()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': ''
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.now().isoformat(),
        'service': 'FoodSave AI GUI Server'
    })

@app.route('/api/system/rebuild-containers', methods=['POST'])
def rebuild_containers():
    """Rebuilduje kontenery Docker"""
    try:
        result = manager.run_script_command('6')  # Opcja rebuild kontenerów
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Kontenery zrebuildowane pomyślnie',
                'details': result['stdout']
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Błąd podczas rebuildowania kontenerów',
                'details': result['stderr']
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Błąd: {e}',
            'details': ''
        }), 500

@app.route('/api/docker/containers')
def docker_containers():
    """Zwraca listę kontenerów Docker i ich statusy"""
    try:
        result = subprocess.run([
            'docker', 'ps', '-a', '--format',
            '{{json .}}'
        ], capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            return jsonify({'success': False, 'error': result.stderr}), 500
        containers = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                containers.append(json.loads(line.strip()))
        return jsonify({'success': True, 'data': containers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/docker/logs/<container_id>')
def docker_logs(container_id):
    """Zwraca logi wybranego kontenera Docker"""
    try:
        result = subprocess.run([
            'docker', 'logs', '--tail', '500', container_id
        ], capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            return jsonify({'success': False, 'error': result.stderr}), 500
        return jsonify({'success': True, 'data': result.stdout})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/system/stop-tauri-dev', methods=['POST'])
def stop_tauri_dev():
    """Zatrzymuje proces Tauri dev"""
    global tauri_dev_process
    try:
        if tauri_dev_process and tauri_dev_process.poll() is None:
            tauri_dev_process.terminate()
            tauri_dev_process.wait(timeout=10)
            return jsonify({'success': True, 'message': 'Tauri dev zatrzymane!'}), 200
        # Fallback: pkill
        subprocess.run(['pkill', '-f', 'tauri dev'], timeout=5)
        return jsonify({'success': True, 'message': 'Tauri dev zatrzymane (pkill)!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/system/tauri-status')
def tauri_status():
    """Sprawdza, czy Tauri dev działa (proces/port)"""
    import psutil
    # Sprawdź proces
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if 'tauri' in ' '.join(proc.info['cmdline']) and 'dev' in ' '.join(proc.info['cmdline']):
                return jsonify({'success': True, 'running': True})
        except Exception:
            continue
    # Sprawdź port 3000
    for conn in psutil.net_connections():
        if conn.laddr.port == 3000 and conn.status == 'LISTEN':
            return jsonify({'success': True, 'running': True})
    return jsonify({'success': True, 'running': False})

@app.route('/api/system/tauri-logs')
def tauri_logs():
    try:
        with open(TAURI_LOG_PATH, 'r') as f:
            logs = f.read()[-10000:]
        return jsonify({'success': True, 'logs': logs})
    except Exception as e:
        return jsonify({'success': False, 'logs': '', 'error': str(e)})

@app.route('/api/docker/start', methods=['POST'])
def start_docker():
    """Uruchamia usługę Docker (jeśli nie działa)"""
    try:
        # Sprawdź czy Docker już działa
        result = subprocess.run(['systemctl', 'is-active', '--quiet', 'docker'])
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Docker już działa'}), 200
        # Spróbuj uruchomić Dockera
        result = subprocess.run(['systemctl', 'start', 'docker'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Docker uruchomiony'}), 200
        else:
            return jsonify({'success': False, 'message': 'Błąd uruchamiania Dockera', 'details': result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/start-all', methods=['POST'])
def start_all_containers():
    """Uruchamia wszystkie kontenery Docker"""
    try:
        result = subprocess.run(['docker', 'compose', 'up', '-d'], capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Wszystkie kontenery uruchomione pomyślnie', 'details': result.stdout}), 200
        else:
            return jsonify({'success': False, 'message': 'Błąd uruchamiania kontenerów', 'details': result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/stop-all', methods=['POST'])
def stop_all_containers():
    """Zatrzymuje wszystkie kontenery Docker"""
    try:
        result = subprocess.run(['docker', 'compose', 'down'], capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Wszystkie kontenery zatrzymane pomyślnie', 'details': result.stdout}), 200
        else:
            return jsonify({'success': False, 'message': 'Błąd zatrzymywania kontenerów', 'details': result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/restart-all', methods=['POST'])
def restart_all_containers():
    """Restartuje wszystkie kontenery Docker"""
    try:
        # Stop all containers
        stop_result = subprocess.run(['docker', 'compose', 'down'], capture_output=True, text=True, timeout=30)
        if stop_result.returncode != 0:
            return jsonify({'success': False, 'message': 'Błąd zatrzymywania kontenerów', 'details': stop_result.stderr}), 500
        
        # Start all containers
        start_result = subprocess.run(['docker', 'compose', 'up', '-d'], capture_output=True, text=True, timeout=60)
        if start_result.returncode == 0:
            return jsonify({'success': True, 'message': 'Wszystkie kontenery zrestartowane pomyślnie', 'details': start_result.stdout}), 200
        else:
            return jsonify({'success': False, 'message': 'Błąd uruchamiania kontenerów', 'details': start_result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/rebuild-all', methods=['POST'])
def rebuild_all_containers():
    """Rebuilduje wszystkie kontenery Docker"""
    try:
        result = subprocess.run(['docker', 'compose', 'up', '-d', '--build'], capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Wszystkie kontenery zrebuildowane pomyślnie', 'details': result.stdout}), 200
        else:
            return jsonify({'success': False, 'message': 'Błąd rebuildowania kontenerów', 'details': result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/status')
def docker_status():
    """Pobiera status kontenerów Docker"""
    try:
        result = subprocess.run(['docker', 'compose', 'ps'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Status kontenerów', 'details': result.stdout}), 200
        else:
            return jsonify({'success': False, 'message': 'Błąd pobierania statusu', 'details': result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/system-info')
def docker_system_info():
    """Pobiera informacje o systemie Docker"""
    try:
        # Docker info
        info_result = subprocess.run(['docker', 'info'], capture_output=True, text=True, timeout=10)
        info_output = info_result.stdout if info_result.returncode == 0 else f"Błąd: {info_result.stderr}"
        
        # Docker system df
        df_result = subprocess.run(['docker', 'system', 'df'], capture_output=True, text=True, timeout=10)
        df_output = df_result.stdout if df_result.returncode == 0 else f"Błąd: {df_result.stderr}"
        
        return jsonify({
            'success': True, 
            'message': 'Informacje o systemie Docker',
            'details': {
                'info': info_output,
                'disk_usage': df_output
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/container/<action>', methods=['POST'])
def container_action(action):
    """Wykonuje akcję na pojedynczym kontenerze"""
    try:
        data = request.get_json() or {}
        container_id = data.get('container_id')
        service_name = data.get('service_name')
        
        if not container_id and not service_name:
            return jsonify({'success': False, 'message': 'Musisz podać container_id lub service_name'}), 400
        
        if action == 'start':
            if container_id:
                cmd = ['docker', 'start', container_id]
            else:
                cmd = ['docker', 'compose', 'up', '-d', service_name]
        elif action == 'stop':
            if container_id:
                cmd = ['docker', 'stop', container_id]
            else:
                cmd = ['docker', 'compose', 'stop', service_name]
        elif action == 'restart':
            if container_id:
                cmd = ['docker', 'restart', container_id]
            else:
                cmd = ['docker', 'compose', 'restart', service_name]
        else:
            return jsonify({'success': False, 'message': 'Nieznana akcja'}), 400
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return jsonify({'success': True, 'message': f'Kontener {action} pomyślnie', 'details': result.stdout}), 200
        else:
            return jsonify({'success': False, 'message': f'Błąd {action} kontenera', 'details': result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

@app.route('/api/docker/container/logs/<container_id>')
def container_logs(container_id):
    """Pobiera logi kontenera"""
    try:
        lines = request.args.get('lines', 100, type=int)
        result = subprocess.run(['docker', 'logs', '--tail', str(lines), container_id], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Logi kontenera', 'details': result.stdout}), 200
        else:
            return jsonify({'success': False, 'message': 'Błąd pobierania logów', 'details': result.stderr}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wyjątek: {e}'}), 500

if __name__ == '__main__':
    print("🚀 Uruchamianie FoodSave AI GUI Server...")
    print(f"📁 Katalog roboczy: {SCRIPT_DIR}")
    print(f"🔧 Skrypt główny: {FOODSAVE_SCRIPT}")
    print("🌐 Serwer dostępny na: http://localhost:8081")
    print("📊 API dostępne na: http://localhost:8081/api/")
    print("💚 Health check: http://localhost:8081/health")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=8081, debug=False) 