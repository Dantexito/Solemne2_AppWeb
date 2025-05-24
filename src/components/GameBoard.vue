<!--- src/components/GameBoard.vue --->
<script setup>
import { storeToRefs } from "pinia"; // Not strictly needed if using gameStore directly
import { useGameStore } from "@/stores/game";
import BoardSquare from "./BoardSquare.vue";

const gameStore = useGameStore();
// boardSquares is now the source of truth for what to render
const { boardSquares, boardRows, boardCols } = storeToRefs(gameStore);

// Function to determine CSS Grid position (from your previous correct version)
function getSquarePositionStyle(squareId, R_from_store, C_from_store) {
  // ... (Paste your corrected getSquarePositionStyle function here)
  // Make sure this function is accurate for the Down->Right->Up->Left path
  const R = R_from_store;
  const C = C_from_store;
  if (R <= 1 || C <= 1) {
    /* ... */
  }
  if (squareId >= 0 && squareId < R) {
    return { gridRow: `${squareId + 1} / span 1`, gridColumn: "1 / span 1" };
  } else if (squareId >= R && squareId < R + C - 1) {
    const colIndex = squareId - R + 2;
    return { gridRow: `${R} / span 1`, gridColumn: `${colIndex} / span 1` };
  } else if (squareId >= R + C - 1 && squareId < R + C - 1 + R - 1) {
    const stepsUp = squareId - (R + C - 1);
    const cssGridRow = R - 1 - stepsUp;
    return { gridRow: `${cssGridRow} / span 1`, gridColumn: `${C} / span 1` };
  } else if (squareId >= R + C - 1 + R - 1 && squareId < gameStore.totalBoardSquares) {
    // Use totalBoardSquares from store
    const stepsLeft = squareId - (R + C - 1 + R - 1);
    const cssGridCol = C - 1 - stepsLeft;
    return { gridRow: "1 / span 1", gridColumn: `${cssGridCol} / span 1` };
  }
  console.warn("Could not determine position for squareId:", squareId, "R:", R, "C:", C);
  return { gridRow: "1 / span 1", gridColumn: "1 / span 1" };
}
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
    </div>
    <div v-if="gameStore.gamePhase === 'boss_encounter'" class="boss-overlay">
      <img
        :src="`/assets/images/bosses/${gameStore.currentBoss?.image}`"
        class="boss-image"
        alt="Boss"
      />
    </div>
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
  position: relative;
  /* margin: 20px auto; */
  background-color: #f0e0c0;
}

.game-board-perimeter {
  --board-rows: v-bind("gameStore.boardRows");
  --board-cols: v-bind("gameStore.boardCols");
}

.boss-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.boss-image {
  max-height: 70vh;
  max-width: 70vw;
  object-fit: contain;
  filter: drop-shadow(0 0 10px white);
}

.game-board-wrapper {
  display: contents;
}
</style>
