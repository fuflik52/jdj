// Глобальные переменные
let lastActivityTime = Date.now();
let lastVisitTime = parseInt(localStorage.getItem('lastVisitTime')) || Date.now();
let isInactive = false;
let inactivityCheckInterval;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем и начисляем офлайн-прибыль
    addOfflineEarnings();
    
    // Запускаем периодическое начисление
    setInterval(addOfflineEarnings, 5000); // Каждые 5 секунд
    
    // Запускаем отслеживание активности
    startInactivityCheck();
    
    // Добавляем обработчики активности пользователя
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);
});

// Функция для отслеживания неактивности
function startInactivityCheck() {
    inactivityCheckInterval = setInterval(() => {
        const currentTime = Date.now();
        const inactiveTime = currentTime - lastActivityTime;
        
        // Если прошло больше 15 секунд неактивности
        if (inactiveTime >= 15000 && !isInactive) {
            isInactive = true;
            const earnings = calculateOfflineEarnings();
            if (earnings > 0) {
                showOfflineEarnings(earnings);
            }
        }
    }, 1000); // Проверяем каждую секунду
}

// Обработчик активности пользователя
function handleUserActivity() {
    lastActivityTime = Date.now();
    isInactive = false;
}

// Функция для показа окна офлайн-прибыли
function showOfflineEarnings(earnings) {
    const offlineEarningsElement = document.getElementById('offlineEarnings');
    const offlineAmountElement = document.getElementById('offlineAmount');
    
    if (offlineEarningsElement && offlineAmountElement) {
        offlineAmountElement.textContent = earnings.toFixed(2);
        offlineEarningsElement.classList.add('visible');
    }
}

// Функция для сбора офлайн-прибыли
function collectOfflineEarnings() {
    const offlineEarnings = calculateOfflineEarnings();
    if (offlineEarnings > 0) {
        // Обновляем баланс
        const currentBalance = parseFloat(localStorage.getItem('balance')) || 0;
        const newBalance = currentBalance + offlineEarnings;
        localStorage.setItem('balance', newBalance.toString());
        
        // Обновляем отображение баланса
        const balanceElement = document.querySelector('.balance');
        if (balanceElement) {
            balanceElement.textContent = newBalance.toFixed(2);
        }

        // Скрываем окно офлайн-прибыли
        const offlineEarningsElement = document.getElementById('offlineEarnings');
        if (offlineEarningsElement) {
            offlineEarningsElement.classList.remove('visible');
        }
        
        // Сохраняем новое время последнего визита
        saveLastVisitTime();
    }
}

// Функция для начисления прибыли
function addOfflineEarnings() {
    const earnings = calculateOfflineEarnings();
    if (earnings > 0) {
        // Обновляем баланс
        const currentBalance = parseFloat(localStorage.getItem('balance')) || 0;
        const newBalance = currentBalance + earnings;
        localStorage.setItem('balance', newBalance.toString());
        
        // Обновляем отображение баланса если страница открыта
        const balanceElement = document.querySelector('.balance');
        if (balanceElement) {
            balanceElement.textContent = Math.floor(newBalance).toString();
        }
        
        // Сохраняем новое время последнего визита
        saveLastVisitTime();
    }
}

// Функция для расчета прибыли
function calculateOfflineEarnings() {
    const currentTime = Date.now();
    const lastSavedTime = parseInt(localStorage.getItem('lastVisitTime')) || currentTime;
    const timeDiff = currentTime - lastSavedTime;
    const hoursPassed = timeDiff / (1000 * 60 * 60); // Конвертируем миллисекунды в часы
    
    // Получаем сохраненную почасовую прибыль
    const hourlyRate = parseFloat(localStorage.getItem('hourlyRate')) || 0;
    
    // Рассчитываем прибыль за время отсутствия
    return hoursPassed * hourlyRate;
}

// Функция для сохранения времени последнего визита
function saveLastVisitTime() {
    const currentTime = Date.now();
    lastVisitTime = currentTime;
    localStorage.setItem('lastVisitTime', currentTime.toString());
}

// Сохраняем время перед закрытием страницы
window.addEventListener('beforeunload', () => {
    saveLastVisitTime();
});

// Обработчик видимости страницы
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Страница скрыта - сохраняем время
        saveLastVisitTime();
    } else {
        // Страница снова видима - начисляем прибыль
        addOfflineEarnings();
    }
});
// Функция для сохранения времени последнего визита
function saveLastVisitTime() {
    localStorage.setItem('lastVisitTime', Date.now());
}

// Функция для получения времени последнего визита
function getLastVisitTime() {
    return parseInt(localStorage.getItem('lastVisitTime')) || Date.now();
}

// Функция для получения текущей прибыли в час
function getCurrentPerHour() {
    let perHour = 0;
    const purchasedCards = JSON.parse(localStorage.getItem('purchasedCards')) || [];
    const cardsList = JSON.parse(localStorage.getItem('cardsList')) || [];

    purchasedCards.forEach(cardId => {
        const card = cardsList.find(c => c.id === cardId);
        if (card) {
            perHour += card.perHour;
        }
    });

    return perHour;
}

// Функция для расчета офлайн прибыли
function calculateOfflineEarnings() {
    const lastVisit = getLastVisitTime();
    const currentTime = Date.now();
    const hoursOffline = (currentTime - lastVisit) / (1000 * 60 * 60); // Конвертируем миллисекунды в часы
    const perHour = getCurrentPerHour();
    
    return Math.floor(hoursOffline * perHour);
}

// Функция для обновления баланса с учетом офлайн прибыли
function updateBalanceWithOfflineEarnings() {
    const offlineEarnings = calculateOfflineEarnings();
    if (offlineEarnings > 0) {
        const currentBalance = parseInt(localStorage.getItem('balance')) || 0;
        const newBalance = currentBalance + offlineEarnings;
        localStorage.setItem('balance', newBalance);
        
        // Показываем уведомление о полученной прибыли
        showOfflineEarningsNotification(offlineEarnings);
    }
}

// Функция для показа уведомления о полученной офлайн прибыли
function showOfflineEarningsNotification(earnings) {
    const notification = document.createElement('div');
    notification.className = 'offline-earnings-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>Добро пожаловать обратно!</h3>
            <p>Пока вас не было, ваши коалы заработали:</p>
            <div class="earnings-amount">+${earnings} 🌿</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 5 секунд
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Добавляем стили для уведомления
const style = document.createElement('style');
style.textContent = `
    .offline-earnings-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.5s ease-out;
    }

    .notification-content {
        text-align: center;
    }

    .earnings-amount {
        font-size: 24px;
        font-weight: bold;
        margin-top: 10px;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    updateBalanceWithOfflineEarnings();
    saveLastVisitTime();
});

// Сохраняем время перед закрытием страницы
window.addEventListener('beforeunload', () => {
    saveLastVisitTime();
});
