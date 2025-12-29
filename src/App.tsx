import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GoBoard } from "./components/GoBoard";
import { Controls } from "./components/Controls";
import { MoveList } from "./components/MoveList";
import { ApiKeyManager } from "./components/ApiKeyManager";
import { CoachPanel } from "./components/CoachPanel";
import { GoGame } from "./lib/goGame";
import { pickAiMove } from "./lib/goAi";
import { clearGoState, loadGoState, saveGoState } from "./lib/storage";
import { clearApiKey, loadApiKey, saveApiKey } from "./lib/apiKeyStorage";
import { getGoFeedback } from "./lib/openaiClient";
import type { GoCoachResponse, StoneColor } from "./types/go";
import type { GoMove } from "./types/go";
import "./App.css";

export default function App() {
  const [boardSize, setBoardSize] = useState(9);
  const gameRef = useRef(new GoGame(boardSize));
  const [board, setBoard] = useState(gameRef.current.getBoard());
  const [moves, setMoves] = useState<GoMove[]>([]);
  const [status, setStatus] = useState("Place a stone to begin.");
  const [humanColor, setHumanColor] = useState<StoneColor>("black");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<GoCoachResponse | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [, setPassesInRow] = useState(0);
  const [gameResult, setGameResult] = useState<string | null>(null);

  const aiColor: StoneColor = humanColor === "black" ? "white" : "black";

  const syncState = useCallback(() => {
    const nextBoard = gameRef.current.getBoard();
    const nextMoves = gameRef.current.getMoveHistory();
    setBoard(nextBoard);
    setMoves(nextMoves);
    saveGoState({
      board: nextBoard,
      moves: nextMoves,
      captures: { ...gameRef.current.captures },
      turn: gameRef.current.getTurn(),
    });
  }, []);

  const resetGame = useCallback(
    (size: number) => {
      const nextGame = new GoGame(size);
      gameRef.current = nextGame;
      setBoard(nextGame.getBoard());
      setMoves([]);
      setStatus("Place a stone to begin.");
      clearGoState();
      setCoachFeedback(null);
      setPassesInRow(0);
      setGameResult(null);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    loadApiKey()
      .then((stored) => {
        if (cancelled) return;
        if (stored) {
          setApiKey(stored);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setApiKeyReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = loadGoState();
    if (saved) {
      const restored = new GoGame(saved.board.length);
      restored.board = saved.board.map((row) => [...row]);
      restored.moves = saved.moves.map((move) => ({
        ...move,
        boardSnapshot: move.boardSnapshot.map((row) => [...row]),
      }));
      restored.captures = saved.captures;
      restored.turn = saved.turn as StoneColor;
      gameRef.current = restored;
      setBoardSize(saved.board.length);
      setBoard(restored.getBoard());
      setMoves(restored.getMoveHistory());
      setStatus("Game restored. Your move.");
      setPassesInRow(0);
      setGameResult(null);
    }
  }, []);

  const requestCoach = useCallback(async () => {
    if (!apiKey) {
      setCoachError("Add your API key to ask the coach.");
      return;
    }
    setCoachLoading(true);
    setCoachError(null);
    try {
      const request = {
        boardSize,
        boardAscii: gameRef.current.toAscii(),
        moveHistory: gameRef.current.getMoveHistory().map((move) => ({
          moveNumber: move.moveNumber,
          color: move.color,
          coordinate: move.coordinate,
          captures: move.captures,
        })),
        captures: { ...gameRef.current.captures },
        lastMove: gameRef.current.getLastMove()
          ? {
              color: gameRef.current.getLastMove()!.color,
              coordinate: gameRef.current.getLastMove()!.coordinate,
            }
          : undefined,
        nextPlayer: gameRef.current.getTurn(),
        territoryEstimate: gameRef.current.getTerritoryEstimate(),
      };
      const response = await getGoFeedback(request, apiKey);
      setCoachFeedback(response);
    } catch (error) {
      if (error instanceof Error) {
        setCoachError(error.message);
      } else {
        setCoachError("Unable to reach coach.");
      }
    } finally {
      setCoachLoading(false);
    }
  }, [apiKey, boardSize]);

  const maybeAutoCoach = useCallback(() => {
    if (!apiKey) return;
    requestCoach();
  }, [apiKey, requestCoach]);

  const concludeGame = useCallback(() => {
    const score = gameRef.current.getScoreEstimate();
    const diff = score.black.total - score.white.total;
    let summary: string;
    if (Math.abs(diff) < 0.5) {
      summary = `Game over. Tie at ${score.black.total}-${score.white.total} (captures included).`;
    } else if (diff > 0) {
      summary = `Game over. Black leads by ${diff} (approx).`;
    } else {
      summary = `Game over. White leads by ${Math.abs(diff)} (approx).`;
    }
    setStatus(summary + " Start a new game to keep practicing.");
    setGameResult(summary);
  }, []);

  const registerPass = useCallback(() => {
    setPassesInRow((prev) => {
      const next = prev + 1;
      if (next >= 2) {
        concludeGame();
      }
      return next;
    });
  }, [concludeGame]);

  const registerMove = useCallback(() => {
    setPassesInRow(0);
  }, []);

  const triggerAiMove = useCallback(() => {
    setIsAiThinking(true);
    setTimeout(() => {
      if (gameResult) {
        setIsAiThinking(false);
        return;
      }
      const move = pickAiMove(gameRef.current, aiColor);
      if (move) {
        gameRef.current.playMove(move.x, move.y, aiColor);
        setStatus("Your turn.");
        registerMove();
      } else {
        gameRef.current.pass(aiColor);
        setStatus("Computer passed. Your turn.");
        registerPass();
      }
      setIsAiThinking(false);
      syncState();
    }, 400);
  }, [aiColor, gameResult, registerMove, registerPass, syncState]);

  const handlePlay = useCallback(
    (x: number, y: number) => {
      if (gameResult) {
        setStatus("Game over. Start a new game.");
        return;
      }
      if (isAiThinking) return;
      if (gameRef.current.getTurn() !== humanColor) {
        setStatus("Wait for your turn.");
        return;
      }
      const result = gameRef.current.playMove(x, y, humanColor);
      if (!result.success) {
        setStatus("Illegal move. Try another intersection.");
        return;
      }
      registerMove();
      setStatus("Computer thinking...");
      syncState();
      maybeAutoCoach();
      triggerAiMove();
    },
    [humanColor, isAiThinking, maybeAutoCoach, registerMove, syncState, triggerAiMove],
  );

  const handlePass = useCallback(() => {
    if (gameResult) {
      setStatus("Game over. Start a new game.");
      return;
    }
    if (gameRef.current.pass(humanColor)) {
      setStatus("You passed. Computer to move.");
      registerPass();
      syncState();
      triggerAiMove();
    }
  }, [humanColor, registerPass, syncState, triggerAiMove]);

  const handleBoardSizeChange = useCallback(
    (size: number) => {
      setBoardSize(size);
      resetGame(size);
    },
    [resetGame],
  );

  const handleNewGame = useCallback(() => {
    resetGame(boardSize);
    if (humanColor === "white") {
      triggerAiMove();
    }
  }, [boardSize, humanColor, resetGame, triggerAiMove]);

  const handleSwapSides = useCallback(() => {
    const nextColor = humanColor === "black" ? "white" : "black";
    setHumanColor(nextColor);
    resetGame(boardSize);
    if (nextColor === "white") {
      triggerAiMove();
    }
  }, [boardSize, humanColor, resetGame, triggerAiMove]);

  const handleSaveApiKey = useCallback(async (value: string) => {
    await saveApiKey(value);
    setApiKey(value);
  }, []);

  const handleClearApiKey = useCallback(async () => {
    await clearApiKey();
    setApiKey(null);
  }, []);

  const lastMove = useMemo(() => moves[moves.length - 1]?.coordinate, [moves]);
  const scoreEstimate = useMemo(() => gameRef.current.getScoreEstimate(), [board]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Go Coach</h1>
          <p className="subtitle">Play 9×9 Go vs. a training bot and get gentle feedback.</p>
        </div>
        <Controls
          boardSize={boardSize}
          onBoardSizeChange={handleBoardSizeChange}
          onNewGame={handleNewGame}
          onPass={handlePass}
          onSwapSides={handleSwapSides}
          humanColor={humanColor}
          disablePass={Boolean(gameResult) || isAiThinking}
        />
      </header>

      <ApiKeyManager apiKey={apiKey} onSave={handleSaveApiKey} onClear={handleClearApiKey} loading={!apiKeyReady} />

      <div className="board-layout">
        <div className="play-column">
          <GoBoard
            board={board}
            allowMoves={!isAiThinking && !gameResult && gameRef.current.getTurn() === humanColor}
            onPlay={handlePlay}
            size={boardSize}
            turn={gameRef.current.getTurn()}
            lastMove={lastMove}
          />
          <p className="status-text">{status}</p>
          {gameResult && <p className="muted">{gameResult}</p>}
          <div className="score-panel">
            <h3>Live score (stones + territory + captures)</h3>
            <div className="score-breakdown">
              <div>
                <span className="score-label">Black</span>
                <span className="score-total">{scoreEstimate.black.total}</span>
                <span className="muted small">
                  stones {scoreEstimate.black.stones} · territory {scoreEstimate.black.territory} · captures {scoreEstimate.black.captures}
                </span>
              </div>
              <div>
                <span className="score-label">White</span>
                <span className="score-total">{scoreEstimate.white.total}</span>
                <span className="muted small">
                  stones {scoreEstimate.white.stones} · territory {scoreEstimate.white.territory} · captures {scoreEstimate.white.captures}
                </span>
              </div>
            </div>
          </div>
          <MoveList moves={moves} />
        </div>
        <div className="analytics-column">
          <CoachPanel
            feedback={coachFeedback}
            loading={coachLoading}
            error={coachError}
            onRefresh={requestCoach}
            disabled={moves.length === 0}
          />
        </div>
      </div>
    </div>
  );
}
