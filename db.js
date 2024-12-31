import { createClient } from '@supabase/supabase-js'

// Инициализация клиента Supabase
const supabase = createClient(
    'https://qgalbzidagyazfdvnfll.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYWxiemlkYWd5YXpmZHZuZmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NDE0MDYsImV4cCI6MjA1MTIxNzQwNn0.G5sfdgJRvE3pzGPpJGUcRTuzlnP7a7Cw1kdxa0lJJEg'
);

const gameDB = {
    // Инициализация пользователя
    async initUser(telegramUser) {
        try {
            const { data, error } = await supabase
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
            const { data, error } = await supabase
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
            const { error } = await supabase
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
            const { error } = await supabase
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
            const { data, error } = await supabase
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
            const { data, error } = await supabase
                .from('purchased_cards')
                .select(`
                    *,
                    cards (*)
                `)
                .eq('user_id', window.tg.initDataUnsafe.user.id);

            if (error) throw error;
            return data.map(pc => pc.cards);
        } catch (error) {
            console.error('Error getting purchased cards:', error);
            return [];
        }
    },

    // Покупка карточки
    async purchaseCard(cardId) {
        try {
            // Начинаем транзакцию
            const { data: { user_id } } = await supabase.auth.getUser();
            
            // Получаем карточку и проверяем баланс
            const { data: card } = await supabase
                .from('cards')
                .select('*')
                .eq('id', cardId)
                .single();

            const { data: user } = await supabase
                .from('users')
                .select('balance')
                .eq('telegram_id', window.tg.initDataUnsafe.user.id)
                .single();

            if (user.balance < card.price) {
                throw new Error('Insufficient funds');
            }

            // Покупаем карточку и обновляем баланс
            const { error: purchaseError } = await supabase
                .from('purchased_cards')
                .insert({
                    user_id: window.tg.initDataUnsafe.user.id,
                    card_id: cardId
                });

            if (purchaseError) throw purchaseError;

            // Обновляем баланс пользователя
            const { error: balanceError } = await supabase
                .from('users')
                .update({ balance: user.balance - card.price })
                .eq('telegram_id', window.tg.initDataUnsafe.user.id);

            if (balanceError) throw balanceError;

            return true;
        } catch (error) {
            console.error('Error purchasing card:', error);
            return false;
        }
    },

    // Расчет часового дохода
    async calculateHourlyRate() {
        try {
            const purchasedCards = await this.getPurchasedCards();
            const baseRate = 10;
            const totalRate = purchasedCards.reduce((sum, card) => sum + card.per_hour, baseRate);
            return totalRate;
        } catch (error) {
            console.error('Error calculating hourly rate:', error);
            return 10; // Базовая ставка в случае ошибки
        }
    }
};

export default gameDB;
