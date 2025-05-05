<script setup>
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game";

const gameStore = useGameStore();
// storeToRefs to keep reactivity
const { playerPosition, playerMoney, lastDiceRoll } = storeToRefs(gameStore);
</script>

<template>
  <div class="game-info">
    <p>Position: {{ playerPosition }}</p>
    <p>Money: ${{ playerMoney }}</p>
    <p v-if="lastDiceRoll !== null">Last Roll: {{ lastDiceRoll }}</p>
    <p v-else>Roll the die!</p>
  </div>
</template>

<style scoped>
.game-info {
  padding: 10px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  background-color: #f9f9f9;
}
p {
  margin: 5px 0;
}
</style>
