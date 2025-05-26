<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game"; // Adjust path if needed
import BoardSquare from "./BoardSquare.vue";
// import PlayerSprite from "./PlayerSprite.vue"; // PlayerSprite is commented out for now

const gameStore = useGameStore();
// Destructure reactive properties from the store
// playerActionState is not needed for a static image
const { boardSquares, boardRows, boardCols, playerPosition } = storeToRefs(gameStore);

// --- Static Player Image Configuration ---

const STATIC_PLAYER_IMAGE_DIMENSIONS = {
  width: 60,
  height: 52,
};
const staticPlayerImageUrl = new URL("../assets/sprites/knight_static.png", import.meta.url).href;
// --- ---

// Helper function to get the 1-indexed grid row and column for a square ID
// Path: Down -> Right -> Up -> Left (starting top-left at 0)
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
function getBoardSquareStyle(squareId, R_val, C_val) {
  const pos = getSquareGridPosition(squareId, R_val, C_val);
  return {
    gridRowStart: pos.r,
    gridColumnStart: pos.c,
  };
}

// Computed property to dynamically calculate the style for positioning the static player marker
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
    zIndex: 10, // Ensure player marker is visually on top
    pointerEvents: "none", // So it doesn't interfere with clicks on squares if any
  };
});
</script>

<template>
  <div class="game-board-perimeter">
    <BoardSquare
      v-for="square in boardSquares"
      :key="square.id"
      :square="square"
      :style="getBoardSquareStyle(square.id, boardRows, boardCols)"
    />

    <img
      v-if="boardSquares.length > 0"
      :src="staticPlayerImageUrl"
      alt="Player"
      class="static-player-marker"
      :style="staticPlayerMarkerStyle"
    />
  </div>
</template>

<style scoped>
.game-board-perimeter {
  display: grid;
  grid-template-columns: repeat(var(--board-cols, 6), 60px);
  grid-template-rows: repeat(var(--board-rows, 6), 60px);
  width: calc(var(--board-cols, 6) * 60px);
  height: calc(var(--board-rows, 6) * 60px);
  border: 3px solid saddlebrown;
  position: relative; /* Crucial for absolute positioning of the player marker */
  background-color: #f0e0c0;
}

.game-board-perimeter {
  --board-rows: v-bind("gameStore.boardRows");
  --board-cols: v-bind("gameStore.boardCols");
}

.static-player-marker {
  /* Basic styling, most is handled by inline :style */
  object-fit: contain; /* Or 'cover', depending on your image and desired look */
  image-rendering: pixelated; /* Good for pixel art */
}
</style>
