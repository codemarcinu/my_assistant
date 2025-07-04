// FoodSave AI GUI - JavaScript
class FoodSaveGUI {
    constructor() {
        this.baseUrl = 'http://localhost:8000';
        this.autoRefreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.refreshStatus();
        this.startAutoRefresh();
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

    // Status Management
    async refreshStatus() {
        try {
            await this.updateDockerStatusPanel();
            await this.fetchStatus();
        } catch (error) {
            console.error('Error refreshing status:', error);
        }
    }

    async updateDockerStatusPanel() {
        const statusCard = document.getElementById('docker-status');
        const statusIcon = document.getElementById('dockerStatusIcon');
        const statusText = document.getElementById('dockerStatusText');
        const containersInfo = document.getElementById('dockerContainersInfo');
        
        // Sprawdź czy elementy istnieją
        if (!statusCard || !statusIcon || !statusText || !containersInfo) {
            console.warn('Niektóre elementy Docker status nie istnieją');
            return;
        }
        
        try {
            const res = await fetch('/api/docker/containers');
            if (!res.ok) throw new Error('Błąd API');
            const data = await res.json();
            if (data && Array.isArray(data.data)) {
                statusCard.classList.remove('status-error');
                statusCard.classList.add('status-ok');
                statusIcon.style.background = '#1d72b8';
                statusText.textContent = 'Docker działa';
                containersInfo.innerHTML = `Uruchomione kontenery: <b>${data.data.length}</b><br>${data.data.map(c => c.Names).join(', ')}`;
            } else {
                throw new Error('Brak danych');
            }
        } catch (e) {
            statusCard.classList.remove('status-ok');
            statusCard.classList.add('status-error');
            statusIcon.style.background = '#b81d1d';
            statusText.textContent = 'Docker niedostępny';
            containersInfo.innerHTML = `<button class='btn btn-primary' onclick='tryStartDocker()'><i class='fas fa-play'></i> Uruchom Dockera</button>`;
        }
    }

    async fetchStatus() {
        try {
            const docker = await fetch('/api/docker/status').then(r => r.json());
            const tauri = await fetch('/api/system/tauri-status').then(r => r.json());
            
            const dockerStatusElement = document.getElementById('docker-status');
            const tauriStatusElement = document.getElementById('tauri-status');
            
            if (dockerStatusElement) {
                dockerStatusElement.innerHTML = 'Status: <span>' + (docker.success ? 'Aktywne' : 'Nieaktywne') + '</span>';
            }
            
            if (tauriStatusElement) {
                tauriStatusElement.innerHTML = 'Status: <span>' + (tauri.success && tauri.running ? 'Uruchomione' : 'Zatrzymane') + '</span>';
            }
        } catch (e) {
            const dockerStatusElement = document.getElementById('docker-status');
            const tauriStatusElement = document.getElementById('tauri-status');
            
            if (dockerStatusElement) {
                dockerStatusElement.innerHTML = 'Status: <span>Błąd</span>';
            }
            if (tauriStatusElement) {
                tauriStatusElement.innerHTML = 'Status: <span>Błąd</span>';
            }
        }
    }

    async checkBackendStatus() {
        const statusCard = document.getElementById('backend-status');
        if (!statusCard) return; // Element nie istnieje
        
        const statusText = statusCard.querySelector('.status-text');
        if (!statusText) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/health`, { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (response.ok) {
                this.updateStatusCard(statusCard, 'online', 'Działa poprawnie');
            } else {
                this.updateStatusCard(statusCard, 'offline', 'Błąd serwera');
            }
        } catch (error) {
            this.updateStatusCard(statusCard, 'offline', 'Nieosiągalny');
        }
    }

    async checkFrontendStatus() {
        const statusCard = document.getElementById('frontend-status');
        if (!statusCard) return; // Element nie istnieje
        
        const statusText = statusCard.querySelector('.status-text');
        if (!statusText) return;
        
        try {
            const response = await fetch('http://localhost:3000', { 
                method: 'GET',
                timeout: 3000 
            });
            
            if (response.ok) {
                this.updateStatusCard(statusCard, 'online', 'Działa poprawnie');
            } else {
                this.updateStatusCard(statusCard, 'offline', 'Błąd aplikacji');
            }
        } catch (error) {
            this.updateStatusCard(statusCard, 'offline', 'Nieosiągalny');
        }
    }

    async checkDatabaseStatus() {
        const statusCard = document.getElementById('database-status');
        if (!statusCard) return; // Element nie istnieje
        
        const statusText = statusCard.querySelector('.status-text');
        if (!statusText) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/health/database`, { 
                method: 'GET',
                timeout: 5000 
            });
            
            if (response.ok) {
                this.updateStatusCard(statusCard, 'online', 'Połączony');
            } else {
                this.updateStatusCard(statusCard, 'offline', 'Błąd połączenia');
            }
        } catch (error) {
            this.updateStatusCard(statusCard, 'offline', 'Nieosiągalny');
        }
    }

    async checkAIStatus() {
        const statusCard = document.getElementById('ai-status');
        if (!statusCard) return; // Element nie istnieje
        
        const statusText = statusCard.querySelector('.status-text');
        if (!statusText) return;
        
        try {
            const response = await fetch('http://localhost:11434/api/tags', { 
                method: 'GET',
                timeout: 3000 
            });
            
            if (response.ok) {
                this.updateStatusCard(statusCard, 'online', 'Model dostępny');
            } else {
                this.updateStatusCard(statusCard, 'warning', 'Model niedostępny');
            }
        } catch (error) {
            this.updateStatusCard(statusCard, 'warning', 'Ollama nie działa');
        }
    }

    updateStatusCard(card, status, text) {
        if (!card) return; // Element nie istnieje
        
        // Remove all status classes
        card.classList.remove('online', 'offline', 'warning');
        
        // Add new status class
        card.classList.add(status);
        
        // Update text
        const statusText = card.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = text;
        }
    }

    startAutoRefresh() {
        // Refresh status every 30 seconds
        this.autoRefreshInterval = setInterval(() => {
            this.refreshStatus();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    // Loading Management
    showLoading(text = 'Przetwarzam...', description = 'Proszę czekać...') {
        const loadingText = document.getElementById('loadingText');
        const loadingDescription = document.getElementById('loadingDescription');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        if (loadingText) loadingText.textContent = text;
        if (loadingDescription) loadingDescription.textContent = description;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    // Modal Management
    showModal(title, content, footerButtons = []) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        const modal = document.getElementById('modal');
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        
        if (modalFooter) {
            modalFooter.innerHTML = '';
            
            if (footerButtons.length === 0) {
                modalFooter.innerHTML = '<button class="btn btn-secondary" onclick="gui.closeModal()">Zamknij</button>';
            } else {
                footerButtons.forEach(button => {
                    const btn = document.createElement('button');
                    btn.className = `btn ${button.class || 'btn-secondary'}`;
                    btn.textContent = button.text;
                    btn.onclick = button.onclick;
                    modalFooter.appendChild(btn);
                });
            }
        }
        
        if (modal) modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
    }

    // System Actions
    async startDevelopmentMode() {
        this.showLoading('Uruchamiam tryb deweloperski...', 'To może potrwać kilka minut');
        
        try {
            const response = await fetch('/api/system/start-dev', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showModal(
                    'Sukces!',
                    `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 20px;"></i>
                        <h3>Tryb deweloperski uruchomiony pomyślnie!</h3>
                        <p>System jest gotowy do pracy.</p>
                        <div style="margin-top: 20px;">
                            <a href="http://localhost:3000" target="_blank" class="btn btn-primary">
                                <i class="fas fa-external-link-alt"></i>
                                Otwórz aplikację
                            </a>
                        </div>
                    </div>
                    `,
                    [
                        {
                            text: 'Odśwież status',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.refreshStatus();
                            }
                        },
                        {
                            text: 'Zamknij',
                            class: 'btn-secondary',
                            onclick: () => this.closeModal()
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                '❌ Błąd Uruchamiania Systemu',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się uruchomić systemu</h3>
                    <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: left; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🔍 Możliwe przyczyny problemu:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>Porty zajęte:</strong> Port 3000 lub 8000 może być używany przez inną aplikację</li>
                            <li><strong>Docker nie działa:</strong> Docker może nie być uruchomiony lub nie mieć uprawnień</li>
                            <li><strong>Brak uprawnień:</strong> Użytkownik może nie mieć uprawnień do uruchamiania usług</li>
                            <li><strong>Problem z konfiguracją:</strong> Pliki konfiguracyjne mogą być uszkodzone</li>
                            <li><strong>Brak zależności:</strong> Niektóre wymagane programy mogą nie być zainstalowane</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #2980b9;">🔧 Jak naprawić problem:</h4>
                        <ol style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>Sprawdź środowisko:</strong> Użyj opcji "Sprawdź środowisko" aby zobaczyć szczegóły</li>
                            <li><strong>Sprawdź Docker:</strong> Otwórz terminal i wpisz <code>docker --version</code></li>
                            <li><strong>Sprawdź porty:</strong> Upewnij się, że porty 3000, 8000, 5432 są wolne</li>
                            <li><strong>Sprawdź uprawnienia:</strong> Upewnij się, że masz dostęp do Docker</li>
                            <li><strong>Restart systemu:</strong> Czasami restart komputera rozwiązuje problemy</li>
                        </ol>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #856404;">📞 Potrzebujesz pomocy?</h4>
                        <p style="margin: 0; color: #856404;">
                            • Sprawdź dokumentację w katalogu <code>docs/</code><br>
                            • Uruchom diagnostykę środowiska<br>
                            • Skontaktuj się z zespołem wsparcia
                        </p>
                    </div>
                </div>
                `,
                [
                    {
                        text: '🔧 Sprawdź środowisko',
                        class: 'btn-primary',
                        onclick: () => {
                            this.closeModal();
                            this.checkEnvironment();
                        }
                    },
                    {
                        text: '📊 Odśwież status',
                        class: 'btn-secondary',
                        onclick: () => {
                            this.closeModal();
                            this.refreshStatus();
                        }
                    },
                    {
                        text: '❓ Pokaż pomoc',
                        class: 'btn-info',
                        onclick: () => {
                            this.closeModal();
                            this.showHelp();
                        }
                    },
                    {
                        text: 'Zamknij',
                        class: 'btn-secondary',
                        onclick: () => this.closeModal()
                    }
                ]
            );
        } finally {
            this.hideLoading();
        }
    }

    async startProductionMode() {
        this.showLoading('Uruchamiam tryb produkcyjny...', 'To może potrwać kilka minut');
        
        try {
            const response = await fetch('/api/system/start-prod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showModal(
                    'Sukces!',
                    `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 20px;"></i>
                        <h3>Tryb produkcyjny uruchomiony pomyślnie!</h3>
                        <p>System jest gotowy do użytku produkcyjnego.</p>
                        <div style="margin-top: 20px;">
                            <a href="http://localhost:3000" target="_blank" class="btn btn-primary">
                                <i class="fas fa-external-link-alt"></i>
                                Otwórz aplikację
                            </a>
                        </div>
                    </div>
                    `,
                    [
                        {
                            text: 'Odśwież status',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.refreshStatus();
                            }
                        },
                        {
                            text: 'Zamknij',
                            class: 'btn-secondary',
                            onclick: () => this.closeModal()
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                '❌ Błąd Uruchamiania Systemu',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się uruchomić systemu</h3>
                    <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: left; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🔍 Możliwe przyczyny problemu:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>Porty zajęte:</strong> Port 3000 lub 8000 może być używany przez inną aplikację</li>
                            <li><strong>Docker nie działa:</strong> Docker może nie być uruchomiony lub nie mieć uprawnień</li>
                            <li><strong>Brak uprawnień:</strong> Użytkownik może nie mieć uprawnień do uruchamiania usług</li>
                            <li><strong>Problem z konfiguracją:</strong> Pliki konfiguracyjne mogą być uszkodzone</li>
                            <li><strong>Brak zależności:</strong> Niektóre wymagane programy mogą nie być zainstalowane</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #2980b9;">🔧 Jak naprawić problem:</h4>
                        <ol style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>Sprawdź środowisko:</strong> Użyj opcji "Sprawdź środowisko" aby zobaczyć szczegóły</li>
                            <li><strong>Sprawdź Docker:</strong> Otwórz terminal i wpisz <code>docker --version</code></li>
                            <li><strong>Sprawdź porty:</strong> Upewnij się, że porty 3000, 8000, 5432 są wolne</li>
                            <li><strong>Sprawdź uprawnienia:</strong> Upewnij się, że masz dostęp do Docker</li>
                            <li><strong>Restart systemu:</strong> Czasami restart komputera rozwiązuje problemy</li>
                        </ol>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #856404;">📞 Potrzebujesz pomocy?</h4>
                        <p style="margin: 0; color: #856404;">
                            • Sprawdź dokumentację w katalogu <code>docs/</code><br>
                            • Uruchom diagnostykę środowiska<br>
                            • Skontaktuj się z zespołem wsparcia
                        </p>
                    </div>
                </div>
                `,
                [
                    {
                        text: '🔧 Sprawdź środowisko',
                        class: 'btn-primary',
                        onclick: () => {
                            this.closeModal();
                            this.checkEnvironment();
                        }
                    },
                    {
                        text: '📊 Odśwież status',
                        class: 'btn-secondary',
                        onclick: () => {
                            this.closeModal();
                            this.refreshStatus();
                        }
                    },
                    {
                        text: '❓ Pokaż pomoc',
                        class: 'btn-info',
                        onclick: () => {
                            this.closeModal();
                            this.showHelp();
                        }
                    },
                    {
                        text: 'Zamknij',
                        class: 'btn-secondary',
                        onclick: () => this.closeModal()
                    }
                ]
            );
        } finally {
            this.hideLoading();
        }
    }

    async startTauriApp() {
        this.showLoading('Uruchamiam aplikację desktop...', 'Sprawdzam czy aplikacja jest zbudowana');
        
        try {
            const response = await fetch('/api/system/start-tauri', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showModal(
                    'Sukces!',
                    `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 20px;"></i>
                        <h3>Aplikacja desktop uruchomiona!</h3>
                        <p>Aplikacja powinna się otworzyć w osobnym oknie.</p>
                    </div>
                    `,
                    [
                        {
                            text: 'Zamknij',
                            class: 'btn-secondary',
                            onclick: () => this.closeModal()
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                'Błąd',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się uruchomić aplikacji</h3>
                    <p>${error.message}</p>
                    <div style="margin-top: 20px;">
                        <p>Aplikacja może nie być jeszcze zbudowana.</p>
                    </div>
                </div>
                `,
                [
                    {
                        text: 'Zbuduj aplikację',
                        class: 'btn-primary',
                        onclick: () => {
                            this.closeModal();
                            this.buildTauriApp();
                        }
                    },
                    {
                        text: 'Zamknij',
                        class: 'btn-secondary',
                        onclick: () => this.closeModal()
                    }
                ]
            );
        } finally {
            this.hideLoading();
        }
    }

    async startTauriDev() {
        this.showLoading('Uruchamiam Tauri dev...', 'To może potrwać kilka sekund');
        try {
            const response = await fetch('/api/system/start-tauri-dev', { method: 'POST' });
            const result = await response.json();
            this.hideLoading();
            if (result.success) {
                showToast({ title: 'Tauri dev', message: 'Aplikacja Tauri dev uruchomiona w tle!', type: 'success' });
            } else {
                showToast({ title: 'Błąd Tauri dev', message: result.message || 'Nie udało się uruchomić.', type: 'error' });
            }
        } catch (e) {
            this.hideLoading();
            showToast({ title: 'Błąd Tauri dev', message: e.message, type: 'error' });
        }
    }

    async stopAllServices() {
        this.showModal(
            'Potwierdzenie',
            `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-question-circle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 20px;"></i>
                <h3>Czy na pewno chcesz zatrzymać wszystkie usługi?</h3>
                <p>To bezpiecznie zatrzyma cały system FoodSave AI.</p>
            </div>
            `,
            [
                {
                    text: 'Tak, zatrzymaj',
                    class: 'btn-primary',
                    onclick: async () => {
                        this.closeModal();
                        this.showLoading('Zatrzymuję usługi...', 'To może potrwać kilka sekund');
                        
                        try {
                            const response = await fetch('/api/system/stop', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                this.showModal(
                                    'Sukces!',
                                    `
                                    <div style="text-align: center; padding: 20px;">
                                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 20px;"></i>
                                        <h3>Wszystkie usługi zostały zatrzymane</h3>
                                        <p>System jest bezpiecznie wyłączony.</p>
                                    </div>
                                    `,
                                    [
                                        {
                                            text: 'Odśwież status',
                                            class: 'btn-primary',
                                            onclick: () => {
                                                this.closeModal();
                                                this.refreshStatus();
                                            }
                                        },
                                        {
                                            text: 'Zamknij',
                                            class: 'btn-secondary',
                                            onclick: () => this.closeModal()
                                        }
                                    ]
                                );
                            } else {
                                throw new Error(result.error || 'Nieznany błąd');
                            }
                        } catch (error) {
                            this.showModal(
                                'Błąd',
                                `
                                <div style="text-align: center; padding: 20px;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                                    <h3>Nie udało się zatrzymać usług</h3>
                                    <p>${error.message}</p>
                                </div>
                                `,
                                [
                                    {
                                        text: 'Zamknij',
                                        class: 'btn-secondary',
                                        onclick: () => this.closeModal()
                                    }
                                ]
                            );
                        } finally {
                            this.hideLoading();
                        }
                    }
                },
                {
                    text: 'Anuluj',
                    class: 'btn-secondary',
                    onclick: () => this.closeModal()
                }
            ]
        );
    }

    async showLogs() {
        let logType = 'all';
        let level = 'all';
        let search = '';
        let limit = 1000;
        // Modal z filtrami
        const modalContent = `
            <div style="margin-bottom:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                <label>Typ:
                    <select id="logTypeSelect">
                        <option value="all">Wszystkie</option>
                        <option value="backend">Backend</option>
                        <option value="frontend">Frontend</option>
                        <option value="docker">Docker</option>
                    </select>
                </label>
                <label>Poziom:
                    <select id="logLevelSelect">
                        <option value="all">Wszystkie</option>
                        <option value="ERROR">ERROR</option>
                        <option value="WARN">WARN</option>
                        <option value="INFO">INFO</option>
                        <option value="DEBUG">DEBUG</option>
                    </select>
                </label>
                <label>Szukaj:
                    <input type="text" id="logSearchInput" placeholder="fraza..." style="min-width:100px;" />
                </label>
                <label>Limit:
                    <input type="number" id="logLimitInput" value="1000" min="10" max="5000" style="width:70px;" />
                </label>
                <button class="btn btn-secondary" id="logFilterBtn"><i class="fas fa-filter"></i> Filtruj</button>
                <button class="btn btn-secondary" id="logExportBtn"><i class="fas fa-download"></i> Eksportuj</button>
            </div>
            <div class="logs-container" id="logsContainer"><span>Ładowanie logów...</span></div>
        `;
        this.showModal('Logi systemowe', modalContent);
        // Pobierz logi
        async function fetchAndRenderLogs() {
            logType = document.getElementById('logTypeSelect').value;
            level = document.getElementById('logLevelSelect').value;
            search = document.getElementById('logSearchInput').value;
            limit = parseInt(document.getElementById('logLimitInput').value);
            const url = `/api/system/logs/${logType}?level=${level}&search=${encodeURIComponent(search)}&limit=${limit}`;
            const logsDiv = document.getElementById('logsContainer');
            logsDiv.innerHTML = '<span>Ładowanie...</span>';
            try {
                const res = await fetch(url);
                const data = await res.json();
                if (!data.success) {
                    logsDiv.innerHTML = '<span>Błąd pobierania logów</span>';
                    return;
                }
                logsDiv.innerHTML = renderLogsColored(data.data);
            } catch (e) {
                logsDiv.innerHTML = '<span>Błąd połączenia</span>';
            }
        }
        // Kolorowanie logów
        function renderLogsColored(logs) {
            if (!logs) return '<span>Brak logów</span>';
            return `<pre>${logs.replace(/^(.*ERROR.*)$/gmi, '<span class="log-entry error">$1</span>')
                .replace(/^(.*WARN.*)$/gmi, '<span class="log-entry warning">$1</span>')
                .replace(/^(.*INFO.*)$/gmi, '<span class="log-entry info">$1</span>')}</pre>`;
        }
        // Eksport logów
        function exportLogs() {
            const logs = document.getElementById('logsContainer').innerText;
            const blob = new Blob([logs], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `foodsave-logs-${Date.now()}.txt`;
            a.click();
        }
        // Eventy
        setTimeout(() => {
            document.getElementById('logFilterBtn').onclick = fetchAndRenderLogs;
            document.getElementById('logExportBtn').onclick = exportLogs;
            fetchAndRenderLogs();
        }, 200);
    }

    async checkEnvironment() {
        this.showLoading('Sprawdzam środowisko...', 'Diagnostyka systemu w toku');
        
        try {
            const response = await fetch('/api/system/check-environment', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Formatuj szczegółowe informacje diagnostyczne
                const formattedDetails = this._formatDiagnosticInfo(result.details);
                
                this.showModal(
                    '🔧 Diagnostyka Środowiska Systemu',
                    `
                    <div style="max-height: 500px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">📋 Wynik Diagnostyki</h3>
                            <div style="white-space: pre-wrap; color: #34495e;">${formattedDetails}</div>
                        </div>
                        
                        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 10px 0; color: #2980b9;">💡 Co to oznacza?</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #34495e;">
                                <li><strong>✅</strong> - Wszystko działa poprawnie</li>
                                <li><strong>❌</strong> - Znaleziono problem do naprawienia</li>
                                <li><strong>⚠️</strong> - Ostrzeżenie, ale system może działać</li>
                            </ul>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px;">
                            <h3 style="margin: 0 0 10px 0; color: #856404;">🚀 Następne kroki</h3>
                            <ol style="margin: 0; padding-left: 20px; color: #856404;">
                                <li>Sprawdź czy wszystkie komponenty mają status ✅</li>
                                <li>Jeśli widzisz ❌, napraw problemy przed uruchomieniem</li>
                                <li>Uruchom ponownie diagnostykę po naprawach</li>
                                <li>Gdy wszystko jest ✅, możesz uruchomić system</li>
                            </ol>
                        </div>
                    </div>
                    `,
                    [
                        {
                            text: '🔄 Uruchom ponownie diagnostykę',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.checkEnvironment();
                            }
                        },
                        {
                            text: '📊 Odśwież status systemu',
                            class: 'btn-secondary',
                            onclick: () => {
                                this.closeModal();
                                this.refreshStatus();
                            }
                        },
                        {
                            text: '❓ Pokaż pomoc',
                            class: 'btn-info',
                            onclick: () => {
                                this.closeModal();
                                this.showHelp();
                            }
                        },
                        {
                            text: '🔄 Przebuduj kontenery',
                            class: 'btn-warning',
                            onclick: () => {
                                this.closeModal();
                                this.rebuildContainers();
                            }
                        },
                        {
                            text: 'Zamknij',
                            class: 'btn-secondary',
                            onclick: () => this.closeModal()
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                '❌ Błąd Diagnostyki',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się sprawdzić środowiska</h3>
                    <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: left; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🔧 Co możesz zrobić:</h4>
                        <ol style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>Sprawdź czy GUI działa:</strong> Uruchom ponownie GUI</li>
                            <li><strong>Sprawdź uprawnienia:</strong> Upewnij się, że masz dostęp do systemu</li>
                            <li><strong>Sprawdź Docker:</strong> Uruchom <code>docker --version</code> w terminalu</li>
                            <li><strong>Sprawdź porty:</strong> Upewnij się, że porty 3000 i 8000 są wolne</li>
                            <li><strong>Restart systemu:</strong> Czasami restart komputera pomaga</li>
                        </ol>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #2980b9;">📞 Potrzebujesz pomocy?</h4>
                        <p style="margin: 0; color: #34495e;">
                            • Sprawdź dokumentację w katalogu <code>docs/</code><br>
                            • Uruchom ponownie diagnostykę po naprawach<br>
                            • Skontaktuj się z zespołem wsparcia
                        </p>
                    </div>
                </div>
                `,
                [
                    {
                        text: '🔄 Spróbuj ponownie',
                        class: 'btn-primary',
                        onclick: () => {
                            this.closeModal();
                            this.checkEnvironment();
                        }
                    },
                    {
                        text: '❓ Pokaż pomoc',
                        class: 'btn-info',
                        onclick: () => {
                            this.closeModal();
                            this.showHelp();
                        }
                    },
                    {
                        text: '🔄 Przebuduj kontenery',
                        class: 'btn-warning',
                        onclick: () => {
                            this.closeModal();
                            this.rebuildContainers();
                        }
                    },
                    {
                        text: 'Zamknij',
                        class: 'btn-secondary',
                        onclick: () => this.closeModal()
                    }
                ]
            );
        } finally {
            this.hideLoading();
        }
    }

    _formatDiagnosticInfo(details) {
        if (!details) {
            return 'Brak szczegółów diagnostyki';
        }
        
        // Jeśli szczegóły zawierają już sformatowany tekst, zwróć go
        if (details.includes('🔧 DIAGNOSTYKA SYSTEMU') || details.includes('❌ BŁĄD')) {
            return details;
        }
        
        // W przeciwnym razie sformatuj jako zwykły tekst
        return details.replace(/\n/g, '<br>');
    }

    async buildTauriApp() {
        this.showModal(
            'Potwierdzenie',
            `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-question-circle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 20px;"></i>
                <h3>Czy chcesz zbudować aplikację desktop?</h3>
                <p>To może potrwać kilka minut i wymaga zainstalowanego Rust.</p>
            </div>
            `,
            [
                {
                    text: 'Tak, zbuduj',
                    class: 'btn-primary',
                    onclick: async () => {
                        this.closeModal();
                        this.showLoading('Buduję aplikację...', 'To może potrwać kilka minut');
                        
                        try {
                            const response = await fetch('/api/system/build-tauri', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                this.showModal(
                                    'Sukces!',
                                    `
                                    <div style="text-align: center; padding: 20px;">
                                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 20px;"></i>
                                        <h3>Aplikacja została zbudowana!</h3>
                                        <p>Plik instalacyjny jest gotowy.</p>
                                        <div style="margin-top: 20px;">
                                            <p><strong>Lokalizacja:</strong> ${result.location || 'Nieznana'}</p>
                                        </div>
                                    </div>
                                    `,
                                    [
                                        {
                                            text: 'Uruchom aplikację',
                                            class: 'btn-primary',
                                            onclick: () => {
                                                this.closeModal();
                                                this.startTauriApp();
                                            }
                                        },
                                        {
                                            text: 'Zamknij',
                                            class: 'btn-secondary',
                                            onclick: () => this.closeModal()
                                        }
                                    ]
                                );
                            } else {
                                throw new Error(result.error || 'Nieznany błąd');
                            }
                        } catch (error) {
                            this.showModal(
                                'Błąd',
                                `
                                <div style="text-align: center; padding: 20px;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                                    <h3>Nie udało się zbudować aplikacji</h3>
                                    <p>${error.message}</p>
                                    <div style="margin-top: 20px; text-align: left;">
                                        <h4>Możliwe przyczyny:</h4>
                                        <ul>
                                            <li>Rust nie jest zainstalowany</li>
                                            <li>Brak uprawnień do budowania</li>
                                            <li>Problem z zależnościami</li>
                                            <li>Błąd w konfiguracji</li>
                                        </ul>
                                    </div>
                                </div>
                                `,
                                [
                                    {
                                        text: 'Zamknij',
                                        class: 'btn-secondary',
                                        onclick: () => this.closeModal()
                                    }
                                ]
                            );
                        } finally {
                            this.hideLoading();
                        }
                    }
                },
                {
                    text: 'Anuluj',
                    class: 'btn-secondary',
                    onclick: () => this.closeModal()
                }
            ]
        );
    }

    async showBackups() {
        this.showLoading('Ładuję kopie zapasowe...', 'Sprawdzam dostępne backupy');
        
        try {
            const response = await fetch('/api/system/backups', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showModal(
                    'Kopie Zapasowe',
                    `
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${result.backups || 'Brak kopii zapasowych'}
                    </div>
                    `,
                    [
                        {
                            text: 'Utwórz backup',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.createBackup();
                            }
                        },
                        {
                            text: 'Zamknij',
                            class: 'btn-secondary',
                            onclick: () => this.closeModal()
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                'Błąd',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się załadować kopii zapasowych</h3>
                    <p>${error.message}</p>
                </div>
                `,
                [
                    {
                        text: 'Zamknij',
                        class: 'btn-secondary',
                        onclick: () => this.closeModal()
                    }
                ]
            );
        } finally {
            this.hideLoading();
        }
    }

    async createBackup() {
        this.showLoading('Tworzę kopię zapasową...', 'To może potrwać kilka minut');
        
        try {
            const response = await fetch('/api/system/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showModal(
                    'Sukces!',
                    `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 20px;"></i>
                        <h3>Kopia zapasowa została utworzona!</h3>
                        <p>Backup został zapisany pomyślnie.</p>
                        <div style="margin-top: 20px;">
                            <p><strong>Lokalizacja:</strong> ${result.location || 'Nieznana'}</p>
                        </div>
                    </div>
                    `,
                    [
                        {
                            text: 'Zobacz backupy',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.showBackups();
                            }
                        },
                        {
                            text: 'Zamknij',
                            class: 'btn-secondary',
                            onclick: () => this.closeModal()
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                'Błąd',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się utworzyć kopii zapasowej</h3>
                    <p>${error.message}</p>
                </div>
                `,
                [
                    {
                        text: 'Zamknij',
                        class: 'btn-secondary',
                        onclick: () => this.closeModal()
                    }
                ]
            );
        } finally {
            this.hideLoading();
        }
    }

    showHelp() {
        this.showModal(
            'Pomoc i Informacje',
            `
            <div style="max-height: 400px; overflow-y: auto;">
                <h3>🍽️ FoodSave AI - Panel Sterowania</h3>
                <p>Intuicyjny panel do zarządzania systemem FoodSave AI.</p>
                
                <h4>🚀 Szybkie Akcje:</h4>
                <ul>
                    <li><strong>Tryb Deweloperski:</strong> Dla programistów i testowania</li>
                    <li><strong>Tryb Produkcyjny:</strong> Dla użytkowników końcowych</li>
                    <li><strong>Aplikacja Desktop:</strong> Natywna aplikacja systemowa</li>
                    <li><strong>Zatrzymaj Wszystko:</strong> Bezpieczne wyłączenie</li>
                </ul>
                
                <h4>🔧 Opcje Zaawansowane:</h4>
                <ul>
                    <li><strong>Pokaż Logi:</strong> Dostęp do logów systemowych</li>
                    <li><strong>Sprawdź Środowisko:</strong> Diagnostyka systemu</li>
                    <li><strong>Zbuduj Aplikację:</strong> Tworzenie pliku instalacyjnego</li>
                    <li><strong>Kopie Zapasowe:</strong> Zarządzanie backupami</li>
                </ul>
                
                <h4>📊 Status Systemu:</h4>
                <ul>
                    <li><strong>Zielony:</strong> Działa poprawnie</li>
                    <li><strong>Czerwony:</strong> Błąd lub nieosiągalny</li>
                    <li><strong>Żółty:</strong> Ostrzeżenie</li>
                </ul>
                
                <h4>🔗 Przydatne Linki:</h4>
                <ul>
                    <li><strong>Interfejs Web:</strong> http://localhost:3000</li>
                    <li><strong>Dokumentacja API:</strong> http://localhost:8000/docs</li>
                    <li><strong>Backend API:</strong> http://localhost:8000</li>
                </ul>
                
                <h4>❓ Rozwiązywanie Problemów:</h4>
                <ul>
                    <li>Sprawdź czy Docker jest uruchomiony</li>
                    <li>Upewnij się, że porty 3000 i 8000 są wolne</li>
                    <li>Sprawdź logi w przypadku błędów</li>
                    <li>Użyj opcji "Sprawdź środowisko"</li>
                </ul>
                <div style="margin-top: 16px; padding: 10px; background: #fef3c7; border-radius: 8px; border: 1px solid #fde68a;">
                  <b>Najczęstsze problemy i rozwiązania:</b>
                  <ul style="margin-top: 8px;">
                    <li><b>Backend nie uruchamia się lub pojawia się "Nie udało się uruchomić systemu":</b>
                      <ul>
                        <li>Sprawdź logi backendu:<br><code>docker logs aiasisstmarubo-backend-1 --tail 50</code></li>
                        <li>Jeśli widzisz <b>ImportError</b> lub błąd importu, sprawdź czy wszystkie pliki i funkcje istnieją w kodzie źródłowym.</li>
                        <li>Po poprawce kodu backendu uruchom:<br><code>docker-compose build backend</code><br><code>docker-compose up -d</code></li>
                      </ul>
                    </li>
                    <li><b>Baza danych nie startuje lub port 5432 jest zajęty:</b>
                      <ul>
                        <li>Sprawdź czy lokalny PostgreSQL nie blokuje portu:<br><code>sudo netstat -tulpn | grep :5432</code></li>
                        <li>Jeśli tak, zatrzymaj lokalny serwer:<br><code>sudo systemctl stop postgresql</code></li>
                      </ul>
                    </li>
                    <li><b>Jak sprawdzić status usług Docker:</b>
                      <ul>
                        <li>Wyświetl listę uruchomionych kontenerów:<br><code>docker ps</code></li>
                        <li>Sprawdź logi wybranej usługi, np. bazy danych:<br><code>docker logs aiasisstmarubo-postgres-1 --tail 50</code></li>
                      </ul>
                    </li>
                    <li><b>Backend nie odpowiada na healthcheck:</b>
                      <ul>
                        <li>Sprawdź status:<br><code>curl -s http://localhost:8000/health</code></li>
                        <li>Jeśli brak odpowiedzi, sprawdź logi backendu jak wyżej.</li>
                      </ul>
                    </li>
                    <li><b>Najczęstsze przyczyny problemów:</b>
                      <ul>
                        <li>Błąd w kodzie backendu (np. ImportError)</li>
                        <li>Brak uprawnień do Docker</li>
                        <li>Porty zajęte przez inne procesy</li>
                        <li>Nieaktualny obraz backendu (po zmianach w kodzie zawsze wykonaj <code>docker-compose build backend</code>)</li>
                      </ul>
                    </li>
                  </ul>
                  <div style="margin-top: 8px; font-size: 0.95em; color: #b91c1c;">
                    Jeśli nie wiesz jak naprawić błąd, skopiuj logi i skontaktuj się z administratorem lub zespołem wsparcia.
                  </div>
                </div>
            </div>
            `,
            [
                {
                    text: 'Zamknij',
                    class: 'btn-secondary',
                    onclick: () => this.closeModal()
                }
            ]
        );
    }

    async rebuildContainers() {
        this.showLoading('Przebudowuję kontenery...', 'To może potrwać kilka minut');
        
        try {
            const response = await fetch('/api/system/rebuild-containers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showModal(
                    'Sukces!',
                    `
                    <div style="text-align: center; padding: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 20px;"></i>
                        <h3>Kontenery zostały przebudowane!</h3>
                        <p>System jest gotowy do pracy.</p>
                    </div>
                    `,
                    [
                        {
                            text: 'Odśwież status',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.refreshStatus();
                            }
                        },
                        {
                            text: 'Zamknij',
                            class: 'btn-secondary',
                            onclick: () => this.closeModal()
                        }
                    ]
                );
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                '❌ Błąd Przebudowy Kontenerów',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się przebudować kontenerów</h3>
                    <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: left; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🔍 Możliwe przyczyny:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>System nie jest uruchomiony:</strong> Kontenery są dostępne tylko gdy system działa</li>
                            <li><strong>Brak uprawnień:</strong> GUI może nie mieć dostępu do kontenerów</li>
                            <li><strong>Pliki konfiguracyjne mogą być uszkodzone:</strong> Kontenery mogą nie działać poprawnie</li>
                            <li><strong>Problem z serwerem GUI:</strong> Serwer GUI może nie działać poprawnie</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #2980b9;">🔧 Co możesz zrobić:</h4>
                        <ol style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>Sprawdź czy system działa:</strong> Użyj opcji "Sprawdź status systemu"</li>
                            <li><strong>Uruchom system:</strong> Jeśli nie działa, uruchom go najpierw</li>
                            <li><strong>Sprawdź uprawnienia:</strong> Upewnij się, że GUI ma dostęp do kontenerów</li>
                            <li><strong>Restart GUI:</strong> Uruchom ponownie GUI</li>
                        </ol>
                    </div>
                </div>
                `,
                [
                    {
                        text: '📊 Sprawdź status',
                        class: 'btn-primary',
                        onclick: () => {
                            this.closeModal();
                            this.refreshStatus();
                        }
                    },
                    {
                        text: '🔧 Sprawdź środowisko',
                        class: 'btn-secondary',
                        onclick: () => {
                            this.closeModal();
                            this.checkEnvironment();
                        }
                    },
                    {
                        text: 'Zamknij',
                        class: 'btn-secondary',
                        onclick: () => this.closeModal()
                    }
                ]
            );
        } finally {
            this.hideLoading();
        }
    }
}

// Global functions for onclick handlers
let gui;

// Initialize GUI when page loads
document.addEventListener('DOMContentLoaded', () => {
    gui = new FoodSaveGUI();
});

// Global functions for HTML onclick handlers
function refreshStatus() {
    if (gui) gui.refreshStatus();
}

function startDevelopmentMode() {
    if (gui) gui.startDevelopmentMode();
}

function startProductionMode() {
    if (gui) gui.startProductionMode();
}

function startTauriApp() {
    gui.startTauriApp();
}

function startTauriDev() {
    gui.startTauriDev();
}

function stopAllServices() {
    if (gui) gui.stopAllServices();
}

function showLogs() {
    if (gui) gui.showLogs();
}

function checkEnvironment() {
    if (gui) gui.checkEnvironment();
}

function buildTauriApp() {
    if (gui) gui.buildTauriApp();
}

function showBackups() {
    if (gui) gui.showBackups();
}

function showHelp() {
    if (gui) gui.showHelp();
}

function closeModal() {
    if (gui) gui.closeModal();
}

// Monitoring Real-time Charts
let cpuChart, ramChart, diskChart, networkChart;
let monitoringInterval = null;
let monitoringPaused = false;
let lastNetwork = { sent: 0, recv: 0 };
let monitoringRefreshMs = 10000;

function initMonitoringCharts() {
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const ramCtx = document.getElementById('ramChart').getContext('2d');
    const diskCtx = document.getElementById('diskChart').getContext('2d');
    const netCtx = document.getElementById('networkChart').getContext('2d');

    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'CPU (%)', data: [], borderColor: '#667eea', fill: false }] },
        options: { scales: { y: { min: 0, max: 100 } }, animation: false }
    });
    ramChart = new Chart(ramCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'RAM (%)', data: [], borderColor: '#764ba2', fill: false }] },
        options: { scales: { y: { min: 0, max: 100 } }, animation: false }
    });
    diskChart = new Chart(diskCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Dysk (%)', data: [], borderColor: '#10b981', fill: false }] },
        options: { scales: { y: { min: 0, max: 100 } }, animation: false }
    });
    networkChart = new Chart(netCtx, {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Wysłano (kB/s)', data: [], borderColor: '#f59e0b', fill: false },
            { label: 'Odebrano (kB/s)', data: [], borderColor: '#3b82f6', fill: false }
        ] },
        options: { animation: false }
    });
}

function startMonitoring() {
    if (monitoringInterval) clearInterval(monitoringInterval);
    monitoringPaused = false;
    fetchAndUpdateMetrics();
    monitoringInterval = setInterval(() => {
        if (!monitoringPaused) fetchAndUpdateMetrics();
    }, monitoringRefreshMs);
}

function stopMonitoring() {
    if (monitoringInterval) clearInterval(monitoringInterval);
    monitoringPaused = true;
}

function toggleMonitoring() {
    monitoringPaused = !monitoringPaused;
    document.getElementById('monitoringToggleText').textContent = monitoringPaused ? 'Wznów' : 'Wstrzymaj';
    document.getElementById('monitoringToggle').querySelector('i').className = monitoringPaused ? 'fas fa-play' : 'fas fa-pause';
}

function updateRefreshInterval() {
    const val = parseInt(document.getElementById('refreshInterval').value);
    monitoringRefreshMs = val;
    if (monitoringInterval) clearInterval(monitoringInterval);
    if (val > 0) {
        monitoringInterval = setInterval(() => {
            if (!monitoringPaused) fetchAndUpdateMetrics();
        }, val);
    }
}

function fetchAndUpdateMetrics() {
    fetch('/api/system/metrics')
        .then(res => res.json())
        .then(res => {
            if (!res.success) return;
            const m = res.data;
            const ts = new Date(m.timestamp).toLocaleTimeString();
            // CPU
            addChartPoint(cpuChart, ts, m.cpu.percent);
            // RAM
            addChartPoint(ramChart, ts, m.memory.percent);
            // Dysk
            addChartPoint(diskChart, ts, m.disk.percent);
            // Sieć (wylicz KB/s)
            if (lastNetwork.sent !== 0) {
                const sent = (m.network.bytes_sent - lastNetwork.sent) / (monitoringRefreshMs / 1000) / 1024;
                const recv = (m.network.bytes_recv - lastNetwork.recv) / (monitoringRefreshMs / 1000) / 1024;
                addChartPoint(networkChart, ts, sent, recv);
            }
            lastNetwork.sent = m.network.bytes_sent;
            lastNetwork.recv = m.network.bytes_recv;
        });
}

function addChartPoint(chart, label, v1, v2) {
    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        if (chart.data.datasets.length > 1) chart.data.datasets[1].data.shift();
    }
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(v1);
    if (typeof v2 !== 'undefined' && chart.data.datasets.length > 1) chart.data.datasets[1].data.push(v2);
    chart.update('none');
}

// Inicjalizacja po załadowaniu strony
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cpuChart')) {
        initMonitoringCharts();
        startMonitoring();
        document.getElementById('monitoringToggle').addEventListener('click', toggleMonitoring);
        document.getElementById('refreshInterval').addEventListener('change', updateRefreshInterval);
    }
});

// DARK MODE
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.getElementById('darkModeText').textContent = theme === 'dark' ? 'Tryb Jasny' : 'Tryb Ciemny';
    document.getElementById('darkModeToggle').querySelector('i').className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
    let theme = localStorage.getItem('theme');
    if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setTheme(theme);
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    if (document.getElementById('darkModeToggle')) {
        document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    }
});

// TOAST NOTIFICATIONS
function showToast({ title = '', message = '', type = 'info', timeout = 4000 }) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, timeout);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return '<i class="fas fa-check-circle"></i>';
        case 'error': return '<i class="fas fa-times-circle"></i>';
        case 'warning': return '<i class="fas fa-exclamation-triangle"></i>';
        default: return '<i class="fas fa-info-circle"></i>';
    }
}

// Przykład użycia:
// showToast({ title: 'Sukces', message: 'Operacja zakończona', type: 'success' }); 

// DIAGNOSTICS
async function showDiagnostics() {
    gui.showLoading('Diagnostyka...', 'Trwa testowanie usług i wydajności');
    try {
        const res = await fetch('/api/system/diagnostics');
        const data = await res.json();
        gui.hideLoading();
        if (!data.success) {
            gui.showModal('Błąd diagnostyki', `<div style='color:#ef4444'>${data.error || 'Nie udało się pobrać wyników.'}</div>`);
            return;
        }
        const d = data.data;
        let html = `<div style='margin-bottom:15px;'><b>System:</b> ${d.system_info.platform} | <b>Python:</b> ${d.system_info.python_version} | <b>CPU:</b> ${d.system_info.processor}</div>`;
        html += `<div><b>Usługi:</b><ul>`;
        for (const [k, v] of Object.entries(d.service_tests)) {
            html += `<li>${k}: <span style='color:${v ? '#10b981' : '#ef4444'}'>${v ? 'OK' : 'BŁĄD'}</span></li>`;
        }
        html += `</ul></div>`;
        html += `<div><b>Połączenia:</b><ul>`;
        for (const [k, v] of Object.entries(d.connection_tests)) {
            html += `<li>${k}: <span style='color:${v ? '#10b981' : '#ef4444'}'>${v ? 'OK' : 'BŁĄD'}</span></li>`;
        }
        html += `</ul></div>`;
        html += `<div><b>Wydajność:</b><ul>`;
        for (const [k, v] of Object.entries(d.performance_tests)) {
            if (typeof v === 'boolean') continue;
            html += `<li>${k.replace('_percent','')}: <b>${v}%</b></li>`;
        }
        html += `</ul></div>`;
        if (d.recommendations && d.recommendations.length) {
            html += `<div style='margin-top:15px;'><b>Rekomendacje:</b><ul>`;
            d.recommendations.forEach(r => html += `<li style='color:#f59e0b'>${r}</li>`);
            html += `</ul></div>`;
        }
        gui.showModal('Diagnostyka systemu', html);
    } catch (e) {
        gui.hideLoading();
        gui.showModal('Błąd diagnostyki', `<div style='color:#ef4444'>${e.message}</div>`);
    }
}

// DOCKER CONTAINERS PANEL - Standalone function for backward compatibility
function showDockerContainers() {
    // Otwórz modal z tabelą kontenerów (możesz użyć istniejącego kodu modalnego)
    fetch('/api/docker/containers').then(res => res.json()).then(data => {
        let html = '<h3>Kontenery Docker</h3>';
        if (data && Array.isArray(data.containers) && data.containers.length > 0) {
            html += '<table class="docker-table"><thead><tr><th>Nazwa</th><th>Status</th><th>Obraz</th></tr></thead><tbody>';
            data.containers.forEach(c => {
                html += `<tr><td>${c.name}</td><td>${c.status}</td><td>${c.image}</td></tr>`;
            });
            html += '</tbody></table>';
        } else {
            html += '<p>Brak uruchomionych kontenerów.</p>';
        }
        showModal(html);
    }).catch(() => showModal('<p>Błąd pobierania listy kontenerów.</p>'));
}

// Standalone fetchStatus function for backward compatibility
async function fetchStatus() {
  try {
    const docker = await fetch('/api/docker/status').then(r => r.json());
    const tauri = await fetch('/api/system/tauri-status').then(r => r.json());
    
    const dockerStatusElement = document.getElementById('docker-status');
    const tauriStatusElement = document.getElementById('tauri-status');
    
    if (dockerStatusElement) {
      dockerStatusElement.innerHTML = 'Status: <span>' + (docker.success ? 'Aktywne' : 'Nieaktywne') + '</span>';
    }
    
    if (tauriStatusElement) {
      tauriStatusElement.innerHTML = 'Status: <span>' + (tauri.success && tauri.running ? 'Uruchomione' : 'Zatrzymane') + '</span>';
    }
  } catch (e) {
    const dockerStatusElement = document.getElementById('docker-status');
    const tauriStatusElement = document.getElementById('tauri-status');
    
    if (dockerStatusElement) {
      dockerStatusElement.innerHTML = 'Status: <span>Błąd</span>';
    }
    if (tauriStatusElement) {
      tauriStatusElement.innerHTML = 'Status: <span>Błąd</span>';
    }
  }
}

function showToast(msg) {
  if (typeof msg === 'string') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  } else {
    // Nowy format showToast z obiektem
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${msg.type || 'info'}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(msg.type)}</span>
        <div class="toast-content">
            <div class="toast-title">${msg.title || ''}</div>
            <div class="toast-message">${msg.message || ''}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, msg.timeout || 4000);
  }
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return '<i class="fas fa-check-circle"></i>';
        case 'error': return '<i class="fas fa-times-circle"></i>';
        case 'warning': return '<i class="fas fa-exclamation-triangle"></i>';
        default: return '<i class="fas fa-info-circle"></i>';
    }
}

async function action(url, successMsg) {
  try {
    const btns = document.querySelectorAll('button');
    btns.forEach(b => b.disabled = true);
    const res = await fetch(url, {method: 'POST'});
    const data = await res.json();
    if (data.success) showToast(successMsg);
    else showToast(data.message || 'Błąd');
    await fetchStatus();
  } catch (e) {
    showToast('Błąd połączenia');
  } finally {
    const btns = document.querySelectorAll('button');
    btns.forEach(b => b.disabled = false);
  }
}

document.getElementById('docker-start-btn').onclick = () => action('/api/docker/start-all', 'Wszystkie kontenery uruchomione');
document.getElementById('docker-stop-btn').onclick = () => action('/api/docker/stop-all', 'Wszystkie kontenery zatrzymane');
document.getElementById('docker-restart-btn').onclick = () => action('/api/docker/restart-all', 'Wszystkie kontenery zrestartowane');
document.getElementById('docker-rebuild-btn').onclick = () => action('/api/docker/rebuild-all', 'Wszystkie kontenery zrebuildowane');
document.getElementById('docker-manage-btn').onclick = () => showDockerManagement();
document.getElementById('tauri-start-btn').onclick = () => action('/api/system/start-tauri-dev', 'Tauri dev uruchomione');
document.getElementById('tauri-stop-btn').onclick = () => action('/api/system/stop-tauri-dev', 'Tauri dev zatrzymane');
document.getElementById('tauri-logs-btn').onclick = async () => {
  try {
    const res = await fetch('/api/system/tauri-logs');
    const data = await res.json();
    document.getElementById('tauri-logs-content').textContent = data.logs || 'Brak logów.';
    document.getElementById('tauri-logs-modal').style.display = 'block';
  } catch (e) {
    showToast('Błąd pobierania logów');
  }
};
document.getElementById('close-logs-modal').onclick = () => {
  document.getElementById('tauri-logs-modal').style.display = 'none';
};
window.onclick = function(event) {
  const modal = document.getElementById('tauri-logs-modal');
  if (event.target === modal) modal.style.display = 'none';
};
// Auto-refresh is now handled by the FoodSaveGUI class
// setInterval(fetchStatus, 4000);
// fetchStatus();

async function tryStartDocker() {
    try {
        const res = await fetch('/api/docker/start', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast({ title: 'Docker', message: data.message, type: 'success' });
            // Call the class method instead of standalone function
            setTimeout(() => {
                if (window.gui && window.gui.updateDockerStatusPanel) {
                    window.gui.updateDockerStatusPanel();
                }
            }, 2000);
        } else {
            showToast({ title: 'Docker', message: data.message || 'Błąd uruchamiania Dockera', type: 'error' });
        }
    } catch (e) {
        showToast({ title: 'Docker', message: 'Błąd połączenia z backendem', type: 'error' });
    }
}

// Nowe funkcje zarządzania kontenerami Docker
async function showDockerManagement() {
    try {
        const res = await fetch('/api/docker/containers');
        const data = await res.json();
        
        let html = `
            <div class="docker-management">
                <h3><i class="fab fa-docker"></i> Zarządzanie Kontenerami Docker</h3>
                <div class="docker-actions">
                    <button class="btn btn-success" onclick="dockerAction('start-all')">
                        <i class="fas fa-play"></i> Uruchom wszystkie
                    </button>
                    <button class="btn btn-warning" onclick="dockerAction('stop-all')">
                        <i class="fas fa-stop"></i> Zatrzymaj wszystkie
                    </button>
                    <button class="btn btn-info" onclick="dockerAction('restart-all')">
                        <i class="fas fa-redo"></i> Restartuj wszystkie
                    </button>
                    <button class="btn btn-secondary" onclick="dockerAction('rebuild-all')">
                        <i class="fas fa-hammer"></i> Rebuilduj wszystkie
                    </button>
                    <button class="btn btn-primary" onclick="showDockerSystemInfo()">
                        <i class="fas fa-info-circle"></i> Informacje systemowe
                    </button>
                </div>
                <div class="docker-status">
                    <h4>Status kontenerów:</h4>
                    <pre id="docker-status-output">Ładowanie...</pre>
                </div>
                <div class="docker-containers">
                    <h4>Lista kontenerów:</h4>
                    <div id="docker-containers-list">Ładowanie...</div>
                </div>
            </div>
        `;
        
        gui.showModal('Zarządzanie Docker', html);
        
        // Załaduj dane
        await loadDockerData();
        
    } catch (e) {
        gui.showModal('Błąd', `<div style='color:#ef4444'>Błąd ładowania danych Docker: ${e.message}</div>`);
    }
}

async function loadDockerData() {
    try {
        // Status kontenerów
        const statusRes = await fetch('/api/docker/status');
        const statusData = await statusRes.json();
        const statusOutput = document.getElementById('docker-status-output');
        if (statusOutput) {
            statusOutput.textContent = statusData.success ? statusData.details : 'Błąd pobierania statusu';
        }
        
        // Lista kontenerów
        const containersRes = await fetch('/api/docker/containers');
        const containersData = await containersRes.json();
        const containersList = document.getElementById('docker-containers-list');
        if (containersList) {
            if (containersData.success && containersData.data) {
                let containersHtml = '<div class="containers-grid">';
                containersData.data.forEach(container => {
                    const statusClass = container.Status.includes('Up') ? 'running' : 'stopped';
                    containersHtml += `
                        <div class="container-card ${statusClass}">
                            <div class="container-header">
                                <h5>${container.Names}</h5>
                                <span class="status-badge ${statusClass}">${container.Status}</span>
                            </div>
                            <div class="container-details">
                                <p><strong>Obraz:</strong> ${container.Image}</p>
                                <p><strong>Porty:</strong> ${container.Ports || 'Brak'}</p>
                                <p><strong>ID:</strong> ${container.ID}</p>
                            </div>
                            <div class="container-actions">
                                <button class="btn btn-sm btn-success" onclick="containerAction('start', '${container.ID}')">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="containerAction('stop', '${container.ID}')">
                                    <i class="fas fa-stop"></i>
                                </button>
                                <button class="btn btn-sm btn-info" onclick="containerAction('restart', '${container.ID}')">
                                    <i class="fas fa-redo"></i>
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="showContainerLogs('${container.ID}', '${container.Names}')">
                                    <i class="fas fa-file-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                containersHtml += '</div>';
                containersList.innerHTML = containersHtml;
            } else {
                containersList.innerHTML = '<p>Brak kontenerów lub błąd pobierania danych.</p>';
            }
        }
    } catch (e) {
        console.error('Błąd ładowania danych Docker:', e);
    }
}

async function dockerAction(action) {
    try {
        gui.showLoading(`Wykonywanie akcji: ${action}...`, 'Proszę czekać...');
        
        const res = await fetch(`/api/docker/${action}`, { method: 'POST' });
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            showToast({ 
                title: 'Docker', 
                message: data.message, 
                type: 'success' 
            });
            // Odśwież dane
            setTimeout(loadDockerData, 2000);
        } else {
            showToast({ 
                title: 'Docker', 
                message: data.message || 'Błąd wykonania akcji', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Docker', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function containerAction(action, containerId) {
    try {
        gui.showLoading(`Wykonywanie akcji ${action} na kontenerze...`, 'Proszę czekać...');
        
        const res = await fetch(`/api/docker/container/${action}`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ container_id: containerId })
        });
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            showToast({ 
                title: 'Kontener', 
                message: data.message, 
                type: 'success' 
            });
            // Odśwież dane
            setTimeout(loadDockerData, 2000);
        } else {
            showToast({ 
                title: 'Kontener', 
                message: data.message || 'Błąd wykonania akcji', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Kontener', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function showContainerLogs(containerId, containerName) {
    try {
        gui.showLoading('Pobieranie logów...', 'Proszę czekać...');
        
        const res = await fetch(`/api/docker/container/logs/${containerId}?lines=200`);
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            let html = `
                <div class="container-logs">
                    <h4><i class="fas fa-file-alt"></i> Logi kontenera: ${containerName}</h4>
                    <div class="logs-controls">
                        <button class="btn btn-sm btn-secondary" onclick="refreshContainerLogs('${containerId}', '${containerName}')">
                            <i class="fas fa-sync"></i> Odśwież
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="exportContainerLogs('${containerId}', '${containerName}')">
                            <i class="fas fa-download"></i> Eksportuj
                        </button>
                    </div>
                    <div class="logs-content">
                        <pre id="container-logs-content">${data.details || 'Brak logów'}</pre>
                    </div>
                </div>
            `;
            
            gui.showModal(`Logi kontenera: ${containerName}`, html);
        } else {
            showToast({ 
                title: 'Logi', 
                message: data.message || 'Błąd pobierania logów', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Logi', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function showDockerSystemInfo() {
    try {
        gui.showLoading('Pobieranie informacji systemowych...', 'Proszę czekać...');
        
        const res = await fetch('/api/docker/system-info');
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            let html = `
                <div class="docker-system-info">
                    <h4><i class="fas fa-info-circle"></i> Informacje o systemie Docker</h4>
                    <div class="info-section">
                        <h5>Informacje systemowe:</h5>
                        <pre>${data.details.info || 'Brak danych'}</pre>
                    </div>
                    <div class="info-section">
                        <h5>Użycie dysku:</h5>
                        <pre>${data.details.disk_usage || 'Brak danych'}</pre>
                    </div>
                </div>
            `;
            
            gui.showModal('Informacje o systemie Docker', html);
        } else {
            showToast({ 
                title: 'Docker', 
                message: data.message || 'Błąd pobierania informacji', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Docker', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function refreshContainerLogs(containerId, containerName) {
    try {
        const res = await fetch(`/api/docker/container/logs/${containerId}?lines=200`);
        const data = await res.json();
        
        const logsContent = document.getElementById('container-logs-content');
        if (logsContent) {
            logsContent.textContent = data.success ? (data.details || 'Brak logów') : 'Błąd pobierania logów';
        }
    } catch (e) {
        showToast({ 
            title: 'Logi', 
            message: 'Błąd odświeżania logów', 
            type: 'error' 
        });
    }
}

function exportContainerLogs(containerId, containerName) {
    // Implementacja eksportu logów do pliku
    showToast({ 
        title: 'Eksport', 
        message: 'Funkcja eksportu w trakcie implementacji', 
        type: 'info' 
    });
}

// Nowe funkcje zarządzania kontenerami Docker
async function showDockerManagement() {
    try {
        const res = await fetch('/api/docker/containers');
        const data = await res.json();
        
        let html = `
            <div class="docker-management">
                <h3><i class="fab fa-docker"></i> Zarządzanie Kontenerami Docker</h3>
                <div class="docker-actions">
                    <button class="btn btn-success" onclick="dockerAction('start-all')">
                        <i class="fas fa-play"></i> Uruchom wszystkie
                    </button>
                    <button class="btn btn-warning" onclick="dockerAction('stop-all')">
                        <i class="fas fa-stop"></i> Zatrzymaj wszystkie
                    </button>
                    <button class="btn btn-info" onclick="dockerAction('restart-all')">
                        <i class="fas fa-redo"></i> Restartuj wszystkie
                    </button>
                    <button class="btn btn-secondary" onclick="dockerAction('rebuild-all')">
                        <i class="fas fa-hammer"></i> Rebuilduj wszystkie
                    </button>
                    <button class="btn btn-primary" onclick="showDockerSystemInfo()">
                        <i class="fas fa-info-circle"></i> Informacje systemowe
                    </button>
                </div>
                <div class="docker-status">
                    <h4>Status kontenerów:</h4>
                    <pre id="docker-status-output">Ładowanie...</pre>
                </div>
                <div class="docker-containers">
                    <h4>Lista kontenerów:</h4>
                    <div id="docker-containers-list">Ładowanie...</div>
                </div>
            </div>
        `;
        
        gui.showModal('Zarządzanie Docker', html);
        
        // Załaduj dane
        await loadDockerData();
        
    } catch (e) {
        gui.showModal('Błąd', `<div style='color:#ef4444'>Błąd ładowania danych Docker: ${e.message}</div>`);
    }
}

async function loadDockerData() {
    try {
        // Status kontenerów
        const statusRes = await fetch('/api/docker/status');
        const statusData = await statusRes.json();
        const statusOutput = document.getElementById('docker-status-output');
        if (statusOutput) {
            statusOutput.textContent = statusData.success ? statusData.details : 'Błąd pobierania statusu';
        }
        
        // Lista kontenerów
        const containersRes = await fetch('/api/docker/containers');
        const containersData = await containersRes.json();
        const containersList = document.getElementById('docker-containers-list');
        if (containersList) {
            if (containersData.success && containersData.data) {
                let containersHtml = '<div class="containers-grid">';
                containersData.data.forEach(container => {
                    const statusClass = container.Status.includes('Up') ? 'running' : 'stopped';
                    containersHtml += `
                        <div class="container-card ${statusClass}">
                            <div class="container-header">
                                <h5>${container.Names}</h5>
                                <span class="status-badge ${statusClass}">${container.Status}</span>
                            </div>
                            <div class="container-details">
                                <p><strong>Obraz:</strong> ${container.Image}</p>
                                <p><strong>Porty:</strong> ${container.Ports || 'Brak'}</p>
                                <p><strong>ID:</strong> ${container.ID}</p>
                            </div>
                            <div class="container-actions">
                                <button class="btn btn-sm btn-success" onclick="containerAction('start', '${container.ID}')">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="containerAction('stop', '${container.ID}')">
                                    <i class="fas fa-stop"></i>
                                </button>
                                <button class="btn btn-sm btn-info" onclick="containerAction('restart', '${container.ID}')">
                                    <i class="fas fa-redo"></i>
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="showContainerLogs('${container.ID}', '${container.Names}')">
                                    <i class="fas fa-file-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                containersHtml += '</div>';
                containersList.innerHTML = containersHtml;
            } else {
                containersList.innerHTML = '<p>Brak kontenerów lub błąd pobierania danych.</p>';
            }
        }
    } catch (e) {
        console.error('Błąd ładowania danych Docker:', e);
    }
}

async function dockerAction(action) {
    try {
        gui.showLoading(`Wykonywanie akcji: ${action}...`, 'Proszę czekać...');
        
        const res = await fetch(`/api/docker/${action}`, { method: 'POST' });
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            showToast({ 
                title: 'Docker', 
                message: data.message, 
                type: 'success' 
            });
            // Odśwież dane
            setTimeout(loadDockerData, 2000);
        } else {
            showToast({ 
                title: 'Docker', 
                message: data.message || 'Błąd wykonania akcji', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Docker', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function containerAction(action, containerId) {
    try {
        gui.showLoading(`Wykonywanie akcji ${action} na kontenerze...`, 'Proszę czekać...');
        
        const res = await fetch(`/api/docker/container/${action}`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ container_id: containerId })
        });
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            showToast({ 
                title: 'Kontener', 
                message: data.message, 
                type: 'success' 
            });
            // Odśwież dane
            setTimeout(loadDockerData, 2000);
        } else {
            showToast({ 
                title: 'Kontener', 
                message: data.message || 'Błąd wykonania akcji', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Kontener', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function showContainerLogs(containerId, containerName) {
    try {
        gui.showLoading('Pobieranie logów...', 'Proszę czekać...');
        
        const res = await fetch(`/api/docker/container/logs/${containerId}?lines=200`);
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            let html = `
                <div class="container-logs">
                    <h4><i class="fas fa-file-alt"></i> Logi kontenera: ${containerName}</h4>
                    <div class="logs-controls">
                        <button class="btn btn-sm btn-secondary" onclick="refreshContainerLogs('${containerId}', '${containerName}')">
                            <i class="fas fa-sync"></i> Odśwież
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="exportContainerLogs('${containerId}', '${containerName}')">
                            <i class="fas fa-download"></i> Eksportuj
                        </button>
                    </div>
                    <div class="logs-content">
                        <pre id="container-logs-content">${data.details || 'Brak logów'}</pre>
                    </div>
                </div>
            `;
            
            gui.showModal(`Logi kontenera: ${containerName}`, html);
        } else {
            showToast({ 
                title: 'Logi', 
                message: data.message || 'Błąd pobierania logów', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Logi', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function showDockerSystemInfo() {
    try {
        gui.showLoading('Pobieranie informacji systemowych...', 'Proszę czekać...');
        
        const res = await fetch('/api/docker/system-info');
        const data = await res.json();
        
        gui.hideLoading();
        
        if (data.success) {
            let html = `
                <div class="docker-system-info">
                    <h4><i class="fas fa-info-circle"></i> Informacje o systemie Docker</h4>
                    <div class="info-section">
                        <h5>Informacje systemowe:</h5>
                        <pre>${data.details.info || 'Brak danych'}</pre>
                    </div>
                    <div class="info-section">
                        <h5>Użycie dysku:</h5>
                        <pre>${data.details.disk_usage || 'Brak danych'}</pre>
                    </div>
                </div>
            `;
            
            gui.showModal('Informacje o systemie Docker', html);
        } else {
            showToast({ 
                title: 'Docker', 
                message: data.message || 'Błąd pobierania informacji', 
                type: 'error' 
            });
        }
    } catch (e) {
        gui.hideLoading();
        showToast({ 
            title: 'Docker', 
            message: 'Błąd połączenia z backendem', 
            type: 'error' 
        });
    }
}

async function refreshContainerLogs(containerId, containerName) {
    try {
        const res = await fetch(`/api/docker/container/logs/${containerId}?lines=200`);
        const data = await res.json();
        
        const logsContent = document.getElementById('container-logs-content');
        if (logsContent) {
            logsContent.textContent = data.success ? (data.details || 'Brak logów') : 'Błąd pobierania logów';
        }
    } catch (e) {
        showToast({ 
            title: 'Logi', 
            message: 'Błąd odświeżania logów', 
            type: 'error' 
        });
    }
}

function exportContainerLogs(containerId, containerName) {
    // Implementacja eksportu logów do pliku
    showToast({ 
        title: 'Eksport', 
        message: 'Funkcja eksportu w trakcie implementacji', 
        type: 'info' 
    });
}
