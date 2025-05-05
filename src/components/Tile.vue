<template>
    <div :class="['tile', { player: isPlayer }]">
      💰{{ tile.reward }}
    </div>
  </template>
  
  <script setup>
  defineProps(['tile', 'isPlayer'])
  </script>
  
  <style scoped>
  .tile {
    width: 60px;
    height: 60px;
    border: 2px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  .player {
    background-color: gold;
  }
  </style>
  