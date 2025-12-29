// Игра "Холодильник" - переключение квадратов
const GRID_SIZE = 6;
let gameState = [];
let movesCount = 0;
let gameWon = false;

// Инициализация игры
function initGame() {
  gameState = [];
  movesCount = 0;
  gameWon = false;
  
  // Создаём игровое поле
  const gameBoard = document.getElementById('gameBoard');
  gameBoard.innerHTML = '';
  
  // Инициализируем состояние (половина квадратов активна случайным образом)
  const totalSquares = GRID_SIZE * GRID_SIZE;
  const activeCount = Math.floor(totalSquares / 2);
  const activeIndices = new Set();
  
  // Выбираем случайные индексы для активных квадратов
  while (activeIndices.size < activeCount) {
    const index = Math.floor(Math.random() * totalSquares);
    activeIndices.add(index);
  }
  
  // Создаём квадраты
  for (let row = 0; row < GRID_SIZE; row++) {
    gameState[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const index = row * GRID_SIZE + col;
      const isActive = activeIndices.has(index);
      gameState[row][col] = isActive;
      
      const square = document.createElement('div');
      square.className = `square ${isActive ? 'active' : ''}`;
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener('click', () => handleSquareClick(row, col));
      
      gameBoard.appendChild(square);
    }
  }
  
  updateScore();
  hideModal();
}

// Обработка клика по квадрату
function handleSquareClick(row, col) {
  if (gameWon) return;
  
  // Переключаем квадрат и все квадраты в строке и столбце
  toggleSquare(row, col);
  
  // Переключаем все квадраты в строке
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col) {
      toggleSquare(row, c);
    }
  }
  
  // Переключаем все квадраты в столбце
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row) {
      toggleSquare(r, col);
    }
  }
  
  movesCount++;
  updateScore();
  
  // Проверяем победу
  checkWin();
}

// Переключение состояния квадрата
function toggleSquare(row, col) {
  gameState[row][col] = !gameState[row][col];
  
  const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
  if (square) {
    square.classList.toggle('active', gameState[row][col]);
  }
}

// Проверка победы
function checkWin() {
  let allActive = true;
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!gameState[row][col]) {
        allActive = false;
        break;
      }
    }
    if (!allActive) break;
  }
  
  if (allActive) {
    gameWon = true;
    showWinModal();
  }
}

// Обновление счёта
function updateScore() {
  const scoreElements = document.querySelectorAll('.score');
  scoreElements.forEach(el => {
    el.textContent = `Ходы: ${movesCount}`;
  });
}

// Показать модальное окно победы
function showWinModal() {
  const modal = document.getElementById('modalBackdrop');
  const movesCountEl = document.getElementById('movesCount');
  movesCountEl.textContent = movesCount;
  modal.hidden = false;
}

// Скрыть модальное окно
function hideModal() {
  const modal = document.getElementById('modalBackdrop');
  modal.hidden = true;
}

// Обработчики кнопок
document.addEventListener('DOMContentLoaded', () => {
  // Кнопки "Меню"
  document.getElementById('btnBackLeft').addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
  
  document.getElementById('btnBackRight').addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
  
  document.getElementById('btnToMenu').addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
  
  // Кнопки "Новая партия"
  document.getElementById('btnNewLeft').addEventListener('click', () => {
    initGame();
  });
  
  document.getElementById('btnNewRight').addEventListener('click', () => {
    initGame();
  });
  
  document.getElementById('btnRematch').addEventListener('click', () => {
    initGame();
  });
  
  // Инициализация игры при загрузке
  initGame();
});
