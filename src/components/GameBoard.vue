<template>
    <div class="board">
      <Tile
        v-for="tile in store.tiles"
        :key="tile.id"
        :tile="tile"
        :is-player="tile.id === store.playerPosition"
      />
    </div>
  </template>
  
  <script setup>
  import { useGameStore } from '@/stores/game'
  import Tile from './Tile.vue'
  const store = useGameStore()
  </script>
  
  <style scoped>
  .board {
    display: grid;
    grid-template-columns: repeat(5, 60px);
    gap: 10px;
  }
  </style>
  