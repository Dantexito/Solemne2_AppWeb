<script setup>
import { useGameStore } from "@/stores/game";
const gameStore = useGameStore();

const money = gameStore.playerMoney;
const rolls = gameStore.totalRolls;
const dice = gameStore.diceObtained;
const bosses = gameStore.bossesDefeated;

function restartGame() {
  gameStore.resetGame();
}
</script>

<template>
  <div class="modal-backdrop">
    <div class="modal-content">
      <h2>🏁 Resumen de la Partida</h2>
      <ul>
        <li>💰 Dinero reunido: ${{ money }}</li>
        <li>🎲 Dados lanzados: {{ rolls }}</li>
        <li>🎁 Dados obtenidos: {{ dice }}</li>
        <li>🧟‍♂️ Jefes derrotados: {{ bosses }}</li>
      </ul>
      <button @click="restartGame">Reiniciar Partida</button>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  width: 300px;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

button {
  background-color: #28a745;
  color: white;
  padding: 10px 18px;
  margin-top: 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
button:hover {
  background-color: #218838;
}
</style>
