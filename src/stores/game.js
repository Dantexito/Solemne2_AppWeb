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
    bossName: "Tax Collector", // Boss logic is on hold, but config is here
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
    gamePhase: "rolling", // Current phase of the game turn
    choiceDetails: null,
    animationSpeedMultiplier: 1,
    isAnimating: false, // Flag to indicate if an animation sequence is in progress
    diceRollAnimationBaseDuration: 1000, // Base duration for dice roll visual
    playerStepBaseDuration: 300, // Base duration for player moving one square
    lastPlayerPositionBeforeThisMove: 0,
    assetsLoaded: false, // Simplified for now, set to true in initializeGame

    // Boss related state (on hold for implementation, but can remain in state)
    currentStageBoss: null,
    currentBossMoneyRequirement: 0,
    diceFightRolls: null,
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

    // New getter to determine player's current action for sprite animation
    playerActionState(state) {
      if (state.gamePhase === "player_moving_animation") {
        return "walking";
      }
      // Could add more states here, e.g., 'attacking' if gamePhase is 'boss_dice_fight'
      return "idle"; // Default state
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
      this.assetsLoaded = true; // Assuming assets are ready (preloading on hold)
      this.playerStage = 1;
      this.isGameOver = false;
      this.isAnimating = false;
      this.reservedDice = [];
      this.playerMoney = 0; // Reset money for a new game
      this.setupStage();
      if (this.gamePhase !== "awaiting_choice") {
        this.gamePhase = "rolling";
      }
      console.log("Store: initializeGame - FINISHED. Phase:", this.gamePhase);
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
      // Money is not reset here per stage, only on initializeGame
      this.lastDiceRoll = null;
      this.choiceDetails = null; // Clear any pending choices

      // Boss selection (on hold for implementation, but keep structure)
      // const availableBosses = [...BOSS_POOL];
      // this.currentStageBoss = shuffleArray(availableBosses)[0];
      // if (this.currentStageBoss.baseMoneyRequirement) {
      //   this.currentBossMoneyRequirement = Math.floor(this.currentStageBoss.baseMoneyRequirement * (1 + (this.playerStage -1) * 0.5));
      // } else {
      //   this.currentBossMoneyRequirement = 0;
      // }
      // console.log(`Store: Stage ${this.playerStage} Boss: ${this.currentStageBoss?.name || 'N/A'}, Money Req: ${this.currentBossMoneyRequirement}`);
      this.currentStageBoss = null; // Explicitly nullify if boss logic is on hold

      this.generateBoardLayout();
      this.setupLapEffects();
      this.gameMessage = `Stage ${this.playerStage} - Lap ${this.playerLap}/${config.lapsToComplete}. Roll the die!`;
      this.gamePhase = "rolling";
      this.isAnimating = false; // Ensure ready for input
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
          // Only reset normal squares' dynamic effects
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
      this.gamePhase = "player_moving_animation"; // Player is now "walking"
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

      // After movement animation is complete
      let landedMessage = "";
      if (passedStartThisTurn) {
        this.gameMessage = `Completed a lap! Now on Lap ${this.playerLap}/${this.currentStageConfig.lapsToComplete}.`;
        await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(1000))); // Pause for lap message
        if (this.playerLap > this.currentStageConfig.lapsToComplete) {
          // Boss logic on hold, so we'll just advance stage for now or end game
          console.log("Store: movePlayer - Boss encounter would happen here.");
          this.gameMessage = "Reached end of laps for stage!";
          await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(1000)));
          await this.advanceStage(); // Or handle actual boss logic
          if (this.isGameOver || this.gamePhase === "game_won" || this.gamePhase === "rolling")
            return;
        } else {
          this.setupLapEffects(); // Sets its own message
          await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(500)));
        }
      }

      this.gamePhase = "landed"; // Player has landed, sprite should go to idle
      landedMessage = `Landed on square ${this.playerPosition}.`;
      if (moneyEarnedThisTurn > 0 && direction > 0) {
        landedMessage += ` Earned $${moneyEarnedThisTurn} this turn.`;
      }
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
      } else if (
        this.gamePhase !== "boss_encounter_intro" &&
        /* other boss phases */ !this.isGameOver
      ) {
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
        effectAppliedMessage += ` Bad corner! Lost $20.`;
      }
      switch (square.currentEffectType) {
        case "temp_bad_lap":
          const penalty = square.effectDetails?.penalty || getRandomInt(5, 15) * this.playerStage;
          this.playerMoney -= penalty;
          effectAppliedMessage += ` Trap! -$${penalty}.`;
          break;
        case "huge_money":
          const hugeGain = square.effectDetails?.amount || this.currentHugeMoneyValue;
          this.playerMoney += hugeGain;
          effectAppliedMessage += ` Huge! +$${hugeGain}.`;
          square.currentEffectType = "none";
          square.effectDetails = null;
          break;
        case "choice_dice_money":
          this.gamePhase = "awaiting_choice";
          let offeredDieInChoice;
          const rdc = Math.random();
          if (rdc < 0.6) offeredDieInChoice = { type: DICE_TYPES.FIXED, value: getRandomInt(2, 6) };
          else if (rdc < 0.85) offeredDieInChoice = { type: DICE_TYPES.REVERSE_RANDOM };
          else offeredDieInChoice = { type: DICE_TYPES.D20 };
          this.choiceDetails = {
            type: "dice_vs_money",
            message: "Choose reward:",
            options: [
              {
                text: `Get $${10 * this.playerStage}`,
                action: "get_money_bonus",
                value: 10 * this.playerStage,
                visual: { type: "money" },
              },
              {
                text: `Get ${offeredDieInChoice.type}${
                  offeredDieInChoice.value ? " (" + offeredDieInChoice.value + ")" : ""
                } Die`,
                action: "get_chosen_die",
                value: offeredDieInChoice,
                visual: { type: "die", dieData: offeredDieInChoice },
              },
            ],
          };
          effectAppliedMessage += " " + this.choiceDetails.message;
          break;
        case "choice_pick_die":
          this.gamePhase = "awaiting_choice";
          const dPool = [
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
          shuffleArray(dPool);
          const numOffer = getRandomInt(3, 4);
          const finalOpts = [];
          const sigs = new Set();
          for (const d of dPool) {
            if (finalOpts.length >= numOffer) break;
            let sig = d.type;
            if (d.type === DICE_TYPES.FIXED || d.type === DICE_TYPES.REVERSE_FIXED)
              sig += `_${d.value}`;
            if (!sigs.has(sig)) {
              finalOpts.push({
                text: `Die: ${d.type}${d.value !== undefined ? " (" + d.value + ")" : ""}`,
                action: "get_chosen_die",
                value: { ...d },
                visual: { type: "die", dieData: { ...d } },
              });
              sigs.add(sig);
            }
          }
          this.choiceDetails = {
            type: "pick_a_die",
            message: `Choose a die (${finalOpts.length} options):`,
            options: finalOpts,
          };
          effectAppliedMessage += " " + this.choiceDetails.message;
          break;
      }
      this.gameMessage = (this.gameMessage + " " + effectAppliedMessage).trim();
      console.log(
        "Store: handleSquareLanding - Finished. Final message:",
        this.gameMessage,
        "Phase:",
        this.gamePhase
      );
    },

    async playerMakesChoice(chosenOption) {
      if (this.gamePhase !== "awaiting_choice" || !this.choiceDetails) return;
      this.isAnimating = true;
      const oSI = this.playerPosition;
      switch (chosenOption.action) {
        case "get_money_bonus":
          this.playerMoney += chosenOption.value;
          this.gameMessage = `Chose money! +$${chosenOption.value}.`;
          break;
        case "get_chosen_die":
          this.addReservedDie(chosenOption.value);
          break;
      }
      if (oSI >= 0 && oSI < this.boardSquares.length) {
        this.boardSquares[oSI].currentEffectType = "none";
        this.boardSquares[oSI].effectDetails = null;
      }
      await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(500)));
      this.choiceDetails = null;
      this.gamePhase = "rolling";
      this.isAnimating = false;
    },

    // Boss logic is on hold for now
    async handleBossEncounter() {
      console.log("Store: Boss encounter would be triggered here. Advancing stage for now.");
      this.gameMessage = "End of stage! Preparing next...";
      this.isAnimating = true; // Keep isAnimating true during this transition
      await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(1500))); // Pause for message
      await this.advanceStage();
    },

    async playerRollsForDiceFight() {
      /* On Hold */ console.log("Player rolls for dice fight - ON HOLD");
    },
    async resolveBossEncounter(bossDefeated) {
      /* On Hold */ console.log("Resolve boss encounter - ON HOLD");
    },

    async advanceStage() {
      this.playerStage++;
      if (this.playerStage > MAX_STAGES) {
        this.gameMessage = "CONGRATULATIONS! You've beaten all stages!";
        this.isGameOver = true;
        this.gamePhase = "game_won";
        this.isAnimating = false;
      } else {
        this.setupStage(); // This sets gamePhase to rolling and isAnimating to false
        // gameMessage is set by setupStage
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
