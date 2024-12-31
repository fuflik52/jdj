// Инициализация Supabase
const supabaseUrl = 'https://qgalbzidagyazfdvnfll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYWxiemlkYWd5YXpmZHZuZmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM5MjgxNzAsImV4cCI6MjAxOTUwNDE3MH0.qgZBGvZMXDOLmhqTyPKrqSEqDvXfvGNYiDw_7zBo1Vc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

class GameDatabase {
    constructor() {
        this.currentUser = null;
        this.onUserUpdate = null;
        this.onProgressUpdate = null;
    }

    // Инициализация пользователя через Telegram
    async initUser(telegramUser) {
        try {
            let { data: user, error } = await supabase
                .from('users')
                .select()
                .eq('telegram_id', telegramUser.id)
                .single();

            if (!user) {
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{
                        username: telegramUser.username || `Player${telegramUser.id}`,
                        telegram_id: telegramUser.id.toString()
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                user = newUser;
            }

            this.currentUser = user;
            if (this.onUserUpdate) this.onUserUpdate(user);
            
            // Загружаем или создаём прогресс
            await this.initProgress();
            
            return user;
        } catch (error) {
            console.error('Error initializing user:', error);
            return null;
        }
    }

    // Инициализация или создание прогресса
    async initProgress() {
        if (!this.currentUser) return null;

        try {
            let { data: progress, error } = await supabase
                .from('game_progress')
                .select()
                .eq('user_id', this.currentUser.id)
                .single();

            if (!progress) {
                const { data: newProgress, error: createError } = await supabase
                    .from('game_progress')
                    .insert([{
                        user_id: this.currentUser.id,
                        balance: 0,
                        energy: 100,
                        hourly_rate: 10
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                progress = newProgress;
            }

            if (this.onProgressUpdate) this.onProgressUpdate(progress);
            return progress;
        } catch (error) {
            console.error('Error initializing progress:', error);
            return null;
        }
    }

    // Обновление баланса
    async updateBalance(newBalance) {
        if (!this.currentUser) return false;

        try {
            const { data, error } = await supabase
                .from('game_progress')
                .update({ balance: newBalance })
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            if (this.onProgressUpdate) this.onProgressUpdate(data);
            return true;
        } catch (error) {
            console.error('Error updating balance:', error);
            return false;
        }
    }

    // Обновление энергии
    async updateEnergy(newEnergy) {
        if (!this.currentUser) return false;

        try {
            const { data, error } = await supabase
                .from('game_progress')
                .update({ energy: newEnergy })
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            if (this.onProgressUpdate) this.onProgressUpdate(data);
            return true;
        } catch (error) {
            console.error('Error updating energy:', error);
            return false;
        }
    }

    // Получение списка карточек
    async getCards() {
        try {
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
    }

    // Получение купленных карточек
    async getPurchasedCards() {
        if (!this.currentUser) return [];

        try {
            const { data, error } = await supabase
                .from('purchased_cards')
                .select(`
                    *,
                    cards (*)
                `)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return data.map(item => item.cards);
        } catch (error) {
            console.error('Error fetching purchased cards:', error);
            return [];
        }
    }

    // Покупка карточки
    async purchaseCard(cardId) {
        if (!this.currentUser) return false;

        try {
            const { error } = await supabase
                .from('purchased_cards')
                .insert([{
                    user_id: this.currentUser.id,
                    card_id: cardId
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error purchasing card:', error);
            return false;
        }
    }

    // Получение часового дохода
    async getHourlyRate() {
        if (!this.currentUser) return 0;

        try {
            const purchasedCards = await this.getPurchasedCards();
            const baseRate = 10; // Базовый доход
            const cardsRate = purchasedCards.reduce((sum, card) => sum + card.per_hour, 0);
            return baseRate + cardsRate;
        } catch (error) {
            console.error('Error calculating hourly rate:', error);
            return 0;
        }
    }

    // Обновление времени последнего сбора
    async updateLastCollectTime() {
        if (!this.currentUser) return false;

        try {
            const { error } = await supabase
                .from('game_progress')
                .update({ last_collect_time: new Date().toISOString() })
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating last collect time:', error);
            return false;
        }
    }
}

// Создаём и экспортируем экземпляр базы данных
window.gameDB = new GameDatabase();
