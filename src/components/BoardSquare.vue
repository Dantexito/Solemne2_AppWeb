<script setup>
import { computed } from "vue";
import { useGameStore } from "../stores/game"; // Adjust path if needed

const props = defineProps({
  square: {
    type: Object,
    required: true,
  },
});

const gameStore = useGameStore();
const isHighlighted = computed(() => {
  return gameStore.highlightedTargetSquare === props.square.id;
});

// This computed property is for highlighting the square itself,
// not for drawing the player marker (which is now a separate PlayerSprite component).
const isPlayerCurrentlyOnThisSquare = computed(() => gameStore.playerPosition === props.square.id);

// Computes the icons and text to display based on the square's properties
const displayData = computed(() => {
  const sq = props.square;
  let icons = [];
  let text = "";

  // Determine display based on base type (permanent features of the square)
  if (sq.baseType === "start") {
    icons.push("🏁"); // Start flag emoji
  } else if (sq.baseType === "corner_br") {
    icons.push("☣️"); // Biohazard for the bad bottom-right corner
    text = "-$20"; // Text indicating the penalty
  } else if (sq.baseType.startsWith("corner_")) {
    icons.push("⭐"); // Star for other generic corners
  }

  // Determine display based on current dynamic effect (can override or add to base type)
  if (sq.isTempBad) {
    icons = ["💀"]; // Skull for temporary bad squares (traps), overrides other icons for clarity
    text = `Trap! (-$${sq.effectDetails?.penalty || "?"})`; // Show penalty if available
  } else {
    // If not a trap, check for other current effects
    switch (sq.currentEffectType) {
      case "huge_money":
        icons = ["💰"]; // Money bag for huge money
        text = `+$${sq.effectDetails?.amount || gameStore.currentHugeMoneyValue}`;
        break;
      case "choice_dice_money":
        icons = ["💰", "🎲"]; // Money bag and dice for this choice
        text = "Choice!";
        break;
      case "choice_pick_die":
        icons = ["🎲"]; // Gift box and dice for picking a die
        text = "Get Die!";
        break;
      case "normal_money":
        // Add money icon only if it's not a corner that already has an icon
        if (!sq.baseType.startsWith("corner_")) {
          icons.push("🪙"); // Coin emoji for normal money squares
        }
        text = `+$${sq.effectDetails?.amount || "?"}`; // Display the pre-set money amount
        break;
      case "none": // No specific dynamic effect
        if (sq.baseType === "normal" && icons.length === 0) {
          // If it's a normal square with no other icon and no dynamic effect,
          // it's currently a blank/neutral square.
          text = ""; // No text, or could be a placeholder like "Safe"
        }
        break;
    }
  }

  // If no icons were set by dynamic effects or specific base types,
  // and it's a normal square, give it a default "empty" icon.
  if (icons.length === 0 && sq.baseType === "normal" && sq.currentEffectType === "none") {
    icons.push("▫️"); // Simple dot or empty square indicator
  }

  return { icons, text };
});

// Computes dynamic CSS classes for the square based on its state
const squareClasses = computed(() => ({
  "player-is-on-this-square": isPlayerCurrentlyOnThisSquare.value, // For highlighting the square
  "temp-bad": props.square.isTempBad,
  corner: props.square.baseType.startsWith("corner_"),
  "corner-br": props.square.baseType === "corner_br",
  "start-square": props.square.baseType === "start",
  "effect-huge-money": props.square.currentEffectType === "huge_money",
  "effect-choice":
    props.square.currentEffectType === "choice_dice_money" ||
    props.square.currentEffectType === "choice_pick_die",
  "effect-normal-money": props.square.currentEffectType === "normal_money",
}));
</script>

<template>
  <div
    class="board-square"
    :class="[
      square.baseType,
      square.currentEffectType,
      { highlighted: isHighlighted, active: isPlayerCurrentlyOnThisSquare },
    ]"
  >
    <div class="square-id-container">
      <span class="square-id">{{ square.id }}</span>
    </div>
    <div class="icons-container">
      <span v-for="(icon, index) in displayData.icons" :key="index" class="icon-display">
        {{ icon }}
      </span>
    </div>
    <div class="text-container">
      <span class="effect-text">{{ displayData.text }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Overall style for each square on the board */
.board-square {
  border: 1px solid #a07040; /* Brownish border, change border thickness of the square */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between; /* Distribute space for ID, icons, text */
  padding: 4px; /* Change padding for more or less internal spacing in the larger square */
  font-size: 11px; /* Base font size within the square */
  position: relative;
  background-color: #fff8e8; /* Lighter square color */
  box-sizing: border-box;
  overflow: visible;
  text-align: center;
  width: 75px; /* Explicitly set width for the new square size */
  height: 75px; /* Explicitly set height for the new square size */
  z-index: 0;
}

/* Highlight for the square the player is currently on */
.player-is-on-this-square {
  /* UPDATED: Made the outline thicker for better visibility on a larger square */
  outline: 4px solid gold !important;
  /* UPDATED: Slightly increased the glow effect */
  box-shadow: 0 0 12px gold;
  position: relative;
  z-index: 2;
}

/* Specific styling for different types of squares */
.temp-bad {
  background-color: #a73737;
  color: white;
  /* UPDATED: Slightly thicker border for consistency if desired, or keep as is */
  /* border-color: darkred; */ /* Kept original, adjust if needed */
}
.temp-bad .icon-display,
.temp-bad .effect-text {
  color: white;
}
.corner-br {
  background-color: #ffcccc;
  /* UPDATED: Slightly thicker border for consistency if desired, or keep as is */
  /* border: 2px solid red; */ /* Kept original, adjust if needed */
}
.corner {
  background-color: #e0e0e0;
  /* UPDATED: Slightly thicker border for consistency if desired, or keep as is */
  /* border-width: 2px; */ /* Kept original, adjust if needed */
}
.start-square {
  background-color: #c0ffc0;
  /* UPDATED: Slightly thicker border for consistency if desired, or keep as is */
  /* border: 2px solid green; */ /* Kept original, adjust if needed */
}
.effect-huge-money {
  background-color: gold;
}
.effect-choice {
  background-color: lightgreen;
}

.square-id-container {
  width: 100%;
  text-align: left;
  /* UPDATED: Adjusted padding slightly if needed due to overall padding change in .board-square */
  padding-left: 2px; /* Kept original, adjust if needed */
}

.square-id {
  font-weight: bold;
  color: #555;
  /* UPDATED: Increased font size for the square ID */
  font-size: 12px;
  z-index: 2;
}

.icons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  /* UPDATED: Increased font size for icons (emojis) */
  font-size: 20px;
  /* UPDATED: Adjusted margin for better spacing with larger icons */
  margin: 2px 0;
  /* UPDATED: Increased min-height to reserve more space for larger icons */
  min-height: 22px;
  z-index: 2;
  overflow: visible;
}

.icon-display {
  /* UPDATED: Adjusted margin between icons if multiple are present */
  margin: 0 2px;
}

.text-container {
  /* UPDATED: Increased min-height to reserve more space for potentially larger text */
  min-height: 15px;
  width: 100%;
}

.effect-text {
  /* UPDATED: Increased font size for effect text */
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.highlighted {
  /* border: 2px dashed #00f; */ /* Kept original, adjust if needed */
  box-shadow: 0 0 10px rgba(0, 0, 255, 0.6);
}

.board-square.start {
  background-color: lightgray;
}

.board-square.normal_money {
  background-color: lightgreen;
}

.board-square.bad {
  background-color: #f88;
}

.board-square.choice_dice_money {
  background-color: gold;
}

.board-square.choice_pick_die {
  background-color: #add8e6;
}

.board-square.highlighted {
  /* border: 2px dashed #00f; */ /* Kept original, adjust if needed */
  box-shadow: 0 0 8px rgba(0, 0, 255, 0.5);
}

.board-square.active {
  /* border: 2px solid yellow; */ /* Kept original, adjust if needed */
}
</style>
