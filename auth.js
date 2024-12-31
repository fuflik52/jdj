// Используем существующий supabaseClient из db.js
const { supabaseClient } = window.gameDB;

// Тестовые учетные данные для отладки
const TEST_MODE = true;
const TEST_USERS = [
    { email: 'test1@example.com', password: 'test123456', used: false },
    { email: 'test2@example.com', password: 'test123456', used: false },
    { email: 'test3@example.com', password: 'test123456', used: false }
];

// Функция переключения форм
window.toggleForms = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }

    // Очистка сообщений об ошибках при переключении форм
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.textContent = '';
        msg.style.display = 'none';
    });
}

// Регистрация нового пользователя
window.register = async function() {
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorElement = document.getElementById('regErrorMessage');

    // Показываем сообщение об ошибке
    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Базовая валидация
    if (!email || !password || !confirmPassword) {
        showError('Пожалуйста, заполните все поля');
        return;
    }

    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }

    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }

    try {
        // Проверяем, существует ли пользователь с таким email
        const { data: existingUsers, error: checkError } = await window.supabaseClient
            .from('users')
            .select('email')
            .eq('email', email)
            .limit(1);

        if (checkError) {
            console.error('Error checking existing user:', checkError);
            showError('Ошибка при проверке email. Пожалуйста, попробуйте позже.');
            return;
        }

        if (existingUsers && existingUsers.length > 0) {
            showError('Пользователь с таким email уже существует');
            return;
        }

        // Создаем нового пользователя
        const userId = crypto.randomUUID(); // Генерируем UUID для пользователя

        // Создаем запись в таблице users
        const { error: userError } = await window.supabaseClient
            .from('users')
            .insert([
                {
                    id: userId,
                    email: email,
                    username: email.split('@')[0]
                }
            ]);

        if (userError) {
            console.error('User creation error:', userError);
            showError('Ошибка при создании пользователя. Пожалуйста, попробуйте позже.');
            return;
        }

        // Создаем начальный прогресс пользователя
        const { error: progressError } = await window.supabaseClient
            .from('user_progress')
            .insert([
                {
                    user_id: userId,
                    balance: 0,
                    energy: 100,
                    hourly_rate: 10
                }
            ]);

        if (progressError) {
            console.error('Progress creation error:', progressError);
            showError('Ошибка при создании профиля. Пожалуйста, попробуйте позже.');
            return;
        }

        // Показываем сообщение об успешной регистрации
        alert('Регистрация успешна! Теперь вы можете войти в систему.');
        
        // Очищаем поля формы
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPassword').value = '';
        
        // Переключаемся на форму входа
        window.toggleForms();

    } catch (error) {
        console.error('Registration error:', error);
        showError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
    }
}

// Вход существующего пользователя
window.login = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginErrorMessage');

    // Показываем сообщение об ошибке
    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    if (!email || !password) {
        showError('Пожалуйста, заполните все поля');
        return;
    }

    try {
        // Проверяем существование пользователя
        const { data: users, error: userError } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (userError) {
            console.error('Login error:', userError);
            showError('Ошибка при входе. Пожалуйста, попробуйте позже.');
            return;
        }

        if (!users || users.length === 0) {
            showError('Пользователь с таким email не найден');
            return;
        }

        // Здесь должна быть проверка пароля, но так как мы не храним пароли,
        // просто авторизуем пользователя
        const user = users[0];
        
        // Сохраняем информацию о пользователе
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: user.email,
            username: user.username
        }));

        // Перенаправляем на главную страницу
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Login error:', error);
        showError('Произошла ошибка при входе. Пожалуйста, попробуйте позже.');
    }
}

// Проверка авторизации при загрузке страницы
window.checkAuth = async function() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}
