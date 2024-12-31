// Класс для работы с базой данных GitHub
class GitHubDatabase {
    constructor() {
        this.supabaseUrl = 'https://qgalbzidagyazfdvnfll.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYWxiemlkYWd5YXpmZHZuZmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM5MjgxNzAsImV4cCI6MjAxOTUwNDE3MH0.qgZBGvZMXDOLmhqTyPKrqSEqDvXfvGNYiDw_7zBo1Vc';
        this.currentUser = null;
        this.initSupabase();
    }

    // Инициализация Supabase
    async initSupabase() {
        try {
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.1/+esm');
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
        }
    }

    // Создание нового пользователя или получение существующего
    async getOrCreateUser(username) {
        try {
            // Проверяем существование пользователя
            let { data: user, error } = await this.supabase
                .from('users')
                .select()
                .eq('username', username)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // Если пользователь не найден, создаем нового
            if (!user) {
                const { data: newUser, error: createError } = await this.supabase
                    .from('users')
                    .insert([{ username }])
                    .select()
                    .single();

                if (createError) throw createError;
                user = newUser;
            }

            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Error in getOrCreateUser:', error);
            return null;
        }
    }

    // Сохранение прогресса игры
    async saveGameProgress(data) {
        if (!this.currentUser) return false;

        try {
            const { error } = await this.supabase
                .from('game_progress')
                .insert([{
                    user_id: this.currentUser.id,
                    balance: data.balance,
                    energy: data.energy,
                    purchased_cards: data.purchasedCards
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving game progress:', error);
            return false;
        }
    }

    // Загрузка прогресса игры
    async loadGameProgress() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabase
                .from('game_progress')
                .select()
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error loading game progress:', error);
            return null;
        }
    }

    // Обновление баланса пользователя
    async updateBalance(balance) {
        if (!this.currentUser) return false;

        try {
            const { error } = await this.supabase
                .from('game_progress')
                .insert([{
                    user_id: this.currentUser.id,
                    balance: balance
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating balance:', error);
            return false;
        }
    }

    // Сохранение купленной карточки
    async savePurchasedCard(card) {
        if (!this.currentUser) return false;

        try {
            const { error } = await this.supabase
                .from('purchased_cards')
                .insert([{
                    user_id: this.currentUser.id,
                    card_id: card.id,
                    card_data: card
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving purchased card:', error);
            return false;
        }
    }

    // Загрузка купленных карточек
    async loadPurchasedCards() {
        if (!this.currentUser) return [];

        try {
            const { data, error } = await this.supabase
                .from('purchased_cards')
                .select('card_data')
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return data?.map(item => item.card_data) || [];
        } catch (error) {
            console.error('Error loading purchased cards:', error);
            return [];
        }
    }

    // Сохранение энергии
    async saveEnergy(energy) {
        if (!this.currentUser) return false;

        try {
            const { error } = await this.supabase
                .from('game_progress')
                .insert([{
                    user_id: this.currentUser.id,
                    energy: energy
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving energy:', error);
            return false;
        }
    }

    // Получение таблицы лидеров
    async getLeaderboard() {
        try {
            const { data, error } = await this.supabase
                .from('game_progress')
                .select(`
                    balance,
                    users (username)
                `)
                .order('balance', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }
}

// Создаем и экспортируем экземпляр базы данных
window.githubDB = new GitHubDatabase();
