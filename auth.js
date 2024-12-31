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
        // Сначала попробуем получить структуру таблицы users
        console.log('Checking database structure...');
        const { error: structureError } = await window.supabaseClient
            .from('users')
            .select('id')
            .limit(1);

        if (structureError) {
            console.error('Database structure error:', structureError);
            showError('Ошибка базы данных. Пожалуйста, попробуйте позже.');
            return;
        }

        console.log('Creating new user...');
        // Создаем нового пользователя через Supabase Auth
        const { data: authData, error: signUpError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (signUpError) {
            console.error('Auth error:', signUpError);
            showError(signUpError.message);
            return;
        }

        if (authData && authData.user) {
            console.log('User created in Auth:', authData.user);

            try {
                // Создаем запись в таблице user_progress
                console.log('Creating user progress...');
                const { error: progressError } = await window.supabaseClient
                    .from('user_progress')
                    .insert([
                        {
                            user_id: authData.user.id,
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

                console.log('User progress created successfully');

                // Показываем сообщение об успешной регистрации
                alert('Регистрация успешна! Теперь вы можете войти в систему.');
                
                // Очищаем поля формы
                document.getElementById('regEmail').value = '';
                document.getElementById('regPassword').value = '';
                document.getElementById('regConfirmPassword').value = '';
                
                // Переключаемся на форму входа
                window.toggleForms();
            } catch (dbError) {
                console.error('Database error:', dbError);
                showError('Ошибка при создании профиля. Пожалуйста, попробуйте позже.');
            }
        }
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
        console.log('Attempting login...');
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login error:', error);
            if (error.message.includes('Invalid login credentials')) {
                showError('Неверный email или пароль');
            } else {
                showError(error.message);
            }
            return;
        }

        if (data && data.user) {
            console.log('Login successful:', data.user);

            try {
                // Получаем прогресс пользователя
                const { data: progressData, error: progressError } = await window.supabaseClient
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', data.user.id)
                    .single();

                if (progressError) {
                    console.error('Error fetching progress:', progressError);
                }

                // Сохраняем данные пользователя
                localStorage.setItem('currentUser', JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    progress: progressData || {}
                }));

                // Перенаправляем на главную страницу
                window.location.href = 'index.html';
            } catch (dbError) {
                console.error('Database error:', dbError);
                showError('Ошибка при получении данных пользователя');
            }
        }
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
