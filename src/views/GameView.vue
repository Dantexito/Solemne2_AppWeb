// src/views/GameView.vue
<script setup>
import { onMounted, computed } from "vue"; // Added computed
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game"; // Adjust path if store is elsewhere
import GameBoard from "../components/GameBoard.vue";
import GameInfo from "../components/GameInfo.vue";
import ReservedDiceDisplay from "../components/ReservedDiceDisplay.vue";
import ChoiceModal from "../components/ChoiceModal.vue";

const gameStore = useGameStore();
const { isGameOver, gamePhase, choiceDetails, boardRows, boardCols } = storeToRefs(gameStore);

onMounted(() => {
  gameStore.initializeGame();
});

function handleRollNormalDice() {
  if (gameStore.gamePhase === "rolling" && !gameStore.isGameOver && gameStore.assetsLoaded) {
    gameStore.rollDice();
  }
}

function handleChoice(option) {
  gameStore.playerMakesChoice(option);
}

// Computed property to display the current animation speed text
const currentSpeedText = computed(() => {
  switch (gameStore.animationSpeedMultiplier) {
    case 0:
      return "Instant";
    case 1:
      return "Normal";
    case 2:
      return "Faster";
    default:
      return "Unknown";
  }
});

function handleToggleSpeed() {
  gameStore.toggleAnimationSpeed();
}
</script>

<template>
  <div class="game-view-container">
    <div class="main-game-area">
      <div class="board-with-info-overlay">
        <GameBoard class="game-board-component" />
        <GameInfo class="game-info-overlay-panel" />
      </div>

      <div class="right-action-panel">
        <ReservedDiceDisplay class="dice-reserve-component" />

        <div class="action-buttons-group">
          <div class="normal-roll-button-container">
            <button
              @click="handleRollNormalDice"
              :disabled="isGameOver || gamePhase !== 'rolling' || gameStore.isAnimating"
              class="roll-button"
            >
              Roll Normal Die
            </button>
          </div>

          <div class="speed-control-container">
            <button @click="handleToggleSpeed" class="speed-button">
              Speed: {{ currentSpeedText }}
            </button>
          </div>
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
.game-view-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.main-game-area {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 25px;
  justify-content: center;
  width: 100%;
  max-width: 950px;
  margin-top: 20px;
}

.board-with-info-overlay {
  position: relative;
}

.game-info-overlay-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(v-bind(boardCols) * 60px - 2 * 60px - 15px);
  height: calc(v-bind(boardRows) * 60px - 2 * 60px - 15px);
  min-width: 160px;
  max-width: 320px;
  min-height: 100px;
  max-height: 250px;
  z-index: 10;
}

.right-action-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 15px; /* Reduced gap slightly */
  min-width: 160px;
  max-width: 200px;
}

.dice-reserve-component {
  width: 100%;
}

.action-buttons-group {
  display: flex;
  flex-direction: column;
  gap: 10px; /* Space between roll button and speed button */
  width: 100%;
}

.normal-roll-button-container,
.speed-control-container {
  width: 100%;
}

.roll-button,
.speed-button {
  width: 100%;
  padding: 10px 10px; /* Adjusted padding */
  font-size: 0.9em; /* Slightly smaller font */
  font-weight: bold;
  cursor: pointer;
  color: white;
  border: none;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.roll-button {
  background-color: #28a745; /* Green */
}
.roll-button:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.speed-button {
  background-color: #007bff; /* Blue */
}
.speed-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.roll-button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
