<!---
File Path: src/components/GameBoard.vue

Purpose:
This component renders the visual game board, including the perimeter of squares
and the player's marker. It also displays a boss image overlay when a boss
encounter is active.

Interactions:
- Parent Component: `GameView.vue`.
- Child Components: `BoardSquare.vue`.
- Store: Uses `useGameStore` for board layout (`boardSquares`, `boardRows`, `boardCols`),
  player position (`playerPosition`), game phase (`gamePhase`), and current boss data (`currentBoss`).
- Assets: Loads boss images dynamically and the static player marker image.
--->
<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game"; // Adjust path if needed
import BoardSquare from "./BoardSquare.vue";

const gameStore = useGameStore();
// Destructure reactive properties from the store
const { boardSquares, boardRows, boardCols, playerPosition, gamePhase, currentBoss } =
  storeToRefs(gameStore);

// --- Static Player Image Configuration (from Lucas branch) ---
// Update width and height to the actual dimensions of your knight_static.png
const STATIC_PLAYER_IMAGE_DIMENSIONS = {
  width: 75,
  height: 75,
};
// Assuming knight_static.png is in src/assets/sprites/
const staticPlayerImageUrl = new URL("/assets/images/sprites/knight_static.png", import.meta.url)
  .href;
// Helper function to get the 1-indexed grid row and column for a square ID
// Path: Down -> Right -> Up -> Left (starting top-left at 0)
// This function is crucial for both BoardSquare and staticPlayerMarker positioning
function getSquareGridPosition(squareId, R_val, C_val) {
  const R = R_val;
  const C = C_val;
  if (R <= 1 || C <= 1) {
    if (R === 1) return { r: 1, c: squareId + 1 };
    if (C === 1) return { r: squareId + 1, c: 1 };
    return { r: 1, c: 1 };
  }
  if (squareId >= 0 && squareId < R) {
    // Left Column
    return { r: squareId + 1, c: 1 };
  } else if (squareId >= R && squareId < R + C - 1) {
    // Bottom Row
    return { r: R, c: squareId - R + 2 };
  } else if (squareId >= R + C - 1 && squareId < R + C - 1 + R - 1) {
    // Right Column
    return { r: R - 1 - (squareId - (R + C - 1)), c: C };
  } else if (squareId >= R + C - 1 + R - 1 && squareId < gameStore.totalBoardSquares) {
    // Top Row
    return { r: 1, c: C - 1 - (squareId - (R + C - 1 + R - 1)) };
  }
  console.warn(
    "GameBoard: Could not determine grid position for squareId:",
    squareId,
    "R:",
    R,
    "C:",
    C
  );
  return { r: 1, c: 1 };
}

// Generates the inline style object for placing a BoardSquare component on the CSS Grid
// Renamed from getBoardSquareStyle to match "main" branch's likely getSquarePositionStyle
function getSquarePositionStyle(squareId, R_val, C_val) {
  const pos = getSquareGridPosition(squareId, R_val, C_val);
  return {
    gridRowStart: pos.r,
    gridColumnStart: pos.c,
  };
}

// Computed property for positioning the static player marker (from Lucas branch)
const staticPlayerMarkerStyle = computed(() => {
  if (
    !boardSquares.value ||
    boardSquares.value.length === 0 ||
    boardRows.value === 0 ||
    boardCols.value === 0
  ) {
    return { display: "none" };
  }

  const currentSquareId = playerPosition.value;
  const R_val = boardRows.value;
  const C_val = boardCols.value;

  const playerGridPos = getSquareGridPosition(currentSquareId, R_val, C_val);
  const squarePixelSize = 60; // Assumed size of each square, ensure this matches CSS

  const markerWidth = STATIC_PLAYER_IMAGE_DIMENSIONS.width;
  const markerHeight = STATIC_PLAYER_IMAGE_DIMENSIONS.height;

  const targetSquarePixelTop = (playerGridPos.r - 1) * squarePixelSize;
  const targetSquarePixelLeft = (playerGridPos.c - 1) * squarePixelSize;

  const markerOffsetY = (squarePixelSize - markerHeight) / 2;
  const markerOffsetX = (squarePixelSize - markerWidth) / 2;

  const topPosition = targetSquarePixelTop + markerOffsetY;
  const leftPosition = targetSquarePixelLeft + markerOffsetX;

  return {
    position: "absolute",
    top: `${topPosition}px`,
    left: `${leftPosition}px`,
    width: `${markerWidth}px`,
    height: `${markerHeight}px`,
    zIndex: 10,
    pointerEvents: "none",
  };
});

// Computed property for boss image URL (from main branch)
const bossImageUrl = computed(() => {
  if (currentBoss.value && currentBoss.value.image) {
    // Assuming boss images are in public/assets/images/bosses/
    // Vite serves from `public` directory at the root.
    // If images are in `src/assets`, you'd use `new URL(...)`
    return `/assets/images/bosses/${currentBoss.value.image}`;
  }
  return ""; // Or a placeholder boss image
});
</script>

<template>
  <div class="game-board-wrapper">
    <div class="game-board-perimeter">
      <BoardSquare
        v-for="square in boardSquares"
        :key="square.id"
        :square="square"
        :style="getSquarePositionStyle(square.id, boardRows, boardCols)"
      />
      <img
        v-if="boardSquares.length > 0"
        :src="staticPlayerImageUrl"
        alt="Player"
        class="static-player-marker"
        :style="staticPlayerMarkerStyle"
      />
    </div>
    <div v-if="gameStore.gamePhase === 'boss_encounter'" class="boss-overlay-inside-board">
      <div class="boss-wrapper animated-boss">
        <img
          :src="`/assets/images/bosses/${gameStore.currentBoss?.image}`"
          class="boss-image-inside"
          alt="Boss"
        />

        <!-- 🎲 Número del dado lanzado -->
        <div v-if="gameStore.bossLastRoll !== null" class="boss-die-result">
          🎲 {{ gameStore.bossLastRoll }}
        </div>
        <div class="boss-counters">
          <p><strong>🎲 Dados restantes:</strong> {{ gameStore.remainingBossRolls }}</p>
          <p>
            <strong>💥 Total acumulado:</strong>
            {{ gameStore.currentDiceThrows.reduce((a, b) => a + b, 0) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-board-wrapper {
  position: relative;
  display: inline-block;
}

.game-board-perimeter {
  display: grid;
  grid-template-columns: repeat(var(--board-cols, 6), 75px); /* 75px for new square size */
  grid-template-rows: repeat(var(--board-rows, 6), 75px); /* 75px for new square size */
  width: calc(var(--board-cols, 6) * 75px); /* 75px in width calculation */
  height: calc(var(--board-rows, 6) * 75px); /* 75px in height calculation */
  border: 3px solid saddlebrown; /* Thickness and color of border for the main board perimeter if desired */
  position: relative;
  background-color: #f0e0c0;
}

.game-board-perimeter {
  --board-rows: v-bind("gameStore.boardRows");
  --board-cols: v-bind("gameStore.boardCols");
}

.static-player-marker {
  object-fit: contain;
  image-rendering: pixelated;
}

.boss-overlay-inside-board {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.boss-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  filter: drop-shadow(0 0 15px white);
}

.boss-image-inside {
  max-width: 60%;
  max-height: 70%;
  object-fit: contain;
  pointer-events: none;
}

.boss-counters {
  color: white;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 1.2rem; /* Slightly increased font size for boss counters */
  text-align: center;
}

@keyframes bossEntrance {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animated-boss {
  animation: bossEntrance 0.6s ease-out;
}
.boss-die-result {
  font-size: 4.5rem; /* Increased font size for boss die result */
  font-weight: bold;
  color: white;
  margin-top: 10px;
  animation: pop-in 0.8s ease-out;
  text-shadow: 0 0 10px #fff, 0 0 20px #fff;
}

@keyframes pop-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
