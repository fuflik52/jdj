// База данных игры
const gameDB = {
    // Проверка, является ли пользователь телеграм пользователем
    isTelegramUser() {
        return window.tg && window.tg.initDataUnsafe && window.tg.initDataUnsafe.user;
    },

    // Проверка, авторизован ли веб-пользователь
    isWebUser() {
        return localStorage.getItem('user_id') !== null;
    },

    // Получение ID пользователя
    getUserId() {
        if (this.isTelegramUser()) {
            return window.tg.initDataUnsafe.user.id;
        } else if (this.isWebUser()) {
            return localStorage.getItem('user_id');
        }
        return null;
    },

    // Получение имени пользователя
    getUsername() {
        if (this.isTelegramUser()) {
            return window.tg.initDataUnsafe.user.username;
        } else if (this.isWebUser()) {
            return localStorage.getItem('username');
        }
        return 'Guest';
    },

    // Инициализация пользователя
    async initUser() {
        if (!this.getUserId()) {
            window.location.href = 'login.html';
            return null;
        }

        if (this.isTelegramUser()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('users')
                    .upsert({
                        telegram_id: window.tg.initDataUnsafe.user.id,
                        username: window.tg.initDataUnsafe.user.username,
                        first_name: window.tg.initDataUnsafe.user.first_name,
                        last_name: window.tg.initDataUnsafe.user.last_name
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error initializing user:', error);
                return null;
            }
        } else {
            try {
                const { data, error } = await window.supabaseClient
                    .from('users')
                    .select()
                    .eq('id', this.getUserId())
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error getting web user:', error);
                return null;
            }
        }
    },

    // Загрузка прогресса
    async loadProgress() {
        try {
            const { data, error } = await window.supabaseClient
                .from('user_progress')
                .select('*')
                .eq('user_id', this.getUserId())
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error loading progress:', error);
            return {
                balance: 0,
                energy: 100,
                hourly_rate: 10
            };
        }
    },

    // Сохранение прогресса
    async saveProgress(progress) {
        try {
            const { error } = await window.supabaseClient
                .from('user_progress')
                .upsert({
                    user_id: this.getUserId(),
                    ...progress
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    },

    // Обновление баланса
    async updateBalance(balance) {
        const progress = await this.loadProgress();
        progress.balance = balance;
        await this.saveProgress(progress);
    },

    // Обновление энергии
    async updateEnergy(energy) {
        const progress = await this.loadProgress();
        progress.energy = energy;
        await this.saveProgress(progress);
    },

    // Получение всех карточек
    async getCards() {
        try {
            const { data, error } = await window.supabaseClient
                .from('cards')
                .select('*')
                .order('price');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting cards:', error);
            return [];
        }
    },

    // Получение купленных карточек
    async getPurchasedCards() {
        try {
            const { data, error } = await window.supabaseClient
                .from('purchased_cards')
                .select(`
                    *,
                    cards (*)
                `)
                .eq('user_id', this.getUserId());

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting purchased cards:', error);
            return [];
        }
    },

    // Покупка карточки
    async purchaseCard(cardId) {
        try {
            // Получаем карточку и проверяем баланс
            const { data: card } = await window.supabaseClient
                .from('cards')
                .select('*')
                .eq('id', cardId)
                .single();

            const progress = await this.loadProgress();

            if (progress.balance < card.price) {
                throw new Error('Недостаточно средств');
            }

            // Покупаем карточку
            const { error: purchaseError } = await window.supabaseClient
                .from('purchased_cards')
                .insert({
                    user_id: this.getUserId(),
                    card_id: cardId
                });

            if (purchaseError) throw purchaseError;

            // Обновляем баланс
            progress.balance -= card.price;
            await this.saveProgress(progress);

            return {
                success: true,
                card: card
            };
        } catch (error) {
            console.error('Error purchasing card:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Выход из аккаунта
    async logout() {
        if (this.isWebUser()) {
            await window.supabaseClient.auth.signOut();
            localStorage.removeItem('user_id');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
        }
    }
};

// Делаем gameDB доступным глобально
window.gameDB = gameDB;
