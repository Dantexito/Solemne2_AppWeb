import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    boardRows: 6,
    boardCols: 6,
    playerPosition: 0,
    playerMoney: 0,
    lap: 0,
    turn: 1,
    stage: 1,
    currentDice: { name: '1-6', type: 'range', min: 1, max: 6 },
    availableDice: [
      { name: '1-6', type: 'range', min: 1, max: 6 },
      { name: '1-20', type: 'range', min: 1, max: 20 },
      { name: 'Retrocede 1', type: 'fixed', value: -1 },
      { name: 'Avanza 3', type: 'fixed', value: 3 },
      { name: '1-3', type: 'range', min: 1, max: 3 }
    ],
    boardSquares: []
  }),   

  getters: {
    totalBoardSquares(state) {
      const R = state.boardRows;
      const C = state.boardCols;
      return R <= 1 || C <= 1 ? R * C : 2 * R + 2 * C - 4;
    }
  },

  actions: {
    generateBoard() {
      const squares = []
      const maxPenalty = this.boardRows === 6 ? 2 : 4
      let penalties = 0
      let id = 0

      // Bordes: arriba → derecha → abajo → izquierda
      for (let col = 0; col < this.boardCols; col++)
        squares.push(this._createSquare(id++, 0, col, penalties, maxPenalty, () => penalties++))

      for (let row = 1; row < this.boardRows - 1; row++)
        squares.push(this._createSquare(id++, row, this.boardCols - 1, penalties, maxPenalty, () => penalties++))

      for (let col = this.boardCols - 1; col >= 0; col--)
        squares.push(this._createSquare(id++, this.boardRows - 1, col, penalties, maxPenalty, () => penalties++))

      for (let row = this.boardRows - 2; row > 0; row--)
        squares.push(this._createSquare(id++, row, 0, penalties, maxPenalty, () => penalties++))

      this.boardSquares = squares
    },

    _createSquare(id, row, col, penalties, maxPenalty, incrementPenalty) {
      let type = 'gold'
      const rand = Math.random()

      if (penalties < maxPenalty && rand < 0.1) {
        type = 'penalty'
        incrementPenalty()
      } else if (rand < 0.3) {
        type = 'dice'
      } else if (rand < 0.5) {
        type = 'gold_dice'
      }

      return {
        id,
        row,
        col,
        type,
        reward: type.includes('gold') ? Math.floor(Math.random() * 3 + 1) : 0
      }
    },

    roll() {
      let steps = 1

      if (this.currentDice.type === 'range') {
        steps = Math.floor(Math.random() * (this.currentDice.max - this.currentDice.min + 1)) + this.currentDice.min
      } else if (this.currentDice.type === 'fixed') {
        steps = this.currentDice.value
      }

      this.playerPosition += steps

      if (this.playerPosition >= this.totalBoardSquares) {
        this.playerPosition %= this.totalBoardSquares
        this.lap++

        if (this.lap >= 3 && this.boardRows === 6) {
          this.boardRows = 9
          this.boardCols = 9
          this.stage++
          this.lap = 0
          this.generateBoard()
        }
      }

      const current = this.boardSquares[this.playerPosition]
      if (current.type === 'gold' || current.type === 'gold_dice') {
        this.playerMoney += current.reward
      }

      if (current.type === 'penalty') {
        this.playerMoney = Math.max(0, this.playerMoney - Math.floor(Math.random() * 2 + 1))
      }

      if (current.type === 'dice' || current.type === 'gold_dice') {
        this.currentDice = this.availableDice[Math.floor(Math.random() * this.availableDice.length)]
      }

      this.turn++
    }
  }
})
