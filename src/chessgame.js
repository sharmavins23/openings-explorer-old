var board = null;
var game = new Chess();

// ===== EVENT HANDLING ========================================================

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
}

// When the player leaves a square...
function onMouseoutSquare(square, piece) {
    // Clear all grey squares
    removeGreySquares();
}

// ===== CSS HELPERS ===========================================================

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
