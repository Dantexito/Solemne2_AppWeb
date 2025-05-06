<script setup>
import { onMounted } from "vue";
import { useGameStore } from "./stores/game";
import GameBoard from "./components/GameBoard.vue";
import GameInfo from "./components/GameInfo.vue";

const gameStore = useGameStore();

onMounted(() => {
  gameStore.initializeGame(); // Changed to initializeGame
});

function handleRollDice() {
  gameStore.rollDice();
}
</script>

<template>
  <div id="game-container">
    <h1>Dice Perimeter Quest</h1>
    <div class="game-layout">
      <GameInfo class="game-info-area" />
      <GameBoard class="game-board-area" />
      <div class="dice-control-area">
        <button @click="handleRollDice" :disabled="gameStore.isGameOver">Roll Die</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
#game-container {
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
}

.game-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 15px;
}

.game-info-area {
  /* Style from previous response is fine */
  border: 1px dashed grey;
  padding: 15px;
  margin-bottom: 15px;
  min-width: 300px;
  text-align: center;
  background-color: rgba(255, 255, 240, 0.85);
}

.game-board-area {
  /* Board is centered via margin:auto in its own component */
}

.dice-control-area {
  margin-top: 20px;
  text-align: center;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
