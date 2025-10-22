// САМОЛЕТЫ - полноэкранная версия
(() => {
  // КОНФИГУРАЦИЯ ИГРЫ
  const GAME_CONFIG = {
    name: 'Самолеты',
    icon: '✈️',
    colors: [
      { name: 'red', value: '#FE112E', display: 'Красный' },
      { name: 'green', value: '#2ED573', display: 'Зелёный' },
      { name: 'yellow', value: '#FFE23F', display: 'Жёлтый' },
      { name: 'blue', value: '#1E6FE3', display: 'Синий' }
    ],
    planeSpeed: 2, // Скорость самолетов (пикселей за кадр)
    bulletSpeed: 4, // Скорость пуль (в 2 раза больше самолетов)
    gameLoopInterval: 50 // Интервал обновления игры (мс)
  };

  // СОСТОЯНИЕ ИГРЫ
  const gameState = {
    currentPlayers: 2,
    isPlaying: false,
    gamePhase: 'selecting',
    isWin: false,
    gameLoop: null,
    field: null,
    planes: [],
    bullets: [],
    explosions: [],
    gameStartTime: 0
  };

  // DOM ЭЛЕМЕНТЫ
  let stage, gameField;

  // ИНИЦИАЛИЗАЦИЯ
  function initGame() {
    console.log('Инициализация игры самолеты');
    stage = document.getElementById('stage');
    if (!stage) {
      console.error('Элемент stage не найден!');
      return;
    }
    
    createGameInterface();
    updateDisplay();
    bindEvents();
    showDifficultyModal();
    createClouds();
    console.log('Игра инициализирована');
  }

  // СОЗДАНИЕ ИНТЕРФЕЙСА
  function createGameInterface() {
    stage.innerHTML = `
      <div class="clouds" id="clouds"></div>
      <div class="game-field" id="gameField" style="display: none;">
        <!-- ИГРОВЫЕ ЭЛЕМЕНТЫ СОЗДАЮТСЯ ДИНАМИЧЕСКИ -->
      </div>
    `;
    
    gameField = document.getElementById('gameField');
  }

  // СОЗДАНИЕ ОБЛАКОВ
  function createClouds() {
    const cloudsContainer = document.getElementById('clouds');
    if (!cloudsContainer) return;

    for (let i = 0; i < 5; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud';
      cloud.style.left = Math.random() * 100 + '%';
      cloud.style.top = Math.random() * 50 + '%';
      cloud.style.width = (Math.random() * 60 + 40) + 'px';
      cloud.style.height = (Math.random() * 30 + 20) + 'px';
      cloud.style.animationDelay = Math.random() * 20 + 's';
      cloud.style.animationDuration = (Math.random() * 10 + 15) + 's';
      cloudsContainer.appendChild(cloud);
    }
  }

  // ОБЯЗАТЕЛЬНЫЕ ФУНКЦИИ
  function updateDisplay() {
    const scoreTop = document.getElementById('scoreTop');
    const scoreBottom = document.getElementById('scoreBottom');
    if (scoreTop) scoreTop.textContent = `Скорость: ${GAME_CONFIG.planeSpeed}`;
    if (scoreBottom) scoreBottom.textContent = `Скорость: ${GAME_CONFIG.planeSpeed}`;
    
    if (!gameState.isPlaying) {
      const turnLabelTop = document.getElementById('turnLabelTop');
      const turnLabelBottom = document.getElementById('turnLabelBottom');
      if (turnLabelTop) turnLabelTop.textContent = `${GAME_CONFIG.icon} ${GAME_CONFIG.name}`;
      if (turnLabelBottom) turnLabelBottom.textContent = `${GAME_CONFIG.icon} ${GAME_CONFIG.name}`;
    }
  }

  function updateHUDInfo(text) {
    const turnLabelTop = document.getElementById('turnLabelTop');
    const turnLabelBottom = document.getElementById('turnLabelBottom');
    if (turnLabelTop) turnLabelTop.textContent = text;
    if (turnLabelBottom) turnLabelBottom.textContent = text;
  }

  function resetGame() {
    gameState.isPlaying = false;
    gameState.gamePhase = 'selecting';
    gameState.isWin = false;
    gameState.planes = [];
    gameState.bullets = [];
    gameState.explosions = [];
    
    if (gameState.gameLoop) {
      clearInterval(gameState.gameLoop);
      gameState.gameLoop = null;
    }
    
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    if (gameField) gameField.style.display = 'none';
    
    // Скрываем все элементы управления
    document.querySelectorAll('.player-controls-hud').forEach(control => {
      control.style.display = 'none';
    });
    
    showDifficultyModal();
    updateDisplay();
  }

  // МОДАЛЬНЫЕ ОКНА
  function showDifficultyModal() {
    console.log('Показываем модальное окно выбора игроков');
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    const difficultyModal = document.getElementById('difficultyModal');
    if (difficultyModal) {
      difficultyModal.style.display = 'flex';
      console.log('Модальное окно показано');
    } else {
      console.error('Модальное окно не найдено!');
    }
  }

  function hideDifficultyModal() {
    const difficultyModal = document.getElementById('difficultyModal');
    if (difficultyModal) difficultyModal.style.display = 'none';
  }

  function showEndModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    
    if (modalBackdrop && modalTitle && modalSubtitle) {
      const alivePlanes = gameState.planes.filter(plane => plane.alive);
      
      modalTitle.textContent = 'Игра окончена!';
      
      if (alivePlanes.length === 1) {
        const winner = alivePlanes[0];
        modalSubtitle.innerHTML = `Победитель: <span style="color: ${winner.color}">${winner.colorName}</span>`;
      } else {
        modalSubtitle.textContent = 'Ничья!';
      }
      
      modalBackdrop.hidden = false;
    }
  }

  // ОБРАБОТЧИКИ СОБЫТИЙ
  function bindEvents() {
    // Выбор количества игроков
    const playerOptions = document.querySelectorAll('.player-option');
    playerOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        playerOptions.forEach(opt => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        gameState.currentPlayers = parseInt(e.currentTarget.dataset.players);
        startGame();
      });
    });

    // Кнопки HUD
    const btnNewTop = document.getElementById('btnNewTop');
    const btnNewBottom = document.getElementById('btnNewBottom');
    const btnBackTop = document.getElementById('btnBackTop');
    const btnBackBottom = document.getElementById('btnBackBottom');
    const btnRematch = document.getElementById('btnRematch');
    const btnToMenu = document.getElementById('btnToMenu');
    
    if (btnNewTop) btnNewTop.addEventListener('click', resetGame);
    if (btnNewBottom) btnNewBottom.addEventListener('click', resetGame);
    if (btnBackTop) btnBackTop.addEventListener('click', () => window.location.href = '../index.html');
    if (btnBackBottom) btnBackBottom.addEventListener('click', () => window.location.href = '../index.html');
    if (btnRematch) btnRematch.addEventListener('click', () => {
      const modalBackdrop = document.getElementById('modalBackdrop');
      if (modalBackdrop) modalBackdrop.hidden = true;
      resetGame();
    });
    if (btnToMenu) btnToMenu.addEventListener('click', () => window.location.href = '../index.html');

    // Клавиатура
    document.addEventListener('keydown', handleKeyPress);
    
    // Кнопки управления в HUD
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('control-btn')) {
        const player = parseInt(e.target.dataset.player);
        const action = e.target.dataset.action;
        handlePlayerInput(player, action);
      }
    });
  }

  function handleKeyPress(e) {
    if (!gameState.isPlaying) return;
    
    const keyMappings = [
      { left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Space' },
      { left: 'KeyA', right: 'KeyD', shoot: 'KeyW' },
      { left: 'KeyJ', right: 'KeyL', shoot: 'KeyI' },
      { left: 'Numpad4', right: 'Numpad6', shoot: 'Numpad8' }
    ];
    
    for (let i = 0; i < gameState.planes.length; i++) {
      const plane = gameState.planes[i];
      if (!plane.alive) continue;
      
      const keys = keyMappings[i] || keyMappings[0];
      if (e.code === keys.left) {
        e.preventDefault();
        turnPlaneLeft(i);
      } else if (e.code === keys.right) {
        e.preventDefault();
        turnPlaneRight(i);
      } else if (e.code === keys.shoot) {
        e.preventDefault();
        shootBullet(i);
      }
    }
  }

  function handlePlayerInput(player, action) {
    if (action === 'left') {
      turnPlaneLeft(player);
    } else if (action === 'right') {
      turnPlaneRight(player);
    } else if (action === 'shoot') {
      shootBullet(player);
    }
  }

  // АЛГОРИТМ ИГРЫ
  function startGame() {
    console.log('Начинаем игру!');
    gameState.isPlaying = true;
    gameState.gamePhase = 'playing';
    gameState.gameStartTime = Date.now();
    
    hideDifficultyModal();
    createGameField();
    createPlanes();
    createControls();
    
    updateDisplay();
    updateHUDInfo('Играйте!');
    startGameLoop();
  }

  function createGameField() {
    if (gameField) {
      console.log('Создаем игровое поле');
      gameField.style.display = 'block';
      gameField.innerHTML = '';
    } else {
      console.error('gameField не найден!');
    }
  }

  function createPlanes() {
    console.log('Создаем самолеты для', gameState.currentPlayers, 'игроков');
    gameState.planes = [];
    
    const startPositions = [
      { x: 100, y: 100, angle: 0 },    // Левый верх
      { x: 300, y: 100, angle: 0 },    // Правый верх
      { x: 100, y: 200, angle: 0 },    // Левый низ
      { x: 300, y: 200, angle: 0 }     // Правый низ
    ];

    for (let i = 0; i < gameState.currentPlayers; i++) {
      const plane = {
        id: i,
        color: GAME_CONFIG.colors[i].value,
        colorName: GAME_CONFIG.colors[i].display,
        x: startPositions[i].x,
        y: startPositions[i].y,
        angle: startPositions[i].angle,
        alive: true,
        element: null
      };

      gameState.planes.push(plane);
      createPlaneElement(plane);
      console.log(`Создан самолет ${i}:`, plane);
    }
  }

  function createPlaneElement(plane) {
    const element = document.createElement('div');
    element.className = `plane plane-${GAME_CONFIG.colors[plane.id].name}`;
    element.style.left = plane.x + 'px';
    element.style.top = plane.y + 'px';
    element.style.transform = `rotate(${plane.angle}deg)`;
    element.id = `plane-${plane.id}`;
    
    gameField.appendChild(element);
    plane.element = element;
  }

  function createControls() {
    // Показываем кнопки управления в HUD
    for (let i = 0; i < 4; i++) {
      const playerControls = document.getElementById(`player${i + 1}Controls`);
      if (playerControls) {
        playerControls.style.display = gameState.currentPlayers > i ? 'flex' : 'none';
      }
    }
  }

  function turnPlaneLeft(playerIndex) {
    const plane = gameState.planes[playerIndex];
    if (!plane || !plane.alive) return;
    
    plane.angle -= 15; // Поворот на 15 градусов влево
    updatePlaneElement(plane);
  }

  function turnPlaneRight(playerIndex) {
    const plane = gameState.planes[playerIndex];
    if (!plane || !plane.alive) return;
    
    plane.angle += 15; // Поворот на 15 градусов вправо
    updatePlaneElement(plane);
  }

  function updatePlaneElement(plane) {
    if (plane.element) {
      plane.element.style.transform = `rotate(${plane.angle}deg)`;
    }
  }

  function shootBullet(playerIndex) {
    const plane = gameState.planes[playerIndex];
    if (!plane || !plane.alive) return;
    
    const bullet = {
      id: Date.now() + Math.random(),
      x: plane.x + 15, // Центр самолета
      y: plane.y + 10,
      angle: plane.angle,
      color: plane.color,
      colorName: plane.colorName,
      element: null
    };
    
    gameState.bullets.push(bullet);
    createBulletElement(bullet);
    console.log(`Самолет ${playerIndex} выстрелил`);
  }

  function createBulletElement(bullet) {
    const element = document.createElement('div');
    element.className = `bullet bullet-${GAME_CONFIG.colors.find(c => c.value === bullet.color)?.name}`;
    element.style.left = bullet.x + 'px';
    element.style.top = bullet.y + 'px';
    element.id = `bullet-${bullet.id}`;
    
    gameField.appendChild(element);
    bullet.element = element;
  }

  function startGameLoop() {
    gameState.gameLoop = setInterval(() => {
      updateGame();
    }, GAME_CONFIG.gameLoopInterval);
  }

  function updateGame() {
    // Двигаем самолеты
    gameState.planes.forEach(plane => {
      if (plane.alive) {
        movePlane(plane);
      }
    });
    
    // Двигаем пули
    gameState.bullets.forEach(bullet => {
      moveBullet(bullet);
    });
    
    // Обновляем отображение
    updatePlanesDisplay();
    updateBulletsDisplay();
    
    // Проверяем столкновения
    checkCollisions();
    
    // Проверяем условия победы
    checkWinCondition();
    
    // Удаляем взрывы
    updateExplosions();
  }

  function movePlane(plane) {
    // Вычисляем направление движения на основе угла
    const radians = (plane.angle * Math.PI) / 180;
    const dx = Math.cos(radians) * GAME_CONFIG.planeSpeed;
    const dy = Math.sin(radians) * GAME_CONFIG.planeSpeed;
    
    plane.x += dx;
    plane.y += dy;
    
    // Телепорт через края
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    if (plane.x < 0) plane.x = fieldWidth;
    if (plane.x > fieldWidth) plane.x = 0;
    if (plane.y < 0) plane.y = fieldHeight;
    if (plane.y > fieldHeight) plane.y = 0;
  }

  function moveBullet(bullet) {
    // Вычисляем направление движения на основе угла
    const radians = (bullet.angle * Math.PI) / 180;
    const dx = Math.cos(radians) * GAME_CONFIG.bulletSpeed;
    const dy = Math.sin(radians) * GAME_CONFIG.bulletSpeed;
    
    bullet.x += dx;
    bullet.y += dy;
    
    // Удаляем пулю если она вылетела за границы
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    if (bullet.x < 0 || bullet.x > fieldWidth || bullet.y < 0 || bullet.y > fieldHeight) {
      removeBullet(bullet);
    }
  }

  function updatePlanesDisplay() {
    gameState.planes.forEach(plane => {
      if (plane.alive && plane.element) {
        plane.element.style.left = plane.x + 'px';
        plane.element.style.top = plane.y + 'px';
        plane.element.style.transform = `rotate(${plane.angle}deg)`;
      }
    });
  }

  function updateBulletsDisplay() {
    gameState.bullets.forEach(bullet => {
      if (bullet.element) {
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
      }
    });
  }

  function checkCollisions() {
    // Проверяем столкновения пуль с самолетами
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
      const bullet = gameState.bullets[i];
      
      for (let j = 0; j < gameState.planes.length; j++) {
        const plane = gameState.planes[j];
        if (!plane.alive) continue;
        
        // Проверяем столкновение
        if (isCollision(bullet, plane)) {
          console.log(`Пуля попала в самолет ${j}`);
          explodePlane(plane);
          removeBullet(bullet);
          break;
        }
      }
    }
    
    // Проверяем столкновения самолетов друг с другом
    for (let i = 0; i < gameState.planes.length; i++) {
      const plane1 = gameState.planes[i];
      if (!plane1.alive) continue;
      
      for (let j = i + 1; j < gameState.planes.length; j++) {
        const plane2 = gameState.planes[j];
        if (!plane2.alive) continue;
        
        if (isCollision(plane1, plane2)) {
          console.log(`Самолеты ${i} и ${j} столкнулись`);
          explodePlane(plane1);
          explodePlane(plane2);
        }
      }
    }
  }

  function isCollision(obj1, obj2) {
    const distance = Math.sqrt(
      Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)
    );
    return distance < 20; // Радиус столкновения
  }

  function explodePlane(plane) {
    plane.alive = false;
    
    // Создаем взрыв
    createExplosion(plane.x, plane.y);
    
    // Скрываем самолет
    if (plane.element) {
      plane.element.style.opacity = '0';
    }
    
    console.log(`Самолет ${plane.colorName} взорвался!`);
  }

  function createExplosion(x, y) {
    const explosion = {
      id: Date.now() + Math.random(),
      x: x,
      y: y,
      element: null
    };
    
    gameState.explosions.push(explosion);
    
    const element = document.createElement('div');
    element.className = 'explosion';
    element.style.left = (x - 20) + 'px';
    element.style.top = (y - 20) + 'px';
    element.id = `explosion-${explosion.id}`;
    
    gameField.appendChild(element);
    explosion.element = element;
    
    // Удаляем взрыв через 0.5 секунды
    setTimeout(() => {
      removeExplosion(explosion);
    }, 500);
  }

  function removeBullet(bullet) {
    const index = gameState.bullets.indexOf(bullet);
    if (index > -1) {
      gameState.bullets.splice(index, 1);
    }
    
    if (bullet.element) {
      bullet.element.remove();
    }
  }

  function removeExplosion(explosion) {
    const index = gameState.explosions.indexOf(explosion);
    if (index > -1) {
      gameState.explosions.splice(index, 1);
    }
    
    if (explosion.element) {
      explosion.element.remove();
    }
  }

  function updateExplosions() {
    // Взрывы удаляются автоматически через setTimeout
  }

  function checkWinCondition() {
    const alivePlanes = gameState.planes.filter(plane => plane.alive);
    
    if (alivePlanes.length <= 1) {
      endGame();
    }
  }

  function endGame() {
    gameState.isPlaying = false;
    gameState.gamePhase = 'finished';
    
    if (gameState.gameLoop) {
      clearInterval(gameState.gameLoop);
      gameState.gameLoop = null;
    }
    
    updateHUDInfo('Игра окончена!');
    showEndModal();
  }

  // ЗАПУСК ИГРЫ
  document.addEventListener('DOMContentLoaded', initGame);
  
  // ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ НАВИГАЦИИ
  window.goToMenu = () => {
    window.location.href = '../index.html';
  };
})();