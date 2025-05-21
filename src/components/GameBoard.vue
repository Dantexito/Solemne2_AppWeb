<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game"; // Adjust path if needed
import BoardSquare from "./BoardSquare.vue";
import PlayerSprite from "./PlayerSprite.vue"; // Import the PlayerSprite component

const gameStore = useGameStore();
// Destructure reactive properties from the store
const { boardSquares, boardRows, boardCols, playerPosition, playerActionState } =
  storeToRefs(gameStore);

// --- Sprite Configuration (needed for positioning calculations) ---
const PLAYER_SPRITE_DIMENSIONS = {
  frameWidth: 48, // Example width, ensure it matches your sprite's frame width
  frameHeight: 64, // Example height, ensure it matches your sprite's frame height
};
// --- ---

// Helper function to get the 1-indexed grid row and column for a square ID
// Path: Down -> Right -> Up -> Left (starting top-left at 0)
function getSquareGridPosition(squareId, R_val, C_val) {
  const R = R_val; // Number of rows in the conceptual grid
  const C = C_val; // Number of columns in the conceptual grid

  // Handle edge cases for 1xN or Nx1 boards (lines)
  if (R <= 1 || C <= 1) {
    if (R === 1) return { r: 1, c: squareId + 1 }; // Horizontal line
    if (C === 1) return { r: squareId + 1, c: 1 }; // Vertical line
    return { r: 1, c: 1 }; // Default for very small/invalid boards
  }

  // Left Column (moving Down): Indices 0 to R-1
  if (squareId >= 0 && squareId < R) {
    return { r: squareId + 1, c: 1 };
  }
  // Bottom Row (moving Right): Indices R to R + C - 2 (total C-1 squares on this row segment)
  else if (squareId >= R && squareId < R + C - 1) {
    // colIndex starts from 2 because squareId=R is the second square on the bottom row
    return { r: R, c: squareId - R + 2 };
  }
  // Right Column (moving Up): Indices R + C - 1 to R + C - 1 + R - 2 (total R-1 squares on this row segment)
  else if (squareId >= R + C - 1 && squareId < R + C - 1 + R - 1) {
    // stepsUp from the bottom-right corner of this segment
    const stepsUp = squareId - (R + C - 1);
    // cssGridRow counts from top (1-indexed), so R is bottom row.
    // R - 1 is the row above the bottom, R - 1 - stepsUp moves further up.
    return { r: R - 1 - stepsUp, c: C };
  }
  // Top Row (moving Left): Indices R + C - 1 + R - 1 up to totalBoardSquares - 1
  else if (squareId >= R + C - 1 + R - 1 && squareId < gameStore.totalBoardSquares) {
    // stepsLeft from the top-right corner of this segment
    const stepsLeft = squareId - (R + C - 1 + R - 1);
    // cssGridCol counts from left (1-indexed). C is rightmost column.
    // C - 1 is the column to the left of the rightmost, C - 1 - stepsLeft moves further left.
    return { r: 1, c: C - 1 - stepsLeft };
  }

  console.warn(
    "GameBoard: Could not determine grid position for squareId:",
    squareId,
    "R:",
    R,
    "C:",
    C
  );
  return { r: 1, c: 1 }; // Fallback position
}

// Generates the inline style object for placing a BoardSquare component on the CSS Grid
function getBoardSquareStyle(squareId, R_val, C_val) {
  const pos = getSquareGridPosition(squareId, R_val, C_val);
  return {
    gridRowStart: pos.r, // CSS Grid lines are 1-indexed
    gridColumnStart: pos.c,
    // gridRowEnd: `span 1`, // Default span is 1, so not strictly needed
    // gridColumnEnd: `span 1`,
  };
}

// Computed property to dynamically calculate the style for positioning the PlayerSprite
const playerSpriteStyle = computed(() => {
  // Don't try to position if the board data isn't ready
  if (
    !boardSquares.value ||
    boardSquares.value.length === 0 ||
    boardRows.value === 0 ||
    boardCols.value === 0
  ) {
    return { display: "none" }; // Hide sprite if board isn't set up
  }

  const currentSquareId = playerPosition.value;
  const R_val = boardRows.value;
  const C_val = boardCols.value;

  // Get the grid cell (row, col) where the player's current square is located
  const playerGridPos = getSquareGridPosition(currentSquareId, R_val, C_val);

  // Assumed size of each square in pixels (must match CSS for .game-board-perimeter grid cells)
  const squarePixelSize = 60; // TODO: Make this a prop or a shared constant if it can vary

  // Dimensions of the player sprite (from its own configuration)
  const spriteWidth = PLAYER_SPRITE_DIMENSIONS.frameWidth;
  const spriteHeight = PLAYER_SPRITE_DIMENSIONS.frameHeight;

  // Calculate the top-left pixel coordinate of the target grid cell
  const targetSquarePixelTop = (playerGridPos.r - 1) * squarePixelSize;
  const targetSquarePixelLeft = (playerGridPos.c - 1) * squarePixelSize;

  // Calculate offsets to center the sprite within the target square
  const spriteOffsetY = (squarePixelSize - spriteHeight) / 2;
  const spriteOffsetX = (squarePixelSize - spriteWidth) / 2;

  // Final pixel position for the sprite
  const topPosition = targetSquarePixelTop + spriteOffsetY;
  const leftPosition = targetSquarePixelLeft + spriteOffsetX;

  return {
    position: "absolute", // Positioned relative to .game-board-perimeter
    top: `${topPosition}px`,
    left: `${leftPosition}px`,
    zIndex: 10, // Ensure player sprite is visually on top of the board squares
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

    <PlayerSprite
      v-if="boardSquares.length > 0"
      :action="playerActionState"
      :style="playerSpriteStyle"
    />
  </div>
</template>

<style scoped>
.game-board-perimeter {
  display: grid;
  /* grid columns and rows based on CSS variables, which are reactively bound to store state */
  grid-template-columns: repeat(var(--board-cols, 6), 60px); /* Default 6 cols, 60px wide each */
  grid-template-rows: repeat(var(--board-rows, 6), 60px); /* Default 6 rows, 60px high each */

  /* Calculate the total width and height of the board container */
  width: calc(var(--board-cols, 6) * 60px);
  height: calc(var(--board-rows, 6) * 60px);
  overflow: visible;
  border: 3px solid saddlebrown;
  position: relative;
  background-color: #f0e0c0; /* Background color for the board area */
  z-index: 0;
}

/* Vue 3 v-bind in CSS: Makes CSS variables reactive to Pinia store state */
.game-board-perimeter {
  --board-rows: v-bind("gameStore.boardRows");
  --board-cols: v-bind("gameStore.boardCols");
}
</style>
