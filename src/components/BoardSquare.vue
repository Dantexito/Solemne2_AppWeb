<script setup>
import { computed } from "vue";
import { useGameStore } from "../stores/game";

const props = defineProps({
  squareId: {
    type: Number,
    required: true,
  },
});

const gameStore = useGameStore();
const isPlayerHere = computed(() => gameStore.playerPosition === props.squareId);
</script>

<template>
  <div class="board-square" :class="{ 'player-here': isPlayerHere }">
    <span class="square-id">{{ squareId }}</span>
    <span v-if="isPlayerHere" class="player-marker"> P </span>
  </div>
</template>

<style scoped>
.board-square {
  border: 1px solid #a07040; /* Brownish border */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between; /* Pushes ID and Player Marker apart slightly */
  padding: 2px;
  font-size: 11px;
  position: relative;
  background-color: #fff8e8; /* Lighter square color */
  box-sizing: border-box; /* Include padding/border in size */
  overflow: hidden; /* Prevent content spillover */
}
.board-square.player-here {
  background-color: #add8e6; /* Light blue */
}
.square-id {
  font-weight: normal;
  color: #555;
}
.player-marker {
  font-weight: bold;
  color: red;
  font-size: 18px;
  line-height: 1; /* Adjust line height */
}
</style>
