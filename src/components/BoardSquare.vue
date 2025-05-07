<!-- BoardSquare.vue -->
<!--
Here each square is be

-->
<script setup>
import { computed } from "vue";
import { useGameStore } from "../stores/game";

const props = defineProps({
  square: {
    type: Object,
    required: true,
  },
});

const gameStore = useGameStore();
const isPlayerHere = computed(() => gameStore.playerPosition === props.square.id);

const displayData = computed(() => {
  const sq = props.square;
  let icons = [];
  let text = "";

  // Base type effects first (permanent visual cues)
  if (sq.baseType === "start") {
    icons.push("🏁"); // or 🏠
  } else if (sq.baseType === "corner_br") {
    icons.push("💸"); // Special bad corner
    text = "-$20";
  } else if (sq.baseType.startsWith("corner_")) {
    icons.push("⭐"); // Generic other corners
  }

  // Current dynamic effect (can override or add to base type display)
  if (sq.isTempBad) {
    icons = ["💀"]; // Temp bad overrides other icons for clarity
    text = `Trap! (-$${sq.effectDetails?.penalty || "?"})`;
  } else {
    switch (sq.currentEffectType) {
      case "huge_money":
        icons = ["💰"];
        text = `+$${sq.effectDetails?.amount || gameStore.currentHugeMoneyValue}`;
        break;
      case "choice_dice_money":
        icons = ["💰", "🎲"];
        text = "Choice";
        break;
      case "choice_pick_die":
        icons = ["🎁", "🎲"]; // Gift box + Dice
        text = "Get Die";
        break;
      case "normal_money":
        if (!sq.baseType.startsWith("corner_")) icons.push("💰"); // Add money bag if not already a styled corner
        text = `+$${sq.effectDetails?.amount || "?"}`; // Display the pre-set amount
        break;
      case "none":
        if (sq.baseType === "normal") {
          // This case should ideally be 'normal_money' now if it gives money.
          // If truly 'none' and 'normal', it gives nothing.
          text = ""; // Or a placeholder like "."
        }
        break;
    }
  }
  // Consolidate icons to avoid duplicates if baseType also had an icon
  if (icons.length > 1 && icons[0] === icons[1]) icons.pop();
  if (icons.length === 0 && sq.baseType === "normal" && sq.currentEffectType === "none") {
    // A truly blank normal square, no specific effect, no money assigned this lap
    // This state should be rare if normal squares always get a money value or transform
    icons.push("▫️"); // Simple dot or empty square indicator
  }

  return { icons, text };
});

const squareClasses = computed(() => ({
  "player-here": isPlayerHere.value,
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
  <div class="board-square" :class="squareClasses">
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
    <span v-if="isPlayerHere" class="player-marker"> P </span>
  </div>
</template>

<style scoped>
.board-square {
  border: 1px solid #a07040; /* Brownish border */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between; /* Distribute space for ID, icons, text */
  padding: 2px;
  font-size: 9px;
  position: relative;
  background-color: #fff8e8; /* Lighter square color */
  box-sizing: border-box;
  overflow: hidden;
  text-align: center;
  min-height: 55px; /* Ensure consistent height */
}

/* Specific square type styling */
.player-here {
  background-color: #add8e6 !important;
}
.temp-bad {
  background-color: #a73737;
  color: white;
  border-color: darkred;
}
.temp-bad .icon-display,
.temp-bad .effect-text {
  color: white;
}
.corner-br {
  background-color: #ffcccc;
  border: 2px solid red;
} /* Distinct bad corner */
.corner {
  background-color: #e0e0e0;
  border-width: 2px;
} /* Generic other corners */
.start-square {
  background-color: #c0ffc0;
  border: 2px solid green;
}
.effect-huge-money {
  background-color: gold;
}
.effect-choice {
  background-color: lightgreen;
}
/* .effect-normal-money { background-color: #f0f8ff; } /* Alice blue for normal money squares */

.square-id-container {
  width: 100%;
  text-align: left;
  padding-left: 2px;
}
.square-id {
  font-weight: bold;
  color: #555;
  font-size: 10px;
}

.icons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px; /* Emoji size */
  margin: 1px 0; /* Minimal margin */
  min-height: 18px; /* Reserve space for icons */
}
.icon-display {
  margin: 0 1px;
}

.text-container {
  min-height: 12px; /* Reserve space for text */
  width: 100%;
}
.effect-text {
  font-size: 10px;
  font-weight: 500;
  color: #333;
}

.player-marker {
  font-weight: bold;
  color: blue;
  font-size: 24px; /* Larger marker */
  line-height: 1;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none; /* So it doesn't interfere with clicks if square becomes clickable */
}
</style>
