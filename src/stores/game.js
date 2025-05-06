// src/stores/game.js
import { defineStore } from "pinia";

// Define board configurations for each stage
const STAGE_CONFIGS = {
  1: { rows: 6, cols: 6, moneyMultiplier: 1, lapsToComplete: 3, bossName: "Tax Collector" },
  2: { rows: 9, cols: 9, moneyMultiplier: 1.5, lapsToComplete: 3, bossName: "Greedy Goblin King" },
  3: { rows: 12, cols: 12, moneyMultiplier: 2, lapsToComplete: 3, bossName: "The Final Audit" },
  // Add more stages if needed
};
const MAX_STAGES = Object.keys(STAGE_CONFIGS).length;

export const useGameStore = defineStore("game", {
  state: () => ({
    boardRows: 6, // Will be updated by stage
    boardCols: 6, // Will be updated by stage
    playerPosition: 0,
    playerMoney: 0,
    lastDiceRoll: null,
    playerLap: 1,
    playerStage: 1,
    boardSquares: [], // Now an array of square objects {id, type}
    gameMessage: "Roll the die to start!",
    isGameOver: false,
  }),

  getters: {
    currentStageConfig(state) {
      return STAGE_CONFIGS[state.playerStage];
    },
    totalBoardSquares(state) {
      const config = this.currentStageConfig;
      if (!config) return 0;
      const R = config.rows;
      const C = config.cols;
      if (R <= 1 || C <= 1) return R * C;
      return 2 * R + 2 * C - 4;
    },
    // Calculates the ID of the bottom-right corner based on current config and path
    // Path: Down -> Right -> Up -> Left
    // Left Col (0 to R-1), Bottom Row (R to R+C-2)
    // So, the last square of the bottom row is R + C - 2
    bottomRightCornerId(state) {
      const config = this.currentStageConfig;
      if (!config) return -1; // Should not happen if stage is valid
      return config.rows + config.cols - 2;
    },
  },

  actions: {
    initializeGame() {
      this.playerStage = 1;
      this.isGameOver = false;
      this.gameMessage = "Roll the die to start!";
      this.setupStage();
    },

    setupStage() {
      const config = this.currentStageConfig;
      if (!config) {
        console.error("Invalid stage:", this.playerStage);
        this.gameMessage = "Error: Invalid stage configuration!";
        this.isGameOver = true;
        return;
      }

      this.boardRows = config.rows;
      this.boardCols = config.cols;
      this.playerLap = 1;
      this.playerPosition = 0;
      this.playerMoney = this.playerStage > 1 ? this.playerMoney : 0; // Keep money between stages or reset for first
      this.lastDiceRoll = null;
      this.generateBoardLayout();
      this.gameMessage = `Stage ${this.playerStage} - Lap ${this.playerLap}/${config.lapsToComplete}. Roll the die!`;
      console.log(`Stage ${this.playerStage} setup with ${this.totalBoardSquares} squares.`);
    },

    generateBoardLayout() {
      const config = this.currentStageConfig;
      const totalSquares = this.totalBoardSquares;
      const brCornerId = this.bottomRightCornerId;
      const newLayout = [];

      for (let i = 0; i < totalSquares; i++) {
        let squareType = "normal";
        if (i === 0) {
          squareType = "start";
        } else if (i === brCornerId) {
          squareType = "corner_br_bad";
        }
        // Add more logic for other corner types or boosters here
        // e.g., other corners:
        // const topLeftCornerId = 0; (already 'start')
        // const topRightCornerId = config.cols -1 ; // if path was right first
        // const bottomLeftCornerId = config.rows + config.cols -2 + (config.rows -1); // if path was right first
        // For path Down -> Right -> Up -> Left:
        // Top-left: 0 (start)
        // Bottom-left: config.rows - 1
        // Bottom-right: config.rows - 1 + (config.cols - 1) => this.bottomRightCornerId
        // Top-right: config.rows - 1 + (config.cols - 1) + (config.rows - 1)

        newLayout.push({ id: i, type: squareType });
      }
      this.boardSquares = newLayout;
    },

    rollDice() {
      if (this.isGameOver) return;
      const steps = Math.floor(Math.random() * 6) + 1;
      this.lastDiceRoll = steps;
      this.gameMessage = `Rolled a ${steps}...`;
      console.log(`Rolled a ${steps}`);
      this.movePlayer(steps);
    },

    movePlayer(steps) {
      if (steps <= 0 || this.isGameOver) return;

      let moneyEarnedThisTurn = 0;
      for (let i = 0; i < steps; i++) {
        this.playerPosition = (this.playerPosition + 1) % this.totalBoardSquares;

        // Money per step
        const baseMoney = Math.floor(Math.random() * 3) + 1; // 1 to 3
        const stepMoney = Math.floor(baseMoney * this.currentStageConfig.moneyMultiplier);
        this.playerMoney += stepMoney;
        moneyEarnedThisTurn += stepMoney;

        if (this.playerPosition === 0) {
          // Passed Start
          this.playerLap++;
          this.gameMessage = `Completed a lap! Now on Lap ${this.playerLap}/${this.currentStageConfig.lapsToComplete}`;
          console.log(`Lap completed. Current Lap: ${this.playerLap}`);
          if (this.playerLap > this.currentStageConfig.lapsToComplete) {
            this.handleBossEncounter();
            return; // Stop movement if boss encounter happens
          }
        }
      }
      this.gameMessage = `Moved ${steps} steps, earned $${moneyEarnedThisTurn}. Landed on square ${this.playerPosition}.`;
      console.log(`Moved to square ${this.playerPosition}. Money: ${this.playerMoney}`);
      this.handleSquareLanding();
    },

    handleSquareLanding() {
      if (this.isGameOver) return;
      if (this.playerPosition < 0 || this.playerPosition >= this.boardSquares.length) {
        console.error("Player position out of bounds:", this.playerPosition);
        return;
      }
      const square = this.boardSquares[this.playerPosition];
      console.log(`Landed on square ${square.id}, type: ${square.type}.`);
      this.gameMessage += ` Landed on ${square.type} square ${square.id}.`;

      if (square.type === "corner_br_bad") {
        this.playerMoney -= 10;
        if (this.playerMoney < 0) this.playerMoney = 0;
        this.gameMessage += ` Lost $10! Money: ${this.playerMoney}.`;
        console.log("Bad corner! Lost 10 money.");
      }
      // Add other square type logic here
    },

    handleBossEncounter() {
      // For now, assume boss is 'passed' if you reach here.
      // In a real game, you'd check money vs boss requirement.
      this.gameMessage = `Stage ${this.playerStage} Boss Cleared! Preparing next stage...`;
      console.log(`Boss for stage ${this.playerStage} cleared.`);
      this.advanceStage();
    },

    advanceStage() {
      this.playerStage++;
      if (this.playerStage > MAX_STAGES) {
        this.gameMessage = "Congratulations! You've beaten all stages!";
        this.isGameOver = true;
        console.log("Game Won!");
      } else {
        this.setupStage(); // This will reset lap to 1 and setup new board
      }
    },
  },
});
