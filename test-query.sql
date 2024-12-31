-- Проверяем карточки
select * from cards;

-- Проверяем политики безопасности
select * from pg_policies where schemaname = 'public';
