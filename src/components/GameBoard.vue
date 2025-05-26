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
// IMPORTANT: Update width and height to the actual dimensions of your knight_static.png
const STATIC_PLAYER_IMAGE_DIMENSIONS = {
  width: 40,  // <<<< TODO: SET ACTUAL WIDTH OF knight_static.png
  height: 40, // <<<< TODO: SET ACTUAL HEIGHT OF knight_static.png
};
// Assuming knight_static.png is in src/assets/sprites/
const staticPlayerImageUrl = new URL('../assets/sprites/knight_static.png', import.meta.url).href;
// --- ---

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
  if (squareId >= 0 && squareId < R) { // Left Column
    return { r: squareId + 1, c: 1 };
  } else if (squareId >= R && squareId < R + C - 1) { // Bottom Row
    return { r: R, c: squareId - R + 2 };
  } else if (squareId >= R + C - 1 && squareId < R + C - 1 + R - 1) { // Right Column
    return { r: R - 1 - (squareId - (R + C - 1)), c: C };
  } else if (squareId >= R + C - 1 + R - 1 && squareId < gameStore.totalBoardSquares) { // Top Row
    return { r: 1, c: C - 1 - (squareId - (R + C - 1 + R - 1)) };
  }
  console.warn("GameBoard: Could not determine grid position for squareId:", squareId, "R:", R, "C:", C);
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
    pointerEvents: 'none',
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
    return ''; // Or a placeholder boss image
});

</script>

<template>
  <div class="game-board-wrapper"> <div class="game-board-perimeter">
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
    <div v-if="gamePhase === 'boss_encounter' && currentBoss" class="boss-overlay">
      <img
        v-if="bossImageUrl"
        :src="bossImageUrl"
        class="boss-image"
        alt="Boss"
      />
      <p v-else class="boss-name-fallback">{{ currentBoss.name || 'A Fearsome Boss' }}</p>
    </div>
  </div>
</template>

<style scoped>
.game-board-wrapper {
  position: relative; /* For positioning the boss overlay */
  display: inline-block; /* So it only takes the size of its content */
}

.game-board-perimeter {
  display: grid;
  grid-template-columns: repeat(var(--board-cols, 6), 60px);
  grid-template-rows: repeat(var(--board-rows, 6), 60px);
  width: calc(var(--board-cols, 6) * 60px);
  height: calc(var(--board-rows, 6) * 60px);
  border: 3px solid saddlebrown;
  position: relative; /* For static player marker positioning */
  background-color: #f0e0c0;
}

.game-board-perimeter {
  --board-rows: v-bind("gameStore.boardRows");
  --board-cols: v-bind("gameStore.boardCols");
}

.static-player-marker {
  object-fit: contain;
  image-rendering: pixelated;
  /* zIndex and positioning are handled by inline style */
}

.boss-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.65); /* Semi-transparent dark overlay */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20; /* Ensure boss is on top of player and board */
  border-radius: calc(3px + var(--board-cols, 6) * 0.5px); /* Match board border somewhat */
}

.boss-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  border: 3px solid gold;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.1);
}
.boss-name-fallback {
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    text-shadow: 1px 1px 2px black;
}
</style>
