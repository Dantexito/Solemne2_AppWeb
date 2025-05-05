<template>
    <div>
      <GameBoard />
      <Dice />
      <p>Turno: {{ store.currentTurn }} / {{ store.turns }}</p>
      <p>Monedas: {{ store.coins }}</p>
      <p v-if="store.hasWon()">🏆 ¡Ganaste!</p>
      <p v-else-if="store.hasLost()">💀 Perdiste</p>
    </div>
  </template>
  
  <script setup>
  import { useGameStore } from '@/stores/game'
  import GameBoard from '@/components/GameBoard.vue'
  import Dice from '@/components/Dice.vue'
  
  const store = useGameStore()
  </script>
  