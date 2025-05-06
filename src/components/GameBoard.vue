<template>
<div class="board">
    <div
        v-for="(cell, index) in totalCells"
        :key="index"
        class="cell"
      >
      <Tile
  v-if="isPerimeter(index) && game.boardSquares[perimeterIndex(index)]"
  :tile="game.boardSquares[perimeterIndex(index)]"
  :is-player="perimeterIndex(index) === game.playerPosition"
/>

        <div v-else class="empty"></div>
      </div>
  
      <div class="center-info">
        <GameInfo />
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useGameStore } from '@/stores/game'
  import Tile from './Tile.vue'
  import GameInfo from './GameInfo.vue'
  
  const game = useGameStore()
  
  const gridSize = computed(() => game.boardRows) // 6 o 9
  const totalCells = computed(() => gridSize.value * gridSize.value)
  
  // Generar un array con las posiciones del borde
  const perimeterPositions = computed(() => {
    const size = gridSize.value
    const positions = []
  
    for (let col = 0; col < size; col++) positions.push(col) // fila arriba
    for (let row = 1; row < size - 1; row++) positions.push(row * size + size - 1) // columna derecha
    for (let col = size - 1; col >= 0; col--) positions.push((size - 1) * size + col) // fila abajo
    for (let row = size - 2; row > 0; row--) positions.push(row * size) // columna izquierda
  
    return positions
  })
  
  // Saber si una celda en la grilla es parte del borde
  function isPerimeter(index) {
    return perimeterPositions.value.includes(index)
  }
  
  // Obtener el índice dentro de boardSquares para esa posición de borde
  function perimeterIndex(index) {
    return perimeterPositions.value.indexOf(index)
  }
  </script>
  
  <style scoped>
  .board {
    display: grid;
    gap: 2px;
    margin: auto;
    position: relative;
  }
  
  .cell {
    width: 60px;
    height: 60px;
  }
  
  .board {
    /* Se ajusta dinámicamente a 6x6 o 9x9 */
    grid-template-columns: repeat(auto-fit, 60px);
    grid-auto-rows: 60px;
    background-color: #ddd;
    padding: 10px;
    border: 4px solid #222;
  }
  
  .empty {
    background-color: transparent;
  }
  
  /* Info al centro */
  .center-info {
    position: absolute;
    top: 25%;
    left: 25%;
    width: 50%;
    height: 50%;
    background-color: rgba(255, 255, 255, 0.96);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 0 5px #0003;
    pointer-events: none;
  }
  </style>
  