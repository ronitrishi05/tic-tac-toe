/* ==========================================================
   TIC TAC TOE — vanilla JS, Player (X) vs Computer (O)
   ========================================================== */

// ----- Constants -----
const PLAYER = "X";
const COMPUTER = "O";

// All possible winning lines (indices into the 9-cell board array)
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

// ----- State -----
let board = Array(9).fill(null); // null | "X" | "O"
let gameOver = false;
let scores = { player: 0, computer: 0, draw: 0 };

// ----- DOM references -----
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const overlayEl = document.getElementById("overlay");
const popupImageWrap = document.getElementById("popupImageWrap");
const popupImageEl = document.getElementById("popupImage");
const popupTextEl = document.getElementById("popupText");

const scorePlayerEl = document.getElementById("scorePlayer");
const scoreComputerEl = document.getElementById("scoreComputer");
const scoreDrawEl = document.getElementById("scoreDraw");

/**
 * Build the 9 cell buttons once, wire up click handlers.
 */
function buildBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.setAttribute("data-index", i);
    cell.setAttribute("aria-label", "Cell " + (i + 1));
    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
  }
}

/**
 * Handles a tap/click on a board cell by the human player.
 */
function onCellClick(e) {
  const index = Number(e.currentTarget.getAttribute("data-index"));

  // Ignore taps on filled cells, or if game already ended, or if it's not player's turn
  if (gameOver || board[index] !== null) return;

  placeMark(index, PLAYER);

  // Check for outcome after player's move
  const outcome = checkOutcome(board);
  if (outcome) {
    handleGameEnd(outcome);
    return;
  }

  // Computer's turn — small delay feels more natural than an instant reply
  setStatus("Computer's Turn", "turn-computer");
  lockBoard(true);
  setTimeout(computerMove, 450);
}

/**
 * Places a mark on the board (data) and updates the matching cell (DOM).
 */
function placeMark(index, mark) {
  board[index] = mark;
  const cellEl = boardEl.querySelector(`[data-index="${index}"]`);
  cellEl.textContent = mark;
  cellEl.classList.add("filled", mark === PLAYER ? "x" : "o");
}

/**
 * Temporarily disable/enable pointer events on empty cells while
 * the computer is "thinking", so the player can't double-move.
 */
function lockBoard(locked) {
  boardEl.style.pointerEvents = locked ? "none" : "auto";
}

/**
 * Decide and play the computer's move using simple rule-based AI:
 * 1) Win if possible.
 * 2) Block the player if they are about to win.
 * 3) Take the center if free.
 * 4) Take a corner if free.
 * 5) Otherwise take any free cell.
 */
function computerMove() {
  if (gameOver) return;

  let move = findWinningMove(COMPUTER); // try to win
  if (move === -1) move = findWinningMove(PLAYER); // else block player
  if (move === -1) move = pickStrategicMove(); // else best remaining spot

  if (move !== -1) {
    placeMark(move, COMPUTER);
  }

  const outcome = checkOutcome(board);
  if (outcome) {
    handleGameEnd(outcome);
    return;
  }

  lockBoard(false);
  setStatus("Your Turn", "turn-player");
}

/**
 * Returns the index of a cell that would let `mark` complete a line
 * right now, or -1 if no such move exists.
 */
function findWinningMove(mark) {
  for (const line of WIN_LINES) {
    const values = line.map((i) => board[i]);
    const markCount = values.filter((v) => v === mark).length;
    const emptyCount = values.filter((v) => v === null).length;

    if (markCount === 2 && emptyCount === 1) {
      const emptyIndex = line[values.indexOf(null)];
      return emptyIndex;
    }
  }
  return -1;
}

/**
 * Fallback move selection: prefer center, then corners, then edges.
 */
function pickStrategicMove() {
  const center = 4;
  const corners = [0, 2, 6, 8];
  const edges = [1, 3, 5, 7];

  if (board[center] === null) return center;

  const freeCorners = corners.filter((i) => board[i] === null);
  if (freeCorners.length > 0) {
    return freeCorners[Math.floor(Math.random() * freeCorners.length)];
  }

  const freeEdges = edges.filter((i) => board[i] === null);
  if (freeEdges.length > 0) {
    return freeEdges[Math.floor(Math.random() * freeEdges.length)];
  }

  return -1; // board full
}

/**
 * Checks the board for a win or draw.
 * Returns { result: "player" | "computer" | "draw", line: [...] | null } or null if game continues.
 */
function checkOutcome(b) {
  for (const line of WIN_LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { result: b[a] === PLAYER ? "player" : "computer", line };
    }
  }
  if (b.every((v) => v !== null)) {
    return { result: "draw", line: null };
  }
  return null;
}

/**
 * Runs when the game reaches a final state: highlights the winning
 * line (if any), updates the scoreboard, and shows the right popup.
 */
function handleGameEnd(outcome) {
  gameOver = true;
  lockBoard(true);

  if (outcome.line) {
    outcome.line.forEach((i) => {
      boardEl.querySelector(`[data-index="${i}"]`).classList.add("win-cell");
    });
  }

  if (outcome.result === "player") {
    scores.player++;
    updateScoreboard();
    setStatus("You Won!", "turn-player");
    showPopup({
      image: "assests/win-image.png",
      text: "YOU WON 🎉"
    });
  } else if (outcome.result === "computer") {
    scores.computer++;
    updateScoreboard();
    setStatus("Computer Won!", "turn-computer");
    showPopup({
      image: "assests/lose-image.png",
      text: "YOU LOST 😂"
    });
  } else {
    scores.draw++;
    updateScoreboard();
    setStatus("It's a Draw!", "");
    showPopup({
      image: "assests/draw-image.png",
      text: "DRAW 🤝"
    });
  }
}

/**
 * Updates the status line text/color under the title.
 */
function setStatus(text, className) {
  statusEl.textContent = text;
  statusEl.className = "status" + (className ? " " + className : "");
}

/**
 * Updates the three score numbers in the scoreboard.
 */
function updateScoreboard() {
  scorePlayerEl.textContent = scores.player;
  scoreComputerEl.textContent = scores.computer;
  scoreDrawEl.textContent = scores.draw;
}

/**
 * Shows the win/lose/draw popup. If the image fails to load (e.g. the
 * asset hasn't been added yet), the image area is simply hidden so the
 * game never crashes or looks broken.
 */
function showPopup({ image, text }) {
  popupTextEl.textContent = text;

  // Reset image area, then attempt to load the image
  popupImageWrap.classList.remove("has-image");
  popupImageEl.removeAttribute("src");

  const tester = new Image();
  tester.onload = () => {
    popupImageEl.src = image;
    popupImageWrap.classList.add("has-image");
  };
  tester.onerror = () => {
    // Graceful fallback: no image yet, just keep it hidden
    popupImageWrap.classList.remove("has-image");
  };
  tester.src = image;

  overlayEl.classList.add("show");
}

/**
 * Hides the popup overlay.
 */
function hidePopup() {
  overlayEl.classList.remove("show");
}

/**
 * Resets the board back to an empty state for a new round
 * (does NOT reset the scoreboard — only a page refresh does that).
 */
function resetGame() {
  board = Array(9).fill(null);
  gameOver = false;
  hidePopup();
  buildBoard();
  lockBoard(false);
  setStatus("Your Turn", "turn-player");
}

// ----- Event wiring -----
restartBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

// ----- Init -----
buildBoard();
setStatus("Your Turn", "turn-player");
