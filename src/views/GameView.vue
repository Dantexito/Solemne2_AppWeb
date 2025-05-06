<template>
  <div class="game-view">
    <GameBoard />
    <Dice />
    <GameInfo />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import GameBoard from '@/components/GameBoard.vue'
import Dice from '@/components/Dice.vue'
import GameInfo from '@/components/GameInfo.vue'

const store = useGameStore()

onMounted(() => {
  game.generateBoard()
})

</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
