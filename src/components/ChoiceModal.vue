<script setup>
const props = defineProps({
  details: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["player-choice"]);

function makeChoice(option) {
  emit("player-choice", option);
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h4>{{ details.message }}</h4>
      <div class="options">
        <button v-for="(option, index) in details.options" :key="index" @click="makeChoice(option)">
          {{ option.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 300px;
}
.options button {
  margin: 10px;
  padding: 10px 15px;
  background-color: #5cb85c;
}
h4 {
  margin-top: 0;
  margin-bottom: 20px;
}
</style>
