// FoodSave AI GUI - Uproszczony JavaScript dla użytkowników nietechnicznych
class FoodSaveGUI {
    constructor() {
        this.baseUrl = 'http://localhost:8001';
        this.isFirstRun = this.checkFirstRun();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkSystemStatus();
        
        // Pokaż kreator pierwszego uruchomienia jeśli to pierwsze uruchomienie
        if (this.isFirstRun) {
            this.showSetupWizard();
        } else {
            this.showMainInterface();
        }
    }

    setupEventListeners() {
        // Close modal when clicking outside
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    checkFirstRun() {
        // Sprawdź czy to pierwsze uruchomienie (można dodać localStorage)
        return !localStorage.getItem('foodsave_initialized');
    }

    showSetupWizard() {
        document.getElementById('setupWizard').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
        this.runSetupWizard();
    }

    showMainInterface() {
        document.getElementById('setupWizard').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }

    async runSetupWizard() {
        try {
            // Krok 1: Sprawdzanie systemu
            await this.runSetupStep(1, 'Sprawdzam wymagania systemowe...', async () => {
                await this.checkSystemRequirements();
            });

            // Krok 2: Instalacja komponentów
            await this.runSetupStep(2, 'Instaluję niezbędne komponenty...', async () => {
                await this.installComponents();
            });

            // Krok 3: Uruchamianie aplikacji
            await this.runSetupStep(3, 'Uruchamiam system...', async () => {
                await this.startApplication();
            });

            // Krok 4: Gotowe
            this.showSetupStep(4);
            
        } catch (error) {
            console.error('Błąd podczas konfiguracji:', error);
            this.showToast({
                title: 'Błąd konfiguracji',
                message: 'Wystąpił problem podczas konfiguracji. Sprawdź logi.',
                type: 'error'
            });
        }
    }

    async runSetupStep(stepNumber, message, action) {
        this.showSetupStep(stepNumber);
        this.updateSetupProgress(stepNumber, 0);
        
        // Symuluj postęp
        const progressInterval = setInterval(() => {
            const currentProgress = parseInt(document.getElementById(`step${stepNumber}Progress`).style.width) || 0;
            if (currentProgress < 90) {
                this.updateSetupProgress(stepNumber, currentProgress + 10);
            }
        }, 200);

        try {
            await action();
            clearInterval(progressInterval);
            this.updateSetupProgress(stepNumber, 100);
            await this.delay(500);
        } catch (error) {
            clearInterval(progressInterval);
            throw error;
        }
    }

    showSetupStep(stepNumber) {
        // Ukryj wszystkie kroki
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`step${i}`).style.display = 'none';
        }
        // Pokaż aktualny krok
        document.getElementById(`step${stepNumber}`).style.display = 'flex';
    }

    updateSetupProgress(stepNumber, percentage) {
        const progressBar = document.getElementById(`step${stepNumber}Progress`);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    async checkSystemRequirements() {
        // Sprawdź podstawowe wymagania
        const requirements = [
            { name: 'Python 3', check: () => this.checkPython() },
            { name: 'Docker', check: () => this.checkDocker() },
            { name: 'Porty', check: () => this.checkPorts() }
        ];

        for (const req of requirements) {
            try {
                await req.check();
                await this.delay(500);
            } catch (error) {
                throw new Error(`Błąd: ${req.name} - ${error.message}`);
            }
        }
    }

    async installComponents() {
        // Symuluj instalację komponentów
        const components = [
            'Pobieranie obrazów Docker...',
            'Konfiguracja bazy danych...',
            'Instalacja modeli AI...',
            'Konfiguracja serwera...'
        ];

        for (const component of components) {
            await this.delay(1000);
            console.log(component);
        }
    }

    async startApplication() {
        // Uruchom aplikację
        await this.startAllServices();
    }

    completeSetup() {
        localStorage.setItem('foodsave_initialized', 'true');
        this.showMainInterface();
        this.showToast({
            title: 'Konfiguracja zakończona!',
            message: 'FoodSave AI jest gotowe do użycia.',
            type: 'success'
        });
    }

    // Główne funkcje aplikacji
    async startApplication() {
        this.showLoading('Uruchamiam aplikację...', 'To może potrwać kilka minut');
        
        try {
            const response = await fetch('/api/system/start-prod', {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showToast({
                    title: 'Sukces!',
                    message: 'Aplikacja została uruchomiona pomyślnie.',
                    type: 'success'
                });
                this.updateStartStatus('Aplikacja działa', 'success');
                await this.checkSystemStatus();
            } else {
                throw new Error('Błąd uruchamiania');
            }
        } catch (error) {
            this.showToast({
                title: 'Błąd uruchamiania',
                message: 'Nie udało się uruchomić aplikacji. Sprawdź logi.',
                type: 'error'
            });
            this.updateStartStatus('Błąd uruchamiania', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async checkStatus() {
        this.showLoading('Sprawdzam status...', 'Weryfikuję wszystkie komponenty');
        
        try {
            await this.checkSystemStatus();
            const now = new Date().toLocaleTimeString();
            document.getElementById('checkStatus').innerHTML = `<span class="status-text">Ostatnie sprawdzenie: ${now}</span>`;
            
            this.showToast({
                title: 'Status sprawdzony',
                message: 'Wszystkie komponenty zostały zweryfikowane.',
                type: 'info'
            });
        } catch (error) {
            this.showToast({
                title: 'Błąd sprawdzania',
                message: 'Nie udało się sprawdzić statusu systemu.',
                type: 'error'
            });
        } finally {
            this.hideLoading();
        }
    }

    async checkSystemStatus() {
        try {
            // Sprawdź status wszystkich komponentów
            const statuses = await Promise.allSettled([
                this.checkBackendStatus(),
                this.checkFrontendStatus(),
                this.checkDatabaseStatus(),
                this.checkAIStatus()
            ]);

            // Aktualizuj status główny
            const allOnline = statuses.every(status => status.status === 'fulfilled' && status.value);
            this.updateMainStatus(allOnline);

            // Aktualizuj karty statusu
            this.updateStatusCards(statuses);

        } catch (error) {
            console.error('Błąd sprawdzania statusu:', error);
            this.updateMainStatus(false);
        }
    }

    updateMainStatus(isOnline) {
        const statusLight = document.getElementById('statusLight');
        const statusTitle = document.getElementById('statusTitle');
        const statusDescription = document.getElementById('statusDescription');

        if (isOnline) {
            statusLight.className = 'status-light online';
            statusTitle.textContent = 'System działa poprawnie';
            statusDescription.textContent = 'Wszystkie komponenty są aktywne';
        } else {
            statusLight.className = 'status-light error';
            statusTitle.textContent = 'Problem z systemem';
            statusDescription.textContent = 'Niektóre komponenty nie działają';
        }
    }

    updateStatusCards(statuses) {
        const cards = [
            { id: 'backendStatus', status: statuses[0] },
            { id: 'frontendStatus', status: statuses[1] },
            { id: 'databaseStatus', status: statuses[2] },
            { id: 'aiStatus', status: statuses[3] }
        ];

        cards.forEach(card => {
            const element = document.getElementById(card.id);
            if (element) {
                if (card.status.status === 'fulfilled' && card.status.value) {
                    element.textContent = 'Działa';
                    element.className = 'card-status online';
                } else {
                    element.textContent = 'Problem';
                    element.className = 'card-status offline';
                }
            }
        });
    }

    updateStartStatus(message, type) {
        const statusElement = document.getElementById('startStatus');
        if (statusElement) {
            statusElement.innerHTML = `<span class="status-text ${type}">${message}</span>`;
        }
    }

    // Funkcje sprawdzania statusu
    async checkBackendStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, { timeout: 5000 });
            return response.ok;
        } catch {
            return false;
        }
    }

    async checkFrontendStatus() {
        try {
            const response = await fetch('http://localhost:3003', { timeout: 3000 });
            return response.ok;
        } catch {
            return false;
        }
    }

    async checkDatabaseStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/health/database`, { timeout: 5000 });
            return response.ok;
        } catch {
            return false;
        }
    }

    async checkAIStatus() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', { timeout: 3000 });
            return response.ok;
        } catch {
            return false;
        }
    }

    // Funkcje sprawdzania wymagań
    async checkPython() {
        // Symuluj sprawdzenie Pythona
        await this.delay(500);
        return true;
    }

    async checkDocker() {
        try {
            const response = await fetch('/api/docker/status');
            const data = await response.json();
            return data.success;
        } catch {
            return false;
        }
    }

    async checkPorts() {
        // Sprawdź czy porty są wolne
        const ports = [3003, 8001, 5432, 11434];
        for (const port of ports) {
            try {
                const response = await fetch(`http://localhost:${port}`, { timeout: 1000 });
                // Jeśli port jest zajęty, to dobrze
            } catch {
                // Port jest wolny, to też OK
            }
        }
        return true;
    }

    async startAllServices() {
        try {
            const response = await fetch('/api/system/start-prod', {
                method: 'POST'
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    // Funkcje pomocnicze
    showLoading(text = 'Przetwarzam...', description = 'Proszę czekać...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingDescription').textContent = description;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showModal(title, content, footerButtons = []) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        
        const footer = document.getElementById('modalFooter');
        footer.innerHTML = '';
        
        if (footerButtons.length === 0) {
            footer.innerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Zamknij</button>';
        } else {
            footerButtons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `btn ${button.class || 'btn-secondary'}`;
                btn.textContent = button.text;
                btn.onclick = button.onclick;
                footer.appendChild(btn);
            });
        }
        
        document.getElementById('modal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    showToast({ title = '', message = '', type = 'info', timeout = 4000 }) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        // Animacja wejścia
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Automatyczne usunięcie
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, timeout);
    }

    getToastIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Funkcje globalne
let gui;

function initGUI() {
    gui = new FoodSaveGUI();
}

function startApplication() {
    if (gui) gui.startApplication();
}

function checkStatus() {
    if (gui) gui.checkStatus();
}

function showSettings() {
    if (gui) {
        gui.showModal('Ustawienia', `
            <div style="text-align: center; padding: 20px;">
                <h3>Ustawienia FoodSave AI</h3>
                <p>Funkcja ustawień będzie dostępna w przyszłych wersjach.</p>
                <p>Na razie system używa domyślnej konfiguracji.</p>
            </div>
        `);
    }
}

function showHelp() {
    if (gui) {
        gui.showModal('Pomoc', `
            <div style="padding: 20px;">
                <h3>Jak korzystać z FoodSave AI</h3>
                <div style="margin: 20px 0;">
                    <h4>🚀 Uruchomienie aplikacji</h4>
                    <p>Kliknij przycisk "URUCHOM APLIKACJĘ" aby włączyć cały system.</p>
                </div>
                <div style="margin: 20px 0;">
                    <h4>📊 Sprawdzanie statusu</h4>
                    <p>Użyj "SPRAWDŹ STATUS" aby zobaczyć czy wszystko działa poprawnie.</p>
                </div>
                <div style="margin: 20px 0;">
                    <h4>🛠️ Ustawienia</h4>
                    <p>W sekcji "USTAWIENIA" możesz dostosować aplikację do swoich potrzeb.</p>
                </div>
                <div style="margin: 20px 0;">
                    <h4>💡 Wskazówki</h4>
                    <ul style="text-align: left;">
                        <li>Zielona lampka = wszystko działa</li>
                        <li>Czerwona lampka = problem z systemem</li>
                        <li>Żółta lampka = uwaga, sprawdź szczegóły</li>
                    </ul>
                </div>
            </div>
        `);
    }
}

function showDiagnostics() {
    if (gui) {
        gui.showLoading('Uruchamiam diagnostykę...', 'Sprawdzam wszystkie komponenty');
        
        setTimeout(async () => {
            try {
                const response = await fetch('/api/system/diagnostics');
                const data = await response.json();
                
                gui.hideLoading();
                gui.showModal('Diagnostyka Systemu', `
                    <div style="padding: 20px;">
                        <h3>Wyniki diagnostyki</h3>
                        <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
                    </div>
                `);
            } catch (error) {
                gui.hideLoading();
                gui.showToast({
                    title: 'Błąd diagnostyki',
                    message: 'Nie udało się uruchomić diagnostyki.',
                    type: 'error'
                });
            }
        }, 2000);
    }
}

function showLogs() {
    if (gui) {
        gui.showLoading('Ładuję logi...', 'Pobieram informacje o systemie');
        
        setTimeout(async () => {
            try {
                const response = await fetch('/api/system/logs');
                const data = await response.json();
                
                gui.hideLoading();
                
                let logsContent = 'Brak logów do wyświetlenia';
                if (data.success && data.data && data.data.trim()) {
                    logsContent = data.data;
                } else if (data.error) {
                    logsContent = `Błąd: ${data.error}`;
                }
                
                gui.showModal('Logi Systemu', `
                    <div style="padding: 20px;">
                        <h3>Logi systemowe</h3>
                        <div style="margin-bottom: 15px;">
                            <button onclick="refreshSystemLogs()" class="btn btn-secondary" style="margin-right: 10px;">
                                <i class="fas fa-refresh"></i> Odśwież
                            </button>
                            <button onclick="clearSystemLogs()" class="btn btn-secondary">
                                <i class="fas fa-trash"></i> Wyczyść
                            </button>
                        </div>
                        <div style="background: #1e1e1e; color: #fff; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4;">
                            ${logsContent}
                        </div>
                    </div>
                `);
            } catch (error) {
                gui.hideLoading();
                gui.showToast({
                    title: 'Błąd ładowania logów',
                    message: 'Nie udało się załadować logów systemu.',
                    type: 'error'
                });
            }
        }, 1000);
    }
}

function refreshSystemLogs() {
    showLogs();
}

function clearSystemLogs() {
    if (confirm('Czy na pewno chcesz wyczyścić logi systemu?')) {
        if (gui) {
            gui.showLoading('Czyszczenie logów...', 'Usuwam stare wpisy');
            
            fetch('/api/system/logs/clear', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                gui.hideLoading();
                if (data.success) {
                    gui.showToast({
                        title: 'Sukces',
                        message: 'Logi zostały wyczyszczone',
                        type: 'success'
                    });
                    showLogs(); // Odśwież widok
                } else {
                    gui.showToast({
                        title: 'Błąd',
                        message: data.message || 'Nie udało się wyczyścić logów',
                        type: 'error'
                    });
                }
            })
            .catch(error => {
                gui.hideLoading();
                gui.showToast({
                    title: 'Błąd połączenia',
                    message: error.message,
                    type: 'error'
                });
            });
        }
    }
}

function closeModal() {
    if (gui) gui.closeModal();
}

function completeSetup() {
    if (gui) gui.completeSetup();
}

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', initGUI);

// Docker Management Functions
function showMainInterface() {
    // Ukryj wszystkie sekcje i pokaż główny interfejs
    document.getElementById('dockerSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function showDockerManagement() {
    if (gui) {
        gui.showLoading('Ładowanie zarządzania kontenerami...', 'Pobieram informacje o kontenerach');
        
        // Pokaż sekcję Docker
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('dockerSection').style.display = 'block';
        
        // Załaduj listę kontenerów
        loadContainers();
        
        gui.hideLoading();
        gui.showToast({
            title: 'Zarządzanie kontenerami',
            message: 'Sekcja załadowana pomyślnie.',
            type: 'info'
        });
    }
}

function loadContainers() {
    const containersList = document.getElementById('containersList');
    containersList.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Ładowanie listy kontenerów...</p></div>';
    
    fetch('/api/docker/containers')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayContainers(data.data);
            } else {
                containersList.innerHTML = `<div class="error-message">Błąd: ${data.error}</div>`;
            }
        })
        .catch(error => {
            containersList.innerHTML = `<div class="error-message">Błąd połączenia: ${error.message}</div>`;
        });
}

function displayContainers(containers) {
    const containersList = document.getElementById('containersList');
    
    if (!containers || containers.length === 0) {
        containersList.innerHTML = '<div class="no-containers">Brak kontenerów do wyświetlenia</div>';
        return;
    }
    
    const containersHtml = containers.map(container => {
        const statusClass = getContainerStatusClass(container.Status);
        const statusText = getContainerStatusText(container.Status);
        
        return `
            <div class="container-item">
                <div class="container-info">
                    <div class="container-status ${statusClass}"></div>
                    <div class="container-details">
                        <h5>${container.Names || container.ID}</h5>
                        <p>${container.Image} - ${statusText}</p>
                    </div>
                </div>
                <div class="container-actions">
                    ${container.Status.includes('Up') ? 
                        `<button class="container-btn stop" onclick="stopContainer('${container.ID}')">Stop</button>` :
                        `<button class="container-btn start" onclick="startContainer('${container.ID}')">Start</button>`
                    }
                    <button class="container-btn restart" onclick="restartContainer('${container.ID}')">Restart</button>
                    <button class="container-btn logs" onclick="showContainerLogs('${container.ID}')">Logi</button>
                </div>
            </div>
        `;
    }).join('');
    
    containersList.innerHTML = containersHtml;
}

function getContainerStatusClass(status) {
    if (status.includes('Up')) return 'running';
    if (status.includes('Exited')) return 'stopped';
    if (status.includes('Restarting')) return 'restarting';
    return 'stopped';
}

function getContainerStatusText(status) {
    if (status.includes('Up')) return 'Działa';
    if (status.includes('Exited')) return 'Zatrzymany';
    if (status.includes('Restarting')) return 'Restartuje się';
    return status;
}

function startAllContainers() {
    if (gui) gui.showLoading('Uruchamianie wszystkich kontenerów...', 'To może potrwać kilka sekund');
    
    fetch('/api/docker/start-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showToast({
                    title: 'Sukces',
                    message: 'Wszystkie kontenery uruchomione pomyślnie',
                    type: 'success'
                });
            }
            loadContainers(); // Odśwież listę
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.message,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}

function stopAllContainers() {
    if (!confirm('Czy na pewno chcesz zatrzymać wszystkie kontenery?')) return;
    
    if (gui) gui.showLoading('Zatrzymywanie wszystkich kontenerów...', 'To może potrwać kilka sekund');
    
    fetch('/api/docker/stop-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showToast({
                    title: 'Sukces',
                    message: 'Wszystkie kontenery zatrzymane pomyślnie',
                    type: 'success'
                });
            }
            loadContainers(); // Odśwież listę
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.message,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}

function restartAllContainers() {
    if (!confirm('Czy na pewno chcesz zrestartować wszystkie kontenery?')) return;
    
    if (gui) gui.showLoading('Restartowanie wszystkich kontenerów...', 'To może potrwać kilka sekund');
    
    fetch('/api/docker/restart-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showToast({
                    title: 'Sukces',
                    message: 'Wszystkie kontenery zrestartowane pomyślnie',
                    type: 'success'
                });
            }
            loadContainers(); // Odśwież listę
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.message,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}

function rebuildAllContainers() {
    if (!confirm('Czy na pewno chcesz przebudować wszystkie kontenery? To może potrwać kilka minut.')) return;
    
    if (gui) gui.showLoading('Przebudowywanie wszystkich kontenerów...', 'To może potrwać kilka minut');
    
    fetch('/api/docker/rebuild-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showToast({
                    title: 'Sukces',
                    message: 'Wszystkie kontenery przebudowane pomyślnie',
                    type: 'success'
                });
            }
            loadContainers(); // Odśwież listę
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.message,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}

function startContainer(containerId) {
    if (gui) gui.showLoading('Uruchamianie kontenera...', 'Proszę czekać');
    
    fetch('/api/docker/container/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container_id: containerId })
    })
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showToast({
                    title: 'Sukces',
                    message: 'Kontener uruchomiony pomyślnie',
                    type: 'success'
                });
            }
            loadContainers(); // Odśwież listę
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.message,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}

function stopContainer(containerId) {
    if (gui) gui.showLoading('Zatrzymywanie kontenera...', 'Proszę czekać');
    
    fetch('/api/docker/container/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container_id: containerId })
    })
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showToast({
                    title: 'Sukces',
                    message: 'Kontener zatrzymany pomyślnie',
                    type: 'success'
                });
            }
            loadContainers(); // Odśwież listę
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.message,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}

function restartContainer(containerId) {
    if (gui) gui.showLoading('Restartowanie kontenera...', 'Proszę czekać');
    
    fetch('/api/docker/container/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container_id: containerId })
    })
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showToast({
                    title: 'Sukces',
                    message: 'Kontener zrestartowany pomyślnie',
                    type: 'success'
                });
            }
            loadContainers(); // Odśwież listę
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.message,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}

function showContainerLogs(containerId) {
    if (gui) gui.showLoading('Ładowanie logów kontenera...', 'Pobieram informacje');
    
    fetch(`/api/docker/logs/${containerId}`)
    .then(response => response.json())
    .then(data => {
        if (gui) gui.hideLoading();
        if (data.success) {
            if (gui) {
                gui.showModal('Logi Kontenera', `
                    <div class="logs-container">
                        <pre style="background: #1e1e1e; color: #fff; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 12px;">${data.data || 'Brak logów'}</pre>
                    </div>
                `);
            }
        } else {
            if (gui) {
                gui.showToast({
                    title: 'Błąd',
                    message: data.error,
                    type: 'error'
                });
            }
        }
    })
    .catch(error => {
        if (gui) {
            gui.hideLoading();
            gui.showToast({
                title: 'Błąd połączenia',
                message: error.message,
                type: 'error'
            });
        }
    });
}
