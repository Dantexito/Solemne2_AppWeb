// src/stores/game.js
import { defineStore } from "pinia";

export const useGameStore = defineStore("game", {
  state: () => ({
    boardRows: 6,
    boardCols: 6,
    playerPosition: 0, // Start at square 0
    playerMoney: 0,
    lastDiceRoll: null,
    // boardSquares isn't strictly needed if we just use indices 0-19 for now LOL
  }),

  getters: {
    // Calculate the total number of squares on the perimeter
    totalBoardSquares(state) {
      const R = state.boardRows;
      const C = state.boardCols;
      if (R <= 1 || C <= 1) return R * C; // Handle edge cases
      // Perimeter squares = 2 * Rows + 2 * Columns - 4 corners (counted double)
      return 2 * R + 2 * C - 4; // For 6x6, this is 2*6 + 2*6 - 4 = 20
    },
  },

  actions: {
    // Simple setup (can be expanded later to define square types)
    setupBoard() {
      this.playerPosition = 0;
      this.playerMoney = 0;
      this.lastDiceRoll = null;
      console.log(`Board setup with ${this.totalBoardSquares} squares.`);
    },

    // Roll a single 6-sided die
    rollDice() {
      const steps = Math.floor(Math.random() * 6) + 1;
      this.lastDiceRoll = steps;
      console.log(`Rolled a ${steps}`);
      this.movePlayer(steps);
    },

    // Move the player and add money
    movePlayer(steps) {
      if (steps <= 0) return;

      // Calculate final position with wrapping
      const newPosition = (this.playerPosition + steps) % this.totalBoardSquares;

      // Add money for each step taken
      this.playerMoney += steps * 100;

      console.log(`Moved ${steps} steps to square ${newPosition}. Money: ${this.playerMoney}`);
      this.playerPosition = newPosition;

      // Basic check after moving (can expand later)
      this.handleSquareLanding();
    },

    // Placeholder for logic when landing on a square
    handleSquareLanding() {
      console.log(`Landed on square ${this.playerPosition}.`);
      // Later: Check square type, trigger boosters, check laps etc.
    },
  },
});
