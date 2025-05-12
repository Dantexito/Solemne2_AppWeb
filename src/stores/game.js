// src/stores/game.js
// Here we got states, getters, actions,

import { defineStore } from "pinia";

// --- Configuration ---
const STAGE_CONFIGS = {
  1: {
    // 6x6
    rows: 6,
    cols: 6,
    moneyMultiplier: 1,
    lapsToComplete: 3,
    minBadSquares: 1,
    maxBadSquares: 2,
    minChoiceDiceMoneySquares: 2,
    maxChoiceDiceMoneySquares: 4,
    minChoicePickDieSquares: 2,
    maxChoicePickDieSquares: 4,
    bossName: "Tax Collector",
  },
  2: {
    // 9x9
    rows: 9,
    cols: 9,
    moneyMultiplier: 1.5,
    lapsToComplete: 3,
    minBadSquares: 2,
    maxBadSquares: 4,
    minChoiceDiceMoneySquares: 4,
    maxChoiceDiceMoneySquares: 8,
    minChoicePickDieSquares: 4,
    maxChoicePickDieSquares: 8,
    bossName: "Greedy Goblin King",
  },
  3: {
    // 9x9 - example
    rows: 9,
    cols: 9,
    moneyMultiplier: 1.75,
    lapsToComplete: 3,
    minBadSquares: 2,
    maxBadSquares: 4,
    minChoiceDiceMoneySquares: 4,
    maxChoiceDiceMoneySquares: 8,
    minChoicePickDieSquares: 4,
    maxChoicePickDieSquares: 8,
    bossName: "Goblin General",
  },
  4: {
    // 12x12 - example
    rows: 12,
    cols: 12,
    moneyMultiplier: 2,
    lapsToComplete: 3,
    minBadSquares: 4,
    maxBadSquares: 8,
    minChoiceDiceMoneySquares: 8,
    maxChoiceDiceMoneySquares: 16,
    minChoicePickDieSquares: 8,
    maxChoicePickDieSquares: 16,
    bossName: "Dragon Treasurer",
  },
  5: {
    // 12x12
    rows: 12,
    cols: 12,
    moneyMultiplier: 2.5,
    lapsToComplete: 3,
    minBadSquares: 4,
    maxBadSquares: 8,
    minChoiceDiceMoneySquares: 8,
    maxChoiceDiceMoneySquares: 16,
    minChoicePickDieSquares: 8,
    maxChoicePickDieSquares: 16,
    bossName: "The Final Audit",
  },
};
const MAX_RESERVED_DICE = 10;
const MAX_STAGES = Object.keys(STAGE_CONFIGS).length;
const HUGE_MONEY_AMOUNT_BASE = 10;

export const DICE_TYPES = {
  NORMAL: "normal",
  FIXED: "fixed",
  D20: "d20",
  REVERSE_FIXED: "reverse_fixed",
  REVERSE_RANDOM: "reverse_random",
};

// --- Helper Functions ---
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const useGameStore = defineStore("game", {
  state: () => ({
    boardRows: 0,
    boardCols: 0,
    playerPosition: 0,
    playerMoney: 0,
    playerLap: 1,
    playerStage: 1,
    lastDiceRoll: null,
    reservedDice: [],
    maxDiceInBag: MAX_RESERVED_DICE,
    boardSquares: [],
    gameMessage: "Roll the die to start!",
    isGameOver: false,
    gamePhase: "rolling",
    choiceDetails: null,
    animationSpeedMultiplier: 1,
    isAnimating: false,
    diceRollAnimationBaseDuration: 500,
    playerStepBaseDuration: 400,
    lastPlayerPositionBeforeThisMove: 0,
    assetsLoaded: false,
  }),

  getters: {
    currentStageConfig(state) {
      return STAGE_CONFIGS[state.playerStage] || STAGE_CONFIGS[1];
    },
    totalBoardSquares(state) {
      const config = this.currentStageConfig;
      if (!config || !config.rows || !config.cols) return 0;
      const R = config.rows;
      const C = config.cols;
      if (R <= 1 || C <= 1) return R * C;
      return 2 * R + 2 * C - 4;
    },
    cornerSquareIds(state) {
      const config = this.currentStageConfig;
      if (!config || !config.rows || !config.cols || config.rows <= 1 || config.cols <= 1)
        return [];
      const R = config.rows;
      const C = config.cols;
      return [0, R - 1, R - 1 + (C - 1), R - 1 + (C - 1) + (R - 1)];
    },
    bottomRightCornerId(state) {
      const config = this.currentStageConfig;
      if (!config || !config.rows || !config.cols || config.rows <= 1 || config.cols <= 1)
        return -1;
      return config.rows - 1 + (config.cols - 1);
    },
    candidateSquareIds(state) {
      if (!state.boardSquares.length) return [];
      const corners = this.cornerSquareIds;
      return state.boardSquares
        .filter((sq) => sq.baseType === "normal" && !corners.includes(sq.id))
        .map((sq) => sq.id);
    },
    currentHugeMoneyValue(state) {
      return HUGE_MONEY_AMOUNT_BASE * state.playerStage;
    },
    diceBagCapacityDisplay(state) {
      return `${state.reservedDice.length}/${state.maxDiceInBag}`;
    },
  },

  actions: {
    toggleAnimationSpeed() {
      if (this.animationSpeedMultiplier === 1) this.animationSpeedMultiplier = 2;
      else if (this.animationSpeedMultiplier === 2) this.animationSpeedMultiplier = 0;
      else this.animationSpeedMultiplier = 1;
      this.gameMessage = `Animation speed: ${
        this.animationSpeedMultiplier === 0
          ? "Instant"
          : this.animationSpeedMultiplier === 2
          ? "Faster"
          : "Normal"
      }`;
    },
    getAnimationDelay(baseDuration) {
      if (this.animationSpeedMultiplier === 0) return 0;
      return baseDuration / this.animationSpeedMultiplier;
    },

    initializeGame() {
      console.log("Store: initializeGame - STARTED");
      this.assetsLoaded = true;
      this.playerStage = 1;
      this.isGameOver = false;
      this.isAnimating = false;
      this.reservedDice = [];
      this.setupStage();
      if (this.gamePhase !== "awaiting_choice") {
        this.gamePhase = "rolling";
      }
      console.log(
        "Store: initializeGame - FINISHED. Board should be ready. Phase:",
        this.gamePhase
      );
    },

    setupStage() {
      const config = this.currentStageConfig;
      if (!config) {
        console.error("Invalid stage config");
        this.isGameOver = true;
        return;
      }
      this.boardRows = config.rows;
      this.boardCols = config.cols;
      this.playerLap = 1;
      this.playerPosition = 0;
      this.lastPlayerPositionBeforeThisMove = 0;
      this.playerMoney = this.playerStage === 1 && this.playerLap === 1 ? 0 : this.playerMoney;
      this.lastDiceRoll = null;
      this.generateBoardLayout();
      this.setupLapEffects();
      this.gameMessage = `Stage ${this.playerStage} - Lap ${this.playerLap}/${config.lapsToComplete}. Roll the die!`;
      this.gamePhase = "rolling";
      console.log("Store: setupStage - FINISHED. Phase:", this.gamePhase);
    },

    generateBoardLayout() {
      const config = this.currentStageConfig;
      const totalSquares = this.totalBoardSquares;
      const corners = this.cornerSquareIds;
      const brCornerId = this.bottomRightCornerId;
      const newLayout = [];
      for (let i = 0; i < totalSquares; i++) {
        let baseType = "normal";
        if (i === corners[0]) baseType = "start";
        else if (i === corners[1]) baseType = "corner_bl";
        else if (i === brCornerId) baseType = "corner_br";
        else if (i === corners[3]) baseType = "corner_tr";
        newLayout.push({
          id: i,
          baseType,
          currentEffectType: "none",
          isTempBad: false,
          effectDetails: null,
        });
      }
      this.boardSquares = newLayout;
      console.log("Store: Board layout generated with squares:", this.boardSquares.length);
    },

    setupLapEffects() {
      const config = this.currentStageConfig;
      console.log(
        "Store: setupLapEffects - Starting for Lap",
        this.playerLap,
        "Stage",
        this.playerStage
      );
      this.boardSquares.forEach((sq) => {
        sq.isTempBad = false;
        if (sq.baseType === "normal") {
          sq.currentEffectType = "none";
          sq.effectDetails = null;
        }
      });
      let availableCandidateIds = [...this.candidateSquareIds];
      shuffleArray(availableCandidateIds);
      const numBadSquares = getRandomInt(config.minBadSquares, config.maxBadSquares);
      for (let i = 0; i < numBadSquares; i++) {
        if (availableCandidateIds.length === 0) break;
        const badId = availableCandidateIds.pop();
        const square = this.boardSquares.find((sq) => sq.id === badId);
        if (square) {
          square.isTempBad = true;
          square.currentEffectType = "temp_bad_lap";
          square.effectDetails = { penalty: getRandomInt(5, 15) * this.playerStage };
        }
      }
      const numChoiceDiceMoney = getRandomInt(
        config.minChoiceDiceMoneySquares,
        config.maxChoiceDiceMoneySquares
      );
      for (let i = 0; i < numChoiceDiceMoney; i++) {
        if (availableCandidateIds.length === 0) break;
        const choiceId = availableCandidateIds.pop();
        const square = this.boardSquares.find((sq) => sq.id === choiceId);
        if (square) square.currentEffectType = "choice_dice_money";
      }
      const numChoicePickDie = getRandomInt(
        config.minChoicePickDieSquares,
        config.maxChoicePickDieSquares
      );
      for (let i = 0; i < numChoicePickDie; i++) {
        if (availableCandidateIds.length === 0) break;
        const pickId = availableCandidateIds.pop();
        const square = this.boardSquares.find((sq) => sq.id === pickId);
        if (square) square.currentEffectType = "choice_pick_die";
      }
      availableCandidateIds.forEach((id) => {
        const square = this.boardSquares.find((sq) => sq.id === id);
        if (square) {
          const rand = Math.random();
          if (rand < 0.15) {
            square.currentEffectType = "huge_money";
            square.effectDetails = { amount: this.currentHugeMoneyValue };
          } else {
            square.currentEffectType = "normal_money";
            square.effectDetails = {
              amount: Math.floor(getRandomInt(1, 3) * config.moneyMultiplier),
            };
          }
        }
      });
      this.gameMessage = `Lap ${this.playerLap} board effects are set!`;
      console.log("Store: setupLapEffects - FINISHED.");
    },

    addReservedDie(dieData) {
      console.log(
        "Store: addReservedDie - Attempting to add:",
        JSON.parse(JSON.stringify(dieData))
      );
      console.log(
        "Store: addReservedDie - Current bag count:",
        this.reservedDice.length,
        "Max:",
        this.maxDiceInBag
      );
      if (this.reservedDice.length < this.maxDiceInBag) {
        this.reservedDice.push(dieData);
        this.gameMessage = `Gained a ${dieData.type}${
          dieData.value ? " (" + dieData.value + ")" : ""
        } die!`;
        console.log("Store: addReservedDie - Die ADDED. New bag count:", this.reservedDice.length);
      } else {
        this.gameMessage = `Dice bag is full (Max ${this.maxDiceInBag})! Couldn't keep the new die.`;
        console.warn("Store: addReservedDie - Dice bag IS FULL. Die NOT added.");
      }
    },

    async rollDice(reservedDieIndex = -1) {
      if (this.isGameOver || this.gamePhase !== "rolling" || this.isAnimating) {
        console.warn("RollDice: Aborted - Conditions not met or already animating.", {
          phase: this.gamePhase,
          gameOver: this.isGameOver,
          animating: this.isAnimating,
        });
        return;
      }
      this.isAnimating = true;
      this.gamePhase = "dice_rolling_animation";
      let dieToRoll;
      let originalTypeForLastRoll;
      if (reservedDieIndex >= 0 && reservedDieIndex < this.reservedDice.length) {
        dieToRoll = this.reservedDice.splice(reservedDieIndex, 1)[0];
        originalTypeForLastRoll = dieToRoll.type;
      } else {
        dieToRoll = { type: DICE_TYPES.NORMAL };
        originalTypeForLastRoll = DICE_TYPES.NORMAL;
      }
      this.gameMessage = `Rolling a ${originalTypeForLastRoll} die...`;
      await new Promise((resolve) =>
        setTimeout(resolve, this.getAnimationDelay(this.diceRollAnimationBaseDuration))
      );
      let steps;
      switch (dieToRoll.type) {
        case DICE_TYPES.NORMAL:
          steps = getRandomInt(1, 6);
          break;
        case DICE_TYPES.FIXED:
          steps = dieToRoll.value || 1;
          break;
        case DICE_TYPES.D20:
          steps = getRandomInt(1, 20);
          break;
        case DICE_TYPES.REVERSE_FIXED:
          steps = -(dieToRoll.value || 1);
          break;
        case DICE_TYPES.REVERSE_RANDOM:
          steps = -getRandomInt(1, 6);
          break;
        default:
          steps = getRandomInt(1, 6);
      }
      let effectiveTypeForImage = originalTypeForLastRoll;
      if (steps < 0) {
        if (originalTypeForLastRoll === DICE_TYPES.NORMAL)
          effectiveTypeForImage = DICE_TYPES.REVERSE_RANDOM;
        else if (originalTypeForLastRoll === DICE_TYPES.FIXED)
          effectiveTypeForImage = DICE_TYPES.REVERSE_FIXED;
      }
      this.lastDiceRoll = {
        value: Math.abs(steps),
        type: effectiveTypeForImage,
        originalType: originalTypeForLastRoll,
        direction: steps >= 0 ? "forward" : "backward",
      };
      console.log(`Rolled ${steps} with original type ${originalTypeForLastRoll}`);
      await this.movePlayer(steps);
    },

    async movePlayer(steps) {
      this.gamePhase = "player_moving_animation";
      let moneyEarnedThisTurn = 0;
      const totalStepsToTake = Math.abs(steps);
      const direction = steps > 0 ? 1 : -1;
      let passedStartThisTurn = false;
      this.gameMessage = `Player moving ${totalStepsToTake} steps...`;
      this.lastPlayerPositionBeforeThisMove = this.playerPosition;

      for (let i = 0; i < totalStepsToTake; i++) {
        if (this.isGameOver) break;
        if (direction > 0) {
          this.playerPosition = (this.playerPosition + 1) % this.totalBoardSquares;
          const currentSq = this.boardSquares[this.playerPosition];
          if (
            currentSq &&
            currentSq.currentEffectType === "normal_money" &&
            currentSq.effectDetails?.amount
          ) {
            const amount = currentSq.effectDetails.amount;
            this.playerMoney += amount;
            moneyEarnedThisTurn += amount;
          }
          if (this.playerPosition === 0) {
            passedStartThisTurn = true;
            this.playerLap++;
            console.log("Store: movePlayer - Passed Start. New Lap:", this.playerLap);
          
            this.gameMessage = `Completed a lap! Now on Lap ${this.playerLap}/${this.currentStageConfig.lapsToComplete}.`;
          
            await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(1000)));
          
            if (this.playerLap > this.currentStageConfig.lapsToComplete) {
              await this.handleBossEncounter();
              return;
            } else {
              this.setupLapEffects();
              await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(500)));
            }
          
            break; // ← Detiene el movimiento aquí al dar una vuelta
          }          
        } else {
          this.playerPosition =
            (this.playerPosition - 1 + this.totalBoardSquares) % this.totalBoardSquares;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, this.getAnimationDelay(this.playerStepBaseDuration))
        );
      }

      // --- After movement animation is complete ---
      let landedMessage = ""; // Start with an empty message for this part

      if (passedStartThisTurn) {
        this.gameMessage = `Completed a lap! Now on Lap ${this.playerLap}/${this.currentStageConfig.lapsToComplete}.`;
        console.log("Store: movePlayer - Lap completed processing. Current Lap:", this.playerLap);

        // Add a delay for "Lap Complete" message visibility
        await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(1000))); // e.g., 1 second pause

        if (this.playerLap > this.currentStageConfig.lapsToComplete) {
          await this.handleBossEncounter();
          // handleBossEncounter should manage isAnimating and gamePhase.
          // If game ends or new stage starts, it might return early from there.
          if (this.isGameOver || this.gamePhase === "game_won" || this.gamePhase === "rolling") {
            console.log("Store: movePlayer - Boss encounter concluded turn. Returning.");
            return; // Exit movePlayer
          }
        } else {
          // It's a regular new lap, setup effects now
          this.setupLapEffects(); // This sets its own message like "Lap X effects set!"
          // The message from setupLapEffects will be the current gameMessage
          await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(500))); // Brief pause after effects set
        }
      }

      this.gamePhase = "landed"; // Player has officially landed
      landedMessage = `Landed on square ${this.playerPosition}.`;
      if (moneyEarnedThisTurn > 0 && direction > 0) {
        landedMessage += ` Earned $${moneyEarnedThisTurn} this turn.`;
      }
      // Append landing info to whatever message is current (lap complete, effects set, etc.)
      this.gameMessage = (this.gameMessage + " " + landedMessage).trim();

      console.log(
        "Store: movePlayer - Before handleSquareLanding. Phase:",
        this.gamePhase,
        "isAnimating:",
        this.isAnimating
      );
      this.handleSquareLanding(); // Synchronous call
      console.log(
        "Store: movePlayer - After handleSquareLanding. Phase:",
        this.gamePhase,
        "isAnimating:",
        this.isAnimating
      );

      if (this.gamePhase === "awaiting_choice") {
        this.isAnimating = false;
        console.log("Store: movePlayer - Ended in awaiting_choice. isAnimating set to false.");
      } else if (this.gamePhase !== "boss_encounter" && !this.isGameOver) {
        this.gamePhase = "rolling";
        this.isAnimating = false;
        console.log("Store: movePlayer - Ended, phase set to rolling. isAnimating set to false.");
      } else if (this.isGameOver) {
        this.isAnimating = false;
        console.log("Store: movePlayer - Ended, game is over. isAnimating set to false.");
      }
    },

    handleSquareLanding() {
      if (this.isGameOver || (this.isAnimating && this.gamePhase !== "landed")) {
        console.warn("Store: handleSquareLanding - Aborted.", {
          phase: this.gamePhase,
          animating: this.isAnimating,
          gameOver: this.isGameOver,
        });
        return;
      }
      if (
        !this.boardSquares ||
        this.playerPosition < 0 ||
        this.playerPosition >= this.boardSquares.length
      ) {
        console.error("Invalid playerPosition or boardSquares in handleSquareLanding");
        this.gamePhase = "rolling";
        this.isAnimating = false;
        return;
      }

      const square = this.boardSquares[this.playerPosition];
      let effectAppliedMessage = "";

      console.log(
        "Store: handleSquareLanding - Processing square:",
        JSON.parse(JSON.stringify(square))
      );

      if (square.baseType === "corner_br") {
        this.playerMoney -= 20;
        effectAppliedMessage += ` Bad corner! Lost $20. Money: ${this.playerMoney}.`;
      }
      switch (square.currentEffectType) {
        case "temp_bad_lap":
          const penalty = square.effectDetails?.penalty || getRandomInt(5, 15) * this.playerStage;
          this.playerMoney -= penalty;
          effectAppliedMessage += ` Stepped on a trap! Lost $${penalty}.`;
          break;
        case "huge_money":
          const hugeGain = square.effectDetails?.amount || this.currentHugeMoneyValue;
          this.playerMoney += hugeGain;
          effectAppliedMessage += ` Huge Money! +$${hugeGain}.`;
          this.boardSquares[this.playerPosition].currentEffectType = "none";
          this.boardSquares[this.playerPosition].effectDetails = null;
          break;
        case "choice_dice_money":
          this.gamePhase = "awaiting_choice";
          let offeredDieInChoice;
          const randDieChoice = Math.random();
          if (randDieChoice < 0.6)
            offeredDieInChoice = { type: DICE_TYPES.FIXED, value: getRandomInt(2, 6) };
          else if (randDieChoice < 0.85) offeredDieInChoice = { type: DICE_TYPES.REVERSE_RANDOM };
          else offeredDieInChoice = { type: DICE_TYPES.D20 };
          this.choiceDetails = {
            type: "dice_vs_money",
            message: "Choose your reward:",
            options: [
              {
                text: `Get $${10 * this.playerStage}`,
                action: "get_money_bonus",
                value: 10 * this.playerStage,
                visual: { type: "money" },
              },
              {
                text: `Get a ${offeredDieInChoice.type}${
                  offeredDieInChoice.value ? " (" + offeredDieInChoice.value + ")" : ""
                } Die`,
                action: "get_chosen_die",
                value: offeredDieInChoice,
                visual: { type: "die", dieData: offeredDieInChoice },
              },
            ],
          };
          effectAppliedMessage += " " + this.choiceDetails.message;
          console.log(
            "Store: handleSquareLanding - Set gamePhase to awaiting_choice for dice_vs_money."
          );
          break;
        case "choice_pick_die":
          this.gamePhase = "awaiting_choice";
          const dicePool = [
            { type: DICE_TYPES.FIXED, value: 1 },
            { type: DICE_TYPES.FIXED, value: 2 },
            { type: DICE_TYPES.FIXED, value: 3 },
            { type: DICE_TYPES.FIXED, value: 4 },
            { type: DICE_TYPES.FIXED, value: 5 },
            { type: DICE_TYPES.FIXED, value: 6 },
            { type: DICE_TYPES.D20 },
            { type: DICE_TYPES.REVERSE_RANDOM },
            { type: DICE_TYPES.REVERSE_FIXED, value: getRandomInt(1, 6) },
            { type: DICE_TYPES.NORMAL },
          ];
          shuffleArray(dicePool);
          const numDiceToOffer = getRandomInt(3, 4);
          const finalDiceOptions = [];
          const offeredSignatures = new Set();
          for (const die of dicePool) {
            if (finalDiceOptions.length >= numDiceToOffer) break;
            let signature = die.type;
            if (die.type === DICE_TYPES.FIXED || die.type === DICE_TYPES.REVERSE_FIXED)
              signature += `_${die.value}`;
            if (!offeredSignatures.has(signature)) {
              finalDiceOptions.push({
                text: `Die: ${die.type}${die.value !== undefined ? " (" + die.value + ")" : ""}`,
                action: "get_chosen_die",
                value: { ...die },
                visual: { type: "die", dieData: { ...die } },
              });
              offeredSignatures.add(signature);
            }
          }
          this.choiceDetails = {
            type: "pick_a_die",
            message: `Choose a die (${finalDiceOptions.length} options):`,
            options: finalDiceOptions,
          };
          effectAppliedMessage += " " + this.choiceDetails.message;
          console.log(
            "Store: handleSquareLanding - Set gamePhase to awaiting_choice for pick_a_die."
          );
          break;
      }
      // Append the specific effect message to the current gameMessage
      this.gameMessage = (this.gameMessage + " " + effectAppliedMessage).trim();
      console.log(
        "Store: handleSquareLanding - Finished. Final message:",
        this.gameMessage,
        "Phase:",
        this.gamePhase
      );
    },

    async playerMakesChoice(chosenOption) {
      console.log(
        "Store: playerMakesChoice - Received option:",
        JSON.parse(JSON.stringify(chosenOption))
      );
      console.log(
        "Store: playerMakesChoice - Current state before choice: gamePhase:",
        this.gamePhase,
        "choiceDetails:",
        !!this.choiceDetails,
        "isAnimating:",
        this.isAnimating
      );

      if (this.gamePhase !== "awaiting_choice" || !this.choiceDetails) {
        // Removed isAnimating check here
        console.warn("Store: playerMakesChoice - Aborted due to invalid state/phase.");
        if (this.gamePhase !== "awaiting_choice")
          console.warn(" - Reason: gamePhase is not 'awaiting_choice'. Is:", this.gamePhase);
        if (!this.choiceDetails) console.warn(" - Reason: choiceDetails is null or undefined.");
        return;
      }

      this.isAnimating = true;
      const originalSquareIndex = this.playerPosition;

      switch (chosenOption.action) {
        case "get_money_bonus":
          this.playerMoney += chosenOption.value;
          this.gameMessage = `You chose money! +$${chosenOption.value}.`;
          console.log("Store: playerMakesChoice - Money bonus applied:", chosenOption.value);
          break;
        case "get_chosen_die":
          console.log(
            "Store: playerMakesChoice - Attempting to add die:",
            JSON.parse(JSON.stringify(chosenOption.value))
          );
          this.addReservedDie(chosenOption.value);
          break;
      }

      if (originalSquareIndex >= 0 && originalSquareIndex < this.boardSquares.length) {
        this.boardSquares[originalSquareIndex].currentEffectType = "none";
        this.boardSquares[originalSquareIndex].effectDetails = null;
      }

      await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(500)));

      this.choiceDetails = null;
      this.gamePhase = "rolling";
      this.isAnimating = false;
      console.log(
        "Store: playerMakesChoice - Finished. New gamePhase:",
        this.gamePhase,
        "Reserved dice:",
        JSON.parse(JSON.stringify(this.reservedDice))
      );
    },

    async handleBossEncounter() {
      // isAnimating should be true when this is called
      this.gamePhase = "boss_encounter";
      const config = this.currentStageConfig;
      this.gameMessage = `Boss Time: ${config.bossName}!`;
      console.log("Store: handleBossEncounter - Started. isAnimating:", this.isAnimating);
      await new Promise((resolve) =>
        setTimeout(resolve, this.getAnimationDelay(this.diceRollAnimationBaseDuration + 1000))
      );
      const bossDefeated = true;
      if (bossDefeated) {
        this.gameMessage = `You defeated ${config.bossName}!`;
        await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(1000)));
        await this.advanceStage();
      } else {
        this.gameMessage = `Defeated by ${config.bossName}! Game Over.`;
        this.isGameOver = true;
        this.gamePhase = "game_over";
        this.isAnimating = false;
      }
      console.log(
        "Store: handleBossEncounter - Finished. Phase:",
        this.gamePhase,
        "isAnimating:",
        this.isAnimating
      );
    },

    async advanceStage() {
      this.playerStage++;
      if (this.playerStage > MAX_STAGES) {
        this.gameMessage = "CONGRATULATIONS! You've beaten all stages!";
        this.isGameOver = true;
        this.gamePhase = "game_won";
        this.isAnimating = false;
      } else {
        this.setupStage();
        this.isAnimating = false;
        this.gameMessage = `Stage ${this.playerStage} begins! ` + this.gameMessage;
      }
      console.log(
        "Store: advanceStage - Finished. Phase:",
        this.gamePhase,
        "isAnimating:",
        this.isAnimating
      );
    },
  },
});
