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

// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

    // Валидация
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

    if (password !== confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }

    try {
        console.log('Attempting registration with email:', email);
        
        // Регистрация пользователя
        const { data: { user }, error: signUpError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (signUpError) {
            console.error('Registration error:', signUpError);
            if (signUpError.message.includes('already registered')) {
                showError('Этот email уже зарегистрирован');
            } else {
                showError(signUpError.message);
            }
            return;
        }

        if (user) {
            console.log('User registered:', user);

            try {
                // Создаем запись в таблице users
                const { error: userError } = await window.supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: user.id,
                            email: email,
                            username: email.split('@')[0]
                        }
                    ]);

                if (userError) throw userError;

                // Создаем начальный прогресс пользователя
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

                if (progressError) throw progressError;

                // Показываем сообщение об успешной регистрации
                alert('Регистрация успешна! Теперь вы можете войти в систему.');
                
                // Переключаемся на форму входа
                window.toggleForms();
                
                // Очищаем поля формы регистрации
                document.getElementById('regEmail').value = '';
                document.getElementById('regPassword').value = '';
                document.getElementById('regConfirmPassword').value = '';
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

    if (!isValidEmail(email)) {
        showError('Пожалуйста, введите корректный email адрес');
        return;
    }

    try {
        console.log('Attempting login with email:', email);
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login error:', error);
            if (error.message.includes('Invalid login credentials')) {
                showError('Неверный email или пароль');
            } else if (error.message.includes('Email not confirmed')) {
                showError('Пожалуйста, подтвердите ваш email перед входом. Проверьте почту.');
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
