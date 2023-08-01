var board = null;
var game = new Chess();

// Stockfish constants
var stockfish = null;
var STOCKFISH_MAX_DEPTH = 23;
var STOCKFISH_MIN_USEFUL_DEPTH = 20;

// ===== Event Handling ========================================================

// Page initialization
$(document).ready(() => {
    board = Chessboard("chessboard", {
        draggable: true,
        position: "start",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd,
    });

    // Initialize stockfish properly
    stockfish = new Worker("lib/stockfish.js");
    stockfish.postMessage("uci");
    stockfish.postMessage("ucinewgame");
    stockfish.postMessage("position fen " + game.fen());
    stockfish.postMessage("go depth " + STOCKFISH_MAX_DEPTH);
    stockfish.onmessage = onStockfishMessage;
});

// When the mouse enters a chessboard square...
function onMouseoverSquare(square, piece) {
    // Get the list of possible moves for this square
    let movesList = game.moves({
        square: square,
        verbose: true,
    });

    // Short-circuit leave if no moves are available
    if (movesList.length === 0) return;

    // Highlight the square they moused over
    greySquare(square);

    // Highlight all possible squares for this piece
    for (var i = 0; i < movesList.length; i++) {
        greySquare(movesList[i].to);
    }
}

// When the user picks up a piece...
function onDragStart(source, piece) {
    // Short circuit if the game is over
    if (game.game_over()) return false;

    // Short circuit if it's not the player's turn
    if (
        (game.turn() === "w" && piece.search(/^b/) !== -1) ||
        (game.turn() === "b" && piece.search(/^w/) !== -1)
    )
        return false;
}

// When the user drops a piece...
function onDrop(source, target) {
    // Throw away any grey squares
    removeGreySquares();

    // Short circuit if the move is illegal
    let move = game.move({
        from: source,
        to: target,
        promotion: "q", // This always promotes to a queen for simplicity
    });
    if (move === null) return "snapback";
}

// Once the board snaps to a different position...
function onSnapEnd() {
    board.position(game.fen());

    // Update Stockfish to new position
    resetStockfish(game.fen());

    // Update the game status
    updateStatus();
}

// When the player leaves a square...
function onMouseoutSquare(square, piece) {
    // Clear all grey squares
    removeGreySquares();
}

// ===== Stockfish helpers =====================================================

// Upon any Stockfish message...
function onStockfishMessage(event) {
    // Parse the message
    let message = event.data;
    // Switch on first word of message
    switch (message.split(" ")[0]) {
        case "info":
            // Get the centipawn loss
            let cp = message.split(" ")[message.split(" ").indexOf("cp") + 1];
            // Update evaluation with this
            updateStockfishEval(cp);
            break;
        default: // Return
            return;
    }
}

// Reset Stockfish to a new position
function resetStockfish(fen) {
    // Reset Stockfish
    stockfish.postMessage("position fen " + fen);
    stockfish.postMessage("go depth " + STOCKFISH_MAX_DEPTH);
    stockfish.onmessage = onStockfishMessage;
}

// Update Stockfish evaluation
function updateStockfishEval(centipawnLoss) {
    // Update the evaluation
    let evalSpan = $("#stockfisheval");
    // Adjust for stockfish giving positive evaluations for black
    let turnNumber = game.turn() === "w" ? 1 : -1;
    // Compute the centipawn loss as a string with 1 decimal
    let evaluation = (centipawnLoss / 100) * turnNumber;
    // IF evaluation is NaN, set to 0
    if (isNaN(evaluation)) evaluation = 0;
    let centipawnLossStr = evaluation.toFixed(1);
    // If positive, add a + sign
    if (evaluation > 0) centipawnLossStr = "+" + centipawnLossStr;

    // Get the move color
    let moveColor = game.turn() === "w" ? "White" : "Black";

    // Update the evaluation
    evalSpan.text(centipawnLossStr);
}

// ===== Board helpers =========================================================

// Update the board status HUD
function updateStatus() {
    let statusSpan = $("#movehudtext");

    let moveColor = game.turn() === "w" ? "White" : "Black";
    let prevMoveColor = moveColor === "White" ? "Black" : "White";

    // Update the coloration of the evaluation HUD element
    let evalBox = $("#stockfishevalbox");
    let evalSpan = $("#stockfisheval");
    if (moveColor === "White") {
        evalBox.css("background-color", "white");
        evalSpan.css("color", "black");
    } else {
        evalBox.css("background-color", "black");
        evalSpan.css("color", "white");
    }

    // Short circuit for game ended
    if (game.in_checkmate()) {
        statusSpan.text(`${prevMoveColor} won by checkmate`);
        return;
    }
    if (game.in_draw()) {
        statusSpan.text("Draw");
        return;
    }
    // Update if any checks
    if (game.in_check()) {
        statusSpan.text(`${moveColor} is in check`);
        return;
    }

    // Otherwise, clear
    statusSpan.text("");
}

// ===== CSS Helpers ===========================================================

// Remove grey square highlighting
function removeGreySquares() {
    $("#chessboard .square-55d63").css("background", "");
}

// Add grey square highlighting to a particular square
function greySquare(square) {
    // Color constants
    let whiteSquareGrey = "#a9a9a9";
    let blackSquareGrey = "#696969";

    let $square = $("#chessboard .square-" + square);
    let background = $square.hasClass("black-3c85d")
        ? blackSquareGrey
        : whiteSquareGrey;

    $square.css("background", background);
}
