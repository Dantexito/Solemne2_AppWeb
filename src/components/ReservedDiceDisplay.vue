<script setup>
import { useGameStore } from "../stores/game";
import { storeToRefs } from "pinia";

const gameStore = useGameStore();
const { reservedDice, gamePhase, isGameOver } = storeToRefs(gameStore);

function getDieLabel(die) {
  let label = die.type;
  if (die.value !== undefined) {
    label += ` (${die.value})`;
  }
  return label;
}

function useReservedDie(index) {
  if (gameStore.gamePhase === "rolling" && !gameStore.isGameOver) {
    gameStore.rollDice(index); // Pass index to rollDice action
  }
}
</script>

<template>
  <div class="reserved-dice-container">
    <h3>Dice in Reserve</h3>
    <p v-if="reservedDice.length === 0">None</p>
    <ul>
      <li v-for="(die, index) in reservedDice" :key="index">
        <button
          @click="useReservedDie(index)"
          :disabled="isGameOver || gamePhase !== 'rolling'"
          class="die-button"
        >
          {{ getDieLabel(die) }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.reserved-dice-container {
  text-align: center;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin-bottom: 8px;
}
.die-button {
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}
.die-button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
h3 {
  margin-top: 0;
}
</style>
