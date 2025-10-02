#!/bin/bash

echo "🚀 Автоматическая загрузка изменений на GitHub..."

# Добавляем все изменения
git add .

# Создаем коммит с текущей датой
git commit -m "Автоматическое обновление: $(date '+%Y-%m-%d %H:%M:%S')"

# Отправляем на GitHub (нужна настройка аутентификации)
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Изменения успешно загружены на GitHub!"
    echo "🌐 Сайт обновится через 1-2 минуты: https://academintellekt-cmd.github.io/Senza/"
else
    echo "❌ Ошибка при загрузке. Используйте GitHub Desktop или веб-интерфейс."
fi

