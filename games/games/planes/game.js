// САМОЛЕТЫ - полноэкранная версия
(() => {
  // КОНФИГУРАЦИЯ ИГРЫ
  const GAME_CONFIG = {
    name: 'Самолеты',
    icon: '✈️',
    colors: [
      { name: 'red', value: '#FE112E', display: 'Красный' },     // 0 - верхний левый
      { name: 'yellow', value: '#FFE23F', display: 'Жёлтый' },  // 1 - верхний правый
      { name: 'blue', value: '#1E6FE3', display: 'Синий' },     // 2 - нижний левый
      { name: 'green', value: '#2ED573', display: 'Зелёный' }   // 3 - нижний правый
    ],
    speeds: {
      slow: { planeSpeed: 1.5, bulletSpeed: 3, turnSpeed: 2.5 },
      medium: { planeSpeed: 2.5, bulletSpeed: 5, turnSpeed: 3.5 },
      fast: { planeSpeed: 4, bulletSpeed: 8, turnSpeed: 5 }
    },
    planeSpeed: 2.5, // пикселей за кадр (будет переопределено)
    bulletSpeed: 5, // пикселей за кадр (будет переопределено)
    planeSize: 40,
    bulletSize: 8,
    turnSpeed: 3.5 // градусов за кадр при удержании кнопки (будет переопределено)
  };

  // СОСТОЯНИЕ ИГРЫ
  const gameState = {
    playersCount: 2,
    selectedSpeed: 'medium',
    isPlaying: false,
    gamePhase: 'selecting', // 'selecting', 'playing', 'finished'
    planes: [],
    bullets: [],
    explosions: [],
    gameLoop: null,
    controls: {},
    keysPressed: {} // Отслеживание зажатых клавиш
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
      <div class="game-field" id="gameField" style="display: none;">
        <div class="clouds">
          <div class="cloud cloud1"></div>
          <div class="cloud cloud2"></div>
          <div class="cloud cloud3"></div>
        </div>
        <!-- Игровые элементы создаются динамически -->
      </div>
    `;
    
    gameField = document.getElementById('gameField');
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
    
    if (gameState.gameLoop) {
      clearInterval(gameState.gameLoop);
      gameState.gameLoop = null;
    }
    
    // Очистка всех самолетов и пуль
    gameState.planes.forEach(plane => {
      if (plane.element && plane.element.parentNode) {
        plane.element.remove();
      }
    });
    
    gameState.bullets.forEach(bullet => {
      if (bullet.element && bullet.element.parentNode) {
        bullet.element.remove();
      }
    });
    
    gameState.planes = [];
    gameState.bullets = [];
    gameState.explosions = [];
    gameState.keysPressed = {};
    
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.hidden = true;
      modalBackdrop.style.display = 'none';
    }
    
    if (gameField) gameField.style.display = 'none';
    
    // Скрыть все панели управления
    hideAllPlayerControls();
    
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
        modalTitle.textContent = 'Игра окончена';
        modalSubtitle.textContent = `Победил ${colorName} игрок`;
      } else {
        modalTitle.textContent = 'Игра окончена';
        modalSubtitle.textContent = 'Ничья';
      }
      modalBackdrop.hidden = false;
      modalBackdrop.style.display = 'flex';
    }
  }

  // ОБРАБОТЧИКИ СОБЫТИЙ
  function bindEvents() {
    // Выбор количества игроков
    const playerOptions = document.querySelectorAll('.player-option');
    playerOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        // Убрать selected у всех
        playerOptions.forEach(opt => opt.classList.remove('selected'));
        // Добавить selected к выбранному
        e.currentTarget.classList.add('selected');
        gameState.playersCount = parseInt(e.currentTarget.dataset.players);
      });
    });
    
    // Выбор скорости
    const speedOptions = document.querySelectorAll('.speed-option');
    speedOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        // Убрать selected у всех
        speedOptions.forEach(opt => opt.classList.remove('selected'));
        // Добавить selected к выбранному
        e.currentTarget.classList.add('selected');
        gameState.selectedSpeed = e.currentTarget.dataset.speed;
      });
    });
    
    // Кнопка "Начать игру"
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => {
        hidePlayersModal();
        startGame();
      });
    }

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

  // Скрыть все панели управления
  function hideAllPlayerControls() {
    const controls = ['player1Controls', 'player2Controls', 'player3Controls', 'player4Controls'];
    controls.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
  
  // Показать панели управления для игроков
  function showPlayerControls() {
    hideAllPlayerControls();
    
    // Игрок 1 - всегда на верхней панели
    if (gameState.playersCount >= 1) {
      const p1 = document.getElementById('player1Controls');
      if (p1) p1.style.display = 'flex';
    }
    
    // Игрок 2 - всегда на нижней панели
    if (gameState.playersCount >= 2) {
      const p2 = document.getElementById('player2Controls');
      if (p2) p2.style.display = 'flex';
    }
    
    // Игрок 3 - на верхней панели
    if (gameState.playersCount >= 3) {
      const p3 = document.getElementById('player3Controls');
      if (p3) p3.style.display = 'flex';
    }
    
    // Игрок 4 - на нижней панели
    if (gameState.playersCount >= 4) {
      const p4 = document.getElementById('player4Controls');
      if (p4) p4.style.display = 'flex';
    }
  }

  // ИГРОВАЯ ЛОГИКА
  function startGame() {
    gameState.isPlaying = true;
    gameState.gamePhase = 'playing';
    
    // Применить выбранную скорость
    const speedSettings = GAME_CONFIG.speeds[gameState.selectedSpeed];
    GAME_CONFIG.planeSpeed = speedSettings.planeSpeed;
    GAME_CONFIG.bulletSpeed = speedSettings.bulletSpeed;
    GAME_CONFIG.turnSpeed = speedSettings.turnSpeed;
    
    createPlanes();
    setupPlayerControls();
    showPlayerControls();
    startGameLoop();
    
    if (gameField) gameField.style.display = 'block';
    
    updateDisplay();
    updateHUDInfo('Играйте!');
  }

  function createPlanes() {
    gameState.planes = [];
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    // Позиции самолетов в углах (летят по диагонали в центр)
    const positions = [
      { x: 50, y: 50, angle: 130 + Math.random() * 10 }, // Красный - верхний левый → случайный угол 130-140°
      { x: fieldWidth - 50, y: fieldHeight - 50, angle: 310 + Math.random() * 10 }, // Желтый - нижний правый → случайный угол 310-320°
      { x: fieldWidth - 50, y: 50, angle: 220 + Math.random() * 10 }, // Синий - верхний правый → случайный угол 220-230°
      { x: 50, y: fieldHeight - 50, angle: 40 + Math.random() * 10 } // Зеленый - нижний левый → случайный угол 40-50°
    ];
    
    for (let i = 0; i < gameState.playersCount; i++) {
      const plane = {
        id: i + 1,
        x: positions[i].x,
        y: positions[i].y,
        angle: positions[i].angle,
        colorIndex: i, // 0=красный, 1=желтый, 2=синий, 3=зеленый
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
    planeElement.style.left = (plane.x - 20) + 'px'; // Центрируем
    planeElement.style.top = (plane.y - 20) + 'px';
    planeElement.style.transform = `rotate(${plane.angle}deg)`;
    
    gameField.appendChild(planeElement);
    plane.element = planeElement;
  }

  function setupPlayerControls() {
    // Найти все кнопки управления и привязать к ним обработчики
    const controlButtons = document.querySelectorAll('.control-btn');
    
    controlButtons.forEach(btn => {
      const playerIndex = parseInt(btn.dataset.player);
      const action = btn.dataset.action;
      
      if (action === 'left' || action === 'right') {
        // Обработчики для зажатия кнопок поворота
        btn.addEventListener('mousedown', () => {
          gameState.keysPressed[`${playerIndex}_${action}`] = true;
        });
        btn.addEventListener('mouseup', () => {
          gameState.keysPressed[`${playerIndex}_${action}`] = false;
        });
        btn.addEventListener('mouseleave', () => {
          gameState.keysPressed[`${playerIndex}_${action}`] = false;
        });
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          // Обработка множественных касаний
          for (let touch of e.touches) {
            if (touch.target === btn) {
              gameState.keysPressed[`${playerIndex}_${action}`] = true;
              break;
            }
          }
        });
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          // Обработка множественных касаний
          for (let touch of e.changedTouches) {
            if (touch.target === btn) {
              gameState.keysPressed[`${playerIndex}_${action}`] = false;
              break;
            }
          }
        });
        btn.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          // Обработка отмены касаний
          for (let touch of e.changedTouches) {
            if (touch.target === btn) {
              gameState.keysPressed[`${playerIndex}_${action}`] = false;
              break;
            }
          }
        });
      } else if (action === 'shoot') {
        // Обработчик для выстрела
        btn.addEventListener('click', () => shootBullet(playerIndex));
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          // Обработка множественных касаний для выстрела
          for (let touch of e.touches) {
            if (touch.target === btn) {
              shootBullet(playerIndex);
              break;
            }
          }
        });
      }
    });
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
    
    // Вычисляем позицию носа самолета
    const radians = ((plane.angle - 90) * Math.PI) / 180;
    const noseDistance = 20; // Расстояние от центра до носа
    
    const bullet = {
      x: plane.x + Math.cos(radians) * noseDistance,
      y: plane.y + Math.sin(radians) * noseDistance,
      angle: plane.angle,
      colorIndex: plane.colorIndex,
      shooterIndex: playerIndex,
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
    
    gameState.planes.forEach((plane, index) => {
      if (!plane.isAlive) return;
      
      // Поворот при удержании кнопок (исправленные ключи)
      if (gameState.keysPressed[`${index}_left`]) {
        plane.angle -= GAME_CONFIG.turnSpeed;
      }
      if (gameState.keysPressed[`${index}_right`]) {
        plane.angle += GAME_CONFIG.turnSpeed;
      }
      
      // Движение вперед (угол 0 = вправо, корректируем на -90 градусов)
      const radians = ((plane.angle - 90) * Math.PI) / 180;
      plane.x += Math.cos(radians) * GAME_CONFIG.planeSpeed;
      plane.y += Math.sin(radians) * GAME_CONFIG.planeSpeed;
      
      // Телепортация через края
      if (plane.x < 0) plane.x = fieldWidth;
      if (plane.x > fieldWidth) plane.x = 0;
      if (plane.y < 0) plane.y = fieldHeight;
      if (plane.y > fieldHeight) plane.y = 0;
      
      // Обновление позиции элемента
      plane.element.style.left = (plane.x - 20) + 'px';
      plane.element.style.top = (plane.y - 20) + 'px';
      plane.element.style.transform = `rotate(${plane.angle}deg)`;
    });
  }

  function updateBullets() {
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;
    
    gameState.bullets = gameState.bullets.filter(bullet => {
      if (!bullet.element) return false;
      
      // Движение пули (корректируем угол так же, как у самолета)
      const radians = ((bullet.angle - 90) * Math.PI) / 180;
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
      gameState.planes.forEach((plane, planeIndex) => {
        // Не проверяем столкновение с самим стрелком
        if (!plane.isAlive || planeIndex === bullet.shooterIndex) return;
        
        const distance = Math.sqrt(
          Math.pow(bullet.x - plane.x, 2) + Math.pow(bullet.y - plane.y, 2)
        );
        
        if (distance < GAME_CONFIG.planeSize / 2) {
          // Попадание!
          explodePlane(plane);
          if (bullet.element && bullet.element.parentNode) {
            bullet.element.remove();
          }
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
    
    hideAllPlayerControls();
    
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
