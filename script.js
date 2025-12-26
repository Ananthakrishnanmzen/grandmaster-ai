/**
 * Grandmaster AI - Chess Engine Logic
 * Algorithm: Minimax with Alpha-Beta Pruning
 */

var board = null;
var game = new Chess();
var difficulty = 3; // Default depth
var playerColor = 'w';

/* --- UI FLOW CONTROL --- */

function selectSide(side) {
    playerColor = side === 'white' ? 'w' : 'b';
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('difficulty-screen').classList.remove('hidden');
}

function startGame(depth) {
    difficulty = depth;
    document.getElementById('difficulty-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    var config = {
        draggable: true,
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        orientation: playerColor === 'w' ? 'white' : 'black',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    
    board = Chessboard('myBoard', config);

    // If user chose Black, AI (White) moves first
    if (playerColor === 'b') {
        document.getElementById('status-text').innerText = "AI is thinking...";
        window.setTimeout(makeBestMove, 250);
    }
}

/* --- AI ENGINE: EVALUATION & HEURISTICS --- */

// Weights for board positioning (Knights prefer center, etc.)
const reverseArray = function(array) { return [...array].reverse(); };

const pawnEval = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
    [0.5,  1.0, 1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];

const knightEval = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
    [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
    [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
    [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
    [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
    [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
    [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];

function getPieceValue(piece, x, y) {
    if (piece === null) return 0;
    
    const getAbsoluteValue = function (piece, isWhite, x, y) {
        if (piece.type === 'p') return 10 + (isWhite ? pawnEval[y][x] : reverseArray(pawnEval)[y][x]);
        if (piece.type === 'r') return 50;
        if (piece.type === 'n') return 30 + knightEval[y][x];
        if (piece.type === 'b') return 30;
        if (piece.type === 'q') return 90;
        if (piece.type === 'k') return 900;
        throw "Unknown piece type: " + piece.type;
    };

    const absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

function evaluateBoard(game) {
    let totalEvaluation = 0;
    const boardState = game.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(boardState[i][j], i, j);
        }
    }
    return totalEvaluation;
}

/* --- AI ENGINE: SEARCH ALGORITHM --- */

function minimax(game, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) return -evaluateBoard(game);

    var moves = game.moves();

    if (isMaximizingPlayer) {
        let bestEval = -9999;
        for (let i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestEval);
            if (beta <= alpha) break;
        }
        return bestEval;
    } else {
        let bestEval = 9999;
        for (let i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            bestEval = Math.min(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
            game.undo();
            beta = Math.min(beta, bestEval);
            if (beta <= alpha) break;
        }
        return bestEval;
    }
}

function makeBestMove() {
    let moves = game.moves();
    if (game.game_over()) {
        alert("Game Over!");
        return;
    }

    let bestMove = null;
    let bestValue = -9999;

    // Sort moves to optimize Alpha-Beta pruning
    moves.sort(() => Math.random() - 0.5);

    for (let i = 0; i < moves.length; i++) {
        let move = moves[i];
        game.move(move);
        let boardValue = minimax(game, difficulty - 1, -10000, 10000, false);
        game.undo();
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }

    game.move(bestMove);
    board.position(game.fen());
    document.getElementById('status-text').innerText = "Your Turn";
    
    if (game.game_over()) alert("Game Over!");
}

/* --- BOARD HANDLERS --- */

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;

    // Only allow player to move their own pieces
    if ((playerColor === 'w' && piece.search(/^b/) !== -1) ||
        (playerColor === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to queen for simplicity
    });

    if (move === null) return 'snapback';

    document.getElementById('status-text').innerText = "AI is thinking...";
    window.setTimeout(makeBestMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
    }
