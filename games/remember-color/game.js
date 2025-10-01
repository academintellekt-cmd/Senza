// Запомни цвет - полноэкранная версия
(() => {
  // Цвета из брендбука сайта
  const COLORS = [
    { name: 'red', value: '#FE112E', display: 'Красный' },
    { name: 'blue', value: '#1E6FE3', display: 'Синий' },
    { name: 'green', value: '#2ED573', display: 'Зелёный' },
    { name: 'yellow', value: '#FFE23F', display: 'Жёлтый' },
    { name: 'cyan', value: '#17A2B8', display: 'Голубой' },
    { name: 'purple', value: '#A55EEA', display: 'Фиолетовый' },
    { name: 'orange', value: '#FE7800', display: 'Оранжевый' }
  ];

  // Уровни сложности
  const DIFFICULTIES = [
    { level: 2, name: 'Лёгкий', count: 2 },
    { level: 4, name: 'Средний', count: 4 },
    { level: 6, name: 'Высокий', count: 6 },
    { level: 8, name: 'Экстра', count: 8 },
    { level: 10, name: 'Вассерман', count: 10 }
  ];

  // Состояние игры
  const gameState = {
    currentDifficulty: 2,
    targetColor: null,
    targetPositions: [],
    playerSelections: [],
    gamePhase: 'selecting', // 'selecting', 'showing-target', 'showing-field', 'remembering', 'checking', 'finished'
    score: 0,
    level: 1,
    isPlaying: false,
    showDuration: 3000, // 3 секунды
    allCells: Array.from({length: 25}, (_, i) => i), // индексы всех клеток поля
    isWin: false // флаг для различения победы и поражения
  };

  // DOM элементы
  let stage, gameField, colorSample;
  let hudCheckTop, hudCheckBottom;

  // Инициализация игры
  function initGame() {
    stage = document.getElementById('stage');
    if (!stage) return;

    // Скрываем модальное окно результатов при инициализации
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;

    createGameInterface();
    updateDisplay();
    bindEvents();
    showDifficultyModal();
  }

  // Создание игрового интерфейса
  function createGameInterface() {
    stage.innerHTML = `
      <div class="game-field" id="gameField" style="display: none;">
        <!-- 25 клеток будут созданы динамически -->
      </div>
      
      <div class="color-sample" id="colorSample" style="display: none;"></div>
    `;

    // Обновляем ссылки на элементы
    gameField = document.getElementById('gameField');
    colorSample = document.getElementById('colorSample');
    
    // Получаем ссылки на HUD элементы
    hudCheckTop = document.getElementById('hudCheckTop');
    hudCheckBottom = document.getElementById('hudCheckBottom');
  }

  // Показ модального окна выбора сложности
  function showDifficultyModal() {
    // Сначала скрываем модальное окно результатов
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    // Показываем модальное окно выбора сложности
    const modal = document.getElementById('difficultyModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  // Скрытие модального окна выбора сложности
  function hideDifficultyModal() {
    const modal = document.getElementById('difficultyModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Привязка событий
  function bindEvents() {
    // Выбор сложности в модальном окне
    const difficultyOptions = document.querySelectorAll('.difficulty-option');
    difficultyOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const level = parseInt(e.currentTarget.dataset.level);
        setDifficulty(level);
        hideDifficultyModal();
        startGame();
      });
    });

    // Кнопки проверки в HUD
    if (hudCheckTop) hudCheckTop.addEventListener('click', checkSelection);
    if (hudCheckBottom) hudCheckBottom.addEventListener('click', checkSelection);

    // Кнопки "Новая партия" в HUD
    const btnNewTop = document.getElementById('btnNewTop');
    const btnNewBottom = document.getElementById('btnNewBottom');
    const btnRematch = document.getElementById('btnRematch');
    const btnToMenu = document.getElementById('btnToMenu');
    
    if (btnNewTop) btnNewTop.addEventListener('click', resetGame);
    if (btnNewBottom) btnNewBottom.addEventListener('click', resetGame);
    
    // Кнопки "Меню" в HUD
    const btnBackTop = document.getElementById('btnBackTop');
    const btnBackBottom = document.getElementById('btnBackBottom');
    
    if (btnBackTop) btnBackTop.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
    if (btnBackBottom) btnBackBottom.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
    if (btnRematch) btnRematch.addEventListener('click', () => {
      // Скрываем модальное окно
      const modalBackdrop = document.getElementById('modalBackdrop');
      if (modalBackdrop) modalBackdrop.hidden = true;
      
      // Проверяем, это победа или поражение
      if (gameState.isWin) {
        // Победа - переходим к следующему уровню
        nextLevel();
      } else {
        // Поражение - начинаем новую игру
        resetGame();
      }
    });
    if (btnToMenu) btnToMenu.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }

  // Установка сложности
  function setDifficulty(level) {
    gameState.currentDifficulty = level;
    updateDisplay();
  }

  // Начало игры
  function startGame() {
    gameState.isPlaying = true;
    gameState.gamePhase = 'showing-target';
    gameState.playerSelections = [];
    gameState.targetPositions = [];
    gameState.level = 1;

    // Выбираем случайный целевой цвет
    gameState.targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // Выбираем N случайных позиций для целевого цвета
    const availablePositions = [...gameState.allCells];
    gameState.targetPositions = [];
    
    for (let i = 0; i < gameState.currentDifficulty; i++) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      gameState.targetPositions.push(availablePositions.splice(randomIndex, 1)[0]);
    }
    
    updateDisplay();
    showTargetColor();
  }

  // Показ эталона цвета
  async function showTargetColor() {
    // Показываем четкое состояние с подсветкой слова "цвет"
    const turnLabelTop = document.getElementById('turnLabelTop');
    const turnLabelBottom = document.getElementById('turnLabelBottom');
    
    if (turnLabelTop) {
      turnLabelTop.innerHTML = `🎨 Запомни цвет <span style="color: ${gameState.targetColor.value}; font-weight: bold;">${gameState.targetColor.display}</span>`;
    }
    if (turnLabelBottom) {
      turnLabelBottom.innerHTML = `🎨 Запомни цвет <span style="color: ${gameState.targetColor.value}; font-weight: bold;">${gameState.targetColor.display}</span>`;
    }
    
    colorSample.style.backgroundColor = gameState.targetColor.value;
    colorSample.style.display = 'block';
    colorSample.classList.add('showing');
    
    await sleep(gameState.showDuration);
    
    colorSample.classList.remove('showing');
    colorSample.style.display = 'none';
    
    // Переходим к показу поля
    showGameField();
  }

  // Показ поля с цветами
  async function showGameField() {
    createGameField();
    gameField.style.display = 'grid';
    
    // Раскрашиваем поле
    const cells = gameField.querySelectorAll('.field-cell');
    const otherColors = COLORS.filter(c => c !== gameState.targetColor);
    
    cells.forEach((cell, index) => {
      if (gameState.targetPositions.includes(index)) {
        // Целевые позиции
        cell.style.backgroundColor = gameState.targetColor.value;
        cell.style.color = gameState.targetColor.value === '#FFFFFF' ? '#000000' : '#FFFFFF';
      } else {
        // Остальные позиции - случайные цвета, но не целевой
        const randomColor = otherColors[Math.floor(Math.random() * otherColors.length)];
        cell.style.backgroundColor = randomColor.value;
        cell.style.color = randomColor.value === '#FFFFFF' ? '#000000' : '#FFFFFF';
      }
    });
    
    await sleep(gameState.showDuration);
    
    // Очищаем поле
    clearField();
    
    // Переходим к фазе запоминания
    gameState.gamePhase = 'remembering';
    
    // Показываем четкое состояние
    updateHUDInfo(`Найдите ${gameState.currentDifficulty} ${gameState.targetColor.display} клетки`);
    
    // Показываем кнопку проверки в HUD
    showHUDCheckButton();
    
    // Включаем интерактивность
    enableFieldInteraction();
    updateSelectionStatus();
  }

  // Создание игрового поля
  function createGameField() {
    gameField.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('div');
      cell.className = 'field-cell';
      cell.dataset.index = i;
      cell.style.backgroundColor = 'var(--neutral-color)';
      cell.style.color = 'var(--text)';
      gameField.appendChild(cell);
    }
  }

  // Очистка поля
  function clearField() {
    const cells = gameField.querySelectorAll('.field-cell');
    cells.forEach(cell => {
      cell.style.backgroundColor = 'var(--neutral-color)';
      cell.style.color = 'var(--text)';
      cell.classList.remove('selected', 'correct', 'wrong');
    });
  }

  // Включение интерактивности поля
  function enableFieldInteraction() {
    const cells = gameField.querySelectorAll('.field-cell');
    cells.forEach(cell => {
      cell.addEventListener('click', handleCellClick);
    });
  }

  // Обработка клика по клетке
  function handleCellClick(e) {
    if (gameState.gamePhase !== 'remembering') return;
    
    const cell = e.target;
    const index = parseInt(cell.dataset.index);
    
    if (gameState.playerSelections.includes(index)) {
      // Убираем из выбора
      gameState.playerSelections = gameState.playerSelections.filter(i => i !== index);
      cell.classList.remove('selected');
    } else {
      // Добавляем в выбор
      if (gameState.playerSelections.length < gameState.currentDifficulty) {
        gameState.playerSelections.push(index);
        cell.classList.add('selected');
      }
    }
    
    updateSelectionStatus();
  }

  // Обновление статуса выбора
  function updateSelectionStatus() {
    const selected = gameState.playerSelections.length;
    const needed = gameState.currentDifficulty;
    
    // Показываем прогресс в HUD с подсветкой цвета
    const turnLabelTop = document.getElementById('turnLabelTop');
    const turnLabelBottom = document.getElementById('turnLabelBottom');
    
    if (turnLabelTop) {
      turnLabelTop.innerHTML = `Выбрано ${selected} из ${needed} <span style="color: ${gameState.targetColor.value}; font-weight: bold;">${gameState.targetColor.display}</span> клеток`;
    }
    if (turnLabelBottom) {
      turnLabelBottom.innerHTML = `Выбрано ${selected} из ${needed} <span style="color: ${gameState.targetColor.value}; font-weight: bold;">${gameState.targetColor.display}</span> клеток`;
    }
    
    if (selected === needed) {
      // Включаем кнопки проверки
      if (hudCheckTop) hudCheckTop.disabled = false;
      if (hudCheckBottom) hudCheckBottom.disabled = false;
    } else {
      // Отключаем кнопки проверки
      if (hudCheckTop) hudCheckTop.disabled = true;
      if (hudCheckBottom) hudCheckBottom.disabled = true;
    }
  }

  // Проверка выбора
  function checkSelection() {
    gameState.gamePhase = 'checking';
    
    // Показываем четкое состояние
    updateHUDInfo('Проверяем ваш выбор...');
    
    // Сравниваем выбор с целевыми позициями
    const correct = gameState.playerSelections.filter(pos => 
      gameState.targetPositions.includes(pos)
    );
    const wrong = gameState.playerSelections.filter(pos => 
      !gameState.targetPositions.includes(pos)
    );
    const missed = gameState.targetPositions.filter(pos => 
      !gameState.playerSelections.includes(pos)
    );
    
    // Показываем результат
    showResult(correct, wrong, missed);
  }

  // Показ результата
  function showResult(correct, wrong, missed) {
    const cells = gameField.querySelectorAll('.field-cell');
    
    // Подсвечиваем правильные
    correct.forEach(index => {
      const cell = cells[index];
      cell.classList.add('correct');
      cell.style.backgroundColor = gameState.targetColor.value;
      cell.style.color = gameState.targetColor.value === '#FFFFFF' ? '#000000' : '#FFFFFF';
    });
    
    // Подсвечиваем ошибки
    wrong.forEach(index => {
      const cell = cells[index];
      cell.classList.add('wrong');
    });
    
    // Подсвечиваем пропущенные
    missed.forEach(index => {
      const cell = cells[index];
      cell.classList.add('correct');
      cell.style.backgroundColor = gameState.targetColor.value;
      cell.style.color = gameState.targetColor.value === '#FFFFFF' ? '#000000' : '#FFFFFF';
    });
    
    // Определяем результат
    const isPerfect = wrong.length === 0 && missed.length === 0;
    
    if (isPerfect) {
      gameState.score += gameState.currentDifficulty * 10;
      gameState.level++;
      gameState.isWin = true; // Устанавливаем флаг победы
      
      updateHUDInfo('Отлично! Все правильно!');
      
      setTimeout(() => {
        // Автоматически переходим к следующему уровню без модального окна
        nextLevel();
      }, 2000);
    } else {
      gameState.isWin = false; // Устанавливаем флаг поражения
      updateHUDInfo(`Правильно: ${correct.length}, Ошибок: ${wrong.length}, Пропущено: ${missed.length}`);
      
      setTimeout(() => {
        endGame();
      }, 3000);
    }
    
    // Скрываем кнопки проверки
    hideHUDCheckButton();
    updateDisplay();
  }

  // Следующий уровень
  function nextLevel() {
    gameState.targetPositions = [];
    gameState.playerSelections = [];
    gameState.gamePhase = 'showing-target';
    
    // Скрываем модальное окно
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    // Скрываем поле
    if (gameField) gameField.style.display = 'none';
    
    // Увеличиваем сложность каждые 3 уровня
    if (gameState.level % 3 === 0 && gameState.currentDifficulty < 10) {
      gameState.currentDifficulty = Math.min(10, gameState.currentDifficulty + 2);
    }
    
    // Выбираем новый цвет и позиции
    gameState.targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const availablePositions = [...gameState.allCells];
    gameState.targetPositions = [];
    
    for (let i = 0; i < gameState.currentDifficulty; i++) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      gameState.targetPositions.push(availablePositions.splice(randomIndex, 1)[0]);
    }
    
    updateDisplay();
    showTargetColor();
  }

  // Завершение игры
  function endGame() {
    gameState.isPlaying = false;
    gameState.gamePhase = 'finished';
    
    // Скрываем HUD элементы
    hideHUDCheckButton();
    
    // Показываем сообщение "Давай сыграем еще?" в HUD
    updateHUDInfo('Давай сыграем еще?');
    
    // Показываем модальное окно с результатами
    showEndModal();
  }

  // Показ модального окна с результатами
  function showEndModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    
    if (modalBackdrop && modalTitle && modalSubtitle) {
      modalTitle.textContent = 'Игра окончена!';
      modalSubtitle.textContent = `Финальный счёт: ${gameState.score} очков, пройдено ${gameState.level - 1} уровней`;
      modalBackdrop.hidden = false;
    }
  }

  // Показ модального окна с победой
  function showWinModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    
    if (modalBackdrop && modalTitle && modalSubtitle) {
      modalTitle.textContent = '🎉 Поздравляем!';
      modalSubtitle.textContent = `Уровень ${gameState.level - 1} пройден! Переходим к уровню ${gameState.level}! Счёт: ${gameState.score} очков`;
      modalBackdrop.hidden = false;
      
      // НЕ устанавливаем gamePhase в 'finished' для победы
      // gameState.gamePhase остается в текущем состоянии
    }
  }

  // Сброс игры
  function resetGame() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.targetPositions = [];
    gameState.playerSelections = [];
    gameState.gamePhase = 'selecting';
    gameState.isPlaying = false;
    gameState.isWin = false;
    
    // Скрываем модальные окна
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    // Скрываем игровые элементы
    if (gameField) gameField.style.display = 'none';
    if (colorSample) colorSample.style.display = 'none';
    
    // Скрываем HUD элементы
    hideHUDCheckButton();
    
    // Показываем выбор сложности
    showDifficultyModal();
    updateDisplay();
  }

  // Обновление отображения
  function updateDisplay() {
    // Обновляем уровень
    const scoreTop = document.getElementById('scoreTop');
    const scoreBottom = document.getElementById('scoreBottom');
    if (scoreTop) scoreTop.textContent = `Уровень: ${gameState.level}`;
    if (scoreBottom) scoreBottom.textContent = `Уровень: ${gameState.level}`;
    
    // Обновляем основную информацию в HUD только если игра не активна
    if (!gameState.isPlaying) {
      const turnLabelTop = document.getElementById('turnLabelTop');
      const turnLabelBottom = document.getElementById('turnLabelBottom');
      
      if (turnLabelTop) turnLabelTop.textContent = '🎨 Запомни цвет';
      if (turnLabelBottom) turnLabelBottom.textContent = '🎨 Запомни цвет';
    }
  }

  // Вспомогательная функция задержки
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Обновление информации в HUD
  function updateHUDInfo(text) {
    const turnLabelTop = document.getElementById('turnLabelTop');
    const turnLabelBottom = document.getElementById('turnLabelBottom');
    
    if (turnLabelTop) turnLabelTop.textContent = text;
    if (turnLabelBottom) turnLabelBottom.textContent = text;
  }

  // Показ кнопки проверки в HUD
  function showHUDCheckButton() {
    if (hudCheckTop) hudCheckTop.style.display = 'block';
    if (hudCheckBottom) hudCheckBottom.style.display = 'block';
  }

  // Скрытие кнопки проверки в HUD
  function hideHUDCheckButton() {
    if (hudCheckTop) hudCheckTop.style.display = 'none';
    if (hudCheckBottom) hudCheckBottom.style.display = 'none';
  }

  // Принудительное скрытие модального окна результатов при загрузке
  document.addEventListener('DOMContentLoaded', () => {
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.hidden = true;
      modalBackdrop.style.display = 'none';
    }
    initGame();
  });
  
  // Экспорт для глобального доступа
  window.rememberColorGame = {
    startGame,
    setDifficulty,
    getScore: () => gameState.score,
    getLevel: () => gameState.level
  };
})();