// Используем существующий supabaseClient из db.js
const { supabaseClient } = window.gameDB;

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
        // Регистрация пользователя
        const { data, error: signUpError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (signUpError) {
            console.error('Registration error:', signUpError);
            showError(signUpError.message);
            return;
        }

        if (data.user) {
            // Автоматически входим после регистрации
            const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (signInError) {
                console.error('Sign in error:', signInError);
                showError('Регистрация успешна, но возникла ошибка при входе. Попробуйте войти вручную.');
                window.toggleForms();
                return;
            }

            try {
                // Создаем запись в таблице users
                const { error: userError } = await window.supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: data.user.id,
                            email: email,
                            username: email.split('@')[0]
                        }
                    ]);

                if (userError) {
                    console.error('User creation error:', userError);
                }

                // Создаем начальный прогресс пользователя
                const { error: progressError } = await window.supabaseClient
                    .from('user_progress')
                    .insert([
                        {
                            user_id: data.user.id,
                            balance: 0,
                            energy: 100,
                            hourly_rate: 10
                        }
                    ]);

                if (progressError) {
                    console.error('Progress creation error:', progressError);
                }

                // Перенаправляем на главную страницу
                window.location.href = 'index.html';
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
        } else {
            // Успешный вход
            window.location.href = 'index.html';
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

