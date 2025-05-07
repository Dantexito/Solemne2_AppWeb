<script setup>
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "./stores/game";
import GameBoard from "./components/GameBoard.vue";
import GameInfo from "./components/GameInfo.vue";
import ReservedDiceDisplay from "./components/ReservedDiceDisplay.vue";
import ChoiceModal from "./components/ChoiceModal.vue";

const gameStore = useGameStore();
const { isGameOver, gamePhase, choiceDetails, boardRows, boardCols } = storeToRefs(gameStore); // Added boardRows/Cols for overlay sizing

onMounted(() => {
  gameStore.initializeGame();
});

function handleRollNormalDice() {
  if (gameStore.gamePhase === "rolling" && !gameStore.isGameOver) {
    gameStore.rollDice();
  }
}

function handleChoice(option) {
  gameStore.playerMakesChoice(option);
}
</script>

<template>
  <div id="game-container">
    <h1>Dice Perimeter Quest (Layout V3 Fixed)</h1>

    <div class="main-game-area">
      <div class="board-with-info-overlay">
        <GameBoard class="game-board-component" />
        <GameInfo class="game-info-overlay-panel" />
      </div>

      <div class="right-action-panel">
        <ReservedDiceDisplay class="dice-reserve-component" />
        <div class="normal-roll-button-container">
          <button @click="handleRollNormalDice" :disabled="isGameOver || gamePhase !== 'rolling'">
            Roll Normal Die
          </button>
        </div>
      </div>
    </div>

    <ChoiceModal
      v-if="gamePhase === 'awaiting_choice' && choiceDetails"
      :details="choiceDetails"
      @player-choice="handleChoice"
    />
  </div>
</template>

<style scoped>
#game-container {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  min-height: 100vh;
  background-color: #e8e8e8; /* Slightly different page background */
}

h1 {
  color: #2c3e50;
  margin-bottom: 25px;
}

.main-game-area {
  display: flex; /* Aligns board-container and right-panel side-by-side */
  flex-direction: row;
  align-items: flex-start; /* Align tops of board and right panel */
  gap: 25px; /* Space between board area and right panel */
  justify-content: center;
  width: 100%;
  max-width: 950px; /* Adjust to fit everything comfortably */
}

.board-with-info-overlay {
  position: relative; /* This is CRUCIAL for absolute positioning GameInfo */
  /* Its size will be determined by GameBoard component */
  /* We don't set width/height here; GameBoard does. */
}

.game-board-component {
  /* GameBoard styles are in its own component.
     It needs to define its own explicit width and height based on its grid.
     Make sure its background allows GameInfo to be readable on top. */
}

.game-info-overlay-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  /* Calculate width/height to fit *inside* the perimeter squares */
  /* Assuming squares are 60px, perimeter is 1 square thick. */
  /* Board is (N_cols * 60px) wide. Empty space is (N_cols - 2) * 60px wide. */
  width: calc(
    v-bind(boardCols) * 60px - 2 * 60px - 20px
  ); /* Board width - 2 squares - some padding */
  height: calc(
    v-bind(boardRows) * 60px - 2 * 60px - 20px
  ); /* Board height - 2 squares - some padding */

  /* Fallback/Max dimensions for the info panel */
  min-width: 180px;
  min-height: 120px;
  max-width: 300px; /* Adjust as needed */
  max-height: 220px; /* Adjust as needed */

  /* pointer-events: none; */ /* Remove if info panel becomes interactive, but for display it's fine */
  z-index: 10; /* Ensure it's above the board squares if any visual overlap */
}

.right-action-panel {
  display: flex;
  flex-direction: column;
  align-items: center; /* Center content horizontally */
  gap: 20px; /* Space between reserved dice and roll button */
  min-width: 170px; /* Give it some space */
  padding-top: 0; /* Align with top of board if desired, or add margin */
}

.dice-reserve-component {
  width: 100%; /* Take full width of its parent (.right-action-panel) */
  /* Styles for ReservedDiceDisplay are in its own component */
}

.normal-roll-button-container {
  width: 100%;
}

.normal-roll-button-container button {
  width: 100%;
  padding: 12px 15px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.normal-roll-button-container button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
