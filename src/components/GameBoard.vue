<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game";
import BoardSquare from "./BoardSquare.vue";

const gameStore = useGameStore();
// Get reactive refs to state and getters
const { totalBoardSquares, boardRows, boardCols, playerPosition } = storeToRefs(gameStore);

// Array of square IDs [0, 1, ..., 19]
const squareIds = computed(() => {
  const count = totalBoardSquares.value; // totalBoardSquares is already a reactive getter
  return count > 0 ? Array.from({ length: count }, (_, i) => i) : [];
});

// Function to determine CSS Grid position for each square ID
// Path: Down -> Right -> Up -> Left (starting top-left)
function getSquarePositionStyle(squareId, rows, cols) {
  const R = rows;
  const C = cols;

  // Check for invalid state to prevent errors
  if (R <= 1 || C <= 1) {
    // Handle simple line or dot cases if necessary, or return default
    return { gridRowStart: 1, gridColumnStart: squareId + 1 };
  }

  // Left Column (Top to Bottom) - Indices 0 to R-1
  if (squareId >= 0 && squareId < R) {
    return { gridRow: `${squareId + 1} / span 1`, gridColumn: "1 / span 1" };
  }
  // Bottom Row (Left to Right) - Indices R to R + C - 2
  else if (squareId >= R && squareId < R + C - 1) {
    const colIndex = squareId - R + 2; // Column starts from 2
    return { gridRow: `${R} / span 1`, gridColumn: `${colIndex} / span 1` };
  }
  // Right Column (Bottom to Top) - Indices R + C - 1 to R + C - 1 + R - 2
  else if (squareId >= R + C - 1 && squareId < R + C - 1 + R - 1) {
    // Calculate row index counting upwards from the bottom
    const stepsUp = squareId - (R + C - 1);
    const rowIndex = R - 1 - stepsUp; // R-1 is 2nd row from bottom, R-R is top row
    return { gridRow: `${rowIndex + 1} / span 1`, gridColumn: `${C} / span 1` };
  }
  // Top Row (Right to Left) - Indices R + C - 1 + R - 1 up to the end
  else if (squareId >= R + C - 1 + R - 1 && squareId < totalBoardSquares.value) {
    // Calculate column index counting leftwards from the right
    const stepsLeft = squareId - (R + C - 1 + R - 1);
    const colIndex = C - 1 - stepsLeft; // C-1 is 2nd col from right, C-C+1=1 doesn't happen here -> stops at col 2
    return { gridRow: "1 / span 1", gridColumn: `${colIndex} / span 1` };
  }

  // Fallback for safety
  console.warn("Could not determine position for squareId:", squareId);
  return { gridRow: "1 / span 1", gridColumn: "1 / span 1" };
}
</script>

<template>
  <div class="game-board-perimeter">
    <BoardSquare
      v-for="id in squareIds"
      :key="id"
      :square-id="id"
      :style="getSquarePositionStyle(id, boardRows, boardCols)"
    />
  </div>
</template>

<style scoped>
.game-board-perimeter {
  display: grid;
  /* Create grid using CSS variables tied to store state */
  /* Ensures the grid resizes if rows/cols change later */
  grid-template-columns: repeat(var(--board-cols, 6), 55px); /* Default 6, size 55px */
  grid-template-rows: repeat(var(--board-rows, 6), 55px); /* Default 6, size 55px */

  /* Calculate width/height based on variables for container sizing */
  width: calc(var(--board-cols, 6) * 55px);
  height: calc(var(--board-rows, 6) * 55px);

  border: 3px solid saddlebrown;
  position: relative; /* Context for potential absolute positioned elements inside */
  margin: 20px auto; /* Center board */
  background-color: #f0e0c0; /* Board background */
  gap: 1px; /* Optional small gap between cells */
}

/* Define CSS variables based on store state using v-bind */
.game-board-perimeter {
  --board-rows: v-bind("gameStore.boardRows");
  --board-cols: v-bind("gameStore.boardCols");
}
</style>
