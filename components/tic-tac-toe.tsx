import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TicTacToeProps {
  onGameEnd: (playerWon: boolean, isTie?: boolean) => void;
}

interface Square {
  id: number;
  owner: number | null; // 1 for player (X), 2 for AI (O)
}

export function TicTacToe({ onGameEnd }: TicTacToeProps) {
  const GRID_SIZE = 3;
  const TOTAL_SQUARES = GRID_SIZE * GRID_SIZE;
  const [squares, setSquares] = useState<Square[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(1); // 1 for player, 2 for AI
  const [gameOver, setGameOver] = useState(false);

  // Initialize the game
  useEffect(() => {
    const initialSquares = Array.from({ length: TOTAL_SQUARES }, (_, index) => ({
      id: index,
      owner: null
    }));
    setSquares(initialSquares);
  }, []);

  // Check for a winner
  const checkWinner = (currentSquares: Square[]): number | null => {
    const lines = [
      [0, 1, 2], // Rows
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6], // Columns
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8], // Diagonals
      [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (
        currentSquares[a].owner &&
        currentSquares[a].owner === currentSquares[b].owner &&
        currentSquares[a].owner === currentSquares[c].owner
      ) {
        return currentSquares[a].owner;
      }
    }

    return null;
  };

  // Check if game is over
  const checkGameOver = (newSquares: Square[]) => {
    const winner = checkWinner(newSquares);
    if (winner) {
      setGameOver(true);
      onGameEnd(winner === 1);
      return true;
    }

    // Check for tie
    if (newSquares.every(square => square.owner !== null)) {
      setGameOver(true);
      onGameEnd(false, true); // false for not won, true for tie
      return true;
    }

    return false;
  };

  // Find best move for AI using minimax algorithm
  const findBestMove = (currentSquares: Square[]): number => {
    let bestScore = -Infinity;
    let bestMove = -1;

    // Try each available move
    for (let i = 0; i < currentSquares.length; i++) {
      // Only try moves on empty squares
      if (currentSquares[i].owner === null) {
        const newSquares = [...currentSquares];
        newSquares[i] = { ...currentSquares[i], owner: 2 };
        const score = minimax(newSquares, 0, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove;
  };

  // Minimax algorithm for AI
  const minimax = (currentSquares: Square[], depth: number, isMaximizing: boolean): number => {
    const winner = checkWinner(currentSquares);
    if (winner === 2) return 10 - depth; // AI wins
    if (winner === 1) return depth - 10; // Player wins
    if (currentSquares.every(square => square.owner !== null)) return 0; // Tie

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < currentSquares.length; i++) {
        // Only try moves on empty squares
        if (currentSquares[i].owner === null) {
          const newSquares = [...currentSquares];
          newSquares[i] = { ...currentSquares[i], owner: 2 };
          const score = minimax(newSquares, depth + 1, false);
          bestScore = Math.max(bestScore, score);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < currentSquares.length; i++) {
        // Only try moves on empty squares
        if (currentSquares[i].owner === null) {
          const newSquares = [...currentSquares];
          newSquares[i] = { ...currentSquares[i], owner: 1 };
          const score = minimax(newSquares, depth + 1, true);
          bestScore = Math.min(bestScore, score);
        }
      }
      return bestScore;
    }
  };

  // AI move
  const makeAIMove = () => {
    if (gameOver) return;

    // Get all empty squares
    const emptySquares = squares.reduce((acc: number[], square, index) => {
      if (square.owner === null) acc.push(index);
      return acc;
    }, []);

    if (emptySquares.length === 0) return;

    // Find best move among empty squares
    let bestScore = -Infinity;
    let bestMove = emptySquares[0];

    for (const square of emptySquares) {
      const newSquares = [...squares];
      newSquares[square] = { ...squares[square], owner: 2 };
      const score = minimax(newSquares, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = square;
      }
    }

    // Make the move only if the square is empty
    if (squares[bestMove].owner === null) {
      const newSquares = [...squares];
      newSquares[bestMove] = { ...squares[bestMove], owner: 2 };
      setSquares(newSquares);
      setCurrentPlayer(1);
      
      // Check for game over conditions after AI move
      const winner = checkWinner(newSquares);
      if (winner) {
        setGameOver(true);
        onGameEnd(winner === 1);
      } else if (!newSquares.some(square => square.owner === null)) {
        setGameOver(true);
        onGameEnd(false, true);
      }
    }
  };

  // Handle square click
  const handleSquareClick = (index: number) => {
    if (gameOver || currentPlayer !== 1 || squares[index].owner !== null) return;

    const newSquares = [...squares];
    newSquares[index] = {
      ...newSquares[index],
      owner: 1
    };
    setSquares(newSquares);

    if (!checkGameOver(newSquares)) {
      setCurrentPlayer(2);
      setTimeout(makeAIMove, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-2xl font-bold text-amber-500">
            {currentPlayer === 1 ? "Your Turn" : "Monster's Turn"}
          </h2>

          <div className="grid grid-cols-3 gap-2 bg-gray-800 p-4 rounded-lg">
            {squares.map((square, index) => (
              <Button
                key={square.id}
                variant="ghost"
                className={cn(
                  "w-20 h-20 rounded-lg transition-all duration-200 text-4xl font-bold",
                  square.owner === 1 
                    ? "bg-amber-500/20 border-2 border-amber-500 text-amber-500"
                    : square.owner === 2
                      ? "bg-red-500/20 border-2 border-red-500 text-red-500"
                      : "bg-gray-700 hover:bg-gray-600",
                  currentPlayer === 1 && square.owner === null && "cursor-pointer hover:border-2 hover:border-amber-500/50"
                )}
                onClick={() => handleSquareClick(index)}
                disabled={square.owner !== null || currentPlayer !== 1}
              >
                {square.owner === 1 ? "X" : square.owner === 2 ? "O" : ""}
              </Button>
            ))}
          </div>

          {gameOver && (
            <div className="text-center mt-4">
              <h3 className="text-3xl font-bold mb-4">
                {checkWinner(squares) === 1 ? (
                  <span className="text-amber-500">Victory!</span>
                ) : checkWinner(squares) === 2 ? (
                  <span className="text-red-500">Defeat!</span>
                ) : (
                  <span className="text-gray-400">It's a Tie!</span>
                )}
              </h3>
              <p className="text-xl text-gray-400">
                {checkWinner(squares) === 1
                  ? "You've outsmarted the monster!"
                  : checkWinner(squares) === 2
                  ? "The monster was too clever..."
                  : "A worthy opponent indeed!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 