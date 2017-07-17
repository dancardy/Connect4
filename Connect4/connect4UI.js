var debugSpan;
window.onload = function () {
    Connect4BoardUI.init();
};
var Connect4BoardUI;
(function (Connect4BoardUI) {
    var canvas;
    var divCanvas;
    var ctx;
    var scalePct = 0.97;
    var holeDiameterPct = 0.85;
    var boardWidth, boardHeight, holeSpacing, radius;
    var chipColors = ['red', 'yellow'];
    var board;
    var columnOfFallingPiece;
    var lastDrawnColumnOfFallingPiece;
    var currentYofFallingPiece;
    var animationRequestID = null;
    var timeOfLastFrameDraw = 0;
    var firstCallToAnimationLoop = false;
    var unprocessedMouseMoveEvent = null;
    function init() {
        debugSpan = document.querySelector("#debugspan");
        canvas = document.querySelector("#connect4MainCanvas");
        ctx = canvas.getContext('2d');
        divCanvas = document.querySelector("#connect4MainCanvasDiv");
        Connect4Board.numRows = 6;
        Connect4Board.numCols = 7;
        Connect4Board.threshold = 4;
        board = new Connect4Board();
        MCTS.initialize(board);
        window.addEventListener('resize', function () { resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1)); }, false);
        resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1));
        canvas.addEventListener('click', processClick);
        canvas.addEventListener('mousemove', processMouseMove);
    }
    Connect4BoardUI.init = init;
    function resizeCanvasAccordingToParentSize(aspectRatio) {
        var winHeight = Math.floor(getWindowHeight() * 0.5);
        var winWidth = divCanvas.clientWidth;
        if ((winHeight > 0) && (winWidth / winHeight > aspectRatio)) {
            canvas.width = Math.floor(winHeight * aspectRatio);
            canvas.height = winHeight;
        }
        else {
            canvas.width = winWidth;
            canvas.height = Math.floor(winWidth / aspectRatio);
        }
        boardWidth = canvas.width * scalePct;
        boardHeight = (canvas.height - canvas.height / (Connect4Board.numRows + 1)) * scalePct;
        holeSpacing = boardWidth / Connect4Board.numCols;
        radius = holeDiameterPct * holeSpacing / 2;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        drawBoard();
    }
    function getWindowHeight() {
        if (typeof (window.innerWidth) == 'number') {
            return window.innerHeight;
        }
        else if (document.documentElement && document.documentElement.clientHeight) {
            return document.documentElement.clientHeight;
        }
        else if (document.body && document.body.clientHeight) {
            return document.body.clientHeight;
        }
        else {
            return -1;
        }
    }
    function translateMouseCoordinates(event) {
        var mouseX = event.clientX - canvas.getBoundingClientRect().left;
        var mouseY = event.clientY - canvas.getBoundingClientRect().top;
        return {
            x: mouseX - (canvas.width - boardWidth) / 2,
            y: mouseY - ((canvas.height / (Connect4Board.numRows + 1)) + ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2)
        };
    }
    function translateCanvas() {
        ctx.translate((canvas.width - boardWidth) / 2, (canvas.height / (Connect4Board.numRows + 1)) + ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2);
    }
    function processClick(event) {
        if (animationRequestID) {
            return;
        }
        if (board.gameState != 0 && board.gameState != 1) {
            return;
        }
        var mousePos = translateMouseCoordinates(event);
        if ((mousePos.y > 0) || (mousePos.x < 0) || (mousePos.x > holeSpacing * Connect4Board.numCols))
            return;
        columnOfFallingPiece = Math.floor(mousePos.x / holeSpacing);
        if (board.colHeight[columnOfFallingPiece] < Connect4Board.numRows) {
            MCTS.processMove(columnOfFallingPiece);
            MCTS.processingInterval = 16;
            firstCallToAnimationLoop = true;
            currentYofFallingPiece = -holeSpacing / 2;
            animationRequestID = requestAnimationFrame(animateFallingPiece);
            lastDrawnColumnOfFallingPiece = -1;
        }
    }
    function processMouseMove(event) {
        if (animationRequestID) {
            unprocessedMouseMoveEvent = event;
            return;
        }
        unprocessedMouseMoveEvent = null;
        if (board.gameState != 0 && board.gameState != 1) {
            return;
        }
        var mousePos = translateMouseCoordinates(event);
        if ((mousePos.y < 0) && (mousePos.x >= 0) && (mousePos.x <= holeSpacing * Connect4Board.numCols)) {
            currentYofFallingPiece = -holeSpacing / 2;
            var col = Math.floor(mousePos.x / holeSpacing);
            if (col != lastDrawnColumnOfFallingPiece) {
                drawSingleLoosePiece(col);
                lastDrawnColumnOfFallingPiece = col;
            }
        }
    }
    function drawSingleLoosePiece(column) {
        ctx.save();
        translateCanvas();
        ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1);
        if (currentYofFallingPiece == -holeSpacing / 2) {
            ctx.beginPath();
            ctx.rect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1);
            ctx.clip();
        }
        setShadow();
        var xCoordinate = holeSpacing / 2 + column * holeSpacing;
        ctx.fillStyle = chipColors[board.turnsCompleted % 2];
        ctx.beginPath();
        ctx.moveTo(xCoordinate + radius, currentYofFallingPiece);
        ctx.arc(xCoordinate, currentYofFallingPiece, radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    function setShadow() {
        if (holeSpacing > 40) {
            ctx.shadowColor = 'black';
            ctx.shadowBlur = boardWidth * 0.009;
            ctx.shadowOffsetX = boardWidth * 0.004;
            ctx.shadowOffsetY = boardWidth * 0.004;
        }
    }
    function animateFallingPiece(timestamp) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var finalY = boardHeight - holeSpacing / 2 - board.colHeight[columnOfFallingPiece] * holeSpacing;
        var timeSinceLastFrameDraw = timestamp - timeOfLastFrameDraw;
        timeOfLastFrameDraw = timestamp;
        var yDropTime = 400;
        var yIncrement = (firstCallToAnimationLoop) ? 0 : boardHeight * timeSinceLastFrameDraw / yDropTime;
        currentYofFallingPiece += yIncrement;
        if (currentYofFallingPiece < finalY) {
            drawSingleLoosePiece(columnOfFallingPiece);
            drawBoard();
            firstCallToAnimationLoop = false;
            animationRequestID = requestAnimationFrame(animateFallingPiece);
        }
        else {
            if (animationRequestID) {
                cancelAnimationFrame(animationRequestID);
                animationRequestID = null;
                board.makeMove(columnOfFallingPiece);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBoard();
                if (board.gameState == 0 || board.gameState == 1) {
                    if (unprocessedMouseMoveEvent) {
                        processMouseMove(unprocessedMouseMoveEvent);
                    }
                    else {
                        currentYofFallingPiece = -holeSpacing / 2;
                        drawSingleLoosePiece(columnOfFallingPiece);
                    }
                    MCTS.processingInterval = 100;
                }
                else {
                    processEndOfGame();
                }
            }
        }
    }
    function drawBoard() {
        ctx.save();
        translateCanvas();
        var firstX = holeSpacing / 2;
        var firstY = boardHeight - holeSpacing / 2;
        ctx.save();
        setShadow();
        var row, col;
        for (row = 0; row < Connect4Board.numRows; row++) {
            for (col = 0; col < Connect4Board.numCols; col++) {
                if (board.getPieceAt(row, col) != -1) {
                    ctx.beginPath();
                    ctx.moveTo(firstX + col * holeSpacing + radius, firstY - row * holeSpacing / 2);
                    ctx.arc(firstX + col * holeSpacing, firstY - row * holeSpacing, radius, 0, Math.PI * 2, false);
                    ctx.fillStyle = chipColors[board.getPieceAt(row, col)];
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
        ctx.beginPath();
        ctx.moveTo(0, boardHeight);
        for (col = 0; col < Connect4Board.numCols; col++) {
            ctx.lineTo(firstX + col * holeSpacing, boardHeight);
            for (row = 0; row < Connect4Board.numRows; row++) {
                ctx.arc(firstX + col * holeSpacing, firstY - row * holeSpacing, radius, Math.PI / 2, 3 * Math.PI / 2, false);
            }
            for (row = Connect4Board.numRows - 1; row >= 0; row--) {
                ctx.arc(firstX + col * holeSpacing, firstY - row * holeSpacing, radius, 3 * Math.PI / 2, Math.PI / 2, false);
            }
            ctx.lineTo(firstX + col * holeSpacing, boardHeight);
        }
        ctx.lineTo(boardWidth, boardHeight);
        ctx.lineTo(boardWidth, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.restore();
        ctx.strokeRect(0, 0, boardWidth, boardHeight);
        ctx.beginPath();
        for (col = 0; col < Connect4Board.numCols; col++) {
            for (row = 0; row < Connect4Board.numRows; row++) {
                ctx.moveTo(firstX + col * holeSpacing + radius, firstY - row * holeSpacing);
                ctx.arc(firstX + col * holeSpacing, firstY - row * holeSpacing, radius, 0, Math.PI * 2, false);
            }
        }
        ctx.stroke();
        ctx.restore();
    }
    function processEndOfGame() {
        if (board.gameState == 3)
            alert('connect4! by Player 1 - end of game handling not yet written');
        else if (board.gameState == 4)
            alert('connect4! by Player 2 - end of game handling not yet written');
        else if (board.gameState == 5)
            alert('draw - end of game handling not yet written');
        else
            alert('processEndOfGame called, but board.gamestate does not match.');
    }
})(Connect4BoardUI || (Connect4BoardUI = {}));
