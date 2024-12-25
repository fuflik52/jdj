// Получаем элементы DOM
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const contactNameInput = document.getElementById('contact-name-input');
const statusTypeSelect = document.getElementById('status-type');
const contactNameDisplay = document.getElementById('contact-name');
const statusDisplay = document.getElementById('status');
const presets = document.querySelectorAll('.preset');
const sendAsMe = document.getElementById('send-as-me');
const sendAsContact = document.getElementById('send-as-contact');
const fontSizeSelect = document.getElementById('font-size');
const profilePicInput = document.getElementById('profile-pic-url');
const profilePicDisplay = document.querySelector('#profile-pic');
const themeToggle = document.getElementById('theme-toggle');

// Переменные состояния
let isTyping = false;
let sendingAsMe = true;

// Функция для обновления времени в статус-баре
function updateStatusBarTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.querySelector('.status-bar .time').textContent = `${hours}:${minutes}`;
}

// Обновляем время каждую минуту
setInterval(updateStatusBarTime, 60000);
updateStatusBarTime();

// Функция для обновления статуса
function updateStatus(type) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Удаляем предыдущий индикатор
    const oldIndicator = statusDisplay.querySelector('.status-indicator');
    if (oldIndicator) {
        oldIndicator.remove();
    }

    // Создаем новый индикатор
    const indicator = document.createElement('span');
    indicator.className = `status-indicator ${type}`;

    switch (type) {
        case 'online':
            statusDisplay.textContent = 'в сети';
            statusDisplay.insertBefore(indicator, statusDisplay.firstChild);
            break;
        case 'recently':
            statusDisplay.textContent = 'был(а) недавно';
            statusDisplay.insertBefore(indicator, statusDisplay.firstChild);
            break;
        case 'last-seen':
            statusDisplay.textContent = `был(а) в сети в ${hours}:${minutes}`;
            statusDisplay.insertBefore(indicator, statusDisplay.firstChild);
            break;
        case 'typing':
            if (!isTyping) {
                isTyping = true;
                statusDisplay.textContent = 'печатает';
                indicator.style.animation = 'pulse 1.5s infinite';
                statusDisplay.insertBefore(indicator, statusDisplay.firstChild);
                setTimeout(() => {
                    isTyping = false;
                    updateStatus(statusTypeSelect.value);
                }, 3000);
            }
            break;
    }
}

// Функция для добавления сообщения
function addMessage(text, isSent = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const messageText = document.createElement('div');
    messageText.className = 'text';
    messageText.textContent = text;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'time';
    const now = new Date();
    messageTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(messageTime);
    messagesContainer.appendChild(messageDiv);
    
    // Прокрутка к последнему сообщению
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Обработчик отправки сообщения
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        addMessage(text, sendingAsMe);
        messageInput.value = '';
        
        // Если пишем от себя, иногда показываем "печатает" и отправляем ответ
        if (sendingAsMe && Math.random() > 0.5) {
            setTimeout(() => {
                updateStatus('typing');
                
                const responses = [
                    "Хорошо, понял 👍",
                    "Интересно...",
                    "Давай встретимся завтра?",
                    "Что думаешь об этом?",
                    "Согласен с тобой!",
                    "Надо подумать 🤔"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                setTimeout(() => {
                    addMessage(randomResponse, false);
                }, 3000);
            }, Math.random() * 1000 + 500);
        }
    }
}

// Обработчики событий для отправки сообщения
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Обработчики изменения настроек профиля
contactNameInput.addEventListener('input', () => {
    contactNameDisplay.textContent = contactNameInput.value;
});

statusTypeSelect.addEventListener('change', (e) => {
    updateStatus(e.target.value);
});

// Обработчик изменения фото профиля
profilePicInput.addEventListener('input', () => {
    profilePicDisplay.src = profilePicInput.value;
});

// Обработчики готовых фонов
presets.forEach(preset => {
    preset.addEventListener('click', () => {
        // Убираем активный класс у всех пресетов
        presets.forEach(p => p.classList.remove('active'));
        // Добавляем активный класс выбранному пресету
        preset.classList.add('active');
        // Получаем background из стилей пресета
        const background = window.getComputedStyle(preset).background;
        // Применяем фон к области сообщений и заголовку
        messagesContainer.style.background = background;
        document.querySelector('.chat-header').style.background = background;
    });
});

// Обработчики выбора отправителя
sendAsMe.addEventListener('click', () => {
    sendingAsMe = true;
    sendAsMe.classList.add('active');
    sendAsContact.classList.remove('active');
});

sendAsContact.addEventListener('click', () => {
    sendingAsMe = false;
    sendAsContact.classList.add('active');
    sendAsMe.classList.remove('active');
});

// Обработчик изменения размера шрифта
fontSizeSelect.addEventListener('change', (e) => {
    const sizes = {
        small: '12px',
        medium: '14px',
        large: '16px'
    };
    document.documentElement.style.setProperty('--message-font-size', sizes[e.target.value]);
});

// Функция для переключения темы
function toggleTheme() {
    const root = document.documentElement;
    const isDark = !root.hasAttribute('data-theme') || root.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        root.setAttribute('data-theme', 'light');
        themeToggle.querySelector('.material-icons').textContent = 'light_mode';
    } else {
        root.removeAttribute('data-theme');
        themeToggle.querySelector('.material-icons').textContent = 'dark_mode';
    }
}

// Обработчик клика по кнопке темы
themeToggle.addEventListener('click', toggleTheme);

// Функция для создания скриншота
async function takeScreenshot() {
    try {
        // Находим элемент messenger
        const messenger = document.querySelector('.phone-frame');
        
        // Создаем canvas из элемента с помощью html2canvas
        const canvas = await html2canvas(messenger, {
            backgroundColor: null,
            scale: 2, // Увеличиваем качество
            logging: false,
        });

        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.download = 'messenger-screenshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Ошибка при создании скриншота:', error);
        alert('Для работы скриншотов нужно добавить библиотеку html2canvas. Добавьте <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script> в ваш HTML файл.');
    }
}

// Добавляем обработчик для кнопки скриншота
document.getElementById('screenshot-button').addEventListener('click', takeScreenshot);

// Инициализация
updateStatus('online');
