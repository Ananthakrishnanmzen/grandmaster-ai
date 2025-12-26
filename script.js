var board = null;
var game = new Chess();
var difficulty = 3;
var playerColor = 'w';

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
        orientation: playerColor === 'w' ? 'white' : 'black',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    board = Chessboard('myBoard', config);

    if (playerColor === 'b') {
        window.setTimeout(makeBestMove, 250);
    }
}

/* --- AI ENGINE LOGIC --- */

function evaluateBoard(game) {
    const pieces = game.board();
    let totalEvaluation = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(pieces[i][j]);
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece) {
    if (piece === null) return 0;
    const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    let val = values[piece.type];
    return piece.color === 'w' ? val : -val;
}

function minimax(game, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) return -evaluateBoard(game);

    var moves = game.moves();
    if (isMaximizingPlayer) {
        let bestEval = -9999;
        for (let move of moves) {
            game.move(move);
            bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestEval);
            if (beta <= alpha) break;
        }
        return bestEval;
    } else {
        let bestEval = 9999;
        for (let move of moves) {
            game.move(move);
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
    if (moves.length === 0) return;

    let bestMove = null;
    let bestValue = -9999;

    for (let move of moves) {
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
}

/* --- BOARD INTERACTION --- */

function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (piece.search(playerColor === 'w' ? /^b/ : /^w/) !== -1) return false;
}

function onDrop(source, target) {
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    window.setTimeout(makeBestMove, 250);
}

function onSnapEnd() { board.position(game.fen()); }
