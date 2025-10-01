#!/bin/bash

# Быстрый деплой скрипт
echo "🔄 Добавляем все изменения..."
git add .

echo "📝 Создаем коммит..."
git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"

echo "🚀 Отправляем на GitHub..."
git push origin main

echo "✅ Готово! Изменения отправлены на GitHub"
