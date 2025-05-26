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
    bossImage: "tax_collector.png",
    bossDefeatCondition: {
      diceThrows: 3,
      targetSum: 15,
    },
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
    bossImage: "greedy_goblin_king.webp",
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
    bossImage: "goblin_general.jpeg",
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
    bossImage: "dragon_treasurer.png",
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
    bossImage: "final_audit.webp",
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
    assetsLoaded: false,
    highlightedTargetSquare: null,


    // Boss-related state
    currentBoss: null,
    currentDiceThrows: [],
    remainingBossRolls: 0,
    bossLastRoll: null,


    // Game summary state
    totalRolls: 0,            // Cuenta cuántos dados ha lanzado el jugador en total
    diceObtained: 0,          // Cuenta cuántos dados ha ganado el jugador
    bossesDefeated: 0,        // Número total de jefes derrotados
    showSummaryModal: false,  // Para mostrar el resumen visual al final del juego
    currentStageConfig: STAGE_CONFIGS[1], // Configuración del stage actual
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
      const squareIdToIndexMap = new Map(this.boardSquares.map((sq, index) => [sq.id, index]));
      let availableCandidateIds = [...this.candidateSquareIds];
      shuffleArray(availableCandidateIds);

      const numBadSquares = getRandomInt(config.minBadSquares, config.maxBadSquares);
      for (let i = 0; i < numBadSquares; i++) {
        if (availableCandidateIds.length === 0) break;
        const badId = availableCandidateIds.pop();
        const square = this.boardSquares[squareIdToIndexMap.get(badId)];
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
        const square = this.boardSquares[squareIdToIndexMap.get(choiceId)];
        if (square) square.currentEffectType = "choice_dice_money";
      }
      const numChoicePickDie = getRandomInt(
        config.minChoicePickDieSquares,
        config.maxChoicePickDieSquares
      );
      for (let i = 0; i < numChoicePickDie; i++) {
        if (availableCandidateIds.length === 0) break;
        const pickId = availableCandidateIds.pop();
        const square = this.boardSquares[squareIdToIndexMap.get(pickId)];
        if (square) square.currentEffectType = "choice_pick_die";
      }
      availableCandidateIds.forEach((id) => {
        const square = this.boardSquares[squareIdToIndexMap.get(id)];
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
      console.log("🧩 addReservedDie called with:", dieData);
      if (!dieData) return;
    
      const signature = JSON.stringify(dieData);
    
      if (this.reservedDice.length < this.maxDiceInBag) {
        this.reservedDice.push(dieData);
        this.diceObtained++;
        this.gameMessage = `🎁 Obtuviste un dado: ${dieData.type}${dieData.value ? " (" + dieData.value + ")" : ""}`;
        console.log(`addReservedDie: Añadido ${signature}. Bolsa actual: ${this.reservedDice.length}`);
      } else {
        this.gameMessage = `🎒 Bolsa de dados llena (${this.maxDiceInBag})! No se añadió ${dieData.type}.`;
        console.warn("addReservedDie: Bolsa llena. Dado ignorado.");
      }
    }
    ,

    async rollDice(reservedDieIndex = -1) {
      if (this.gamePhase === "boss_encounter") {
        if (this.remainingBossRolls <= 0) return;
      
        const roll = Math.ceil(Math.random() * 6);
        this.bossLastRoll = roll;
        setTimeout(() => {
          this.bossLastRoll = null;
        }, 1000);
      
        this.currentDiceThrows.push(roll);
        this.remainingBossRolls--;
        this.totalRolls++;
        this.gameMessage = `Lanzaste un ${roll}. Quedan ${this.remainingBossRolls} intento(s).`;
      
        const total = this.currentDiceThrows.reduce((a, b) => a + b, 0);
      
        // ✅ Derrotar inmediatamente si se alcanza la suma
        if (total >= this.currentBoss.targetSum) {
          await this.defeatBoss();
          return;
        }
      
        // Solo fallar si no alcanzaste y se acabaron los intentos
        if (this.remainingBossRolls === 0) {
          await this.failBossFight();
        }
      
        return;
      }      
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

            if (this.playerLap === this.currentStageConfig.lapsToComplete) {
              this.gamePhase = "boss_encounter";
              this.isAnimating = false;
              await this.handleBossEncounter();
              return; // detener inmediatamente
            } else {
              this.setupLapEffects();
              await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(500)));
            }

            break; // Detiene movimiento inmediatamente al dar la vuelta.
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
      let landedMessage = "";

      if (passedStartThisTurn) {
        this.gameMessage = `Completed a lap! Now on Lap ${this.playerLap}/${this.currentStageConfig.lapsToComplete}.`;
        console.log("Store: movePlayer - Lap completed processing. Current Lap:", this.playerLap);

        await new Promise((resolve) => setTimeout(resolve, this.getAnimationDelay(1000)));

        if (this.playerLap === this.currentStageConfig.lapsToComplete) {
          this.gamePhase = "boss_encounter";
          this.isAnimating = false;
          await this.handleBossEncounter();
          return; // Detener aquí mismo tras comenzar encuentro con el jefe
        } else {
          this.setupLapEffects();
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
      this.handleSquareLanding();

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

    highlightSquareForDie(die) {
      if (!die || !this.boardSquares.length) {
        this.highlightedTargetSquare = null;
        return;
      }
    
      const nonPredictableTypes = ["normal", "d20", "reverse_random"];
      const type = die.type?.toLowerCase?.();
    
      if (!die.value || nonPredictableTypes.includes(type)) {
        this.highlightedTargetSquare = null;
        return;
      }
    
      const steps = type.includes("reverse") ? -die.value : die.value;
      const total = this.boardSquares.length;
      const target = (this.playerPosition + steps + total) % total;
    
      this.highlightedTargetSquare = target;
    },    

    clearHighlightedSquare() {
      this.highlightedTargetSquare = null;
    },
    
    

    resetGame() {
      this.playerMoney = 0;
      this.playerLap = 0;
      this.playerStage = 1;
      this.totalRolls = 0;
      this.diceObtained = 0;
      this.bossesDefeated = 0;
      this.reservedDice = [];
      this.lastDiceRoll = null;
      this.currentDiceThrows = [];
      this.remainingBossRolls = 0;
      this.currentBoss = null;
      this.gamePhase = "rolling";
      this.isGameOver = false;
      this.showSummaryModal = false;
      this.currentStageConfig = STAGE_CONFIGS[1];
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

    applySquareEffect(square) {
      switch (square.currentEffectType) {
        case "temp_bad_lap":
          return this.handleTempBadLap(square);
        case "huge_money":
          return this.handleHugeMoney(square);
        case "choice_dice_money":
          return this.handleChoiceDiceMoney();
        case "choice_pick_die":
          return this.handleChoicePickDie();
        default:
          return "";
      }
    },

    handleTempBadLap(square) {
      const penalty = square.effectDetails?.penalty || getRandomInt(5, 15) * this.playerStage;
      this.playerMoney -= penalty;
      return ` Stepped on a trap! Lost $${penalty}.`;
    },

    handleHugeMoney(square) {
      const hugeGain = square.effectDetails?.amount || this.currentHugeMoneyValue;
      this.playerMoney += hugeGain;
      square.currentEffectType = "none";
      square.effectDetails = null;
      return ` Huge Money! +$${hugeGain}.`;
    },

    handleChoiceDiceMoney() {
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
      console.log(
        "Store: handleSquareLanding - Set gamePhase to awaiting_choice for dice_vs_money."
      );
      return " " + this.choiceDetails.message;
    },

    handleChoicePickDie() {
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
      console.log(
        "Store: handleSquareLanding - Set gamePhase to awaiting_choice for pick_a_die."
      );
      return " " + this.choiceDetails.message;
    },

    async playerMakesChoice(chosenOption) {
      console.log("🎯 playerMakesChoice: opción de dado elegida", chosenOption.value);
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

    // --- Boss Actions from MAIN branch ---
    async handleBossEncounter() {
      const stageConfig = STAGE_CONFIGS[this.playerStage];
      this.currentBoss = {
        ...stageConfig.bossDefeatCondition,
        image: stageConfig.bossImage,
      };
      this.remainingBossRolls = this.currentBoss.diceThrows; // ← esta línea es CLAVE
      this.currentDiceThrows = [];
      this.gamePhase = "boss_encounter";
      this.isAnimating = false;
    },

    async rollDiceForBoss(die) {
      if (this.gamePhase !== "boss_encounter") return;
    
      // 🔻 Elimina el dado de la reserva
      const dieIndex = this.reservedDice.indexOf(die);
      if (dieIndex !== -1) {
        this.reservedDice.splice(dieIndex, 1);
      }
    
      const roll = die.value || Math.ceil(Math.random() * 6);
      this.bossLastRoll = roll;
      setTimeout(() => {
        this.bossLastRoll = null;
      }, 1000);
    
      this.currentDiceThrows.push(roll);
      this.totalRolls++;
      this.gameMessage = `Usaste un dado reservado y lanzaste un ${roll}.`;
    
      const total = this.currentDiceThrows.reduce((a, b) => a + b, 0);
    
      // ✅ Si ya alcanza el total, no esperar más
      if (total >= this.currentBoss.targetSum) {
        await this.defeatBoss();
        return;
      }
    
      // Solo falla si se usaron todos los dados normales y aún no alcanza
      if (this.remainingBossRolls === 0) {
        await this.failBossFight();
      }
    },

    async rollCustomDie(die) { // From MAIN
      // This function should return the numerical result of the roll
      let result;
      switch (die.type) {
        case DICE_TYPES.FIXED:
          result = die.value || 1; // Ensure value if fixed
          break;
        case DICE_TYPES.REVERSE_RANDOM: // Example: 1-6 but counts as negative or special
          result = getRandomInt(1, 6); // For boss, usually positive outcome desired
          // Or if it means "bad" roll: result = -(getRandomInt(1,6));
          break;
        case DICE_TYPES.D20:
          result = getRandomInt(1,20);
          break;
        // Add other dice types from your DICE_TYPES if they have specific roll mechanics
        default: // Includes DICE_TYPES.NORMAL
          result = getRandomInt(1, 6);
      }
      return result;
    },

    async defeatBoss() {
      this.bossesDefeated++;
      this.gameMessage = "¡Has derrotado al jefe!";
      await new Promise((res) => setTimeout(res, 500));
    
      if (this.playerStage >= Object.keys(STAGE_CONFIGS).length) {
        this.isGameOver = true;
        this.showSummaryModal = true;
        return;
      }
    
      this.playerStage++;
      this.playerLap = 0;
      this.currentDiceThrows = [];
      this.remainingBossRolls = 0;
      this.gamePhase = "rolling";
      this.currentStageConfig = STAGE_CONFIGS[this.playerStage];
    },

    async failBossFight() {
      this.gameMessage = `Has fallado en derrotar a ${this.currentStageConfig.bossName}...`;
      await new Promise((res) => setTimeout(res, 1500));
      this.isGameOver = true;
      this.gamePhase = "game_lost";
      this.showSummaryModal = true;
    },
    // advanceStage is now part of defeatBoss or if game ends

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
