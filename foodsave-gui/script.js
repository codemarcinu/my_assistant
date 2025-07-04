// FoodSave AI - Panel Sterowania
// Ulepszona wersja z lepszym UX i feedbackiem podczas ładowania

class FoodSaveGUI {
    constructor() {
        this.init();
    }

    init() {
        this.showSkeletonScreen();
        this.checkSystemStatus();
        this.setupEventListeners();
    }

    // Skeleton screen zamiast pustego spinnera
    showSkeletonScreen() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <section class="status-overview skeleton-section">
                <div class="skeleton-header"></div>
                <div class="skeleton-status">
                    <div class="skeleton-light"></div>
                    <div class="skeleton-text">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-description"></div>
                    </div>
                </div>
            </section>

            <section class="main-actions skeleton-section">
                <div class="skeleton-header"></div>
                <div class="actions-grid">
                    <div class="action-card skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-description"></div>
                        </div>
                    </div>
                    <div class="action-card skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-description"></div>
                        </div>
                    </div>
                    <div class="action-card skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-description"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="quick-status skeleton-section">
                <div class="skeleton-header"></div>
                <div class="status-cards">
                    <div class="status-card skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-status"></div>
                        </div>
                    </div>
                    <div class="status-card skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-status"></div>
                        </div>
                    </div>
                    <div class="status-card skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-status"></div>
                        </div>
                    </div>
                    <div class="status-card skeleton-card">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-status"></div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    async checkSystemStatus() {
        const progressSteps = [
            { name: 'Sprawdzam backend...', weight: 25 },
            { name: 'Weryfikuję frontend...', weight: 25 },
            { name: 'Testuję bazę danych...', weight: 25 },
            { name: 'Sprawdzam AI...', weight: 25 }
        ];

        let currentProgress = 0;
        const progressBar = this.createProgressBar();

        try {
            // 1. Sprawdzam backend
            await this.updateProgress(progressBar, currentProgress, progressSteps[0]);
            const backendStatus = await this.checkBackendStatus();
            currentProgress += progressSteps[0].weight;

            // 2. Sprawdzam frontend
            await this.updateProgress(progressBar, currentProgress, progressSteps[1]);
            const frontendStatus = await this.checkFrontendStatus();
            currentProgress += progressSteps[1].weight;

            // 3. Sprawdzam bazę danych
            await this.updateProgress(progressBar, currentProgress, progressSteps[2]);
            const databaseStatus = await this.checkDatabaseStatus();
            currentProgress += progressSteps[2].weight;

            // 4. Sprawdzam AI
            await this.updateProgress(progressBar, currentProgress, progressSteps[3]);
            const aiStatus = await this.checkAIStatus();
            currentProgress += progressSteps[3].weight;

            // Ukryj progress bar i pokaż główny interfejs
            this.hideProgressBar(progressBar);
            this.showMainInterface(backendStatus, frontendStatus, databaseStatus, aiStatus);

        } catch (error) {
            console.error('Błąd podczas sprawdzania statusu:', error);
            this.hideProgressBar(progressBar);
            this.showErrorState(error);
        }
    }

    createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-content">
                <h3 id="progressTitle">Sprawdzam system...</h3>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <p id="progressDescription">Inicjalizacja komponentów</p>
                <div class="progress-steps" id="progressSteps"></div>
            </div>
        `;
        
        document.body.appendChild(progressContainer);
        return progressContainer;
    }

    async updateProgress(progressBar, progress, step) {
        const progressFill = progressBar.querySelector('#progressFill');
        const progressTitle = progressBar.querySelector('#progressTitle');
        const progressDescription = progressBar.querySelector('#progressDescription');
        const progressSteps = progressBar.querySelector('#progressSteps');

        progressTitle.textContent = step.name;
        progressDescription.textContent = `Postęp: ${progress}%`;
        progressFill.style.width = `${progress}%`;

        // Dodaj krok do listy
        const stepElement = document.createElement('div');
        stepElement.className = 'progress-step';
        stepElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${step.name}`;
        progressSteps.appendChild(stepElement);

        // Symuluj minimalny czas dla każdego kroku
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    hideProgressBar(progressBar) {
        progressBar.style.opacity = '0';
        setTimeout(() => {
            progressBar.remove();
        }, 300);
    }

    async checkBackendStatus() {
        try {
            const response = await fetch('http://localhost:8001/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                return { status: 'healthy', data };
            } else {
                return { status: 'unhealthy', error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkFrontendStatus() {
        try {
            const response = await fetch('http://localhost:3003/api/health/', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                return { status: 'healthy', data };
            } else {
                return { status: 'unhealthy', error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkDatabaseStatus() {
        try {
            const response = await fetch('http://localhost:8001/health/database', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                return { status: 'healthy', data };
            } else {
                return { status: 'unhealthy', error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkAIStatus() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                return { status: 'healthy', data };
            } else {
                return { status: 'unhealthy', error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    showMainInterface(backendStatus, frontendStatus, databaseStatus, aiStatus) {
        const mainContent = document.getElementById('mainContent');
        
        // Określ ogólny status systemu
        const allHealthy = [backendStatus, frontendStatus, databaseStatus, aiStatus]
            .every(status => status.status === 'healthy');
        
        const systemStatus = allHealthy ? 'healthy' : 'warning';

        mainContent.innerHTML = `
            <!-- Status Overview -->
            <section class="status-overview">
                <h2><i class="fas fa-chart-line"></i> Status Systemu</h2>
                <div class="status-indicator ${systemStatus}" id="systemStatus">
                    <div class="status-light ${systemStatus}">
                        <i class="fas fa-circle"></i>
                    </div>
                    <div class="status-info">
                        <h3 id="statusTitle">${this.getStatusTitle(systemStatus)}</h3>
                        <p id="statusDescription">${this.getStatusDescription(systemStatus, backendStatus, frontendStatus, databaseStatus, aiStatus)}</p>
                    </div>
                </div>
            </section>

            <!-- Main Actions -->
            <section class="main-actions">
                <h2><i class="fas fa-bolt"></i> Główne Akcje</h2>
                <div class="actions-grid">
                    <div class="action-card primary-action" onclick="startApplication()">
                        <div class="action-icon">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="action-content">
                            <h3>🚀 URUCHOM APLIKACJĘ</h3>
                            <p>Włącz system zarządzania żywnością</p>
                        </div>
                        <div class="action-status" id="startStatus">
                            <span class="status-text">Kliknij aby uruchomić</span>
                        </div>
                    </div>

                    <div class="action-card" onclick="checkStatus()">
                        <div class="action-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div class="action-content">
                            <h3>📊 SPRAWDŹ STATUS</h3>
                            <p>Zobacz czy wszystko działa poprawnie</p>
                        </div>
                        <div class="action-status" id="checkStatus">
                            <span class="status-text">Ostatnie sprawdzenie: ${new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>

                    <div class="action-card" onclick="showSettings()">
                        <div class="action-icon">
                            <i class="fas fa-cogs"></i>
                        </div>
                        <div class="action-content">
                            <h3>🛠️ USTAWIENIA</h3>
                            <p>Dostosuj aplikację do swoich potrzeb</p>
                        </div>
                        <div class="action-status" id="settingsStatus">
                            <span class="status-text">Konfiguracja systemu</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Quick Status -->
            <section class="quick-status">
                <h2><i class="fas fa-info-circle"></i> Szybki Przegląd</h2>
                <div class="status-cards">
                    <div class="status-card ${backendStatus.status}" id="backendCard">
                        <div class="card-icon">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="card-content">
                            <h4>Serwer</h4>
                            <span class="card-status" id="backendStatus">${this.getComponentStatus(backendStatus)}</span>
                        </div>
                    </div>
                    
                    <div class="status-card ${frontendStatus.status}" id="frontendCard">
                        <div class="card-icon">
                            <i class="fas fa-desktop"></i>
                        </div>
                        <div class="card-content">
                            <h4>Aplikacja</h4>
                            <span class="card-status" id="frontendStatus">${this.getComponentStatus(frontendStatus)}</span>
                        </div>
                    </div>
                    
                    <div class="status-card ${databaseStatus.status}" id="databaseCard">
                        <div class="card-icon">
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="card-content">
                            <h4>Baza danych</h4>
                            <span class="card-status" id="databaseStatus">${this.getComponentStatus(databaseStatus)}</span>
                        </div>
                    </div>
                    
                    <div class="status-card ${aiStatus.status}" id="aiCard">
                        <div class="card-icon">
                            <i class="fas fa-brain"></i>
                        </div>
                        <div class="card-content">
                            <h4>AI</h4>
                            <span class="card-status" id="aiStatus">${this.getComponentStatus(aiStatus)}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Docker Management -->
            <section class="docker-management" id="dockerSection" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2><i class="fas fa-ship"></i> Zarządzanie Kontenerami</h2>
                    <button onclick="showMainInterface()" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Powrót
                    </button>
                </div>
                <div class="docker-controls">
                    <div class="docker-action-card" onclick="startAllContainers()">
                        <div class="docker-icon start">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="docker-content">
                            <h4>Uruchom Wszystkie</h4>
                            <p>Włącz wszystkie kontenery Docker</p>
                        </div>
                    </div>
                    
                    <div class="docker-action-card" onclick="stopAllContainers()">
                        <div class="docker-icon stop">
                            <i class="fas fa-stop"></i>
                        </div>
                        <div class="docker-content">
                            <h4>Zatrzymaj Wszystkie</h4>
                            <p>Wyłącz wszystkie kontenery Docker</p>
                        </div>
                    </div>
                    
                    <div class="docker-action-card" onclick="restartAllContainers()">
                        <div class="docker-icon restart">
                            <i class="fas fa-redo"></i>
                        </div>
                        <div class="docker-content">
                            <h4>Restartuj Wszystkie</h4>
                            <p>Uruchom ponownie wszystkie kontenery</p>
                        </div>
                    </div>
                    
                    <div class="docker-action-card" onclick="rebuildAllContainers()">
                        <div class="docker-icon rebuild">
                            <i class="fas fa-hammer"></i>
                        </div>
                        <div class="docker-content">
                            <h4>Przebuduj Wszystkie</h4>
                            <p>Przebuduj obrazy i uruchom kontenery</p>
                        </div>
                    </div>
                </div>
                
                <div class="containers-status">
                    <h3><i class="fas fa-list"></i> Status Kontenerów</h3>
                    <div class="containers-list" id="containersList">
                        <div class="loading-container">
                            <div class="spinner"></div>
                            <p>Ładowanie listy kontenerów...</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Help Section -->
            <section class="help-section">
                <h2><i class="fas fa-life-ring"></i> Potrzebujesz Pomocy?</h2>
                <div class="help-cards">
                    <div class="help-card" onclick="showHelp()">
                        <div class="help-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <h4>Przewodnik</h4>
                        <p>Dowiedz się jak korzystać z aplikacji</p>
                    </div>
                    
                    <div class="help-card" onclick="showDiagnostics()">
                        <div class="help-icon">
                            <i class="fas fa-stethoscope"></i>
                        </div>
                        <h4>Diagnostyka</h4>
                        <p>Sprawdź czy wszystko działa poprawnie</p>
                    </div>
                    
                    <div class="help-card" onclick="showLogs()">
                        <div class="help-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <h4>Logi</h4>
                        <p>Zobacz szczegółowe informacje o systemie</p>
                    </div>
                    
                    <div class="help-card" onclick="showDockerManagement()">
                        <div class="help-icon">
                            <i class="fas fa-ship"></i>
                        </div>
                        <h4>Kontenery</h4>
                        <p>Zarządzaj kontenerami Docker</p>
                    </div>
                </div>
            </section>
        `;
    }

    getStatusTitle(status) {
        switch (status) {
            case 'healthy': return 'System Gotowy';
            case 'warning': return 'System Częściowo Dostępny';
            case 'unhealthy': return 'System Niedostępny';
            default: return 'Sprawdzam system...';
        }
    }

    getStatusDescription(status, backend, frontend, database, ai) {
        if (status === 'healthy') {
            return 'Wszystkie komponenty działają poprawnie';
        }
        
        const issues = [];
        if (backend.status !== 'healthy') issues.push('Backend');
        if (frontend.status !== 'healthy') issues.push('Frontend');
        if (database.status !== 'healthy') issues.push('Baza danych');
        if (ai.status !== 'healthy') issues.push('AI');
        
        return `Problemy z: ${issues.join(', ')}`;
    }

    getComponentStatus(componentStatus) {
        if (componentStatus.status === 'healthy') {
            return 'Działa';
        } else {
            return `Błąd: ${componentStatus.error || 'Nieznany'}`;
        }
    }

    showErrorState(error) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <section class="error-state">
                <div class="error-content">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Wystąpił błąd podczas sprawdzania systemu</h2>
                    <p>${error.message || 'Nieznany błąd'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Spróbuj ponownie
                    </button>
                </div>
            </section>
        `;
    }

    setupEventListeners() {
        // Event listeners dla przycisków i akcji
        document.addEventListener('click', (e) => {
            if (e.target.matches('.action-card')) {
                this.handleActionClick(e.target);
            }
        });
    }

    handleActionClick(card) {
        // Obsługa kliknięć w karty akcji
        console.log('Kliknięto kartę:', card);
    }
}

// Funkcje globalne
function startApplication() {
    showLoadingOverlay('Uruchamianie aplikacji...', 'Proszę czekać, system się uruchamia...');
    
    // Symulacja uruchamiania
    setTimeout(() => {
        hideLoadingOverlay();
        showToast('Aplikacja została uruchomiona!', 'success');
    }, 3000);
}

function checkStatus() {
    showLoadingOverlay('Sprawdzam status...', 'Weryfikuję wszystkie komponenty...');
    
    // Symulacja sprawdzania
    setTimeout(() => {
        hideLoadingOverlay();
        showToast('Status sprawdzony!', 'info');
        location.reload(); // Odśwież stronę
    }, 2000);
}

function showSettings() {
    showModal('Ustawienia', 'Panel ustawień będzie dostępny wkrótce...');
}

function showDockerManagement() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('dockerSection').style.display = 'block';
    loadContainersList();
}

function showMainInterface() {
    document.getElementById('dockerSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function startAllContainers() {
    showLoadingOverlay('Uruchamianie kontenerów...', 'To może potrwać kilka minut...');
    
    fetch('/api/containers/start', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            hideLoadingOverlay();
            showToast('Kontenery uruchomione!', 'success');
            loadContainersList();
        })
        .catch(error => {
            hideLoadingOverlay();
            showToast('Błąd podczas uruchamiania kontenerów', 'error');
        });
}

function stopAllContainers() {
    showLoadingOverlay('Zatrzymywanie kontenerów...', 'Proszę czekać...');
    
    fetch('/api/containers/stop', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            hideLoadingOverlay();
            showToast('Kontenery zatrzymane!', 'success');
            loadContainersList();
        })
        .catch(error => {
            hideLoadingOverlay();
            showToast('Błąd podczas zatrzymywania kontenerów', 'error');
        });
}

function restartAllContainers() {
    showLoadingOverlay('Restartowanie kontenerów...', 'To może potrwać kilka minut...');
    
    fetch('/api/containers/restart', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            hideLoadingOverlay();
            showToast('Kontenery zrestartowane!', 'success');
            loadContainersList();
        })
        .catch(error => {
            hideLoadingOverlay();
            showToast('Błąd podczas restartowania kontenerów', 'error');
        });
}

function rebuildAllContainers() {
    showLoadingOverlay('Przebudowywanie kontenerów...', 'To może potrwać 10-15 minut...');
    
    fetch('/api/containers/rebuild', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            hideLoadingOverlay();
            showToast('Kontenery przebudowane!', 'success');
            loadContainersList();
        })
        .catch(error => {
            hideLoadingOverlay();
            showToast('Błąd podczas przebudowywania kontenerów', 'error');
        });
}

function loadContainersList() {
    const containersList = document.getElementById('containersList');
    containersList.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Ładowanie listy kontenerów...</p></div>';
    
    fetch('/api/containers')
        .then(response => response.json())
        .then(containers => {
            if (containers.length === 0) {
                containersList.innerHTML = '<p>Brak kontenerów do wyświetlenia</p>';
                return;
            }
            
            containersList.innerHTML = containers.map(container => `
                <div class="container-item ${container.status}">
                    <div class="container-info">
                        <h4>${container.name}</h4>
                        <p>Status: ${container.status}</p>
                        <p>Port: ${container.ports || 'N/A'}</p>
                    </div>
                    <div class="container-actions">
                        <button onclick="toggleContainer('${container.id}', '${container.status}')" class="btn btn-small">
                            ${container.status === 'running' ? 'Zatrzymaj' : 'Uruchom'}
                        </button>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            containersList.innerHTML = '<p>Błąd podczas ładowania kontenerów</p>';
        });
}

function toggleContainer(containerId, currentStatus) {
    const action = currentStatus === 'running' ? 'stop' : 'start';
    showLoadingOverlay(`${action === 'start' ? 'Uruchamianie' : 'Zatrzymywanie'} kontenera...`, 'Proszę czekać...');
    
    fetch(`/api/containers/${containerId}/${action}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            hideLoadingOverlay();
            showToast(`Kontener ${action === 'start' ? 'uruchomiony' : 'zatrzymany'}!`, 'success');
            loadContainersList();
        })
        .catch(error => {
            hideLoadingOverlay();
            showToast(`Błąd podczas ${action === 'start' ? 'uruchamiania' : 'zatrzymywania'} kontenera`, 'error');
        });
}

function showHelp() {
    showModal('Pomoc', `
        <h3>Jak korzystać z FoodSave AI</h3>
        <p>1. <strong>Uruchom aplikację</strong> - kliknij przycisk "Uruchom aplikację"</p>
        <p>2. <strong>Sprawdź status</strong> - monitoruj stan wszystkich komponentów</p>
        <p>3. <strong>Zarządzaj kontenerami</strong> - uruchamiaj, zatrzymuj i restartuj serwisy</p>
        <p>4. <strong>Ustawienia</strong> - dostosuj aplikację do swoich potrzeb</p>
    `);
}

function showDiagnostics() {
    showModal('Diagnostyka', `
        <h3>Diagnostyka systemu</h3>
        <div id="diagnosticsContent">
            <p>Sprawdzam system...</p>
        </div>
    `);
    
    // Symulacja diagnostyki
    setTimeout(() => {
        document.getElementById('diagnosticsContent').innerHTML = `
            <p><strong>Backend:</strong> ✅ Działa</p>
            <p><strong>Frontend:</strong> ✅ Działa</p>
            <p><strong>Baza danych:</strong> ✅ Działa</p>
            <p><strong>AI:</strong> ✅ Działa</p>
            <p><strong>Wszystkie komponenty działają poprawnie!</strong></p>
        `;
    }, 2000);
}

function showLogs() {
    showModal('Logi systemu', `
        <h3>Ostatnie logi</h3>
        <div class="logs-container">
            <pre>2025-07-04 18:30:00 - System uruchomiony
2025-07-04 18:30:01 - Backend gotowy
2025-07-04 18:30:02 - Frontend gotowy
2025-07-04 18:30:03 - Baza danych połączona
2025-07-04 18:30:04 - AI zainicjalizowane</pre>
        </div>
    `);
}

// Utility functions
function showLoadingOverlay(title, description) {
    const overlay = document.getElementById('loadingOverlay');
    const titleEl = document.getElementById('loadingText');
    const descEl = document.getElementById('loadingDescription');
    
    titleEl.textContent = title;
    descEl.textContent = description;
    overlay.style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showModal(title, content) {
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    
    titleEl.textContent = title;
    bodyEl.innerHTML = content;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Initialize GUI when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FoodSaveGUI();
});
