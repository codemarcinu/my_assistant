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
            await this.checkBackendStatus();
            await this.checkFrontendStatus();
            await this.checkDatabaseStatus();
            await this.checkAIStatus();
        } catch (error) {
            console.error('Error refreshing status:', error);
        }
    }

    async checkBackendStatus() {
        const statusCard = document.getElementById('backend-status');
        const statusText = statusCard.querySelector('.status-text');
        
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
        const statusText = statusCard.querySelector('.status-text');
        
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
        const statusText = statusCard.querySelector('.status-text');
        
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
        const statusText = statusCard.querySelector('.status-text');
        
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
        // Remove all status classes
        card.classList.remove('online', 'offline', 'warning');
        
        // Add new status class
        card.classList.add(status);
        
        // Update text
        const statusText = card.querySelector('.status-text');
        statusText.textContent = text;
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
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingDescription').textContent = description;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    // Modal Management
    showModal(title, content, footerButtons = []) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        
        const footer = document.getElementById('modalFooter');
        footer.innerHTML = '';
        
        if (footerButtons.length === 0) {
            footer.innerHTML = '<button class="btn btn-secondary" onclick="gui.closeModal()">Zamknij</button>';
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
        this.showLoading('Uruchamiam tryb deweloperski Tauri...', 'To może potrwać kilka minut');
        
        try {
            const response = await fetch('/api/system/start-tauri-dev', {
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
                        <h3>Tryb deweloperski Tauri uruchomiony!</h3>
                        <p>Aplikacja działa w trybie deweloperskim z hot-reload.</p>
                        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <h4 style="margin: 0 0 10px 0; color: #2980b9;">💡 Co to oznacza:</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #34495e; font-size: 14px;">
                                <li><strong>Hot Reload:</strong> Zmiany w kodzie automatycznie odświeżają aplikację</li>
                                <li><strong>Debug Mode:</strong> Pełne logi i informacje debugowania</li>
                                <li><strong>Dev Tools:</strong> Dostęp do narzędzi deweloperskich</li>
                                <li><strong>Live Updates:</strong> Natychmiastowe odzwierciedlenie zmian</li>
                            </ul>
                        </div>
                    </div>
                    `,
                    [
                        {
                            text: 'Pokaż logi',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.showLogs();
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
                    <h3>Nie udało się uruchomić trybu deweloperskiego</h3>
                    <p>${error.message}</p>
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #856404;">🔧 Możliwe rozwiązania:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px;">
                            <li>Sprawdź czy Node.js i npm są zainstalowane</li>
                            <li>Sprawdź czy katalog myappassistant-chat-frontend istnieje</li>
                            <li>Sprawdź czy package.json zawiera skrypt "tauri dev"</li>
                            <li>Sprawdź logi systemowe</li>
                        </ul>
                    </div>
                </div>
                `,
                [
                    {
                        text: 'Sprawdź środowisko',
                        class: 'btn-primary',
                        onclick: () => {
                            this.closeModal();
                            this.checkEnvironment();
                        }
                    },
                    {
                        text: 'Pokaż logi',
                        class: 'btn-secondary',
                        onclick: () => {
                            this.closeModal();
                            this.showLogs();
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
        this.showLoading('Ładuję logi...', 'Pobieram najnowsze logi systemowe');
        
        try {
            const response = await fetch('/api/system/logs', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showModal(
                    '📝 Logi Systemowe',
                    `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">💡 Jak czytać logi:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #34495e; font-size: 14px;">
                            <li><strong>ERROR</strong> - Błąd wymagający naprawy</li>
                            <li><strong>WARN</strong> - Ostrzeżenie, ale system może działać</li>
                            <li><strong>INFO</strong> - Informacja o normalnym działaniu</li>
                            <li><strong>DEBUG</strong> - Szczegółowe informacje dla programistów</li>
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                            <button class="btn btn-secondary" onclick="gui.showLogsByType('backend')">🔧 Backend</button>
                            <button class="btn btn-secondary" onclick="gui.showLogsByType('frontend')">🌐 Frontend</button>
                            <button class="btn btn-secondary" onclick="gui.showLogsByType('docker')">🐳 Docker</button>
                            <button class="btn btn-primary" onclick="gui.showLogsByType('all')">📋 Wszystkie</button>
                        </div>
                    </div>
                    
                    <div style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; max-height: 400px; overflow-y: auto;">
                        <div style="white-space: pre-wrap;">${result.logs || 'Brak logów do wyświetlenia'}</div>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #2980b9;">🔍 Co szukać w logach:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #34495e; font-size: 14px;">
                            <li><strong>Błędy połączenia:</strong> "Connection refused", "Timeout"</li>
                            <li><strong>Błędy uprawnień:</strong> "Permission denied", "Access denied"</li>
                            <li><strong>Błędy portów:</strong> "Address already in use", "Port busy"</li>
                            <li><strong>Błędy bazy danych:</strong> "Database connection failed"</li>
                        </ul>
                    </div>
                    `,
                    [
                        {
                            text: '🔄 Odśwież logi',
                            class: 'btn-primary',
                            onclick: () => {
                                this.closeModal();
                                this.showLogs();
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
                '❌ Błąd Ładowania Logów',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się załadować logów</h3>
                    <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: left; margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🔍 Możliwe przyczyny:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>System nie jest uruchomiony:</strong> Logi są dostępne tylko gdy system działa</li>
                            <li><strong>Brak uprawnień:</strong> GUI może nie mieć dostępu do plików logów</li>
                            <li><strong>Pliki logów nie istnieją:</strong> System może nie tworzyć logów</li>
                            <li><strong>Problem z serwerem GUI:</strong> Serwer GUI może nie działać poprawnie</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #2980b9;">🔧 Co możesz zrobić:</h4>
                        <ol style="margin: 0; padding-left: 20px; color: #34495e;">
                            <li><strong>Sprawdź czy system działa:</strong> Użyj opcji "Sprawdź status systemu"</li>
                            <li><strong>Uruchom system:</strong> Jeśli nie działa, uruchom go najpierw</li>
                            <li><strong>Sprawdź uprawnienia:</strong> Upewnij się, że GUI ma dostęp do plików</li>
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

    async showLogsByType(type) {
        this.showLoading('Ładuję logi...', `Pobieram logi typu: ${type}`);
        
        try {
            const response = await fetch(`/api/system/logs/${type}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                const modalBody = document.getElementById('modalBody');
                modalBody.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <button class="btn btn-secondary" onclick="gui.showLogsByType('backend')">Backend</button>
                            <button class="btn btn-secondary" onclick="gui.showLogsByType('frontend')">Frontend</button>
                            <button class="btn btn-secondary" onclick="gui.showLogsByType('docker')">Docker</button>
                            <button class="btn btn-secondary" onclick="gui.showLogsByType('all')">Wszystkie</button>
                        </div>
                    </div>
                    <div class="logs-container">
${result.logs || 'Brak logów do wyświetlenia'}
                    </div>
                `;
            } else {
                throw new Error(result.error || 'Nieznany błąd');
            }
        } catch (error) {
            this.showModal(
                'Błąd',
                `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3>Nie udało się załadować logów</h3>
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
                            <li><strong>Sprawdź porty:</strong> Upewnij się, że porty 8000, 3000, 5432 są wolne</li>
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
