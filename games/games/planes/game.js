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
    planeSpeed: 2, // пикселей за кадр
    bulletSpeed: 4, // пикселей за кадр (в 2 раза быстрее самолета)
    planeSize: 30,
    bulletSize: 6
  };

  // СОСТОЯНИЕ ИГРЫ
  const gameState = {
    playersCount: 2,
    isPlaying: false,
    gamePhase: 'selecting', // 'selecting', 'playing', 'finished'
    planes: [],
    bullets: [],
    explosions: [],
    gameLoop: null,
    controls: {}
  };

  // DOM ЭЛЕМЕНТЫ
  let stage, gameField, controlsPanel;

  // ИНИЦИАЛИЗАЦИЯ
  function initGame() {
    stage = document.getElementById('stage');
    if (!stage) return;
    
    createGameInterface();
    updateDisplay();
    bindEvents();
    showPlayersModal();
  }

  // СОЗДАНИЕ ИНТЕРФЕЙСА
  function createGameInterface() {
    stage.innerHTML = `
      <div class="clouds" id="clouds">
        <div class="cloud cloud1"></div>
        <div class="cloud cloud2"></div>
        <div class="cloud cloud3"></div>
      </div>
      <div class="game-field" id="gameField" style="display: none;">
        <!-- Игровые элементы создаются динамически -->
      </div>
      <div class="controls-panel" id="controlsPanel" style="display: none;">
        <!-- Панель управления создается динамически -->
      </div>
    `;
    
    gameField = document.getElementById('gameField');
    controlsPanel = document.getElementById('controlsPanel');
  }

  // ОБЯЗАТЕЛЬНЫЕ ФУНКЦИИ
  function updateDisplay() {
    const scoreTop = document.getElementById('scoreTop');
    const scoreBottom = document.getElementById('scoreBottom');
    if (scoreTop) scoreTop.textContent = `Игроков: ${gameState.playersCount}`;
    if (scoreBottom) scoreBottom.textContent = `Игроков: ${gameState.playersCount}`;
    
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
    // Не используется в этой игре
  }

  function hideHUDCheckButton() {
    // Не используется в этой игре
  }

  function resetGame() {
    gameState.isPlaying = false;
    gameState.gamePhase = 'selecting';
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
    if (controlsPanel) controlsPanel.style.display = 'none';
    
    showPlayersModal();
    updateDisplay();
  }

  // МОДАЛЬНЫЕ ОКНА
  function showPlayersModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.hidden = true;
    
    const playersModal = document.getElementById('playersModal');
    if (playersModal) playersModal.style.display = 'flex';
  }

  function hidePlayersModal() {
    const playersModal = document.getElementById('playersModal');
    if (playersModal) playersModal.style.display = 'none';
  }

  function showEndModal(winner) {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    
    if (modalBackdrop && modalTitle && modalSubtitle) {
      if (winner) {
        const colorName = GAME_CONFIG.colors[winner.colorIndex].display;
        modalTitle.textContent = 'Игра окончена!';
        modalSubtitle.textContent = `Победитель: Игрок ${winner.id} (${colorName})`;
      } else {
        modalTitle.textContent = 'Игра окончена!';
        modalSubtitle.textContent = 'Ничья';
      }
      modalBackdrop.hidden = false;
    }
  }

  // ОБРАБОТЧИКИ СОБЫТИЙ
  function bindEvents() {
    // Выбор количества игроков
    const playerOptions = document.querySelectorAll('.difficulty-option');
    playerOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const players = parseInt(e.currentTarget.dataset.players);
        gameState.playersCount = players;
        hidePlayersModal();
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
    if (btnRematch) btnRematch.addEventListener('click', () => {
      const modalBackdrop = document.getElementById('modalBackdrop');
      if (modalBackdrop) modalBackdrop.hidden = true;
      resetGame();
    });
    if (btnToMenu) btnToMenu.addEventListener('click', () => window.location.href = '../../index.html');
  }

  // ИГРОВАЯ ЛОГИКА
  function startGame() {
    gameState.isPlaying = true;
    gameState.gamePhase = 'playing';
    
    createPlanes();
    createControls();
    startGameLoop();
    
    if (gameField) gameField.style.display = 'block';
    if (controlsPanel) controlsPanel.style.display = 'flex';
    
    updateDisplay();
    updateHUDInfo('Играйте!');
  }

  function createPlanes() {
    gameState.planes = [];
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    // Позиции самолетов в углах
    const positions = [
      { x: 50, y: 50, angle: 45 }, // Верхний левый
      { x: fieldWidth - 50, y: 50, angle: 135 }, // Верхний правый
      { x: 50, y: fieldHeight - 50, angle: -45 }, // Нижний левый
      { x: fieldWidth - 50, y: fieldHeight - 50, angle: -135 } // Нижний правый
    ];
    
    for (let i = 0; i < gameState.playersCount; i++) {
      const plane = {
        id: i + 1,
        x: positions[i].x,
        y: positions[i].y,
        angle: positions[i].angle,
        colorIndex: i,
        isAlive: true,
        element: null
      };
      
      gameState.planes.push(plane);
      createPlaneElement(plane);
    }
  }

  function createPlaneElement(plane) {
    const planeElement = document.createElement('div');
    planeElement.className = `plane plane-${GAME_CONFIG.colors[plane.colorIndex].name}`;
    planeElement.style.left = plane.x + 'px';
    planeElement.style.top = plane.y + 'px';
    planeElement.style.transform = `rotate(${plane.angle}deg)`;
    
    gameField.appendChild(planeElement);
    plane.element = planeElement;
  }

  function createControls() {
    if (!controlsPanel) return;
    
    controlsPanel.innerHTML = '';
    
    for (let i = 0; i < gameState.playersCount; i++) {
      const controlGroup = document.createElement('div');
      controlGroup.className = 'control-group';
      
      const playerLabel = document.createElement('div');
      playerLabel.className = 'player-label';
      playerLabel.textContent = `Игрок ${i + 1}`;
      playerLabel.style.color = GAME_CONFIG.colors[i].value;
      
      const controlButtons = document.createElement('div');
      controlButtons.className = 'control-buttons';
      
      const leftBtn = document.createElement('button');
      leftBtn.className = 'control-btn';
      leftBtn.textContent = '←';
      leftBtn.addEventListener('click', () => turnPlane(i, -15));
      
      const rightBtn = document.createElement('button');
      rightBtn.className = 'control-btn';
      rightBtn.textContent = '→';
      rightBtn.addEventListener('click', () => turnPlane(i, 15));
      
      const shootBtn = document.createElement('button');
      shootBtn.className = 'control-btn shoot';
      shootBtn.textContent = '💥';
      shootBtn.addEventListener('click', () => shootBullet(i));
      
      controlButtons.appendChild(leftBtn);
      controlButtons.appendChild(rightBtn);
      controlButtons.appendChild(shootBtn);
      
      controlGroup.appendChild(playerLabel);
      controlGroup.appendChild(controlButtons);
      controlsPanel.appendChild(controlGroup);
    }
  }

  function turnPlane(playerIndex, angleDelta) {
    const plane = gameState.planes[playerIndex];
    if (!plane || !plane.isAlive) return;
    
    plane.angle += angleDelta;
    plane.element.style.transform = `rotate(${plane.angle}deg)`;
  }

  function shootBullet(playerIndex) {
    const plane = gameState.planes[playerIndex];
    if (!plane || !plane.isAlive) return;
    
    const bullet = {
      x: plane.x + 15, // Центр самолета
      y: plane.y + 15,
      angle: plane.angle,
      colorIndex: plane.colorIndex,
      element: null
    };
    
    gameState.bullets.push(bullet);
    createBulletElement(bullet);
  }

  function createBulletElement(bullet) {
    const bulletElement = document.createElement('div');
    bulletElement.className = `bullet bullet-${GAME_CONFIG.colors[bullet.colorIndex].name}`;
    bulletElement.style.left = bullet.x + 'px';
    bulletElement.style.top = bullet.y + 'px';
    
    gameField.appendChild(bulletElement);
    bullet.element = bulletElement;
  }

  function startGameLoop() {
    gameState.gameLoop = setInterval(() => {
      updateGame();
    }, 16); // ~60 FPS
  }

  function updateGame() {
    updatePlanes();
    updateBullets();
    checkCollisions();
    checkGameEnd();
  }

  function updatePlanes() {
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    gameState.planes.forEach(plane => {
      if (!plane.isAlive) return;
      
      // Движение вперед
      const radians = (plane.angle * Math.PI) / 180;
      plane.x += Math.cos(radians) * GAME_CONFIG.planeSpeed;
      plane.y += Math.sin(radians) * GAME_CONFIG.planeSpeed;
      
      // Телепортация через края
      if (plane.x < 0) plane.x = fieldWidth;
      if (plane.x > fieldWidth) plane.x = 0;
      if (plane.y < 0) plane.y = fieldHeight;
      if (plane.y > fieldHeight) plane.y = 0;
      
      // Обновление позиции элемента
      plane.element.style.left = plane.x + 'px';
      plane.element.style.top = plane.y + 'px';
    });
  }

  function updateBullets() {
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    gameState.bullets = gameState.bullets.filter(bullet => {
      if (!bullet.element) return false;
      
      // Движение пули
      const radians = (bullet.angle * Math.PI) / 180;
      bullet.x += Math.cos(radians) * GAME_CONFIG.bulletSpeed;
      bullet.y += Math.sin(radians) * GAME_CONFIG.bulletSpeed;
      
      // Удаление пули за пределами поля
      if (bullet.x < 0 || bullet.x > fieldWidth || bullet.y < 0 || bullet.y > fieldHeight) {
        bullet.element.remove();
        return false;
      }
      
      // Обновление позиции элемента
      bullet.element.style.left = bullet.x + 'px';
      bullet.element.style.top = bullet.y + 'px';
      
      return true;
    });
  }

  function checkCollisions() {
    // Проверка столкновений пуль с самолетами
    gameState.bullets.forEach((bullet, bulletIndex) => {
      gameState.planes.forEach(plane => {
        if (!plane.isAlive || plane.colorIndex === bullet.colorIndex) return;
        
        const distance = Math.sqrt(
          Math.pow(bullet.x - plane.x, 2) + Math.pow(bullet.y - plane.y, 2)
        );
        
        if (distance < GAME_CONFIG.planeSize) {
          // Попадание!
          explodePlane(plane);
          bullet.element.remove();
          gameState.bullets.splice(bulletIndex, 1);
        }
      });
    });
    
    // Проверка столкновений самолетов друг с другом
    for (let i = 0; i < gameState.planes.length; i++) {
      for (let j = i + 1; j < gameState.planes.length; j++) {
        const plane1 = gameState.planes[i];
        const plane2 = gameState.planes[j];
        
        if (!plane1.isAlive || !plane2.isAlive) continue;
        
        const distance = Math.sqrt(
          Math.pow(plane1.x - plane2.x, 2) + Math.pow(plane1.y - plane2.y, 2)
        );
        
        if (distance < GAME_CONFIG.planeSize) {
          // Столкновение!
          explodePlane(plane1);
          explodePlane(plane2);
        }
      }
    }
  }

  function explodePlane(plane) {
    plane.isAlive = false;
    
    // Создание эффекта взрыва
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = (plane.x - 15) + 'px';
    explosion.style.top = (plane.y - 15) + 'px';
    
    gameField.appendChild(explosion);
    
    // Удаление самолета
    plane.element.style.display = 'none';
    
    // Удаление эффекта взрыва через 500мс
    setTimeout(() => {
      explosion.remove();
    }, 500);
  }

  function checkGameEnd() {
    const alivePlanes = gameState.planes.filter(plane => plane.isAlive);
    
    if (alivePlanes.length <= 1) {
      endGame(alivePlanes[0] || null);
    }
  }

  function endGame(winner) {
    gameState.isPlaying = false;
    gameState.gamePhase = 'finished';
    
    if (gameState.gameLoop) {
      clearInterval(gameState.gameLoop);
      gameState.gameLoop = null;
    }
    
    if (controlsPanel) controlsPanel.style.display = 'none';
    
    updateHUDInfo('Игра окончена!');
    showEndModal(winner);
  }

  // ЗАПУСК ИГРЫ
  document.addEventListener('DOMContentLoaded', initGame);
  
  // ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ НАВИГАЦИИ
  window.goToMenu = () => {
    window.location.href = '../../index.html';
  };
})();