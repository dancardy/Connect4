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
    var lastDrawnColumnOfHoveringPiece;
    var currentYofFallingPiece;
    var animationRequestID = null;
    var timeOfLastFrameDraw = 0;
    var firstCallToAnimationLoop = false;
    var unprocessedMouseMoveEvent = null;
    var AI_Player = 1;
    var AI_Player_Max_Wait = 10000;
    var newGameBtn;
    var widthSlider;
    var heightSlider;
    var difficultySlider;
    var textOutputSpan;
    var processingTimeSlider;
    var connectNumSlider;
    function init() {
        newGameBtn = document.querySelector("#newGameBtn");
        newGameBtn.addEventListener('click', newGameBtnPressed);
        canvas = document.querySelector("#connect4MainCanvas");
        ctx = canvas.getContext('2d');
        divCanvas = document.querySelector("#connect4MainCanvasDiv");
        canvas.addEventListener('click', processClick);
        canvas.addEventListener('mousemove', processMouseMove);
        widthSlider = document.querySelector("#boardWidth");
        widthSlider.addEventListener('change', changeBoardWidth);
        heightSlider = document.querySelector("#boardHeight");
        heightSlider.addEventListener('change', changeBoardHeight);
        difficultySlider = document.querySelector("#difficulty");
        difficultySlider.addEventListener('change', changeDifficulty);
        processingTimeSlider = document.querySelector("#processingTime");
        processingTimeSlider.addEventListener('change', changeProcessingTime);
        connectNumSlider = document.querySelector("#connectNum");
        connectNumSlider.addEventListener('change', changeConnectNum);
        textOutputSpan = document.querySelector("#textOutputSpan");
        resetSliderValues();
        window.addEventListener('resize', function () {
            resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1));
        }, false);
        initBoard();
    }
    Connect4BoardUI.init = init;
    function initBoard() {
        Connect4Board.numRows = parseInt(document.getElementById("heightValue").innerHTML);
        Connect4Board.numCols = parseInt(document.getElementById("widthValue").innerHTML);
        Connect4Board.threshold = parseInt(document.getElementById("connectNumValue").innerHTML);
        AI_Player = 1;
        AI_Player_Max_Wait = parseInt(document.getElementById("processingTimeValue").innerHTML) * 1000;
        var targetDepth = parseFloat(document.getElementById("difficultyValue").innerHTML);
        MCTS.maxNodes = (1 - Math.pow(Connect4Board.numCols, targetDepth + 1)) / (1 - Connect4Board.numCols);
        board = new Connect4Board();
        MCTS.start(board);
        resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1));
        enableControls(true);
    }
    var controlsEnabledNow = true;
    function enableControls(enable) {
        if (enable) {
            if (!controlsEnabledNow) {
                widthSlider.disabled = false;
                heightSlider.disabled = false;
                difficultySlider.disabled = false;
                connectNumSlider.disabled = false;
                document.getElementById("difficultyLabel").className = "";
                document.getElementById("boardWidthLabel").className = "";
                document.getElementById("boardHeightLabel").className = "";
                document.getElementById("connectNumLabel").className = "";
                document.getElementById("difficultyValue").className = "";
                document.getElementById("widthValue").className = "";
                document.getElementById("heightValue").className = "";
                document.getElementById("connectNumValue").className = "";
            }
            if ((board.gameState == 0) || (board.gameState == 1)) {
                newGameBtn.innerText = "Restore Defaults";
            }
            else {
                newGameBtn.innerText = "New Game";
            }
        }
        else if (!enable && controlsEnabledNow) {
            widthSlider.disabled = true;
            heightSlider.disabled = true;
            difficultySlider.disabled = true;
            connectNumSlider.disabled = true;
            document.getElementById("difficultyLabel").className += "grayed";
            document.getElementById("boardWidthLabel").className += "grayed";
            document.getElementById("boardHeightLabel").className += "grayed";
            document.getElementById("connectNumLabel").className += "grayed";
            document.getElementById("difficultyValue").className += "grayed";
            document.getElementById("widthValue").className += "grayed";
            document.getElementById("heightValue").className += "grayed";
            document.getElementById("connectNumValue").className += "grayed";
            newGameBtn.innerText = "New Game";
        }
        controlsEnabledNow = enable;
    }
    function getDepthTarget(difficulty) {
        if (difficulty <= 0)
            return 1;
        switch (difficulty) {
            case 1: return 1;
            case 2: return 2;
            case 3: return 3;
            case 4: return 4;
            case 5: return 4.5;
            case 6: return 5;
            case 7: return 5.5;
            case 8: return 6;
            default: return 6.5;
        }
    }
    function changeBoardWidth(event) {
        MCTS.stop();
        var size = parseInt(event.target.value);
        document.getElementById("widthValue").innerHTML = size;
        initBoard();
    }
    function changeBoardHeight(event) {
        MCTS.stop();
        var size = parseInt(event.target.value);
        document.getElementById("heightValue").innerHTML = size;
        initBoard();
    }
    function changeConnectNum(event) {
        MCTS.stop();
        var num = parseInt(event.target.value);
        document.getElementById("connectNumValue").innerHTML = num;
        initBoard();
    }
    function changeDifficulty(event) {
        MCTS.stop();
        var difficultyNum = parseInt(event.target.value);
        document.getElementById("difficultyValue").innerHTML = getDepthTarget(difficultyNum);
        initBoard();
    }
    function changeProcessingTime(event) {
        var time = parseInt(event.target.value);
        document.getElementById("processingTimeValue").innerHTML = time;
        AI_Player_Max_Wait = parseInt(time) * 1000;
        if ((board.gameState == 0 && AI_Player == 0) || (board.gameState == 1 && AI_Player == 1)) {
            textOutputSpan.innerHTML = "Change to Max Thinking Time will take effect on the next move.";
        }
    }
    function resetSliderValues() {
        difficultySlider.value = "6";
        document.getElementById("difficultyValue").innerHTML = getDepthTarget(parseInt(difficultySlider.value));
        widthSlider.value = "7";
        document.getElementById("widthValue").innerHTML = widthSlider.value;
        heightSlider.value = "6";
        document.getElementById("heightValue").innerHTML = heightSlider.value;
        processingTimeSlider.value = "10";
        document.getElementById("processingTimeValue").innerHTML = processingTimeSlider.value;
        connectNumSlider.value = "4";
        document.getElementById("connectNumValue").innerHTML = connectNumSlider.value;
    }
    function newGameBtnPressed() {
        MCTS.stop();
        if (newGameBtn.innerText == "Restore Defaults") {
            resetSliderValues();
        }
        initBoard();
    }
    function resizeCanvasAccordingToParentSize(aspectRatio) {
        var winWidth = divCanvas.clientWidth;
        var winHeight = Math.floor(getWindowHeight() * 0.95);
        if (divCanvas.className == "c4-fixed-height") {
            if (getWindowWidth() > 768) {
                winHeight = Math.min(divCanvas.clientHeight, winHeight);
            }
            else {
                winHeight = Math.min(winHeight, 500);
            }
        }
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
    function getWindowWidth() {
        if (typeof (window.innerWidth) == 'number') {
            return window.innerWidth;
        }
        else if (document.documentElement && document.documentElement.clientWidth) {
            return document.documentElement.clientWidth;
        }
        else if (document.body && document.body.clientWidth) {
            return document.body.clientWidth;
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
            y: mouseY - ((canvas.height / (Connect4Board.numRows + 1)) +
                ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2)
        };
    }
    function translateCanvas() {
        ctx.translate((canvas.width - boardWidth) / 2, (canvas.height / (Connect4Board.numRows + 1)) +
            ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2);
    }
    function makeMove(col) {
        columnOfFallingPiece = col;
        enableControls(false);
        MCTS.pauseAndProcessMove(columnOfFallingPiece);
        firstCallToAnimationLoop = true;
        currentYofFallingPiece = -holeSpacing / 2;
        animationRequestID = requestAnimationFrame(animateFallingPiece);
        lastDrawnColumnOfHoveringPiece = -1;
    }
    function processClick(event) {
        if ((board.gameState == 0 && AI_Player == 0) || (board.gameState == 1 && AI_Player == 1)) {
            return;
        }
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
            makeMove(columnOfFallingPiece);
        }
        textOutputSpan.innerHTML = "";
    }
    function processMouseMove(event) {
        if ((board.gameState == 0 && AI_Player == 0) || (board.gameState == 1 && AI_Player == 1)) {
            return;
        }
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
            if (col != lastDrawnColumnOfHoveringPiece) {
                drawSingleLoosePiece(col);
                lastDrawnColumnOfHoveringPiece = col;
            }
        }
    }
    var thinkingIndicated = false;
    var cutofftime;
    function playAIMove() {
        if ((board.gameState == 1 && AI_Player == 0) || (board.gameState == 0 && AI_Player == 1)) {
            var move = MCTS.getRecommendedMove();
            if (move != null) {
                makeMove(move);
            }
            else {
                console.log("when player asked computer to play for it, move could not be processed because MCTS could not recommend a move");
            }
            return;
        }
        if (MCTS.simulationState == 1) {
            if (!thinkingIndicated) {
                ctx.save();
                translateCanvas();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 30pt Calibri';
                ctx.fillStyle = "#777777";
                ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1);
                ctx.fillText("Thinking", canvas.width / 2, -holeSpacing / 2);
                ctx.restore();
                thinkingIndicated = true;
                cutofftime = Date.now() + AI_Player_Max_Wait;
            }
            if (Date.now() < cutofftime) {
                setTimeout(playAIMove, 250);
            }
            else {
                thinkingIndicated = false;
                textOutputSpan.innerHTML = "Max thinking time was reached.  Processing was about " + MCTS.getProcessingPct() + "% done.";
                makeMove(MCTS.getRecommendedMove());
            }
        }
        else {
            thinkingIndicated = false;
            textOutputSpan.innerHTML = "";
            makeMove(MCTS.getRecommendedMove());
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
                    if ((board.gameState == 0 && AI_Player == 0) || (board.gameState == 1 && AI_Player == 1)) {
                        setTimeout(function () { MCTS.resume(); playAIMove(); }, 5);
                    }
                    else {
                        if (unprocessedMouseMoveEvent) {
                            processMouseMove(unprocessedMouseMoveEvent);
                        }
                        else {
                            currentYofFallingPiece = -holeSpacing / 2;
                            drawSingleLoosePiece(columnOfFallingPiece);
                        }
                        setTimeout(function () { MCTS.resume(); }, 5);
                    }
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
        ctx.save();
        translateCanvas();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 30pt Calibri';
        ctx.fillStyle = "#777777";
        ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1);
        if ((AI_Player == 0 && board.gameState == 4) || (AI_Player == 1 && board.gameState == 3)) {
            ctx.fillText("You Win!", canvas.width / 2, -holeSpacing / 2);
        }
        else if ((AI_Player == 0 && board.gameState == 3) || (AI_Player == 1 && board.gameState == 4)) {
            ctx.fillText("You Lost", canvas.width / 2, -holeSpacing / 2);
        }
        else if (board.gameState == 5) {
            ctx.fillText("Draw", canvas.width / 2, -holeSpacing / 2);
        }
        ctx.restore();
        enableControls(true);
        textOutputSpan.innerHTML = "";
    }
})(Connect4BoardUI || (Connect4BoardUI = {}));
var Connect4Board = (function () {
    function Connect4Board(src, nextMove) {
        this.turnsCompleted = 0;
        this.gameState = 0;
        if (!src) {
            var i;
            (this.pieces = []).length = Connect4Board.numRows * Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numRows * Connect4Board.numCols; i++) {
                this.pieces[i] = -1;
            }
            (this.colHeight = []).length = Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numCols; i++) {
                this.colHeight[i] = 0;
            }
            this.updateAvailableMoves();
        }
        else {
            var i;
            (this.pieces = []).length = Connect4Board.numRows * Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numRows * Connect4Board.numCols; i++) {
                this.pieces[i] = src.pieces[i];
            }
            (this.colHeight = []).length = Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numCols; i++) {
                this.colHeight[i] = src.colHeight[i];
            }
            this.turnsCompleted = src.turnsCompleted;
            this.gameState = src.gameState;
            if (typeof nextMove === "undefined") {
                this.updateAvailableMoves();
            }
            else {
                this.makeMove(nextMove);
            }
        }
    }
    Connect4Board.prototype.getPieceAt = function (row, column) {
        return this.pieces[row * Connect4Board.numCols + column];
    };
    Connect4Board.prototype.makeMove = function (column) {
        this.pieces[this.colHeight[column] * Connect4Board.numCols + column] =
            (this.turnsCompleted % 2) ? 1 : 0;
        this.colHeight[column] += 1;
        this.turnsCompleted++;
        if (this.turnsCompleted >= Connect4Board.threshold * 2 - 1) {
            this.checkForThresholdInARow(column);
        }
        if ((this.gameState == 0 || this.gameState == 1) && (this.turnsCompleted == Connect4Board.numRows * Connect4Board.numCols)) {
            this.gameState = 5;
        }
        else if (this.gameState == 0) {
            this.gameState = 1;
        }
        else if (this.gameState == 1) {
            this.gameState = 0;
        }
        this.updateAvailableMoves();
    };
    Connect4Board.prototype.checkForThresholdInARow = function (column) {
        var connectionCount = 1;
        var row, col;
        var playerNum = (this.gameState == 0) ? 0 : 1;
        row = this.colHeight[column] - 2;
        while (row >= 0) {
            if (this.pieces[row * Connect4Board.numCols + column] == playerNum)
                connectionCount++;
            else
                break;
            row--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
        connectionCount = 1;
        row = this.colHeight[column] - 1;
        col = column + 1;
        while (col < Connect4Board.numCols) {
            if (this.pieces[row * Connect4Board.numCols + col] == playerNum)
                connectionCount++;
            else
                break;
            col++;
        }
        col = column - 1;
        while (col >= 0) {
            if (this.pieces[row * Connect4Board.numCols + col] == playerNum)
                connectionCount++;
            else
                break;
            col--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
        connectionCount = 1;
        row = this.colHeight[column] - 2;
        col = column + 1;
        while ((row >= 0) && (col < Connect4Board.numCols)) {
            if (this.pieces[row * Connect4Board.numCols + col] == playerNum)
                connectionCount++;
            else
                break;
            row--;
            col++;
        }
        row = this.colHeight[column];
        col = column - 1;
        while ((row < Connect4Board.numRows) && (col >= 0)) {
            if (this.pieces[row * Connect4Board.numCols + col] == playerNum)
                connectionCount++;
            else
                break;
            row++;
            col--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
        connectionCount = 1;
        row = this.colHeight[column] - 2;
        col = column - 1;
        while ((row >= 0) && (col >= 0)) {
            if (this.pieces[row * Connect4Board.numCols + col] == playerNum)
                connectionCount++;
            else
                break;
            row--;
            col--;
        }
        row = this.colHeight[column];
        col = column + 1;
        while ((row < Connect4Board.numRows) && (col < Connect4Board.numCols)) {
            if (this.pieces[row * Connect4Board.numCols + col] == playerNum)
                connectionCount++;
            else
                break;
            row++;
            col++;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
    };
    Connect4Board.prototype.updateAvailableMoves = function () {
        this.availableMoves = [];
        if (this.gameState == 0 || this.gameState == 1) {
            var col;
            for (col = 0; col < Connect4Board.numCols; col++) {
                if (this.colHeight[col] < Connect4Board.numRows)
                    this.availableMoves.push(col);
            }
        }
    };
    return Connect4Board;
}());
var MCTS;
(function (MCTS) {
    var rootNode;
    var startTime;
    var processingInterval = 25;
    var timeoutHandle;
    MCTS.maxNodes = 100000;
    var c_sub_p = 8;
    function start(board) {
        rootNode = new Node(new Connect4Board(board), null);
        MCTS.simulationState = 0;
        resume();
    }
    MCTS.start = start;
    function resume() {
        if (MCTS.simulationState != 2) {
            MCTS.simulationState = 1;
            execute();
        }
    }
    MCTS.resume = resume;
    function pause() {
        if (MCTS.simulationState != 2) {
            clearTimeout(timeoutHandle);
            MCTS.simulationState = 0;
        }
    }
    MCTS.pause = pause;
    function stop() {
        pause();
        MCTS.simulationState = 2;
        rootNode = null;
    }
    MCTS.stop = stop;
    function getRecommendedMove() {
        if (MCTS.simulationState != 2) {
            if (rootNode) {
                return rootNode.board.availableMoves[bestChildIndex(rootNode, 0)];
            }
            else {
                return null;
            }
        }
    }
    MCTS.getRecommendedMove = getRecommendedMove;
    function getProcessingPct() {
        if (MCTS.simulationState == 0) {
            return 100;
        }
        var pct = Math.floor(rootNode.numChildren * 100 / MCTS.maxNodes);
        if (pct == 100)
            return 99;
        return pct;
    }
    MCTS.getProcessingPct = getProcessingPct;
    function execute() {
        startTime = Date.now();
        var currNode;
        while ((Date.now() < startTime + processingInterval) &&
            (rootNode.numChildren < MCTS.maxNodes) &&
            (rootNode.timesVisted - rootNode.numChildren < MCTS.maxNodes * 10)) {
            currNode = getNodeToTest(rootNode);
            updateStats(currNode, simulate(currNode));
        }
        if ((rootNode.numChildren < MCTS.maxNodes) &&
            (rootNode.timesVisted - rootNode.numChildren < MCTS.maxNodes * 10)) {
            timeoutHandle = setTimeout(execute, 2);
        }
        else {
            pause();
        }
    }
    function pauseAndProcessMove(move) {
        pause();
        var index;
        for (index = 0; index < rootNode.board.availableMoves.length; index++) {
            if (rootNode.board.availableMoves[index] == move) {
                break;
            }
        }
        if (index < rootNode.board.availableMoves.length && typeof rootNode.child[index] !== "undefined") {
            rootNode = rootNode.child[index];
            rootNode.parent = null;
        }
        else {
            rootNode = new Node(new Connect4Board(rootNode.board, move), null);
        }
        if (rootNode.board.gameState != 0 && rootNode.board.gameState != 1) {
            stop();
        }
    }
    MCTS.pauseAndProcessMove = pauseAndProcessMove;
    function incrementNumChildren(firstParent) {
        while (firstParent) {
            firstParent.numChildren++;
            firstParent = firstParent.parent;
        }
    }
    function getNodeToTest(root) {
        var curr = root;
        var index;
        while (curr.board.availableMoves.length > 0) {
            for (index = 0; index < curr.board.availableMoves.length; index++) {
                if (!curr.child[index]) {
                    curr.child[index] = new Node(new Connect4Board(curr.board, curr.board.availableMoves[index]), curr);
                    incrementNumChildren(curr);
                    return curr.child[index];
                }
            }
            curr = curr.child[bestChildIndex(curr, c_sub_p)];
        }
        return curr;
    }
    var drawWeight = 0.5;
    function bestChildIndex(curr, cp) {
        var currChild;
        var maxIndex = 0;
        var maxValue = -Infinity;
        var currValue;
        for (var index = 0; index < curr.child.length; index++) {
            if (!(currChild = curr.child[index]))
                break;
            if (curr.board.gameState == 0) {
                currValue = (currChild.numP1Wins + currChild.numDraws * drawWeight) / currChild.timesVisted +
                    cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted);
            }
            else if (curr.board.gameState == 1) {
                currValue = (currChild.numP2Wins + currChild.numDraws * drawWeight) / currChild.timesVisted +
                    cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted);
            }
            if ((currValue > maxValue) || (currValue == maxValue && Math.random() < 0.5)) {
                maxValue = currValue;
                maxIndex = index;
            }
        }
        return maxIndex;
    }
    function simulate(node) {
        if (node.board.gameState == 0 || node.board.gameState == 1) {
            var board = new Connect4Board(node.board);
            var moveIndex;
            while (board.gameState == 0 || board.gameState == 1) {
                moveIndex = Math.floor(Math.random() * board.availableMoves.length);
                board.makeMove(board.availableMoves[moveIndex]);
            }
            return board.gameState;
        }
        else {
            return node.board.gameState;
        }
    }
    function updateStats(v, endState) {
        var curr = v;
        while (curr) {
            if (endState == 3) {
                curr.numP1Wins += 1;
            }
            else if (endState == 4) {
                curr.numP2Wins += 1;
            }
            else if (endState == 5) {
                curr.numDraws += 1;
            }
            curr.timesVisted += 1;
            curr = curr.parent;
        }
    }
    var Node = (function () {
        function Node(board, parent) {
            this.numP1Wins = 0;
            this.numP2Wins = 0;
            this.numDraws = 0;
            this.timesVisted = 0;
            this.numChildren = 0;
            this.board = board;
            this.parent = parent;
            (this.child = []).length = board.availableMoves.length;
        }
        return Node;
    }());
})(MCTS || (MCTS = {}));
//# sourceMappingURL=connect4.js.map