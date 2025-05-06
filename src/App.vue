<script setup>
import { onMounted } from "vue";
import { useGameStore } from "./stores/game";
import GameBoard from "./components/GameBoard.vue";
import GameInfo from "./components/GameInfo.vue";

const gameStore = useGameStore();

onMounted(() => {
  gameStore.generateBoard()
});

function handleRollDice() {
  gameStore.roll()
}
</script>

<template>
  <div>
    <header>
      <nav>
        <router-link to="/">Inicio</router-link>
        <router-link to="/jugar">Jugar</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  background-color: #333;
  padding: 10px;
}
nav a {
  color: white;
  text-decoration: none;
}
</style>
