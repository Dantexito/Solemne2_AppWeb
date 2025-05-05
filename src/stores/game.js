// src/store/game.js
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    turns: 10,
    currentTurn: 1,
    coins: 0,
    playerPosition: 0,
    goal: 10,
    tiles: Array.from({ length: 20 }, (_, i) => ({
      id: i,
      reward: Math.floor(Math.random() * 3), // 0 a 2 monedas
    })),
  }),
  actions: {
    rollDice() {
      const steps = Math.ceil(Math.random() * 6)
      this.playerPosition = (this.playerPosition + steps) % this.tiles.length
      this.coins += this.tiles[this.playerPosition].reward
      this.currentTurn++
    },
    hasWon() {
      return this.coins >= this.goal
    },
    hasLost() {
      return this.currentTurn > this.turns && this.coins < this.goal
    }
  }
})
