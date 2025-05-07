<template>
  <button @click="roll">🎲 Lanzar dado</button>
</template>

<script setup>
import { useGameStore } from "@/stores/game";
const store = useGameStore();

function roll() {
  store.rollDice();
}
</script>
