// База данных игры
const gameDB = {
    // Инициализация пользователя
    async initUser(telegramUser) {
        try {
            const { data, error } = await window.supabaseClient
                .from('users')
                .upsert({
                    telegram_id: telegramUser.id,
                    username: telegramUser.username,
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name,
                    balance: 0,
                    energy: 100
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error initializing user:', error);
            return null;
        }
    },

    // Загрузка прогресса
    async initProgress() {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_progress')
                .select('*')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error loading progress:', error);
            return null;
        }
    },

    // Обновление баланса
    async updateBalance(balance) {
        try {
            const { error } = await window.supabaseClient
                .from('users')
                .update({ balance })
                .eq('telegram_id', window.tg.initDataUnsafe.user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating balance:', error);
            return false;
        }
    },

    // Обновление энергии
    async updateEnergy(energy) {
        try {
            const { error } = await window.supabaseClient
                .from('users')
                .update({ energy })
                .eq('telegram_id', window.tg.initDataUnsafe.user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating energy:', error);
            return false;
        }
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
                .eq('user_id', window.tg.initDataUnsafe.user.id);

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
            // Начинаем транзакцию
            const { data: { user_id } } = await window.supabaseClient.auth.getUser();
            
            // Получаем карточку и проверяем баланс
            const { data: card } = await window.supabaseClient
                .from('cards')
                .select('*')
                .eq('id', cardId)
                .single();

            const { data: user } = await window.supabaseClient
                .from('users')
                .select('balance')
                .eq('telegram_id', window.tg.initDataUnsafe.user.id)
                .single();

            if (user.balance < card.price) {
                throw new Error('Недостаточно средств');
            }

            // Покупаем карточку и обновляем баланс
            const { error: purchaseError } = await window.supabaseClient
                .from('purchased_cards')
                .insert({
                    user_id: window.tg.initDataUnsafe.user.id,
                    card_id: cardId
                });

            if (purchaseError) throw purchaseError;

            // Обновляем баланс пользователя
            const { error: balanceError } = await window.supabaseClient
                .from('users')
                .update({ balance: user.balance - card.price })
                .eq('telegram_id', window.tg.initDataUnsafe.user.id);

            if (balanceError) throw balanceError;

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

    // Расчет часового дохода
    async calculateHourlyRate() {
        try {
            const purchasedCards = await this.getPurchasedCards();
            const baseRate = 10;
            const totalRate = purchasedCards.reduce((sum, pc) => sum + pc.cards.per_hour, baseRate);
            return totalRate;
        } catch (error) {
            console.error('Error calculating hourly rate:', error);
            return 10; // Возвращаем базовую ставку в случае ошибки
        }
    }
};

// Делаем gameDB доступным глобально
window.gameDB = gameDB;
