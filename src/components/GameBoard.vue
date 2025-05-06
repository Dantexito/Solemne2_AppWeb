<template>
    <div class="board">
      <Tile
        v-for="(tile, i) in store.tiles"
        :key="tile.id"
        :tile="tile"
        :is-player="tile.id === store.playerPosition"
        :class="`pos-${i}`"
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
    position: relative;
    width: 364px;
    height: 363px;
    margin: auto;
    background-color: #f5f5f5;
    border: 4px solid #222;
  }
  
  .tile {
    position: absolute;
    width: 60px;
    height: 60px;
    background-color: #fff;
    border: 2px solid #333;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* === Posiciones tipo Monopoly (19 casillas) === */
  /* Lado superior (0–5) */
  .pos-0 { top: 0; left: 0; }
  .pos-1 { top: 0; left: 60px; }
  .pos-2 { top: 0; left: 120px; }
  .pos-3 { top: 0; left: 180px; }
  .pos-4 { top: 0; left: 240px; }
  .pos-5 { top: 0; right: 0; }
  
  /* Lado derecho (6–9) */
  .pos-6 { top: 61.5px; right: 0; }
  .pos-7 { top: 120px; right: 0; }
  .pos-8 { top: 180px; right: 0; }
  .pos-9 { top: 240px; right: 0; }
  
  /* Lado inferior (10–14) */  
  .pos-10 { bottom: 0; right: 0; }
  .pos-11 { bottom: 0; left: 239.5px; }
  .pos-12 { bottom: 0; left: 180px; }
  .pos-13 { bottom: 0; left: 120px; }
  .pos-14 { bottom: 0; left: 60px; }
  .pos-15 { bottom: 0; left: 0; }
  
  /* Lado izquierdo (15–18) */
  .pos-16 { top: 60px; left: 0; }
  .pos-17 { top: 120px; left: 0; }
  .pos-18 { top: 180px; left: 0; }
  .pos-19 { top: 240px; left: 0; }
  </style>
  