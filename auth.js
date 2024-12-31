// Инициализация Supabase
const supabase = window.supabase.createClient(
    'https://qgalbzidagyazfdvnfll.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYWxiemlkYWd5YXpmZHZuZmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM5MjgxNzAsImV4cCI6MjAxOTUwNDE3MH0.qgZBGvZMXDOLmhqTyPKrqSEqDvXfvGNYiDw_7zBo1Vc'
);

// Переключение между формами входа и регистрации
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
}

// Показ сообщения об ошибке
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Регистрация нового пользователя
async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (!username || !password) {
        showError('Пожалуйста, заполните все поля');
        return;
    }

    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }

    try {
        // Регистрация пользователя
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `${username}@koalagame.com`,
            password: password
        });

        if (authError) throw authError;

        // Создание записи в таблице users
        const { error: userError } = await supabase
            .from('users')
            .insert([
                {
                    username: username,
                    web_user: true,
                    balance: 0,
                    energy: 100
                }
            ]);

        if (userError) throw userError;

        // Создание начального прогресса
        const { error: progressError } = await supabase
            .from('user_progress')
            .insert([
                {
                    user_id: authData.user.id,
                    balance: 0,
                    energy: 100,
                    hourly_rate: 10
                }
            ]);

        if (progressError) throw progressError;

        // Сохраняем данные пользователя
        localStorage.setItem('user_id', authData.user.id);
        localStorage.setItem('username', username);

        // Перенаправляем на игру
        window.location.href = 'index.html';
    } catch (error) {
        showError(error.message);
    }
}

// Вход существующего пользователя
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showError('Пожалуйста, заполните все поля');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: `${username}@koalagame.com`,
            password: password
        });

        if (error) throw error;

        // Сохраняем данные пользователя
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('username', username);

        // Перенаправляем на игру
        window.location.href = 'index.html';
    } catch (error) {
        showError('Неверное имя пользователя или пароль');
    }
}

// Проверяем, авторизован ли пользователь
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
        window.location.href = 'index.html';
    }
}

// Проверяем авторизацию при загрузке страницы
checkAuth();
