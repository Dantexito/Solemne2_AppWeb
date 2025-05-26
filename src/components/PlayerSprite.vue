<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { useGameStore } from "../stores/game"; // Adjust path if needed

// --- Sprite Configuration ---
// IMPORTANT: Adjust frameWidth and frameHeight to the exact dimensions
// of a single frame within your Idle.png and Walk.png spritesheets.
const SPRITE_CONFIG = {
  idle: {
    url: new URL("../assets/sprites/Idle.png", import.meta.url).href,
    frameCount: 4, // Number of frames in Idle.png
    frameWidth: 48,
    frameHeight: 64,
    fps: 8,
  },
  walking: {
    url: new URL("../assets/sprites/Walk.png", import.meta.url).href,
    frameCount: 8, // Number of frames in Walk.png
    frameWidth: 48,
    frameHeight: 64,
    fps: 12,
  },
};
// --- ---

const props = defineProps({
  action: {
    type: String,
    default: "idle",
    validator: (value) => ["idle", "walking"].includes(value),
  },
  // Optional: direction prop if your sprites have different facing directions
  // direction: { type: String, default: 'right' }
});

const gameStore = useGameStore();

const currentFrameIndex = ref(0);
// currentSpriteConfig will hold the configuration for the current action (idle or walking)
const currentSpriteConfig = ref(SPRITE_CONFIG[props.action]);
let animationIntervalId = null; // To store the ID of the setInterval timer

// Computed property to dynamically set the style for the sprite div
const backgroundStyle = computed(() => {
  if (!currentSpriteConfig.value || !currentSpriteConfig.value.url) {
    // Return a default style or hide if no config/URL
    return { display: "none" };
  }
  const config = currentSpriteConfig.value;
  return {
    width: `${config.frameWidth}px`,
    height: `${config.frameHeight}px`,
    backgroundImage: `url(${config.url})`,
    // Assumes frames are laid out horizontally in the spritesheet
    // Moves the background image leftwards to show the next frame
    backgroundPosition: `-${currentFrameIndex.value * config.frameWidth}px 0px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated", // Preserves sharp edges for pixel art
    // transform: props.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)', // Example for flipping sprite
  };
});

// Function to start or switch an animation
function playAnimation(actionType) {
  stopAnimation(); // Clear any previous animation interval

  const config = SPRITE_CONFIG[actionType];
  if (!config) {
    console.warn(`PlayerSprite: No sprite config found for action: ${actionType}`);
    currentSpriteConfig.value = null; // Ensure no old config is used
    return;
  }
  currentSpriteConfig.value = config;
  currentFrameIndex.value = 0; // Start from the first frame

  // If the sprite has only one frame, no interval is needed
  if (config.frameCount <= 1) return;

  // Calculate animation interval based on FPS and game speed multiplier
  const baseInterval = 1000 / config.fps;
  let actualInterval = baseInterval;
  if (gameStore.animationSpeedMultiplier !== 0) {
    // Avoid division by zero
    actualInterval = baseInterval / gameStore.animationSpeedMultiplier;
  }

  // If game speed is "Instant", show the first frame and don't animate
  if (gameStore.animationSpeedMultiplier === 0) {
    currentFrameIndex.value = 0; // Show the first frame
    return; // Don't start the interval
  }

  animationIntervalId = setInterval(() => {
    currentFrameIndex.value = (currentFrameIndex.value + 1) % config.frameCount;
  }, actualInterval);
}

// Function to clear the animation interval
function stopAnimation() {
  if (animationIntervalId) {
    clearInterval(animationIntervalId);
    animationIntervalId = null;
  }
}

// Watch for changes in the 'action' prop (e.g., from 'idle' to 'walking')
watch(
  () => props.action,
  (newAction) => {
    console.log("PlayerSprite: Action changed to", newAction);
    playAnimation(newAction);
  },
  { immediate: true }
); // 'immediate: true' runs the watcher once on component mount

// Watch for changes in the game's animation speed multiplier
watch(
  () => gameStore.animationSpeedMultiplier,
  () => {
    // If an animation is supposed to be playing, restart it with the new speed
    if (props.action && SPRITE_CONFIG[props.action]) {
      console.log("PlayerSprite: Animation speed changed, restarting animation for", props.action);
      playAnimation(props.action);
    }
  }
);

// When the component is mounted, start the initial animation
onMounted(() => {
  playAnimation(props.action);
});

// When the component is unmounted (e.g., removed from the page), clear the animation interval
onUnmounted(() => {
  stopAnimation();
});
</script>

<template>
  <div class="player-sprite" :style="backgroundStyle"></div>
</template>

<style scoped>
.player-sprite {
  display: inline-block; /* (you already have this) */
  position: absolute; /* ensure it’s positioned relative to the parent */
  z-index: 100; /* <<— bring it above the squares */
  overflow: visible;
}
</style>
