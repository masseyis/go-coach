import type { GoMove, Intersection, StoneColor } from "../types/go";

function cloneBoard(board: Intersection[][]) {
  return board.map((row) => [...row]);
}

function boardKey(board: Intersection[][]) {
  return board
    .map((row) => row.map((cell) => (cell ? (cell === "black" ? "b" : "w") : ".")).join(""))
    .join("/");
}

const LETTERS = "ABCDEFGHJKLMNOPQRST";

export class GoGame {
  size: number;
  board: Intersection[][];
  turn: StoneColor = "black";
  previousBoardSignature: string | null = null;
  moves: GoMove[] = [];
  captures = { black: 0, white: 0 };

  constructor(size = 9) {
    this.size = size;
    this.board = Array.from({ length: size }, () => Array<Intersection>(size).fill(null));
  }

  reset() {
    this.board = Array.from({ length: this.size }, () => Array<Intersection>(this.size).fill(null));
    this.turn = "black";
    this.moves = [];
    this.captures = { black: 0, white: 0 };
    this.previousBoardSignature = null;
  }

  getBoard() {
    return cloneBoard(this.board);
  }

  getTurn() {
    return this.turn;
  }

  getMoveHistory() {
    return [...this.moves];
  }

  getLastMove() {
    return this.moves[this.moves.length - 1];
  }

  toAscii(): string {
    return this.board
      .map((row) => row.map((cell) => (cell === "black" ? "●" : cell === "white" ? "○" : ".")).join(" "))
      .join("\n");
  }

  coordinateFromIndices(x: number, y: number) {
    return `${LETTERS[x]}${this.size - y}`;
  }

  static coordinateToIndices(coordinate: string, size: number): [number, number] | null {
    if (!coordinate) return null;
    if (coordinate.toLowerCase() === "pass") return null;
    const letter = coordinate[0]?.toUpperCase();
    const numberPortion = coordinate.slice(1);
    const x = LETTERS.indexOf(letter);
    const numeric = Number.parseInt(numberPortion, 10);
    if (x < 0 || x >= size) return null;
    if (Number.isNaN(numeric) || numeric < 1 || numeric > size) return null;
    const y = size - numeric;
    if (y < 0 || y >= size) return null;
    return [x, y];
  }

  getScoreEstimate() {
    const territory = this.countTerritory();
    const stones = { black: 0, white: 0 };
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        const cell = this.board[y][x];
        if (cell) {
          stones[cell] += 1;
        }
      }
    }

    const assemble = (color: StoneColor) => ({
      stones: stones[color],
      territory: territory[color],
      captures: this.captures[color],
      total: stones[color] + territory[color] + this.captures[color],
    });

    return {
      black: assemble("black"),
      white: assemble("white"),
    };
  }

  getTerritoryEstimate() {
    const score = this.getScoreEstimate();
    return {
      black: score.black.total,
      white: score.white.total,
    };
  }

  pass(color: StoneColor) {
    if (color !== this.turn) return false;
    this.moves.push({
      moveNumber: this.moves.length + 1,
      color,
      coordinate: "pass",
      captures: 0,
      boardSnapshot: this.getBoard(),
    });
    this.turn = color === "black" ? "white" : "black";
    return true;
  }

  playMove(x: number, y: number, color: StoneColor) {
    if (color !== this.turn) return { success: false };
    if (!this.isLegalMove(x, y, color)) return { success: false };

    const snapshotBefore = this.getBoard();
    this.board[y][x] = color;
    const opponent = color === "black" ? "white" : "black";

    let totalCaptured = 0;
    const neighborOffsets = this.getNeighbors(x, y);
    neighborOffsets.forEach(([nx, ny]) => {
      if (this.board[ny][nx] === opponent) {
        const group = this.getGroup(nx, ny);
        if (this.countLiberties(group) === 0) {
          this.removeGroup(group);
          totalCaptured += group.length;
        }
      }
    });

    const playedGroup = this.getGroup(x, y);
    if (this.countLiberties(playedGroup) === 0) {
      // undo
      this.board = snapshotBefore;
      return { success: false };
    }

    if (totalCaptured > 0) {
      this.captures[color] += totalCaptured;
    }

    this.previousBoardSignature = boardKey(snapshotBefore);

    const move: GoMove = {
      moveNumber: this.moves.length + 1,
      color,
      coordinate: this.coordinateFromIndices(x, y),
      captures: totalCaptured,
      boardSnapshot: this.getBoard(),
    };
    this.moves.push(move);
    this.turn = opponent;
    return { success: true, move };
  }

  isLegalMove(x: number, y: number, color: StoneColor) {
    if (!this.isOnBoard(x, y)) return false;
    if (this.board[y][x]) return false;

    const snapshot = this.getBoard();
    this.board[y][x] = color;
    const opponent = color === "black" ? "white" : "black";
    let captured = 0;
    const neighbors = this.getNeighbors(x, y);
    neighbors.forEach(([nx, ny]) => {
      if (this.board[ny][nx] === opponent) {
        const group = this.getGroup(nx, ny);
        if (this.countLiberties(group) === 0) {
          captured += group.length;
          this.removeGroup(group);
        }
      }
    });

    const group = this.getGroup(x, y);
    const liberties = this.countLiberties(group);
    const signatureAfter = boardKey(this.board);
    const isKo = this.previousBoardSignature && signatureAfter === this.previousBoardSignature;

    this.board = snapshot;
    return (captured > 0 || liberties > 0) && !isKo;
  }

  getNeighbors(x: number, y: number) {
    const neighbors: Array<[number, number]> = [];
    if (x > 0) neighbors.push([x - 1, y]);
    if (x < this.size - 1) neighbors.push([x + 1, y]);
    if (y > 0) neighbors.push([x, y - 1]);
    if (y < this.size - 1) neighbors.push([x, y + 1]);
    return neighbors;
  }

  getGroup(x: number, y: number) {
    const color = this.board[y][x];
    if (!color) return [] as Array<[number, number]>;
    const visited = new Set<string>();
    const stack: Array<[number, number]> = [[x, y]];
    const group: Array<[number, number]> = [];

    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (this.board[cy][cx] !== color) continue;
      group.push([cx, cy]);
      this.getNeighbors(cx, cy).forEach(([nx, ny]) => {
        if (!visited.has(`${nx},${ny}`) && this.board[ny][nx] === color) {
          stack.push([nx, ny]);
        }
      });
    }
    return group;
  }

  countLiberties(group: Array<[number, number]>) {
    const liberties = new Set<string>();
    group.forEach(([x, y]) => {
      this.getNeighbors(x, y).forEach(([nx, ny]) => {
        if (!this.board[ny][nx]) {
          liberties.add(`${nx},${ny}`);
        }
      });
    });
    return liberties.size;
  }

  removeGroup(group: Array<[number, number]>) {
    group.forEach(([x, y]) => {
      this.board[y][x] = null;
    });
  }

  isOnBoard(x: number, y: number) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  getBoardSize() {
    return this.size;
  }

  clone() {
    const copy = new GoGame(this.size);
    copy.board = this.getBoard();
    copy.turn = this.turn;
    copy.captures = { ...this.captures };
    copy.previousBoardSignature = this.previousBoardSignature;
    copy.moves = this.moves.map((move) => ({
      ...move,
      boardSnapshot: move.boardSnapshot.map((row) => [...row]),
    }));
    return copy;
  }

  private countTerritory() {
    const visited: boolean[][] = Array.from({ length: this.size }, () => Array<boolean>(this.size).fill(false));
    const result = { black: 0, white: 0 };

    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.board[y][x] || visited[y][x]) continue;
        const queue: Array<[number, number]> = [[x, y]];
        visited[y][x] = true;
        const bordering = new Set<StoneColor>();
        let area = 0;

        while (queue.length) {
          const [cx, cy] = queue.pop()!;
          area += 1;
          this.getNeighbors(cx, cy).forEach(([nx, ny]) => {
            const cell = this.board[ny][nx];
            if (cell) {
              bordering.add(cell);
            } else if (!visited[ny][nx]) {
              visited[ny][nx] = true;
              queue.push([nx, ny]);
            }
          });
        }

        if (bordering.size === 1) {
          const [owner] = Array.from(bordering);
          if (owner) {
            result[owner] += area;
          }
        }
      }
    }

    return result;
  }
}
