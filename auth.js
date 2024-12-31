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

// Функция для проверки email
function isValidEmail(email) {
    // Базовая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Генерация UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
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

    if (!isValidEmail(email)) {
        showError('Пожалуйста, введите корректный email адрес');
        return;
    }

    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }

    if (password.length > 72) {
        showError('Пароль не может быть длиннее 72 символов');
        return;
    }

    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }

    try {
        console.log('Starting registration process...');

        // В тестовом режиме генерируем UUID вместо использования Supabase Auth
        const userId = TEST_MODE ? generateUUID() : null;
        let authData = null;

        if (!TEST_MODE) {
            // Создаем пользователя через Supabase Auth
            const { data, error: signUpError } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: email.split('@')[0]
                    }
                }
            });

            if (signUpError) {
                console.error('Auth error:', signUpError);
                if (signUpError.message.includes('rate limit')) {
                    showError('Превышен лимит регистраций. Пожалуйста, попробуйте позже.');
                } else if (signUpError.message.includes('invalid')) {
                    showError('Пожалуйста, используйте реальный email адрес');
                } else {
                    showError(signUpError.message);
                }
                return;
            }
            authData = data;
        }

        const user = TEST_MODE ? { id: userId, email: email } : authData.user;

        if (user) {
            console.log('User created:', user);

            try {
                // Проверяем, существует ли пользователь с таким email
                const { data: existingUser } = await window.supabaseClient
                    .from('users')
                    .select('email')
                    .eq('email', email)
                    .single();

                if (existingUser) {
                    showError('Пользователь с таким email уже существует');
                    return;
                }

                // Создаем запись в таблице users
                console.log('Creating user record...');
                const { error: userError } = await window.supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: user.id,
                            email: email,
                            username: email.split('@')[0]
                        }
                    ]);

                if (userError) {
                    console.error('User record creation error:', userError);
                    showError('Ошибка при создании пользователя. Пожалуйста, попробуйте позже.');
                    return;
                }

                console.log('User record created successfully');

                // Создаем запись в таблице user_progress
                console.log('Creating user progress...');
                const { error: progressError } = await window.supabaseClient
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
                    showError('Ошибка при создании профиля. Пожалуйста, попробуйте позже.');
                    return;
                }

                console.log('User progress created successfully');

                if (TEST_MODE) {
                    // В тестовом режиме сохраняем данные для входа
                    localStorage.setItem('testUser', JSON.stringify({
                        id: user.id,
                        email: email,
                        password: password
                    }));
                }

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

        if (TEST_MODE) {
            // В тестовом режиме проверяем сохраненные данные
            const testUser = JSON.parse(localStorage.getItem('testUser') || '{}');
            if (testUser.email === email && testUser.password === password) {
                // Получаем данные пользователя из базы
                const { data: userData, error: userError } = await window.supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', testUser.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user data:', userError);
                    showError('Ошибка при получении данных пользователя');
                    return;
                }

                // Получаем прогресс пользователя
                const { data: progressData, error: progressError } = await window.supabaseClient
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', testUser.id)
                    .single();

                if (progressError) {
                    console.error('Error fetching progress:', progressError);
                    showError('Ошибка при получении данных прогресса');
                    return;
                }

                // Сохраняем данные пользователя
                localStorage.setItem('currentUser', JSON.stringify({
                    id: testUser.id,
                    email: email,
                    username: userData.username,
                    progress: progressData || {}
                }));

                // Перенаправляем на главную страницу
                window.location.href = 'index.html';
            } else {
                showError('Неверный email или пароль');
            }
        } else {
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
                    // Получаем данные пользователя
                    const { data: userData, error: userError } = await window.supabaseClient
                        .from('users')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    if (userError) {
                        console.error('Error fetching user data:', userError);
                        showError('Ошибка при получении данных пользователя');
                        return;
                    }

                    // Получаем прогресс пользователя
                    const { data: progressData, error: progressError } = await window.supabaseClient
                        .from('user_progress')
                        .select('*')
                        .eq('user_id', data.user.id)
                        .single();

                    if (progressError) {
                        console.error('Error fetching progress:', progressError);
                        showError('Ошибка при получении данных прогресса');
                        return;
                    }

                    // Сохраняем данные пользователя
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: data.user.id,
                        email: data.user.email,
                        username: userData?.username || email.split('@')[0],
                        progress: progressData || {}
                    }));

                    // Перенаправляем на главную страницу
                    window.location.href = 'index.html';
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    showError('Ошибка при получении данных пользователя');
                }
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
