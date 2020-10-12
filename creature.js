class Creature {
  /**
   * @param {Array} initSize - The Initial size of the creature's coordinate plane
   * @param {Boolean} growing - If the coordinate plane may grow as needed
   * @param {Array} activeCells - A list of coordinates in [x, y] form of activated cells
   */
  constructor(activeCells) {
    this.activeCellMap = {};
    activeCells.forEach(cell => this.activeCellMap[cell.join(',')] = true);
    this.initialStage = activeCells;
  }
  get activeCells() {
    return Object.keys(this.activeCellMap).map(cell => {
      cell = cell.split(',');
      cell.forEach((coord, i) => {
        cell[i] = JSON.parse(coord);
      });
      return cell;
    });
  }
  get mass() {
    return this.activeCells.length;
  }
  step() {
    function forEachSurroundingCell(cell, callback) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // Don't call on self:
          if (!i && !j) continue;
          callback([cell[0] + i, cell[1] + j]);
        }
      }
    }
    const activateCells = () => {
      const potentialCells = {};
      this.activeCells.forEach(cell => {
        forEachSurroundingCell(cell, neighborCell => {
          let address = neighborCell.join(',');
          if (potentialCells[address] == undefined) potentialCells[address] = 1;
          else potentialCells[address]++;
        });
      });
      const cellMap = {};
      Object.keys(potentialCells).forEach(cellAddress => {
        const cellScore = potentialCells[cellAddress];
        if (cellScore == 2 && this.activeCellMap[cellAddress]) cellMap[cellAddress] = true;
        else if (cellScore == 3) cellMap[cellAddress] = true;
      });
      this.activeCellMap = cellMap;
    };
    activateCells();
  }
  toJSON() {
    return {
      initialStage: this.initialStage,
      activeCells: this.activeCells,
      mass: this.mass
    };
  }
}

exports.Creature = Creature;
