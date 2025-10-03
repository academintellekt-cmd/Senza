// Сёма - полноэкранная версия
(() => {
  // КОНФИГУРАЦИЯ ИГРЫ
  const GAME_CONFIG = {
    name: 'Сёма',
    icon: '🧠',
    colors: [
      { name: 'red', value: '#FE112E', display: 'Красный', sector: 'top-left' },
      { name: 'blue', value: '#1E6FE3', display: 'Синий', sector: 'top-right' },
      { name: 'green', value: '#2ED573', display: 'Зелёный', sector: 'bottom-left' },
      { name: 'yellow', value: '#FFE23F', display: 'Жёлтый', sector: 'bottom-right' }
    ],
    flashDuration: 400,
    pauseDuration: 200,
    sequenceStartLength: 1
  };

  // СОСТОЯНИЕ ИГРЫ
  const gameState = {
    currentPlayers: 1,
    score: 0,
    level: 1,
    isPlaying: false,
    gamePhase: 'selecting', // 'selecting', 'showing', 'waiting', 'finished'
    isWin: false,
    currentSequence: [],
    playerSequences: {}, // Объект для хранения последовательностей каждого игрока
    currentPlayerIndex: 0,
    players: [],
    showSequenceIndex: 0,
    isShowingSequence: false,
    playersAnswered: 0, // Количество игроков, давших ответ
    totalActivePlayers: 0, // Текущее количество активных игроков
    playersAtRoundStart: 0 // Количество активных игроков в начале раунда
  };

  // DOM ЭЛЕМЕНТЫ
  let stage, centerCircle, playersSection;
  let hudCheckTop, hudCheckBottom;

  // ИНИЦИАЛИЗАЦИЯ
  function initGame() {
    console.log('Инициализация игры Сёма...');
    stage = document.getElementById('stage');
    if (!stage) {
      console.error('Элемент stage не найден!');
      return;
    }
    
    console.log('Создание интерфейса...');
    createGameInterface();
    updateDisplay();
    bindEvents();
    showPlayersModal();
    console.log('Игра инициализирована!');
  }

  // СОЗДАНИЕ ИНТЕРФЕЙСА
  function createGameInterface() {
    console.log('Создание игрового интерфейса...');
    stage.innerHTML = `
      <div class="syoma-game" id="syomaGame">
        <div class="center-circle" id="centerCircle">
          <div class="sector top-left" data-color="red"></div>
          <div class="sector top-right" data-color="blue"></div>
          <div class="sector bottom-left" data-color="green"></div>
          <div class="sector bottom-right" data-color="yellow"></div>
        </div>
        <div class="players-section" id="playersSection">
          <div style="grid-column: 1/-1; text-align: center; color: white; font-size: 18px;">
            Выберите количество игроков для начала игры
          </div>
        </div>
      </div>
    `;
    
    const syomaGame = document.getElementById('syomaGame');
    centerCircle = document.getElementById('centerCircle');
    playersSection = document.getElementById('playersSection');
    hudCheckTop = document.getElementById('hudCheckTop');
    hudCheckBottom = document.getElementById('hudCheckBottom');
    
    console.log('Элементы созданы:', {
      syomaGame: !!syomaGame,
      centerCircle: !!centerCircle,
      playersSection: !!playersSection
    });
  }

  // ОБЯЗАТЕЛЬНЫЕ ФУНКЦИИ
  function updateDisplay() {
    const scoreTop = document.getElementById('scoreTop');
    const scoreBottom = document.getElementById('scoreBottom');
    if (scoreTop) scoreTop.textContent = `Уровень: ${gameState.level}`;
    if (scoreBottom) scoreBottom.textContent = `Уровень: ${gameState.level}`;
    
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
    gameState.score = 0;
    gameState.level = 1;
    gameState.isPlaying = false;
    gameState.gamePhase = 'selecting';
    gameState.isWin = false;
    gameState.currentSequence = [];
    gameState.playerSequences = {};
    gameState.currentPlayerIndex = 0;
    gameState.players = [];
    gameState.showSequenceIndex = 0;
    gameState.isShowingSequence = false;
    gameState.playersAnswered = 0;
    gameState.totalActivePlayers = 0;
    gameState.playersAtRoundStart = 0;
    
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.hidden = true;
      modalBackdrop.style.display = 'none';
      modalBackdrop.style.visibility = 'hidden';
    }
    
    hideHUDCheckButton();
    
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

  function showEndModal(winner, finalScore) {
    console.log('showEndModal вызвана:', { winner, finalScore });
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    
    console.log('Элементы модального окна:', {
      modalBackdrop: !!modalBackdrop,
      modalTitle: !!modalTitle,
      modalSubtitle: !!modalSubtitle
    });
    
    if (modalBackdrop && modalTitle && modalSubtitle) {
      if (winner) {
        modalTitle.textContent = `Победил Игрок ${winner.id}`;
        modalSubtitle.textContent = `Ваш счёт: ${finalScore}`;
      } else {
        modalTitle.textContent = 'Игра окончена!';
        modalSubtitle.textContent = `Все игроки выбыли. Счёт: ${finalScore}`;
      }
      modalBackdrop.hidden = false;
      modalBackdrop.style.display = 'flex';
      modalBackdrop.style.visibility = 'visible';
      console.log('Модальное окно показано');
    } else {
      console.error('Элементы модального окна не найдены!');
    }
  }

  // ОБРАБОТЧИКИ СОБЫТИЙ
  function bindEvents() {
    // Выбор количества игроков
    const difficultyOptions = document.querySelectorAll('.difficulty-option');
    difficultyOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const players = parseInt(e.currentTarget.dataset.players);
        gameState.currentPlayers = players;
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
      if (modalBackdrop) {
        modalBackdrop.hidden = true;
        modalBackdrop.style.display = 'none';
        modalBackdrop.style.visibility = 'hidden';
      }
      resetGame();
    });
    if (btnToMenu) btnToMenu.addEventListener('click', () => window.location.href = '../../index.html');
  }

  // АЛГОРИТМ ИГРЫ
  function startGame() {
    gameState.isPlaying = true;
    gameState.gamePhase = 'showing';
    
    // Инициализация игроков
    gameState.players = [];
    for (let i = 1; i <= gameState.currentPlayers; i++) {
      gameState.players.push({
        id: i,
        status: 'active',
        score: 0
      });
    }
    
    createPlayersInterface();
    updateDisplay();
    showGameInstructions();
  }

  function createPlayersInterface() {
    if (!playersSection) return;
    
    playersSection.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
      const playerDiv = document.createElement('div');
      playerDiv.className = 'player-controls';
      // Для игроков 1 и 2 меняем порядок и переворачиваем
      if (player.id <= 2) {
        playerDiv.innerHTML = `
          <div class="player-status ${player.status} flipped">${getPlayerStatusText(player.status)}</div>
          <div class="player-buttons">
            <button class="player-btn red" data-color="red" data-player="${player.id}"></button>
            <button class="player-btn blue" data-color="blue" data-player="${player.id}"></button>
            <button class="player-btn green" data-color="green" data-player="${player.id}"></button>
            <button class="player-btn yellow" data-color="yellow" data-player="${player.id}"></button>
          </div>
          <div class="player-label flipped">Игрок ${player.id}</div>
        `;
      } else {
        playerDiv.innerHTML = `
          <div class="player-label">Игрок ${player.id}</div>
          <div class="player-buttons">
            <button class="player-btn red" data-color="red" data-player="${player.id}"></button>
            <button class="player-btn blue" data-color="blue" data-player="${player.id}"></button>
            <button class="player-btn green" data-color="green" data-player="${player.id}"></button>
            <button class="player-btn yellow" data-color="yellow" data-player="${player.id}"></button>
          </div>
          <div class="player-status ${player.status}">${getPlayerStatusText(player.status)}</div>
        `;
      }
      
      // Позиционируем игроков по углам
      const positions = [
        { top: '120px', left: '20px' },      // Верхний левый
        { top: '120px', right: '20px' },     // Верхний правый
        { bottom: '120px', left: '20px' },   // Нижний левый
        { bottom: '120px', right: '20px' }   // Нижний правый
      ];
      
      if (positions[index]) {
        Object.assign(playerDiv.style, positions[index]);
      }
      
      playersSection.appendChild(playerDiv);
    });
    
    // Добавляем обработчики для кнопок игроков
    const playerBtns = playersSection.querySelectorAll('.player-btn');
    playerBtns.forEach(btn => {
      btn.addEventListener('click', handlePlayerButtonClick);
    });
  }

  function getPlayerStatusText(status) {
    switch (status) {
      case 'active': return 'Активен';
      case 'eliminated': return 'Выбыл';
      case 'winner': return 'Победитель!';
      default: return '';
    }
  }

  function showGameInstructions() {
    updateHUDInfo('Смотрите на последовательность...');
    setTimeout(() => {
      generateNewSequence();
      showSequence();
    }, 2000);
  }

  function generateNewSequence() {
    gameState.currentSequence = [];
    const sequenceLength = gameState.level;
    
    for (let i = 0; i < sequenceLength; i++) {
      const randomColor = GAME_CONFIG.colors[Math.floor(Math.random() * GAME_CONFIG.colors.length)];
      gameState.currentSequence.push(randomColor.name);
    }
    
    // Сбрасываем последовательности всех игроков
    gameState.playerSequences = {};
    gameState.playersAnswered = 0;
    gameState.totalActivePlayers = gameState.players.filter(p => p.status === 'active').length;
    gameState.playersAtRoundStart = gameState.totalActivePlayers;
    gameState.showSequenceIndex = 0;
    gameState.isShowingSequence = true;
  }

  async function showSequence() {
    updateHUDInfo('Повторите последовательность');
    
    // Убеждаемся, что все сектора неактивны в начале
    const allSectors = centerCircle.querySelectorAll('.sector');
    allSectors.forEach(sector => sector.classList.remove('active'));
    
    for (let i = 0; i < gameState.currentSequence.length; i++) {
      const color = gameState.currentSequence[i];
      const sector = centerCircle.querySelector(`[data-color="${color}"]`);
      
      if (sector) {
        // Убеждаемся, что предыдущие сектора неактивны
        allSectors.forEach(s => s.classList.remove('active'));
        
        // Активируем текущий сектор
        sector.classList.add('active');
        await sleep(GAME_CONFIG.flashDuration);
        
        // Деактивируем сектор
        sector.classList.remove('active');
        await sleep(GAME_CONFIG.pauseDuration);
      }
    }
    
    // Финальная очистка - убеждаемся, что все сектора неактивны
    allSectors.forEach(sector => sector.classList.remove('active'));
    
    gameState.isShowingSequence = false;
    gameState.gamePhase = 'waiting';
    enablePlayerInput();
  }

  function enablePlayerInput() {
    const activePlayers = gameState.players.filter(p => p.status === 'active');
    if (activePlayers.length === 0) {
      endGame();
      return;
    }
    
    updateHUDInfo(`Повторите последовательность (${gameState.playersAnswered}/${gameState.playersAtRoundStart})`);
    
    const playerBtns = playersSection.querySelectorAll('.player-btn');
    playerBtns.forEach(btn => {
      const playerId = parseInt(btn.dataset.player);
      const player = gameState.players.find(p => p.id === playerId);
      btn.disabled = !player || player.status !== 'active';
    });
  }

  function handlePlayerButtonClick(e) {
    if (gameState.gamePhase !== 'waiting' || gameState.isShowingSequence) return;
    
    const color = e.target.dataset.color;
    const playerId = parseInt(e.target.dataset.player);
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!player || player.status !== 'active') return;
    
    // Инициализируем последовательность игрока, если её нет
    if (!gameState.playerSequences[playerId]) {
      gameState.playerSequences[playerId] = [];
    }
    
    // Добавляем цвет к последовательности игрока
    gameState.playerSequences[playerId].push(color);
    
    // Подсвечиваем нажатую кнопку
    e.target.style.transform = 'scale(0.9)';
    setTimeout(() => {
      e.target.style.transform = '';
    }, 150);
    
    // Проверяем, завершил ли игрок последовательность
    if (gameState.playerSequences[playerId].length === gameState.currentSequence.length) {
      checkPlayerSequence(player);
    }
  }

  function checkPlayerSequence(player) {
    const playerSequence = gameState.playerSequences[player.id];
    const isCorrect = playerSequence.every((color, index) => 
      color === gameState.currentSequence[index]
    );
    
    // Увеличиваем счетчик отвечавших игроков
    gameState.playersAnswered++;
    
    if (isCorrect) {
      player.score++;
      gameState.score = Math.max(gameState.score, player.score);
      
      updateHUDInfo(`Игрок ${player.id} правильно! (${gameState.playersAnswered}/${gameState.playersAtRoundStart})`);
      
      // Если все игроки ответили, переходим к следующему уровню
      if (gameState.playersAnswered >= gameState.playersAtRoundStart) {
        gameState.level++;
        
        setTimeout(() => {
          updateHUDInfo(`Все правильно! Уровень ${gameState.level}`);
          setTimeout(() => {
            generateNewSequence();
            showSequence();
          }, 1500);
        }, 1000);
      }
      
    } else {
      // Игрок выбывает
      player.status = 'eliminated';
      gameState.totalActivePlayers--;
      
      updateHUDInfo(`Игрок ${player.id} выбыл! (${gameState.playersAnswered}/${gameState.playersAtRoundStart})`);
      
      // Обновляем интерфейс игрока
      updatePlayerStatus(player.id);
      
      // Проверяем, нужно ли завершать раунд
      setTimeout(() => {
        const activePlayers = gameState.players.filter(p => p.status === 'active');
        
        // Если это одиночная игра или остался 1 или меньше активных игроков, завершаем игру
        if (gameState.currentPlayers === 1 || activePlayers.length <= 1) {
          endGame();
        } else {
          // Проверяем, ответили ли все игроки
          if (gameState.playersAnswered >= gameState.playersAtRoundStart) {
            // Все игроки ответили, переходим к следующему уровню
            gameState.level++;
            setTimeout(() => {
              generateNewSequence();
              showSequence();
            }, 1500);
          } else {
            // Не все игроки ответили, продолжаем ждать
            enablePlayerInput();
          }
        }
      }, 1500);
    }
    
    updateDisplay();
  }

  function updatePlayerStatus(playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const playerDiv = playersSection.querySelector(`[data-player="${playerId}"]`)?.closest('.player-controls');
    if (playerDiv) {
      const statusDiv = playerDiv.querySelector('.player-status');
      if (statusDiv) {
        // Для игроков 1 и 2 добавляем класс flipped
        const flippedClass = player.id <= 2 ? ' flipped' : '';
        statusDiv.className = `player-status ${player.status}${flippedClass}`;
        statusDiv.textContent = getPlayerStatusText(player.status);
      }
      
      // Отключаем кнопки игрока
      const playerBtns = playerDiv.querySelectorAll('.player-btn');
      playerBtns.forEach(btn => {
        btn.disabled = true;
      });
    }
  }

  function endGame() {
    console.log('endGame вызвана');
    gameState.isPlaying = false;
    gameState.gamePhase = 'finished';
    
    hideHUDCheckButton();
    
    let winner = null;
    let finalScore = gameState.level - 1; // Раунд, на котором остановилась игра
    
    if (gameState.currentPlayers === 1) {
      updateHUDInfo('Игра завершена!');
      winner = { id: 1 };
    } else {
      winner = gameState.players.find(p => p.status === 'active');
      if (winner) {
        winner.status = 'winner';
        updatePlayerStatus(winner.id);
        updateHUDInfo(`Победитель: Игрок ${winner.id}!`);
      } else {
        updateHUDInfo('Все игроки выбыли!');
        // Если все выбыли, победителя нет
        winner = null;
      }
    }
    
    console.log('Показываем модальное окно:', { winner, finalScore });
    showEndModal(winner, finalScore);
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