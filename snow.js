function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // Случайная начальная позиция по горизонтали
    snowflake.style.left = Math.random() * 100 + 'vw';
    
    // Случайный размер
    const size = Math.random() * 5 + 5;
    snowflake.style.width = size + 'px';
    snowflake.style.height = size + 'px';
    
    // Случайная прозрачность
    snowflake.style.opacity = Math.random() * 0.6 + 0.4;
    
    // Случайная продолжительность падения
    const duration = Math.random() * 3 + 2;
    snowflake.style.animation = `fall ${duration}s linear forwards`;
    
    document.body.appendChild(snowflake);
    
    // Удаляем снежинку после завершения анимации
    setTimeout(() => {
        snowflake.remove();
    }, duration * 1000);
}

// Создаем снежинки с интервалом
setInterval(createSnowflake, 100);
