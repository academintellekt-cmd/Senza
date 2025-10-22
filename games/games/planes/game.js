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
    aircraftSpeed: 2, // скорость самолетов (пикселей за кадр)
    bulletSpeed: 4,   // скорость пуль (в 2 раза больше самолетов)
    bulletLifetime: 3000, // время жизни пули в мс
    gameLoopInterval: 16  // интервал игрового цикла (60 FPS)
  };

  // СОСТОЯНИЕ ИГРЫ
  const gameState = {
    playerCount: 2,
    isPlaying: false,
    gamePhase: 'selecting', // 'selecting', 'playing', 'finished'
    aircraft: [],
    bullets: [],
    explosions: [],
    gameLoop: null,
    lastTime: 0
  };

  // DOM ЭЛЕМЕНТЫ
  let stage, gameField, controlsPanel;
  let hudCheckTop, hudCheckBottom;

  // ИНИЦИАЛИЗАЦИЯ
  function initGame() {
    stage = document.getElementById('stage');
    if (!stage) return;
    
    createGameInterface();
    createClouds();
    updateDisplay();
    bindEvents();
    showPlayerCountModal();
  }

  // СОЗДАНИЕ ИНТЕРФЕЙСА
  function createGameInterface() {
    stage.innerHTML = `
      <div class="clouds" id="clouds"></div>
      <div class="game-field" id="gameField" style="display: none;">
        <!-- Самолеты и пули создаются динамически -->
      </div>
      <div class="controls-panel" id="controlsPanel" style="display: none;">
        <button class="control-btn" id="btnLeft">← Влево</button>
        <button class="control-btn" id="btnRight">Вправо →</button>
        <button class="control-btn shoot" id="btnShoot">💥 Выстрел</button>
      </div>
    `;
    
    gameField = document.getElementById('gameField');
    controlsPanel = document.getElementById('controlsPanel');
    hudCheckTop = document.getElementById('hudCheckTop');
    hudCheckBottom = document.getElementById('hudCheckBottom');
  }

  // СОЗДАНИЕ ОБЛАКОВ
  function createClouds() {
    const cloudsContainer = document.getElementById('clouds');
    if (!cloudsContainer) return;

    for (let i = 0; i < 3; i++) {
      const cloud = document.createElement('div');
      cloud.className = `cloud cloud${i + 1}`;
      cloudsContainer.appendChild(cloud);
    }
  }

  // ОБЯЗАТЕЛЬНЫЕ ФУНКЦИИ
  function updateDisplay() {
    const scoreTop = document.getElementById('scoreTop');
    const scoreBottom = document.getElementById('scoreBottom');
    if (scoreTop) scoreTop.textContent = `Игроков: ${gameState.playerCount}`;
    if (scoreBottom) scoreBottom.textContent = `Игроков: ${gameState.playerCount}`;
    
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

  function showHUDCheckButton() {
    if (hudCheckTop) hudCheckTop.style.display = 'block';
    if (hudCheckBottom) hudCheckBottom.style.display = 'block';
  }

  function hideHUDCheckButton() {
    if (hudCheckTop) hudCheckTop.style.display = 'none';
    if (hudCheckBottom) hudCheckBottom.style.display = 'none';
  }

  function resetGame() {
    gameState.isPlaying = false;
    gameState.gamePhase = 'selecting';
    gameState.aircraft = [];
    gameState.bullets = [];
    gameState.explosions = [];
    
    if (gameState.gameLoop) {
      clearInterval(gameState.gameLoop);
      gameState.gameLoop = null;
    }
    
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    if (gameField) gameField.style.display = 'none';
    if (controlsPanel) controlsPanel.style.display = 'none';
    hideHUDCheckButton();
    
    showPlayerCountModal();
    updateDisplay();
  }

  // МОДАЛЬНЫЕ ОКНА
  function showPlayerCountModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    const playerCountModal = document.getElementById('playerCountModal');
    if (playerCountModal) playerCountModal.style.display = 'flex';
  }

  function hidePlayerCountModal() {
    const playerCountModal = document.getElementById('playerCountModal');
    if (playerCountModal) playerCountModal.style.display = 'none';
  }

  function showEndModal(winner) {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    
    if (modalBackdrop && modalTitle && modalSubtitle) {
      if (winner) {
        modalTitle.textContent = 'Победитель!';
        modalSubtitle.textContent = `Победитель: ${winner.colorName}`;
      } else {
        modalTitle.textContent = 'Ничья!';
        modalSubtitle.textContent = 'Все самолеты взорвались';
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
        const players = parseInt(e.currentTarget.dataset.players);
        gameState.playerCount = players;
        hidePlayerCountModal();
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
    if (btnBackTop) btnBackTop.addEventListener('click', () => window.location.href = '../../index.html');
    if (btnBackBottom) btnBackBottom.addEventListener('click', () => window.location.href = '../../index.html');
    if (btnRematch) btnRematch.addEventListener('click', resetGame);
    if (btnToMenu) btnToMenu.addEventListener('click', () => window.location.href = '../../index.html');

    // Кнопки проверки
    if (hudCheckTop) hudCheckTop.addEventListener('click', checkResult);
    if (hudCheckBottom) hudCheckBottom.addEventListener('click', checkResult);

    // Управление самолетом
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnShoot = document.getElementById('btnShoot');

    if (btnLeft) btnLeft.addEventListener('click', () => turnAircraft(-1));
    if (btnRight) btnRight.addEventListener('click', () => turnAircraft(1));
    if (btnShoot) btnShoot.addEventListener('click', shootBullet);

    // Клавиатура
    document.addEventListener('keydown', handleKeyPress);
  }

  // ОБРАБОТКА КЛАВИАТУРЫ
  function handleKeyPress(e) {
    if (!gameState.isPlaying) return;

    switch(e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        turnAircraft(-1);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        turnAircraft(1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        shootBullet();
        break;
    }
  }

  // АЛГОРИТМ ИГРЫ
  function startGame() {
    gameState.isPlaying = true;
    gameState.gamePhase = 'playing';
    
    createAircraft();
    updateDisplay();
    showGameInstructions();
  }

  function createAircraft() {
    gameState.aircraft = [];
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    // Позиции самолетов в углах
    const positions = [
      { x: 50, y: 50, angle: 45 },      // левый верхний
      { x: fieldWidth - 50, y: 50, angle: 135 }, // правый верхний
      { x: 50, y: fieldHeight - 50, angle: -45 }, // левый нижний
      { x: fieldWidth - 50, y: fieldHeight - 50, angle: -135 } // правый нижний
    ];

    for (let i = 0; i < gameState.playerCount; i++) {
      const aircraft = {
        id: i + 1,
        x: positions[i].x,
        y: positions[i].y,
        angle: positions[i].angle,
        color: GAME_CONFIG.colors[i].name,
        colorName: GAME_CONFIG.colors[i].display,
        colorValue: GAME_CONFIG.colors[i].value,
        isAlive: true,
        element: null
      };
      
      gameState.aircraft.push(aircraft);
    }
    
    renderAircraft();
  }

  function renderAircraft() {
    // Очищаем предыдущие самолеты
    const existingAircraft = gameField.querySelectorAll('.aircraft');
    existingAircraft.forEach(el => el.remove());
    
    gameState.aircraft.forEach(aircraft => {
      if (!aircraft.isAlive) return;
      
      const element = document.createElement('div');
      element.className = `aircraft ${aircraft.color}`;
      element.style.left = aircraft.x + 'px';
      element.style.top = aircraft.y + 'px';
      element.style.transform = `rotate(${aircraft.angle}deg)`;
      element.style.color = aircraft.colorValue;
      
      gameField.appendChild(element);
      aircraft.element = element;
    });
  }

  function showGameInstructions() {
    updateHUDInfo('Управление: ← → для поворота, Пробел для выстрела');
    setTimeout(() => {
      startGameplay();
    }, 3000);
  }

  function startGameplay() {
    updateHUDInfo('Играйте!');
    if (gameField) gameField.style.display = 'block';
    if (controlsPanel) controlsPanel.style.display = 'flex';
    
    // Запускаем игровой цикл
    gameState.lastTime = Date.now();
    gameState.gameLoop = setInterval(gameLoop, GAME_CONFIG.gameLoopInterval);
  }

  function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - gameState.lastTime;
    gameState.lastTime = currentTime;

    // Движение самолетов
    moveAircraft();
    
    // Движение пуль
    moveBullets();
    
    // Проверка коллизий
    checkCollisions();
    
    // Очистка мертвых пуль
    cleanupBullets();
    
    // Проверка условий победы
    checkWinConditions();
  }

  function moveAircraft() {
    gameState.aircraft.forEach(aircraft => {
      if (!aircraft.isAlive) return;
      
      // Самолет всегда летит вперед
      const radians = (aircraft.angle * Math.PI) / 180;
      aircraft.x += Math.cos(radians) * GAME_CONFIG.aircraftSpeed;
      aircraft.y += Math.sin(radians) * GAME_CONFIG.aircraftSpeed;
      
      // Проверка границ с телепортацией
      const fieldRect = gameField.getBoundingClientRect();
      if (aircraft.x < 0) aircraft.x = fieldRect.width;
      if (aircraft.x > fieldRect.width) aircraft.x = 0;
      if (aircraft.y < 0) aircraft.y = fieldRect.height;
      if (aircraft.y > fieldRect.height) aircraft.y = 0;
      
      // Обновляем позицию элемента
      if (aircraft.element) {
        aircraft.element.style.left = aircraft.x + 'px';
        aircraft.element.style.top = aircraft.y + 'px';
      }
    });
  }

  function turnAircraft(direction) {
    const aliveAircraft = gameState.aircraft.filter(a => a.isAlive);
    if (aliveAircraft.length === 0) return;
    
    // Поворачиваем первый живой самолет (для простоты управления)
    const aircraft = aliveAircraft[0];
    aircraft.angle += direction * 15; // поворот на 15 градусов
    
    if (aircraft.element) {
      aircraft.element.style.transform = `rotate(${aircraft.angle}deg)`;
    }
  }

  function shootBullet() {
    const aliveAircraft = gameState.aircraft.filter(a => a.isAlive);
    if (aliveAircraft.length === 0) return;
    
    const aircraft = aliveAircraft[0]; // стреляет первый живой самолет
    const radians = (aircraft.angle * Math.PI) / 180;
    
    const bullet = {
      id: Date.now() + Math.random(),
      x: aircraft.x + Math.cos(radians) * 20,
      y: aircraft.y + Math.sin(radians) * 20,
      angle: aircraft.angle,
      color: aircraft.color,
      colorValue: aircraft.colorValue,
      speedX: Math.cos(radians) * GAME_CONFIG.bulletSpeed,
      speedY: Math.sin(radians) * GAME_CONFIG.bulletSpeed,
      createdAt: Date.now(),
      element: null
    };
    
    gameState.bullets.push(bullet);
    renderBullet(bullet);
  }

  function renderBullet(bullet) {
    const element = document.createElement('div');
    element.className = `bullet ${bullet.color}`;
    element.style.left = bullet.x + 'px';
    element.style.top = bullet.y + 'px';
    element.style.backgroundColor = bullet.colorValue;
    
    gameField.appendChild(element);
    bullet.element = element;
  }

  function moveBullets() {
    gameState.bullets.forEach(bullet => {
      bullet.x += bullet.speedX;
      bullet.y += bullet.speedY;
      
      // Обновляем позицию элемента
      if (bullet.element) {
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
      }
    });
  }

  function checkCollisions() {
    const fieldRect = gameField.getBoundingClientRect();
    
    // Проверка пуль с самолетами
    gameState.bullets.forEach((bullet, bulletIndex) => {
      if (!bullet.element) return;
      
      gameState.aircraft.forEach(aircraft => {
        if (!aircraft.isAlive || !aircraft.element) return;
        
        // Проверяем коллизию пули с самолетом
        const bulletRect = bullet.element.getBoundingClientRect();
        const aircraftRect = aircraft.element.getBoundingClientRect();
        
        if (bulletRect.left < aircraftRect.right &&
            bulletRect.right > aircraftRect.left &&
            bulletRect.top < aircraftRect.bottom &&
            bulletRect.bottom > aircraftRect.top) {
          
          // Пуля попала в самолет
          explodeAircraft(aircraft);
          removeBullet(bulletIndex);
        }
      });
      
      // Проверка выхода пули за границы
      if (bullet.x < 0 || bullet.x > fieldRect.width || 
          bullet.y < 0 || bullet.y > fieldRect.height) {
        removeBullet(bulletIndex);
      }
    });
    
    // Проверка столкновений самолетов друг с другом
    for (let i = 0; i < gameState.aircraft.length; i++) {
      for (let j = i + 1; j < gameState.aircraft.length; j++) {
        const aircraft1 = gameState.aircraft[i];
        const aircraft2 = gameState.aircraft[j];
        
        if (!aircraft1.isAlive || !aircraft2.isAlive) continue;
        if (!aircraft1.element || !aircraft2.element) continue;
        
        const rect1 = aircraft1.element.getBoundingClientRect();
        const rect2 = aircraft2.element.getBoundingClientRect();
        
        if (rect1.left < rect2.right &&
            rect1.right > rect2.left &&
            rect1.top < rect2.bottom &&
            rect1.bottom > rect2.top) {
          
          // Самолеты столкнулись
          explodeAircraft(aircraft1);
          explodeAircraft(aircraft2);
        }
      }
    }
  }

  function explodeAircraft(aircraft) {
    if (!aircraft.isAlive) return;
    
    aircraft.isAlive = false;
    
    // Создаем взрыв
    createExplosion(aircraft.x, aircraft.y);
    
    // Удаляем элемент самолета
    if (aircraft.element) {
      aircraft.element.remove();
      aircraft.element = null;
    }
  }

  function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = (x - 30) + 'px';
    explosion.style.top = (y - 30) + 'px';
    
    gameField.appendChild(explosion);
    
    // Удаляем взрыв через 500мс
    setTimeout(() => {
      if (explosion.parentNode) {
        explosion.parentNode.removeChild(explosion);
      }
    }, 500);
  }

  function removeBullet(index) {
    const bullet = gameState.bullets[index];
    if (bullet.element) {
      bullet.element.remove();
    }
    gameState.bullets.splice(index, 1);
  }

  function cleanupBullets() {
    const currentTime = Date.now();
    gameState.bullets.forEach((bullet, index) => {
      if (currentTime - bullet.createdAt > GAME_CONFIG.bulletLifetime) {
        removeBullet(index);
      }
    });
  }

  function checkWinConditions() {
    const aliveAircraft = gameState.aircraft.filter(a => a.isAlive);
    
    if (aliveAircraft.length <= 1) {
      endGame(aliveAircraft[0] || null);
    }
  }

  function endGame(winner) {
    gameState.isPlaying = false;
    gameState.gamePhase = 'finished';
    
    if (gameState.gameLoop) {
      clearInterval(gameState.gameLoop);
      gameState.gameLoop = null;
    }
    
    hideHUDCheckButton();
    updateHUDInfo('Игра окончена!');
    showEndModal(winner);
  }

  function checkResult() {
    // Эта функция не используется в данной игре
    // но оставлена для совместимости с шаблоном
  }

  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ЗАПУСК ИГРЫ
  document.addEventListener('DOMContentLoaded', initGame);
  
  // ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ НАВИГАЦИИ
  window.goToMenu = () => {
    window.location.href = '../../index.html';
  };
})();