document.addEventListener('DOMContentLoaded', function() {
    const mainCircle = document.querySelector('.main-circle');
    const gameArea = document.querySelector('.game-area');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const balanceElement = document.querySelector('.balance');
    const rateElement = document.querySelector('.user-info .rate');
    const container = document.querySelector('.container');
    let clickCount = 0;
    let energy = 100;
    const maxEnergy = 100;
    const energyPerClick = 1;
    const energyRegenRate = 1;
    window.totalHourlyRate = 10;
    window.purchasedCards = []; // Массив для хранения купленных карт

    // Функция для сохранения данных
    function saveGameData() {
        localStorage.setItem('balance', clickCount);
        localStorage.setItem('purchasedCards', JSON.stringify(window.purchasedCards));
        localStorage.setItem('energy', energy);
    }

    // Функция для загрузки сохраненных данных
    function loadGameData() {
        const savedBalance = localStorage.getItem('balance');
        const savedPurchasedCards = localStorage.getItem('purchasedCards');
        const savedEnergy = localStorage.getItem('energy');

        if (savedBalance) {
            clickCount = parseInt(savedBalance);
            balanceElement.textContent = Math.floor(clickCount);
        }

        if (savedPurchasedCards) {
            window.purchasedCards = JSON.parse(savedPurchasedCards);
        }

        if (savedEnergy) {
            energy = parseInt(savedEnergy);
            updateEnergy();
        }
    }

    // Загружаем данные при старте
    loadGameData();

    // Сохраняем данные перед закрытием страницы
    window.addEventListener('beforeunload', () => {
        saveGameData();
    });

    // Загружаем сохраненные данные при старте
    if (window.telegramAuth && window.telegramAuth.isAuthenticated) {
        const userData = window.telegramAuth.loadUserData();
        if (userData) {
            clickCount = Number(userData.balance) || 0;
            energy = Number(userData.energy) || 100;
            window.purchasedCards = userData.purchasedItems || [];
            // Обновляем все значения на странице
            updateTotalHourlyRate();
            updateEnergy();
            balanceElement.textContent = Math.floor(clickCount);
            window.clickCount = clickCount; // Сохраняем в глобальную переменную
        }
    }

    // Функция для обновления общей почасовой прибыли
    function updateTotalHourlyRate() {
        window.totalHourlyRate = 10; // Базовая прибыль
        if (window.purchasedCards && window.purchasedCards.length > 0) {
            window.purchasedCards.forEach(card => {
                window.totalHourlyRate += Number(card.perHour);
            });
        }
        const rateElement = document.querySelector('.user-info .rate');
        if (rateElement) {
            rateElement.textContent = `${window.totalHourlyRate}/hour`;
        }
        // Сохраняем данные
        if (window.telegramAuth && window.telegramAuth.isAuthenticated) {
            window.telegramAuth.saveUserData();
        }
    }

    // Обновление баланса каждую секунду
    setInterval(() => {
        const increment = Number(window.totalHourlyRate || 0) / 3600;
        clickCount = Number(clickCount) + Number(increment);
        balanceElement.textContent = Math.floor(clickCount);
        // Сохраняем текущий баланс
        if (window.telegramAuth && window.telegramAuth.isAuthenticated) {
            window.telegramAuth.saveBalance(clickCount);
        }
        saveGameData();
    }, 1000);

    // Восстановление энергии каждую секунду
    setInterval(() => {
        if (energy < maxEnergy) {
            energy = Math.min(maxEnergy, energy + energyRegenRate);
            updateEnergy();

            // Сохраняем текущую энергию
            if (window.telegramAuth && window.telegramAuth.isAuthenticated) {
                window.telegramAuth.saveEnergy(energy);
            }
            saveGameData();
        }
    }, 1000);

    function updateEnergy() {
        progressText.textContent = `${Math.floor(energy)}/${maxEnergy}`;
        progressBar.style.width = `${(energy / maxEnergy) * 100}%`;
        
        if (energy <= 0) {
            mainCircle.classList.add('disabled');
        } else {
            mainCircle.classList.remove('disabled');
        }
    }

    // Функция для создания и показа всплывающего окна с заработком
    function showEarningsPopup(amount) {
        const bottomNav = document.querySelector('.bottom-nav');
        const popupDiv = document.createElement('div');
        popupDiv.className = 'flex flex-col items-center bg-[#262626] rounded-lg w-full mb-2 earnings-popup';
        popupDiv.style.position = 'fixed';
        popupDiv.style.bottom = '70px';
        popupDiv.style.left = '0';
        popupDiv.style.right = '0';
        popupDiv.style.margin = '0 15px';
        popupDiv.style.zIndex = '1000';
        
        popupDiv.innerHTML = `
            <div class="flex items-center gap-2 p-3">
                <img alt="Token" src="images/leaf-popup.png" width="24" height="24">
                <span class="text-white text-2xl font-semibold">${amount.toFixed(2)}</span>
            </div>
            <p class="text-gray-300 mb-2 text-lg">Received for time away</p>
            <button class="collect-btn bg-[#2BBE56] text-white w-full py-2 rounded-lg mb-2">Collect</button>
        `;

        document.body.insertBefore(popupDiv, bottomNav);

        // Обработчик для кнопки Collect
        const collectBtn = popupDiv.querySelector('.collect-btn');
        collectBtn.addEventListener('click', () => {
            clickCount += amount;
            balanceElement.textContent = Math.floor(clickCount);
            window.telegramAuth.updateLastCollectTime();
            popupDiv.remove();
        });
    }

    // Проверяем заработок при загрузке страницы
    if (window.telegramAuth && window.telegramAuth.isAuthenticated) {
        // const earnings = window.telegramAuth.getTimeAwayEarnings();
        // if (earnings > 0) {
        //     showEarningsPopup(earnings);
        // }
    }

    // Обработчик видимости страницы
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.telegramAuth && window.telegramAuth.isAuthenticated) {
            // const earnings = window.telegramAuth.getTimeAwayEarnings();
            // if (earnings > 0) {
            //     showEarningsPopup(earnings);
            // }
        }
    });

    // Добавляем обработку покупки карточки
    function handleCardPurchase(card) {
        if (window.telegramAuth) {
            window.telegramAuth.addPurchasedItem(card);
            window.purchasedCards = window.telegramAuth.purchasedItems;
            updateTotalHourlyRate();
        }
    }

    // Функция для создания конфетти
    function createConfetti() {
        const container = document.querySelector('.container');
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        container.appendChild(confetti);

        // Создаем 80 конфетти (примерно 70% зеленых и 30% белых)
        for (let i = 0; i < 80; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            
            // 30% конфетти будут белыми
            if (i % 3 === 0) {
                piece.classList.add('white');
            }
            
            // Случайная начальная позиция
            piece.style.left = (Math.random() * 100) + '%';
            
            // Случайные движения по X для каждой точки анимации
            const moveX1 = (Math.random() - 0.5) * 40;
            const moveX2 = (Math.random() - 0.5) * 60;
            const moveX3 = (Math.random() - 0.5) * 80;
            const moveX4 = (Math.random() - 0.5) * 100;
            
            // Случайные отклонения по Y
            const randomY1 = (Math.random() - 0.5) * 20;
            const randomY2 = (Math.random() - 0.5) * 30;
            const randomY3 = (Math.random() - 0.5) * 40;
            const randomY4 = (Math.random() - 0.5) * 50;
            
            // Устанавливаем CSS переменные для анимации
            piece.style.setProperty('--moveX1', moveX1 + '%');
            piece.style.setProperty('--moveX2', moveX2 + '%');
            piece.style.setProperty('--moveX3', moveX3 + '%');
            piece.style.setProperty('--moveX4', moveX4 + '%');
            
            piece.style.setProperty('--randomY1', randomY1 + 'px');
            piece.style.setProperty('--randomY2', randomY2 + 'px');
            piece.style.setProperty('--randomY3', randomY3 + 'px');
            piece.style.setProperty('--randomY4', randomY4 + 'px');
            
            // Случайное вращение
            const rotation = Math.random() * 360 * 3;
            piece.style.setProperty('--rotation', rotation + 'deg');
            
            // Замедленная анимация падения (увеличили время в 2 раза)
            piece.style.animationDuration = (1 + Math.random() * 1) + 's';
            piece.style.animationDelay = (Math.random() * 0.4) + 's';
            
            confetti.appendChild(piece);
        }

        // Удаляем конфетти после анимации (увеличили время в 2 раза)
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }

    // Создаем контейнеры для разделов
    const homeSection = document.createElement('div');
    homeSection.className = 'home-section';
    homeSection.appendChild(gameArea);
    homeSection.appendChild(document.querySelector('.progress-container'));
    container.insertBefore(homeSection, document.querySelector('.bottom-nav'));

    const cardsSection = createCardsSection();
    const frensSection = createFrensSection();
    const miningSection = createMiningSection();
    const rewardSection = createRewardSection();

    // Показываем только домашнюю страницу изначально
    cardsSection.style.display = 'none';
    frensSection.style.display = 'none';
    miningSection.style.display = 'none';
    rewardSection.style.display = 'none';

    const sections = {
        'home': homeSection,
        'cards': cardsSection,
        'frens': frensSection,
        'mining': miningSection,
        'reward': rewardSection
    };

    // Обработка клика по навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            
            // Убираем активный класс со всех пунктов меню
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Добавляем активный класс выбранному пункту
            item.classList.add('active');
            
            // Скрываем все секции
            Object.values(sections).forEach(section => {
                if (section) section.style.display = 'none';
            });
            
            // Показываем выбранную секцию
            if (sections[section]) {
                sections[section].style.display = 'block';
            }
        });
    });

    mainCircle.addEventListener('click', function(e) {
        if (energy <= 0) return;

        energy = Math.max(0, energy - energyPerClick);
        updateEnergy();

        const clickInfo = document.createElement('div');
        clickInfo.className = 'click-info';
        
        const icon = document.createElement('img');
        icon.src = 'https://i.postimg.cc/FFx7T4Bh/image.png';
        icon.className = 'click-icon';
        clickInfo.appendChild(icon);
        
        const value = document.createElement('span');
        value.className = 'click-value';
        value.textContent = '+1';
        clickInfo.appendChild(value);

        clickInfo.style.position = 'absolute';
        clickInfo.style.left = '50%';
        clickInfo.style.top = '40%';
        clickInfo.style.transform = 'translateX(-50%)';

        gameArea.appendChild(clickInfo);

        requestAnimationFrame(() => {
            clickInfo.classList.add('show');
        });

        setTimeout(() => {
            gameArea.removeChild(clickInfo);
        }, 800);

        clickCount++;
        balanceElement.textContent = Math.floor(clickCount);
        // Сохраняем баланс после клика
        if (window.telegramAuth && window.telegramAuth.isAuthenticated) {
            window.telegramAuth.saveBalance(clickCount);
        }
        saveGameData();
    });

    // Функция для показа уведомления
    function showNotification(message) {
        // Удаляем предыдущее уведомление, если оно есть
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <img src="https://i.postimg.cc/FFx7T4Bh/image.png" alt="Token">
            <span class="notification-text">${message}</span>
        `;

        document.body.appendChild(notification);

        // Показываем уведомление
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Скрываем и удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    function createCardsSection() {
        const section = document.createElement('div');
        section.className = 'cards-section';
        
        // Создаем переключатель подразделов
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        tabsContainer.innerHTML = `
            <div class="bg-[#1A1B1A] p-1 rounded-xl flex gap-2 mb-3">
                <button class="tab-btn active flex-1 py-3 rounded-lg text-center transition-all duration-300 bg-[#262626] text-white" data-tab="new">New Cards</button>
                <button class="tab-btn flex-1 py-3 rounded-lg text-center transition-all duration-300 text-white/50" data-tab="owned">Your Cards</button>
            </div>
        `;

        // Создаем контейнеры для карточек
        const newCardsContainer = document.createElement('div');
        newCardsContainer.className = 'cards-container';

        const ownedCardsContainer = document.createElement('div');
        ownedCardsContainer.className = 'cards-container';
        ownedCardsContainer.style.display = 'none';

        const cardsData = [
            {
                id: 1,
                image: "https://res.cloudinary.com/dib4woqge/image/upload/v1735300135/1000000472_wu48p4.png",
                title: "Начало пути",
                description: "Коала только начинает своё путешествие. Даёт 120 эвкалипта в час",
                price: "10000",
                perHour: 120
            },
            {
                id: 2,
                image: "https://i.postimg.cc/sxpJmh0S/image.png",
                title: "Первые деньги",
                description: "Коала заработала свои первые деньги. Продолжаем в том же духе. Добавляет 350 эвкалипта в час",
                price: "25000",
                perHour: 350
            },

            {
                id: 3,
                image: "https://i.postimg.cc/pVwWnFHC/image.png",
                title: "Коала на отдыхе",
                description: "После первых заработанных денег можно хорошенько отдохнуть. Добавляет 800 эвкалипта в час",
                price: "35000",
                perHour: 800
            },
            {
                id: 4,
                image: "https://i.postimg.cc/nLCgk3KD/image.png",
                title: "Снежные забавы",
                description: "Наступила зима, а значит можно хорошо порезвиться в снежки. Но не забываем про прибыль в 1800 эвкалипта в час",
                price: "50000",
                perHour: 1800
            },
            {
                id: 5,
                image: "https://i.postimg.cc/wTxjfh3V/Leonardo-Phoenix-10-A-vibrant-whimsical-illustration-of-Koala-2.jpg",
                title: "Коала-путешественник",
                description: "Наша коала отправляется в кругосветное путешествие, собирая эвкалипт по всему миру. Приносит 3500 эвкалипта в час",
                price: "75000",
                perHour: 3500,
                isNew: true
            },
            {
                id: 6,
                image: "https://i.postimg.cc/3JnrGd8c/Leonardo-Phoenix-10-A-whimsical-digital-illustration-of-a-koal-0.jpg",
                title: "Бизнес-коала",
                description: "Пора открывать свой бизнес! Коала в деловом костюме управляет сетью эвкалиптовых плантаций. Добавляет 7000 эвкалипта в час",
                price: "100000",
                perHour: 7000,
                isNew: true
            },
            {
                id: 7,
                image: "https://i.postimg.cc/zvqbJ67b/Leonardo-Phoenix-10-A-vibrant-whimsical-illustration-of-Space-0.jpg",
                title: "Космический исследователь",
                description: "Коала покоряет космос в поисках редких видов эвкалипта на других планетах. Приносит 12000 эвкалипта в час",
                price: "150000",
                perHour: 12000,
                isNew: true
            },
            {
                id: 8,
                image: "https://i.postimg.cc/bv23bSh0/Leonardo-Phoenix-10-In-a-whimsical-vibrant-illustration-depict-0.jpg",
                title: "Коала-волшебник",
                description: "Магия и эвкалипт - отличное сочетание! Коала освоила древние заклинания приумножения эвкалипта. Добавляет 20000 эвкалипта в час",
                price: "200000",
                perHour: 20000,
                isNew: true
            }
        ];

        // Функция создания карточки
        function createCardElement(card, isOwned = false) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';

            // Проверяем, была ли карточка куплена ранее
            const isPurchased = window.purchasedCards.some(pc => pc.id === card.id);
            
            cardElement.innerHTML = `
                <div class="card-image">
                    <img src="${card.image}" alt="${card.title}" class="card-img">
                </div>
                <div class="card-title">${card.title}</div>
                <div class="card-description">${card.description}</div>
                <div class="card-footer">
                    <button class="card-price${isPurchased ? ' purchased' : ''}" data-id="${card.id}" data-rate="${card.perHour}"${isPurchased ? ' disabled' : ''}>
                        ${isPurchased ? 
                            '<span>Куплено</span>' :
                            `<img src="https://i.postimg.cc/FFx7T4Bh/image.png" alt="leaf" class="leaf-icon">
                            <span>${card.price}</span>`
                        }
                    </button>
                    <div class="per-hour">
                        <div class="rate">
                            <img src="https://i.postimg.cc/FFx7T4Bh/image.png" alt="leaf" class="leaf-icon">
                            <span>${card.perHour}</span>
                        </div>
                        <span class="rate-label">per hour</span>
                    </div>
                </div>
            `;

            if (!isPurchased && !isOwned) {
                const buyButton = cardElement.querySelector('.card-price');
                buyButton.addEventListener('click', function() {
                    const cardId = parseInt(this.dataset.id);
                    const price = parseInt(this.querySelector('span').textContent);
                    
                    if (!this.classList.contains('purchased') && clickCount >= price) {
                        clickCount = Number(clickCount) - Number(price);
                        balanceElement.textContent = Math.floor(clickCount);
                        
                        // Запускаем анимацию конфетти
                        createConfetti();
                        
                        this.classList.add('purchased');
                        this.disabled = true;
                        this.innerHTML = '<span>Куплено</span>';

                        // Добавляем карту в купленные
                        const cardData = cardsData.find(c => c.id === cardId);
                        if (cardData && !window.purchasedCards.some(pc => pc.id === cardId)) {
                            window.purchasedCards.push(cardData);
                            updateOwnedCards();
                            handleCardPurchase(cardData);
                            // Обновляем общую прибыль в час
                            updateTotalHourlyRate();
                        }
                    } else if (clickCount < price) {
                        showNotification('Недостаточно средств для покупки!');
                    }
                });
            }

            if (card.isNew) {
                const newLabel = document.createElement('div');
                newLabel.className = 'new-label';
                newLabel.textContent = 'New';
                cardElement.appendChild(newLabel);
            }

            return cardElement;
        }

        // Функция обновления списка купленных карт
        function updateOwnedCards() {
            ownedCardsContainer.innerHTML = '';
            if (!window.purchasedCards || window.purchasedCards.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'У вас пока нет купленных карт';
                ownedCardsContainer.appendChild(emptyMessage);
            } else {
                window.purchasedCards.forEach(card => {
                    ownedCardsContainer.appendChild(createCardElement(card, true));
                });
            }
        }

        // Добавляем карточки в контейнер новых карт
        cardsData.forEach(card => {
            newCardsContainer.appendChild(createCardElement(card));
        });

        // Инициализируем список купленных карт
        updateOwnedCards();

        // Обработчики переключения табов
        tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                tabsContainer.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-[#262626]');
                    b.classList.add('text-white/50');
                });
                this.classList.add('active', 'bg-[#262626]');
                this.classList.remove('text-white/50');

                const tabName = this.dataset.tab;
                if (tabName === 'new') {
                    newCardsContainer.style.display = 'grid';
                    ownedCardsContainer.style.display = 'none';
                } else {
                    newCardsContainer.style.display = 'none';
                    ownedCardsContainer.style.display = 'grid';
                    updateOwnedCards();
                }
            });
        });

        section.appendChild(tabsContainer);
        section.appendChild(newCardsContainer);
        section.appendChild(ownedCardsContainer);
        document.querySelector('.container').insertBefore(section, document.querySelector('.bottom-nav'));
        return section;
    }

    function createFrensSection() {
        const section = document.createElement('div');
        section.className = 'frens-section';
        section.innerHTML = '<div class="section-title">Frens Section</div>';
        document.querySelector('.container').insertBefore(section, document.querySelector('.bottom-nav'));
        return section;
    }

    function createMiningSection() {
        const section = document.createElement('div');
        section.className = 'mining-section';
        section.innerHTML = '<div class="section-title">Mining Section</div>';
        document.querySelector('.container').insertBefore(section, document.querySelector('.bottom-nav'));
        return section;
    }

    function createRewardSection() {
        const section = document.createElement('div');
        section.className = 'reward-section';
        section.innerHTML = '<div class="section-title">Reward Section</div>';
        document.querySelector('.container').insertBefore(section, document.querySelector('.bottom-nav'));
        return section;
    }
});
