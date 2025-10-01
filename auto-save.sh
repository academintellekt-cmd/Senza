#!/bin/bash

# Проверяем есть ли изменения
if [ -n "$(git status --porcelain)" ]; then
    echo "🔄 Найдены изменения, сохраняем автоматически..."
    
    # Добавляем все изменения
    git add .
    
    # Создаем коммит с временной меткой
    git commit -m "Auto-save: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Отправляем на GitHub
    git push origin main
    
    echo "✅ Автоматическое сохранение завершено"
else
    echo "ℹ️  Изменений не найдено"
fi
