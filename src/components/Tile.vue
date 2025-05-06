<template>
    <div class="inner">
      <p>{{ tile.id }}</p>
      <p v-if="isPlayer">P</p>
      <p v-else>💰{{ tile.reward }}</p>
    </div>
  </template>
  
  <script setup>
  defineProps({
    tile: Object,
    isPlayer: Boolean
  })
  </script>
  
  <style scoped>
  .inner {
    width: 100%;
    height: 100%;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  </style>
  