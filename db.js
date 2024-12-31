// Инициализация Supabase
const SUPABASE_URL = 'https://qgalbzidagyazfdvnfll.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYWxiemlkYWd5YXpmZHZuZmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM4NTM1MTAsImV4cCI6MjAxOTQyOTUxMH0.JVG33zXYj1LxqwboJ3XKpxgikc-1q_wX1R4ORXGkwBE';

// Создаем клиент Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Класс для работы с базой данных
class GameDB {
    constructor() {
        // Инициализация
        this.currentUser = null;
        this.isTelegramUser = window.tg && window.tg.initDataUnsafe && window.tg.initDataUnsafe.user;
    }

    // Получение текущего пользователя
    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            if (this.isTelegramUser) {
                // Для пользователей Telegram
                const telegramUser = window.tg.initDataUnsafe.user;
                const { data: users, error } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('telegram_id', telegramUser.id)
                    .single();

                if (error) throw error;

                if (!users) {
                    // Создаем нового пользователя
                    const { data: newUser, error: createError } = await supabaseClient
                        .from('users')
                        .insert([
                            {
                                telegram_id: telegramUser.id,
                                username: telegramUser.username || `user_${telegramUser.id}`,
                                first_name: telegramUser.first_name,
                                last_name: telegramUser.last_name,
                                web_user: false
                            }
                        ])
                        .select()
                        .single();

                    if (createError) throw createError;

                    // Создаем начальный прогресс
                    await supabaseClient
                        .from('user_progress')
                        .insert([
                            {
                                user_id: newUser.id,
                                balance: 0,
                                energy: 100,
                                hourly_rate: 10
                            }
                        ]);

                    this.currentUser = newUser;
                } else {
                    this.currentUser = users;
                }
            } else {
                // Для веб пользователей
                const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
                if (authError) throw authError;
                if (!user) throw new Error('User not authenticated');

                const { data: userData, error: userError } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (userError) throw userError;
                this.currentUser = userData;
            }

            return this.currentUser;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    // Получение прогресса пользователя
    async getUserProgress() {
        try {
            const user = await this.getCurrentUser();
            const { data: progress, error } = await supabaseClient
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return progress;
        } catch (error) {
            console.error('Error getting user progress:', error);
            throw error;
        }
    }

    // Обновление баланса пользователя
    async updateBalance(newBalance) {
        try {
            const user = await this.getCurrentUser();
            const { error } = await supabaseClient
                .from('user_progress')
                .update({ balance: newBalance })
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating balance:', error);
            throw error;
        }
    }

    // Обновление энергии пользователя
    async updateEnergy(newEnergy) {
        try {
            const user = await this.getCurrentUser();
            const { error } = await supabaseClient
                .from('user_progress')
                .update({ energy: newEnergy })
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating energy:', error);
            throw error;
        }
    }

    // Выход из системы
    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    }
}

// Создаем глобальный экземпляр GameDB
window.gameDB = new GameDB();
