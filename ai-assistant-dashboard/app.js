// Application Data
const appData = {
  agents: [
    {
      id: "chef",
      name: "Chef Agent",
      status: "active",
      description: "Sugeruje przepisy na podstawie dostępnych składników",
      icon: "👨‍🍳",
      color: "#FF6B6B"
    },
    {
      id: "weather",
      name: "Weather Agent", 
      status: "active",
      description: "Dostarcza prognozy pogody w czasie rzeczywistym",
      icon: "🌤️",
      color: "#4ECDC4"
    },
    {
      id: "ocr",
      name: "OCR Agent",
      status: "active", 
      description: "Rozpoznaje tekst z obrazów paragonów",
      icon: "📸",
      color: "#45B7D1"
    },
    {
      id: "rag",
      name: "RAG Agent",
      status: "active",
      description: "Wyszukiwanie w bazie wiedzy",
      icon: "📝",
      color: "#96CEB4"
    },
    {
      id: "analytics",
      name: "Analytics Agent",
      status: "active",
      description: "Analizuje wzorce wydatków i marnotrawstwa",
      icon: "📊", 
      color: "#FFEAA7"
    }
  ],
  pantryItems: [
    {name: "Kurczak", quantity: "500g", expiry: "2025-07-02", category: "Mięso"},
    {name: "Ryż basmati", quantity: "1kg", expiry: "2026-01-15", category: "Ziarna"},
    {name: "Brokuły", quantity: "300g", expiry: "2025-07-01", category: "Warzywa"},
    {name: "Marchew", quantity: "500g", expiry: "2025-07-05", category: "Warzywa"},
    {name: "Jajka", quantity: "12szt", expiry: "2025-07-08", category: "Nabiał"}
  ]
};

// Application State
let currentPage = 'dashboard';
let isTyping = false;

// DOM Elements
let menuToggle, sidebar, themeToggle, settingsBtn, messageInput, sendBtn, chatMessagesContainer, fileInput, fileUploadArea, clearChatBtn;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  initializeNavigation();
  initializeChat();
  initializeFileUpload();
  initializeQuickCommands();
  initializeAgents();
  initializeSettings();
  setupEventListeners();
  addTypingCSS();
});

// Initialize DOM Elements
function initializeElements() {
  menuToggle = document.getElementById('menuToggle');
  sidebar = document.getElementById('sidebar');
  themeToggle = document.getElementById('themeToggle');
  settingsBtn = document.getElementById('settingsBtn');
  messageInput = document.getElementById('messageInput');
  sendBtn = document.getElementById('sendBtn');
  chatMessagesContainer = document.getElementById('chatMessages');
  fileInput = document.getElementById('fileInput');
  fileUploadArea = document.getElementById('fileUploadArea');
  clearChatBtn = document.getElementById('clearChat');
}

// Navigation System
function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = item.dataset.page;
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Show target page
      pages.forEach(page => page.classList.remove('active'));
      const targetPageElement = document.getElementById(`${targetPage}-page`);
      if (targetPageElement) {
        targetPageElement.classList.add('active');
      }
      
      currentPage = targetPage;
      
      // Close sidebar on mobile
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
      }
    });
  });
}

// Chat System
function initializeChat() {
  updateChatScroll();
}

function addMessage(content, type = 'user', agent = null) {
  const messageId = Date.now();
  const timestamp = new Date().toLocaleTimeString('pl-PL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${type}`;
  messageElement.innerHTML = `
    <div class="message-avatar">
      ${type === 'assistant' ? 
        '<span class="material-icons">smart_toy</span>' : 
        '<span class="material-icons">person</span>'
      }
    </div>
    <div class="message-content">
      <div class="message-text">${content}</div>
      <div class="message-time">${timestamp}</div>
    </div>
  `;
  
  chatMessagesContainer.appendChild(messageElement);
  updateChatScroll();
  
  return messageId;
}

function updateChatScroll() {
  if (chatMessagesContainer) {
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  // Add user message
  addMessage(message, 'user');
  messageInput.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  // Simulate AI response
  setTimeout(() => {
    hideTypingIndicator();
    const response = generateResponse(message);
    addMessage(response, 'assistant');
  }, 1000 + Math.random() * 2000);
}

function showTypingIndicator() {
  if (isTyping) return;
  
  isTyping = true;
  const typingElement = document.createElement('div');
  typingElement.className = 'message assistant typing';
  typingElement.id = 'typing-indicator';
  typingElement.innerHTML = `
    <div class="message-avatar">
      <span class="material-icons">smart_toy</span>
    </div>
    <div class="message-content">
      <div class="message-text">
        <span class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>
  `;
  
  chatMessagesContainer.appendChild(typingElement);
  updateChatScroll();
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
  isTyping = false;
}

function generateResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('pogoda') || lowerMessage.includes('weather')) {
    return generateWeatherResponse();
  } else if (lowerMessage.includes('śniadanie') || lowerMessage.includes('breakfast')) {
    return generateBreakfastResponse();
  } else if (lowerMessage.includes('obiad') || lowerMessage.includes('lunch')) {
    return generateLunchResponse();
  } else if (lowerMessage.includes('spiżarnia') || lowerMessage.includes('jedzenie') || lowerMessage.includes('inventory')) {
    return generateInventoryResponse();
  } else if (lowerMessage.includes('zakupy') || lowerMessage.includes('shopping')) {
    return "Świetnie! Prześlijcie mi zdjęcie paragonu, a ja zaktualizuję waszą spiżarnię i przeanalizuję wydatki.";
  } else {
    return generateGenericResponse();
  }
}

function generateWeatherResponse() {
  return `🌤️ <strong>Prognoza pogody na 3 dni:</strong><br><br>

<strong>Dziś (Niedziela):</strong><br>
• Ząbki: 22°C, pochmurnie z przejaśnieniami<br>
• Warszawa: 23°C, słonecznie<br><br>

<strong>Jutro (Poniedziałek):</strong><br>
• Ząbki: 19°C, deszcz po południu<br>
• Warszawa: 20°C, lekkie opady<br><br>

<strong>Pojutrze (Wtorek):</strong><br>
• Ząbki: 25°C, słonecznie<br>
• Warszawa: 26°C, bezchmurnie<br><br>

Pamiętajcie o parasolu w poniedziałek! ☂️`;
}

function generateBreakfastResponse() {
  return `🍳 <strong>Propozycje śniadania na podstawie waszej spiżarni:</strong><br><br>

<strong>Opcja 1: Omlet z warzywami</strong><br>
• Jajka (2-3 sztuki)<br>
• Brokuły (100g)<br>
• Marchew (1 średnia, starta)<br>
• Przyprawy według gustu<br><br>

<strong>Opcja 2: Jajecznica z ryżem</strong><br>
• Jajka (2-3 sztuki)<br>
• Ryż basmati (½ szklanki ugotowanego)<br>
• Warzywa na patelni<br><br>

Oba śniadania są pożywne i wykorzystują składniki, które macie w domu! 😊`;
}

function generateLunchResponse() {
  return `🥪 <strong>Plan obiadów na 3 dni do pracy:</strong><br><br>

<strong>Dzień 1: Kurczak teriyaki z ryżem</strong><br>
• Kurczak (200g)<br>
• Ryż basmati<br>
• Brokuły<br><br>

<strong>Dzień 2: Smażony ryż z jajkiem</strong><br>
• Ryż basmati<br>
• Jajka (2 sztuki)<br>
• Marchew<br><br>

<strong>Dzień 3: Sałatka z kurczakiem</strong><br>
• Pozostały kurczak<br>
• Warzywa<br><br>

<strong>📝 Lista zakupów:</strong><br>
• Sos teriyaki<br>
• Olej sezamowy<br>
• Sałata<br>
• Pomidory<br>
• Ogórek<br><br>

Wszystkie posiłki można przygotować wieczorem i zapakować do pojemników! 📦`;
}

function generateInventoryResponse() {
  const tableHtml = `
    <table class="inventory-table">
      <thead>
        <tr>
          <th>Produkt</th>
          <th>Ilość</th>
          <th>Kategoria</th>
          <th>Data ważności</th>
        </tr>
      </thead>
      <tbody>
        ${appData.pantryItems.map(item => {
          const expiryDate = new Date(item.expiry);
          const today = new Date();
          const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          let expiryClass = '';
          if (daysToExpiry < 0) expiryClass = 'expiry-expired';
          else if (daysToExpiry <= 2) expiryClass = 'expiry-soon';
          
          return `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.category}</td>
              <td class="${expiryClass}">${item.expiry}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <br>
    ⚠️ <strong>Uwaga:</strong> Brokuły wkrótce się przeterminują (jutro)!
  `;
  
  return `🧊 <strong>Zawartość waszej spiżarni:</strong><br><br>${tableHtml}`;
}

function generateGenericResponse() {
  const responses = [
    "Rozumiem! Czy mogę w czymś jeszcze pomóc?",
    "Interesujące pytanie! Mogę sprawdzić to w mojej bazie wiedzy.",
    "Dziękuję za informację. Czy potrzebujecie pomocy z czymś konkretnym?",
    "Jestem tutaj, aby pomóc! Użyjcie szybkich komend lub zadajcie mi pytanie.",
    "Świetnie! Czy chcielibyście, żebym przeanalizował jakieś dane z waszej spiżarni?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// File Upload System
function initializeFileUpload() {
  if (!fileUploadArea || !fileInput) return;
  
  fileUploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', handleFileUpload);
  
  // Drag and drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '#3b82f6';
    fileUploadArea.style.background = 'rgba(59, 130, 246, 0.1)';
  });
  
  fileUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '';
    fileUploadArea.style.background = '';
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '';
    fileUploadArea.style.background = '';
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  });
}

function handleFileUpload(e) {
  const files = e.target.files;
  handleFiles(files);
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      addMessage(`📷 Przesłano obraz: ${file.name}`, 'user');
      
      // Simulate OCR processing
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          addMessage(`📸 <strong>Analiza paragonu zakończona!</strong><br><br>
          
Rozpoznane produkty:<br>
• Mleko 3.2% - 4.99 zł<br>
• Chleb razowy - 3.50 zł<br>
• Masło - 6.20 zł<br>
• Jabłka - 8.90 zł<br><br>

💰 <strong>Łączna kwota:</strong> 23.59 zł<br><br>

Wszystkie produkty zostały dodane do waszej spiżarni. Czy chcecie, żebym zasugerował przepisy wykorzystujące nowe składniki?`, 'assistant');
        }, 1000);
      }, 500);
    }
  });
  
  // Reset file input
  fileInput.value = '';
}

// Quick Commands
function initializeQuickCommands() {
  const commandButtons = document.querySelectorAll('.command-btn');
  
  commandButtons.forEach(button => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      handleQuickCommand(command);
    });
  });
}

function handleQuickCommand(command) {
  const commands = {
    shopping: () => {
      if (fileUploadArea) {
        fileUploadArea.classList.add('active');
      }
      addMessage('🛒 Zrobiłem zakupy', 'user');
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          addMessage('Świetnie! Prześlijcie mi zdjęcie paragonu, a przeanalizuję zakupy i zaktualizuję waszą spiżarnię. Możecie przeciągnąć zdjęcie do obszaru powyżej lub kliknąć, aby wybrać plik.', 'assistant');
        }, 1000);
      }, 500);
    },
    weather: () => {
      addMessage('🌤️ Jaka pogoda na dzisiaj i najbliższe 3 dni?', 'user');
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          addMessage(generateWeatherResponse(), 'assistant');
        }, 1500);
      }, 500);
    },
    breakfast: () => {
      addMessage('🍳 Co na śniadanie?', 'user');
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          addMessage(generateBreakfastResponse(), 'assistant');
        }, 2000);
      }, 500);
    },
    lunch: () => {
      addMessage('🥪 Co na obiad do pracy?', 'user');
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          addMessage(generateLunchResponse(), 'assistant');
        }, 2500);
      }, 500);
    },
    inventory: () => {
      addMessage('🧊 Co mam do jedzenia?', 'user');
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          addMessage(generateInventoryResponse(), 'assistant');
        }, 1500);
      }, 500);
    }
  };
  
  if (commands[command]) {
    commands[command]();
  }
}

// Agents Display
function initializeAgents() {
  const agentsList = document.getElementById('agentsList');
  if (!agentsList) return;
  
  appData.agents.forEach(agent => {
    const agentElement = document.createElement('div');
    agentElement.className = 'agent-item';
    agentElement.innerHTML = `
      <div class="agent-icon">${agent.icon}</div>
      <div class="agent-info">
        <div class="agent-name">${agent.name}</div>
        <div class="agent-desc">${agent.description}</div>
      </div>
      <div class="agent-status-dot"></div>
    `;
    
    agentsList.appendChild(agentElement);
  });
}

// Settings Management
function initializeSettings() {
  // Load saved settings
  try {
    const savedSettings = localStorage.getItem('assistantSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      applySettings(settings);
    }
  } catch (e) {
    console.log('No saved settings found');
  }
}

function applySettings(settings) {
  if (settings.theme) {
    document.documentElement.setAttribute('data-color-scheme', settings.theme);
    updateThemeIcon(settings.theme);
  }
  
  if (settings.aiModel) {
    const aiModelSelect = document.getElementById('aiModel');
    if (aiModelSelect) aiModelSelect.value = settings.aiModel;
  }
  
  if (settings.responseLength) {
    const responseLengthSelect = document.getElementById('responseLength');
    if (responseLengthSelect) responseLengthSelect.value = settings.responseLength;
  }
}

function updateThemeIcon(theme) {
  if (themeToggle) {
    const icon = themeToggle.querySelector('.material-icons');
    if (icon) {
      icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  }
}

// Event Listeners
function setupEventListeners() {
  // Menu toggle for mobile
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
  
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-color-scheme', newTheme);
      updateThemeIcon(newTheme);
      
      // Save setting
      try {
        const settings = JSON.parse(localStorage.getItem('assistantSettings') || '{}');
        settings.theme = newTheme;
        localStorage.setItem('assistantSettings', JSON.stringify(settings));
      } catch (e) {
        console.log('Could not save theme setting');
      }
    });
  }
  
  // Settings button
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      navigateToPage('settings');
    });
  }
  
  // Chat input
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  
  // Clear chat
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      // Remove all messages except the initial welcome message
      const messages = chatMessagesContainer.querySelectorAll('.message');
      messages.forEach((message, index) => {
        if (index > 0) { // Keep first message
          message.remove();
        }
      });
    });
  }
  
  // Close file upload area when clicking outside
  document.addEventListener('click', (e) => {
    if (fileUploadArea && !fileUploadArea.contains(e.target) && !e.target.closest('.command-btn[data-command="shopping"]')) {
      fileUploadArea.classList.remove('active');
    }
  });
  
  // Responsive sidebar
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && sidebar) {
      sidebar.classList.remove('open');
    }
  });
}

function navigateToPage(pageName) {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  navItems.forEach(nav => nav.classList.remove('active'));
  const targetNav = document.querySelector(`[data-page="${pageName}"]`);
  if (targetNav) targetNav.classList.add('active');
  
  pages.forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`${pageName}-page`);
  if (targetPage) targetPage.classList.add('active');
  
  currentPage = pageName;
}

// Add typing animation CSS
function addTypingCSS() {
  const typingCSS = `
  .typing-dots {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-text-secondary);
    animation: typing 1.5s infinite;
  }

  .typing-dots span:nth-child(1) { animation-delay: 0s; }
  .typing-dots span:nth-child(2) { animation-delay: 0.3s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.6s; }

  @keyframes typing {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-10px); }
  }

  .keyboard-navigation *:focus {
    outline: 2px solid var(--color-primary) !important;
    outline-offset: 2px;
  }
  `;

  const style = document.createElement('style');
  style.textContent = typingCSS;
  document.head.appendChild(style);
}

// Initialize tooltips and other enhancements
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling for better UX
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Add focus management for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
});