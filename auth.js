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
        console.error('Registration error:', message);
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
                // Проверяем существование пользователя
                console.log('Checking for existing user...');
                const exists = await window.gameDB.checkUserExists(email);
                if (exists) {
                    showError('Пользователь с таким email уже существует');
                    return;
                }

                // Создаем пользователя
                console.log('Creating user record...');
                const userData = await window.gameDB.createUser({
                    id: user.id,
                    email: email,
                    username: email.split('@')[0]
                });

                console.log('User record created successfully');

                // Создаем прогресс пользователя
                console.log('Creating user progress...');
                const progressData = await window.gameDB.createUserProgress({
                    user_id: user.id,
                    balance: 0,
                    energy: 100,
                    hourly_rate: 10
                });

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
                if (dbError.message.includes('duplicate key')) {
                    showError('Пользователь с таким email уже существует');
                } else if (dbError.message.includes('permission denied')) {
                    showError('Ошибка доступа к базе данных. Пожалуйста, обратитесь к администратору.');
                } else {
                    showError('Ошибка при создании профиля. Пожалуйста, попробуйте позже.');
                }
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message.includes('permission denied')) {
            showError('Ошибка доступа к базе данных. Пожалуйста, обратитесь к администратору.');
        } else {
            showError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
        }
    }
}

// Вход существующего пользователя
window.login = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginErrorMessage');

    // Показываем сообщение об ошибке
    function showError(message) {
        console.error('Login error:', message);
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
                try {
                    // Получаем данные пользователя из базы
                    console.log('Fetching user data...');
                    const userData = await window.gameDB.getUserData(testUser.id);
                    console.log('User data:', userData);

                    console.log('Fetching user progress...');
                    const progressData = await window.gameDB.getUserProgress(testUser.id);
                    console.log('User progress:', progressData);

                    // Сохраняем данные пользователя
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: testUser.id,
                        email: email,
                        username: userData.username,
                        progress: progressData || {}
                    }));

                    // Перенаправляем на главную страницу
                    window.location.href = 'index.html';
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    if (dbError.message.includes('permission denied')) {
                        showError('Ошибка доступа к базе данных. Пожалуйста, обратитесь к администратору.');
                    } else {
                        showError('Ошибка при получении данных пользователя');
                    }
                }
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
                    console.log('Fetching user data...');
                    const userData = await window.gameDB.getUserData(data.user.id);
                    console.log('User data:', userData);

                    console.log('Fetching user progress...');
                    const progressData = await window.gameDB.getUserProgress(data.user.id);
                    console.log('User progress:', progressData);

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
                    if (dbError.message.includes('permission denied')) {
                        showError('Ошибка доступа к базе данных. Пожалуйста, обратитесь к администратору.');
                    } else {
                        showError('Ошибка при получении данных пользователя');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('permission denied')) {
            showError('Ошибка доступа к базе данных. Пожалуйста, обратитесь к администратору.');
        } else {
            showError('Произошла ошибка при входе. Пожалуйста, попробуйте позже.');
        }
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
