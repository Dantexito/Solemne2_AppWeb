// src/stores/game.js
import { defineStore } from "pinia";

// --- Configuration ---
const STAGE_CONFIGS = {
  1: {
    rows: 6,
    cols: 6,
    moneyMultiplier: 1,
    lapsToComplete: 3,
    maxBadSquares: 2,
    bossName: "Tax Collector",
  },
  2: {
    rows: 9,
    cols: 9,
    moneyMultiplier: 1.5,
    lapsToComplete: 3,
    maxBadSquares: 4,
    bossName: "Greedy Goblin King",
  },
  3: {
    rows: 12,
    cols: 12,
    moneyMultiplier: 2,
    lapsToComplete: 3,
    maxBadSquares: 6,
    bossName: "The Final Audit",
  },
};
const MAX_RESERVED_DICE = 10;
const MAX_STAGES = Object.keys(STAGE_CONFIGS).length;
const HUGE_MONEY_AMOUNT_BASE = 10; // Base for huge money square, will be multiplied by stage

// Dice Types (can be expanded)
export const DICE_TYPES = {
  NORMAL: "normal", // 1-6
  FIXED: "fixed", // All faces same number
  D20: "d20", // 1-20
  REVERSE_FIXED: "reverse_fixed",
  REVERSE_RANDOM: "reverse_random",
};

// --- Helper Functions ---
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fisher-Yates Shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const useGameStore = defineStore("game", {
  state: () => ({
    // Board Config (will be set by currentStageConfig)
    boardRows: 0,
    boardCols: 0,

    // Player State
    playerPosition: 0,
    playerMoney: 0,
    playerLap: 1,
    playerStage: 1,

    // Dice State
    lastDiceRoll: null, // Can be an object { value: number, type: string }
    reservedDice: [], // Array of Dice Objects e.g., { type: DICE_TYPES.FIXED, value: 5 }
    maxDiceInBag: MAX_RESERVED_DICE,

    // Board State
    boardSquares: [], // Array of { id: number, baseType: string, currentEffectType: string, isTempBad: boolean, effectDetails: any }

    // Game Flow State
    gameMessage: "Roll the die to start!",
    isGameOver: false,
    gamePhase: "rolling", // 'rolling', 'moving', 'landed', 'awaiting_choice', 'boss_encounter'
    choiceDetails: null, // For when player needs to make a choice
  }),

  getters: {
    currentStageConfig(state) {
      return STAGE_CONFIGS[state.playerStage] || STAGE_CONFIGS[1]; // Fallback to stage 1
    },
    totalBoardSquares(state) {
      const config = this.currentStageConfig;
      if (!config || !config.rows || !config.cols) return 0;
      const R = config.rows;
      const C = config.cols;
      if (R <= 1 || C <= 1) return R * C;
      return 2 * R + 2 * C - 4;
    },
    // Corner IDs for the current board configuration (Path: Down -> Right -> Up -> Left)
    cornerSquareIds(state) {
      const config = this.currentStageConfig;
      if (!config || !config.rows || !config.cols || config.rows <= 1 || config.cols <= 1)
        return [];
      const R = config.rows;
      const C = config.cols;
      return [
        0, // Top-Left (Start)
        R - 1, // Bottom-Left
        R - 1 + (C - 1), // Bottom-Right
        R - 1 + (C - 1) + (R - 1), // Top-Right
      ];
    },
    bottomRightCornerId(state) {
      // Specifically the one for bad effect
      const config = this.currentStageConfig;
      if (!config || !config.rows || !config.cols || config.rows <= 1 || config.cols <= 1)
        return -1;
      return config.rows - 1 + (config.cols - 1);
    },
    // Squares that are not corners and not the start square, candidates for random effects
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
    // --- Game Flow & Setup ---
    initializeGame() {
      this.playerStage = 1;
      this.isGameOver = false;
      this.reservedDice = []; // Clear reserved dice
      this.setupStage();
    },

    setupStage() {
      const config = this.currentStageConfig;
      if (!config) {
        this.gameMessage = "Error: Invalid stage!";
        this.isGameOver = true;
        return;
      }

      this.boardRows = config.rows;
      this.boardCols = config.cols;
      this.playerLap = 1;
      this.playerPosition = 0;
      // Reset money only if it's the very first stage, otherwise keep it
      this.playerMoney = this.playerStage === 1 && this.playerLap === 1 ? 0 : this.playerMoney;
      this.lastDiceRoll = null;
      this.gamePhase = "rolling";

      this.generateBoardLayout(); // Defines baseTypes
      this.setupLapEffects(); // Adds temporary bad squares and random good squares for the lap

      this.gameMessage = `Stage ${this.playerStage} - Lap ${this.playerLap}/${config.lapsToComplete}. Roll the die!`;
    },

    generateBoardLayout() {
      const config = this.currentStageConfig;
      const totalSquares = this.totalBoardSquares;
      const corners = this.cornerSquareIds;
      const brCornerId = this.bottomRightCornerId; // This is one of the corners

      const newLayout = [];
      for (let i = 0; i < totalSquares; i++) {
        let baseType = "normal";
        if (i === 0) {
          baseType = "start";
        } else if (i === corners[1]) {
          // Bottom-Left
          baseType = "corner_bl";
        } else if (i === brCornerId) {
          // Bottom-Right
          baseType = "corner_br"; // Specific for the bad effect rule
        } else if (i === corners[3]) {
          // Top-Right
          baseType = "corner_tr";
        }
        // Note: corners[0] is 'start'

        newLayout.push({
          id: i,
          baseType: baseType,
          currentEffectType: "none", // Will be set by setupLapEffects
          isTempBad: false,
          effectDetails: null,
        });
      }
      this.boardSquares = newLayout;
    },

    setupLapEffects() {
      const config = this.currentStageConfig;
      // Reset temporary effects from previous lap
      this.boardSquares.forEach((sq) => {
        sq.isTempBad = false;
        // Only reset currentEffectType if it's a lap-specific effect or a collected normal_money
        if (
          sq.baseType === "normal" ||
          sq.currentEffectType === "temp_bad_lap" ||
          sq.currentEffectType === "normal_money"
        ) {
          sq.currentEffectType = "none"; // Will be re-assigned if it becomes normal_money
        }
        // sq.effectDetails = null; // Reset details carefully, some might be from baseType or choices
      });

      let candidateIds = [...this.candidateSquareIds]; // Non-corner, non-start squares

      // 1. Add temporary bad squares
      const numBadSquaresToPlace = getRandomInt(0, config.maxBadSquares);
      shuffleArray(candidateIds);
      for (let i = 0; i < numBadSquaresToPlace; i++) {
        if (candidateIds.length === 0) break;
        const badId = candidateIds.pop();
        const square = this.boardSquares.find((sq) => sq.id === badId);
        if (square) {
          square.isTempBad = true;
          square.currentEffectType = "temp_bad_lap";
          square.effectDetails = { penalty: getRandomInt(5, 15) * this.playerStage }; // Store penalty
        }
      }

      // 2. Transform some remaining normal squares to special types OR assign them a normal money value
      candidateIds.forEach((id) => {
        const square = this.boardSquares.find((sq) => sq.id === id);
        // Ensure it's still a valid candidate (baseType 'normal' and not made 'temp_bad_lap')
        if (square && square.baseType === "normal" && !square.isTempBad) {
          const rand = Math.random();
          if (rand < 0.1) {
            // 10% Huge Money
            square.currentEffectType = "huge_money";
            square.effectDetails = { amount: this.currentHugeMoneyValue };
          } else if (rand < 0.15) {
            // 5% Choice: Dice vs Money
            square.currentEffectType = "choice_dice_money";
            // effectDetails for choices will be populated when landing or handled by a getter
          } else if (rand < 0.2) {
            // 5% Choice: Pick a Die
            square.currentEffectType = "choice_pick_die";
          } else {
            // This is now a standard money-giving square
            square.currentEffectType = "normal_money";
            square.effectDetails = {
              amount: Math.floor(getRandomInt(1, 3) * config.moneyMultiplier),
            };
          }
        }
      });
      this.gameMessage = `Lap ${this.playerLap} setup! Money values refreshed.`;
    },

    // --- Dice & Movement ---
    addReservedDie(dieData) {
      // MODIFY ON TOP RESERVED MAXIMUM
      if (this.reservedDice.length < this.maxDiceInBag) {
        this.reservedDice.push(dieData);
        this.gameMessage = `Gained a ${dieData.type} die!`;
      } else {
        this.gameMessage = `Dice bag is full! Couldn't keep the new die.`;
      }
    },

    rollDice(reservedDieIndex = -1) {
      if (this.isGameOver || this.gamePhase !== "rolling") return;

      let dieToRoll;
      let steps;

      if (reservedDieIndex >= 0 && reservedDieIndex < this.reservedDice.length) {
        dieToRoll = this.reservedDice.splice(reservedDieIndex, 1)[0]; // Use and remove
      } else {
        dieToRoll = { type: DICE_TYPES.NORMAL }; // Default normal die
      }

      this.gameMessage = `Rolling a ${dieToRoll.type} die...`;

      switch (dieToRoll.type) {
        case DICE_TYPES.NORMAL:
          steps = getRandomInt(1, 6);
          break;
        case DICE_TYPES.FIXED:
          steps = dieToRoll.value || 1; // Default to 1 if value missing
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

      this.lastDiceRoll = {
        value: Math.abs(steps),
        type: dieToRoll.type,
        direction: steps >= 0 ? "forward" : "backward",
      };
      console.log(`Rolled ${steps} with ${dieToRoll.type}`);
      this.movePlayer(steps);
    },

    movePlayer(steps) {
      this.gamePhase = "moving";
      let moneyEarnedThisTurn = 0;

      if (steps > 0) {
        // Forward Movement
        for (let i = 0; i < steps; i++) {
          this.playerPosition = (this.playerPosition + 1) % this.totalBoardSquares;
          const currentSq = this.boardSquares[this.playerPosition];

          // Collect money from normal_money squares when passing/landing
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
            // Passed Start
            this.playerLap++;
            this.gameMessage = `Completed a lap! Now on Lap ${this.playerLap}/${this.currentStageConfig.lapsToComplete}`;
            if (this.playerLap > this.currentStageConfig.lapsToComplete) {
              this.handleBossEncounter();
              return;
            } else {
              this.setupLapEffects(); // Refresh square effects for the new lap
            }
          }
        }
      } else if (steps < 0) {
        // Backward Movement
        for (let i = 0; i < Math.abs(steps); i++) {
          this.playerPosition =
            (this.playerPosition - 1 + this.totalBoardSquares) % this.totalBoardSquares;
        }
      }

      this.gamePhase = "landed";
      // Update message based on actual earnings
      let moveMsg = `Moved ${Math.abs(steps)} steps ${this.lastDiceRoll.direction}. Landed on ${
        this.playerPosition
      }.`;
      if (moneyEarnedThisTurn > 0 && steps > 0) {
        moveMsg += ` Earned $${moneyEarnedThisTurn}.`;
      }
      this.gameMessage = moveMsg;
      this.handleSquareLanding();
    },

    handleSquareLanding() {
      if (
        this.isGameOver ||
        this.playerPosition >= this.boardSquares.length ||
        this.playerPosition < 0
      )
        return;

      const square = this.boardSquares[this.playerPosition];
      let landingMessage = ` Landed on square ${square.id} (${square.baseType}, effect: ${square.currentEffectType}).`;
      // console.log(`Landed on square ${square.id}, base: ${square.baseType}, effect: ${square.currentEffectType}`); // Already have a good gameMessage

      // Base type effects (fixed effects)
      if (square.baseType === "corner_br") {
        this.playerMoney -= 20; // Can go negative
        landingMessage += ` Bad corner! Lost $20. Money: ${this.playerMoney}.`;
      }

      // Current effect type (dynamic effects)
      switch (square.currentEffectType) {
        case "temp_bad_lap":
          const penalty = square.effectDetails?.penalty || getRandomInt(5, 15) * this.playerStage;
          this.playerMoney -= penalty;
          landingMessage += ` Stepped on a trap! Lost $${penalty}.`;
          break;
        case "huge_money":
          const hugeGain = square.effectDetails?.amount || this.currentHugeMoneyValue;
          this.playerMoney += hugeGain;
          landingMessage += ` Huge Money! +$${hugeGain}.`;
          this.boardSquares[this.playerPosition].currentEffectType = "none";
          this.boardSquares[this.playerPosition].effectDetails = null;
          break;

        case "choice_dice_money": // Offer money OR one specific, randomly determined die
          this.gamePhase = "awaiting_choice";
          let offeredDieInChoice;
          const randDieChoice = Math.random();
          if (randDieChoice < 0.6) {
            offeredDieInChoice = { type: DICE_TYPES.FIXED, value: getRandomInt(2, 6) };
          } else if (randDieChoice < 0.85) {
            offeredDieInChoice = { type: DICE_TYPES.REVERSE_RANDOM };
          } else {
            offeredDieInChoice = { type: DICE_TYPES.D20 };
          }
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
          landingMessage += " " + this.choiceDetails.message;
          break;

        case "choice_pick_die": // Offer 3 to 4 unique dice
          this.gamePhase = "awaiting_choice";
          const dicePool = [
            // Create a diverse pool of potential dice
            { type: DICE_TYPES.FIXED, value: 1 },
            { type: DICE_TYPES.FIXED, value: 2 },
            { type: DICE_TYPES.FIXED, value: 3 },
            { type: DICE_TYPES.FIXED, value: 4 },
            { type: DICE_TYPES.FIXED, value: 5 },
            { type: DICE_TYPES.FIXED, value: 6 },
            { type: DICE_TYPES.D20 },
            { type: DICE_TYPES.REVERSE_RANDOM },
            { type: DICE_TYPES.REVERSE_FIXED, value: getRandomInt(1, 3) },
            { type: DICE_TYPES.NORMAL }, // A chance to get another normal die
            // Add more potential dice types/values to the pool if desired
          ];
          shuffleArray(dicePool); // Shuffle the pool

          const numDiceToOffer = getRandomInt(3, 4);
          const finalDiceOptions = [];
          const offeredSignatures = new Set(); // To track uniqueness

          for (const die of dicePool) {
            if (finalDiceOptions.length >= numDiceToOffer) break;

            let signature = die.type;
            // For fixed dice, value matters for uniqueness
            if (die.type === DICE_TYPES.FIXED || die.type === DICE_TYPES.REVERSE_FIXED) {
              signature += `_${die.value}`;
            }

            if (!offeredSignatures.has(signature)) {
              finalDiceOptions.push({
                text: `Die: ${die.type}${die.value !== undefined ? " (" + die.value + ")" : ""}`,
                action: "get_chosen_die",
                value: { ...die }, // Clone the die object
                visual: { type: "die", dieData: { ...die } }, // Add visual cue
              });
              offeredSignatures.add(signature);
            }
          }

          this.choiceDetails = {
            type: "pick_a_die",
            message: `Choose a die to keep (${finalDiceOptions.length} options):`,
            options: finalDiceOptions,
          };
          landingMessage += " " + this.choiceDetails.message;
          break;
      }
      // Update the main game message *after* all specific landing messages are composed
      this.gameMessage = landingMessage.trim();

      if (this.gamePhase === "landed") {
        // If no choice was triggered
        this.gamePhase = "rolling";
      }
    },

    playerMakesChoice(chosenOption) {
      if (this.gamePhase !== "awaiting_choice" || !this.choiceDetails) return;

      const originalSquareIndex = this.playerPosition;

      switch (chosenOption.action) {
        case "get_money_bonus":
          this.playerMoney += chosenOption.value;
          this.gameMessage = `You chose money! +$${chosenOption.value}.`;
          break;
        case "get_fixed_die":
        case "get_chosen_die":
          this.addReservedDie(chosenOption.value);
          break;
      }

      if (originalSquareIndex >= 0 && originalSquareIndex < this.boardSquares.length) {
        // Reset the effect of the square that offered the choice
        this.boardSquares[originalSquareIndex].currentEffectType = "none";
        this.boardSquares[originalSquareIndex].effectDetails = null;
      }
      this.choiceDetails = null;
      this.gamePhase = "rolling";
    },

    // --- Stage Progression ---
    handleBossEncounter() {
      this.gamePhase = "boss_encounter";
      const config = this.currentStageConfig;
      this.gameMessage = `Boss Time: ${config.bossName}! You need $X to pass.`; // TODO: Define boss cost
      // Placeholder: For now, player always wins boss to test stage progression
      console.log(`Facing boss for stage ${this.playerStage}.`);
      // Simulate winning the boss
      setTimeout(() => {
        this.gameMessage = `You defeated ${config.bossName}!`;
        this.advanceStage();
      }, 1500); // Short delay to show boss message
    },

    advanceStage() {
      this.playerStage++;
      if (this.playerStage > MAX_STAGES) {
        this.gameMessage = "CONGRATULATIONS! You've beaten all stages and won the game!";
        this.isGameOver = true;
        this.gamePhase = "game_won";
        console.log("Game Won!");
      } else {
        this.setupStage(); // This will set up new board, reset lap to 1
        this.gamePhase = "rolling";
      }
    },
  },
});
