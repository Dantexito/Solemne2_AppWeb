<script setup>
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game";

const gameStore = useGameStore();
const {
  playerPosition,
  playerMoney,
  lastDiceRoll,
  playerLap,
  playerStage,
  gameMessage,
  currentStageConfig,
} = storeToRefs(gameStore);
</script>

<template>
  <div class="game-info">
    <h3>
      Stage: {{ playerStage }} | Lap: {{ playerLap }} /
      {{ currentStageConfig?.lapsToComplete || 3 }}
    </h3>
    <p>Position: {{ playerPosition }}</p>
    <p>Money: ${{ playerMoney }}</p>
    <p v-if="lastDiceRoll !== null">Last Roll: {{ lastDiceRoll }}</p>
    <hr />
    <p>
      <strong>{{ gameMessage }}</strong>
    </p>
  </div>
</template>

<style scoped>
.game-info {
  padding: 10px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  min-width: 300px; /* Give it some more space */
  text-align: center;
}
p {
  margin: 5px 0;
}
h3 {
  margin-top: 0;
}
hr {
  margin: 10px 0;
  border: 0;
  border-top: 1px solid #eee;
}
</style>
