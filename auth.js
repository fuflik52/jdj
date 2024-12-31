// Инициализация Supabase
const supabase = window.supabase.createClient(
    'https://qgalbzidagyazfdvnfll.supabase.co',
    'eyJhbciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYWxiemlkYWd5YXpmZHZuZmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NDE0MDYsImV4cCI6MjA1MTIxNzQwNn0.G5sfdgJRvE3pzGPpJGUcRTuzlnP7a7Cw1kdxa0lJJEg'
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
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email: `${username}@koalagame.com`,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (signUpError) throw signUpError;

        if (user) {
            // Создание записи в таблице users
            const { error: userError } = await supabase
                .from('users')
                .insert([
                    {
                        id: user.id,
                        username: username,
                        web_user: true
                    }
                ]);

            if (userError) throw userError;

            // Создание начального прогресса
            const { error: progressError } = await supabase
                .from('user_progress')
                .insert([
                    {
                        user_id: user.id,
                        balance: 0,
                        energy: 100,
                        hourly_rate: 10
                    }
                ]);

            if (progressError) throw progressError;

            // Перенаправляем на игру
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Registration error:', error);
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
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: `${username}@koalagame.com`,
            password: password
        });

        if (error) throw error;

        if (user) {
            // Перенаправляем на игру
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Login error:', error);
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
