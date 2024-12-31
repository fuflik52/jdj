// Инициализация Supabase
const supabase = window.supabase.createClient(
    'https://qgalbzidagyazfdvnfll.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnYWxiemlkYWd5YXpmZHZuZmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NDE0MDYsImV4cCI6MjA1MTIxNzQwNn0.G5sfdgJRvE3pzGPpJGUcRTuzlnP7a7Cw1kdxa0lJJEg'
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
function showError(message, isRegistration = false) {
    const errorElement = document.getElementById(isRegistration ? 'regErrorMessage' : 'loginErrorMessage');
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Регистрация нового пользователя
async function register() {
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Валидация
    if (!email || !username || !password || !confirmPassword) {
        showError('Пожалуйста, заполните все поля', true);
        return;
    }

    if (username.length < 3) {
        showError('Имя пользователя должно содержать минимум 3 символа', true);
        return;
    }

    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов', true);
        return;
    }

    if (password !== confirmPassword) {
        showError('Пароли не совпадают', true);
        return;
    }

    try {
        console.log('Attempting registration with:', email);
        
        // Регистрация пользователя
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (signUpError) {
            console.error('Registration error:', signUpError);
            throw signUpError;
        }

        if (user) {
            console.log('Registration successful:', user);
            
            // Создание записи в таблице users
            const { error: userError } = await supabase
                .from('users')
                .insert([
                    {
                        id: user.id,
                        username: username,
                        email: email,
                        web_user: true
                    }
                ]);

            if (userError) {
                console.error('User creation error:', userError);
                throw userError;
            }

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

            if (progressError) {
                console.error('Progress creation error:', progressError);
                throw progressError;
            }

            // Показываем сообщение об успешной регистрации
            showError('Регистрация успешна! Проверьте вашу почту для подтверждения.', true);
            
            // Через 2 секунды переключаемся на форму входа
            setTimeout(() => {
                toggleForms();
            }, 2000);
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message.includes('duplicate key')) {
            showError('Пользователь с таким email уже существует', true);
        } else {
            showError(error.message, true);
        }
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
        console.log('Attempting login with:', username);
        
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: 'test2@example.com',  // Используем тестовый email
            password: password
        });

        if (error) {
            console.error('Login error:', error);
            throw error;
        }

        if (user) {
            console.log('Login successful:', user);
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
    
    if (error) {
        console.error('Auth check error:', error);
    }
    
    if (session) {
        console.log('User is already authenticated:', session);
        window.location.href = 'index.html';
    }
}

// Проверяем авторизацию при загрузке страницы
checkAuth();
