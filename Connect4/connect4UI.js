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
        textOutputSpan = document.querySelector("#textOutputSpan");
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
        window.addEventListener('resize', function () { resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1)); }, false);
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
    function newGameBtnPressed() {
        MCTS.stop();
        if (newGameBtn.innerText == "Restore Defaults") {
            MCTS.stop();
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
        initBoard();
    }
    function resizeCanvasAccordingToParentSize(aspectRatio) {
        var winWidth = divCanvas.clientWidth;
        var winHeight = Math.floor(getWindowHeight() * 0.95);
        if (divCanvas.style.height.length > 0) {
            winHeight = divCanvas.clientHeight;
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
        else {
            console.log('processEndOfGame called, but board.gamestate does not match.');
        }
        ctx.restore();
        enableControls(true);
        textOutputSpan.innerHTML = "";
    }
})(Connect4BoardUI || (Connect4BoardUI = {}));
