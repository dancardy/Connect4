//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
var debugSpan; //DELTE THIS WHEN DONE!      debugSpan.innerHTML = winWidth + " x " + winHeight;
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
window.onload = function () {
    Connect4BoardUI.init();
};
var Connect4BoardUI;
(function (Connect4BoardUI) {
    //variables that describe the game board
    var canvas;
    var divCanvas;
    var ctx;
    var scalePct = 0.97; //percentage of canvas that will be taken up by the board
    var holeDiameterPct = 0.85; //size of the holes on the board
    var boardWidth, boardHeight, holeSpacing, radius; //set dynamically as window is resized.
    var chipColors = ['red', 'yellow'];
    var board;
    //animation parameters
    var columnOfFallingPiece;
    var lastDrawnColumnOfHoveringPiece;
    var currentYofFallingPiece;
    var animationRequestID = null; //null when not animating
    var timeOfLastFrameDraw = 0;
    var firstCallToAnimationLoop = false;
    var unprocessedMouseMoveEvent = null;
    //Gameplay controls
    var AI_Player = 1; //0 is first player, 1 is second player.
    var AI_Player_Wait = 5000; //five seconds.
    //html Controls
    var pauseBtn;
    var widthSlider;
    var heightSlider;
    function init() {
        debugSpan = document.querySelector("#debugspan");
        pauseBtn = document.querySelector("#pauseBtn");
        pauseBtn.addEventListener('click', pauseBtnPressed);
        //above is temporary, below should be kept.
        canvas = document.querySelector("#connect4MainCanvas");
        ctx = canvas.getContext('2d');
        divCanvas = document.querySelector("#connect4MainCanvasDiv");
        canvas.addEventListener('click', processClick);
        canvas.addEventListener('mousemove', processMouseMove);
        widthSlider = document.querySelector("#BoardWidth");
        widthSlider.addEventListener('change', changeBoardWidth);
        heightSlider = document.querySelector("#BoardHeight");
        heightSlider.addEventListener('change', changeBoardHeight);
        window.addEventListener('resize', function () { resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1)); }, false);
        initBoard();
    }
    Connect4BoardUI.init = init;
    function initBoard() {
        Connect4Board.numRows = parseInt(document.getElementById("heightValue").innerHTML);
        Connect4Board.numCols = parseInt(document.getElementById("widthValue").innerHTML);
        Connect4Board.threshold = 4;
        AI_Player = 1;
        MCTS.maxNodes = 300000; //300000;//300k max
        //500 is easy
        //1000 is medium (you beat it)
        //50000 is hard
        //300000 is very hard. 300k is max
        //Player wait 5000 for hard; 2000 for all other levels.
        //need to scale these for different board sizes/widths; 5000 resulted in awful play on a 6x20. (it let you just make a tower and win in 4 moves).
        //need to remember if player wait should wait for nodes (doesn't make sense since will run out of nodes at end of game'), or just time;
        //should wait less time if are already at max nodes
        //review nodes and timing more.
        board = new Connect4Board();
        MCTS.start(board);
        resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1));
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
    //since dropping a piece resumes, the button label is not currently kept up-to-date at all times. (fine because not sure if will be in final controls);
    function pauseBtnPressed() {
        switch (MCTS.simulationState) {
            case 0 /* Paused */:
                pauseBtn.innerText = "Pause";
                MCTS.resume();
                break;
            case 1 /* Running */:
                pauseBtn.innerText = "Resume";
                MCTS.pause();
                break;
            case 2 /* Stopped */:
                pauseBtn.innerText = "-----";
                break;
        }
        //playAIMove();
    }
    //resizes the canvas so it fits in the window vertically and within its parent div horizontally, maintianing aspectRatio
    function resizeCanvasAccordingToParentSize(aspectRatio) {
        var winWidth = divCanvas.clientWidth;
        var winHeight = Math.floor(getWindowHeight() * 0.95); //set initial height to viewport
        if (divCanvas.style.height.length > 0) {
            //if height is set by __inline__ CSS, let that height control instead of the window's height
            //Note: this only makes sense where the inline CSS specifies an absolute height (eg. 500px), not a relative height.
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
            return window.innerHeight; //this should be the return for nearly all browsers.
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
        var mouseX = event.clientX - canvas.getBoundingClientRect().left; //mouseX&Y is now position over canvas.
        var mouseY = event.clientY - canvas.getBoundingClientRect().top;
        return {
            x: mouseX - (canvas.width - boardWidth) / 2,
            y: mouseY - ((canvas.height / (Connect4Board.numRows + 1)) + ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2)
        };
    }
    //leaves canvas height/(numRows+1) at top of convas, and then centers the range between boardwidth/height and canvas width/height within the remaining space.
    //Result is that (0,0) is at top left corner of where want to draw board. 
    function translateCanvas() {
        ctx.translate((canvas.width - boardWidth) / 2, (canvas.height / (Connect4Board.numRows + 1)) + ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2);
    }
    function makeMove(col) {
        columnOfFallingPiece = col;
        MCTS.pauseAndProcessMove(columnOfFallingPiece);
        //Begin Animation!
        firstCallToAnimationLoop = true;
        currentYofFallingPiece = -holeSpacing / 2;
        animationRequestID = requestAnimationFrame(animateFallingPiece);
        lastDrawnColumnOfHoveringPiece = -1; //doesn't match any column, so forces conclusion that we are in new column (and need to redraw) on next mouse move.
    }
    function processClick(event) {
        if ((board.gameState == 0 /* Player1sTurn */ && AI_Player == 0) || (board.gameState == 1 /* Player2sTurn */ && AI_Player == 1)) {
            return; //don't handle a click if it is the AI's turn.
        }
        if (animationRequestID) {
            return; //don't handle another click while still animating last one
        }
        if (board.gameState != 0 /* Player1sTurn */ && board.gameState != 1 /* Player2sTurn */) {
            return; //do nothing if game is over.
        }
        var mousePos = translateMouseCoordinates(event);
        if ((mousePos.y > 0) || (mousePos.x < 0) || (mousePos.x > holeSpacing * Connect4Board.numCols))
            return; //clicks on board or beside board don't do anything.
        columnOfFallingPiece = Math.floor(mousePos.x / holeSpacing);
        if (board.colHeight[columnOfFallingPiece] < Connect4Board.numRows) {
            makeMove(columnOfFallingPiece);
        }
    }
    function processMouseMove(event) {
        if ((board.gameState == 0 /* Player1sTurn */ && AI_Player == 0) || (board.gameState == 1 /* Player2sTurn */ && AI_Player == 1)) {
            return; //don't draw mouse hover if it is the AI's turn.
        }
        if (animationRequestID) {
            unprocessedMouseMoveEvent = event;
            return; //don't handle a new mouse move while still animating last mouse click
        }
        unprocessedMouseMoveEvent = null;
        if (board.gameState != 0 /* Player1sTurn */ && board.gameState != 1 /* Player2sTurn */) {
            return; //do nothing if game is over.
        }
        var mousePos = translateMouseCoordinates(event);
        if ((mousePos.y < 0) && (mousePos.x >= 0) && (mousePos.x <= holeSpacing * Connect4Board.numCols)) {
            //mouse is above the game board
            currentYofFallingPiece = -holeSpacing / 2;
            var col = Math.floor(mousePos.x / holeSpacing);
            if (col != lastDrawnColumnOfHoveringPiece) {
                drawSingleLoosePiece(col);
                lastDrawnColumnOfHoveringPiece = col;
            }
        }
    }
    //if there is no delay, it will crash because rootNode becomes undefined<<< go back and add appropriate error checking.!
    var playAIMoveCalledBefore = false;
    //var countdown: number;
    function playAIMove() {
        //if player asks the computer to play for it
        if ((board.gameState == 1 /* Player2sTurn */ && AI_Player == 0) || (board.gameState == 0 /* Player1sTurn */ && AI_Player == 1)) {
            makeMove(MCTS.getRecommendedMove());
            return;
        }
        if (playAIMoveCalledBefore == false) {
            playAIMoveCalledBefore = true;
            if (AI_Player_Wait > 2000) {
                ctx.save();
                translateCanvas();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 40pt Calibri';
                ctx.fillStyle = "#777777";
                ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1); //clear area above board
                ctx.fillText("Thinking", canvas.width / 2, -holeSpacing / 2);
                ctx.restore();
            }
            setTimeout(playAIMove, AI_Player_Wait);
        }
        else {
            playAIMoveCalledBefore = false;
            makeMove(MCTS.getRecommendedMove());
        }
    }
    //draws single loose piece at the height set by currentYofFallingPiece
    function drawSingleLoosePiece(column) {
        ctx.save();
        translateCanvas();
        ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1); //clear area above board
        if (currentYofFallingPiece == -holeSpacing / 2) {
            //make sure don't write over the board area (which may occur because shadows exceed size of the piece being drawn)
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
        var yDropTime = 400; //time in ms it takes to traverse the board
        var yIncrement = (firstCallToAnimationLoop) ? 0 : boardHeight * timeSinceLastFrameDraw / yDropTime;
        currentYofFallingPiece += yIncrement;
        // call again to draw next frame
        if (currentYofFallingPiece < finalY) {
            //draw falling gamepiece.
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
                if (board.gameState == 0 /* Player1sTurn */ || board.gameState == 1 /* Player2sTurn */) {
                    //now that animation is finished, prepare for next move
                    if ((board.gameState == 0 /* Player1sTurn */ && AI_Player == 0) || (board.gameState == 1 /* Player2sTurn */ && AI_Player == 1)) {
                        playAIMove();
                    }
                    else {
                        if (unprocessedMouseMoveEvent) {
                            processMouseMove(unprocessedMouseMoveEvent);
                        }
                        else {
                            currentYofFallingPiece = -holeSpacing / 2;
                            drawSingleLoosePiece(columnOfFallingPiece);
                        }
                    }
                    //restart MCTS solver, which was paused during animation; 
                    //the 5 ms delay and the use of an anonymous function required to avoid stutter in the piece drop animation in some browsers. 
                    setTimeout(function () { MCTS.resume(); }, 5);
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
        var firstX = holeSpacing / 2; //coordinates of first hole.
        var firstY = boardHeight - holeSpacing / 2;
        ctx.save();
        setShadow();
        //Draw each game piece that has already been played
        var row, col;
        for (row = 0; row < Connect4Board.numRows; row++) {
            for (col = 0; col < Connect4Board.numCols; col++) {
                if (board.getPieceAt(row, col) != -1 /* Empty */) {
                    ctx.beginPath();
                    ctx.moveTo(firstX + col * holeSpacing + radius, firstY - row * holeSpacing / 2);
                    ctx.arc(firstX + col * holeSpacing, firstY - row * holeSpacing, radius, 0, Math.PI * 2, false);
                    ctx.fillStyle = chipColors[board.getPieceAt(row, col)];
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
        //trace shape of the blue overlay game board
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
        ctx.restore(); //no more shadows
        //draw outline of the board
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
        if (board.gameState == 3 /* Player1Wins */)
            alert('connect4! by Player 1 - end of game handling not yet written');
        else if (board.gameState == 4 /* Player2Wins */)
            alert('connect4! by Player 2 - end of game handling not yet written');
        else if (board.gameState == 5 /* Draw */)
            alert('draw - end of game handling not yet written');
        else
            alert('processEndOfGame called, but board.gamestate does not match.');
    }
})(Connect4BoardUI || (Connect4BoardUI = {}));
//Todos
//limit the text size of the "Thinking" display.
//<!--Board Width; Board Height; <-- alter the event handlers so they only resize on mouseup/final choice made.
//limit widths and heights so that animations will still work cleanly, text shows up clearly, etc.  (20 is too much!).
//Difficulty Level; Player 1 or Player2; Spit Out Some Stats. -->
//--process beginning of game when play1 is the AI instead of player 2.
//-- process end of game as part of UI as well.
//todo idea: save (using the html5 cookies equivalents) your last settings, game success/failure history, etc.
//writeup all features (resizable board), resolution independent, animations work at constant drop rate, regardless of framerate that client is capable of providing.
//interactive controls: http://jsbin.com/fatube/edit?html,output
//http://jsbin.com/qigoro/edit?html,js,output
//android radio buttons with input type =range; 0-1; step 1. (not sure if the step will work, but if not, can force on the js).
//details, including how to style w/ css to get desired look: Week 5: HTML5 Forms > 5.4 New input types > &lt;input type="range"&gt;
//https://courses.edx.org/courses/course-v1:W3Cx+HTML5.1x+4T2015/courseware/36a27299952f4ecf87066b10a1928bb5/66d1519efebf474f9e44a38f27c87070/
//<input id="range" name="range" type="range" min="0" max="100" step="5"/>
//per 6.4, use local storage to save default skill levels, etc.
var Connect4Board = (function () {
    function Connect4Board(src, nextMove) {
        this.turnsCompleted = 0;
        this.gameState = 0 /* Player1sTurn */;
        if (!src) {
            var i;
            (this.pieces = []).length = Connect4Board.numRows * Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numRows * Connect4Board.numCols; i++) {
                this.pieces[i] = -1 /* Empty */;
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
                this.makeMove(nextMove); //makeMove will update availableMoves.
            }
        }
    }
    Connect4Board.prototype.getPieceAt = function (row, column) {
        return this.pieces[row * Connect4Board.numCols + column];
    };
    Connect4Board.prototype.makeMove = function (column) {
        //this.colHeigh[column] is to row where the piece will be
        this.pieces[this.colHeight[column] * Connect4Board.numCols + column] = (this.turnsCompleted % 2) ? 1 /* Player2 */ : 0 /* Player1 */;
        this.colHeight[column] += 1;
        this.turnsCompleted++;
        if (this.turnsCompleted >= Connect4Board.threshold * 2 - 1) {
            this.checkForThresholdInARow(column); //will change this.gameState if game has been won.
        }
        if ((this.gameState == 0 /* Player1sTurn */ || this.gameState == 1 /* Player2sTurn */) && (this.turnsCompleted == Connect4Board.numRows * Connect4Board.numCols)) {
            this.gameState = 5 /* Draw */;
        }
        else if (this.gameState == 0 /* Player1sTurn */) {
            this.gameState = 1 /* Player2sTurn */;
        }
        else if (this.gameState == 1 /* Player2sTurn */) {
            this.gameState = 0 /* Player1sTurn */;
        }
        this.updateAvailableMoves();
    };
    Connect4Board.prototype.checkForThresholdInARow = function (column) {
        var connectionCount = 1; //the just-played piece counts towards the threshold
        var row, col;
        var playerNum = (this.gameState == 0 /* Player1sTurn */) ? 0 /* Player1 */ : 1 /* Player2 */;
        //look for a vertical connection
        row = this.colHeight[column] - 2; //-1 gets row of current piece; -2 is one row below current piece 
        while (row >= 0) {
            if (this.pieces[row * Connect4Board.numCols + column] == playerNum)
                connectionCount++;
            else
                break;
            row--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == 0 /* Player1sTurn */) ? 3 /* Player1Wins */ : 4 /* Player2Wins */;
            return;
        }
        //look for a horizontal connection
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
            this.gameState = (this.gameState == 0 /* Player1sTurn */) ? 3 /* Player1Wins */ : 4 /* Player2Wins */;
            return;
        }
        //look for a diagonal connection in first direction (\).
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
            this.gameState = (this.gameState == 0 /* Player1sTurn */) ? 3 /* Player1Wins */ : 4 /* Player2Wins */;
            return;
        }
        //look for a diagonal connection in second direction (/).
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
            this.gameState = (this.gameState == 0 /* Player1sTurn */) ? 3 /* Player1Wins */ : 4 /* Player2Wins */;
            return;
        }
    };
    Connect4Board.prototype.updateAvailableMoves = function () {
        this.availableMoves = [];
        if (this.gameState == 0 /* Player1sTurn */ || this.gameState == 1 /* Player2sTurn */) {
            var col;
            for (col = 0; col < Connect4Board.numCols; col++) {
                if (this.colHeight[col] < Connect4Board.numRows)
                    this.availableMoves.push(col);
            }
        }
    };
    return Connect4Board;
}());
/*
This file implements a Monte Carlo Tree Search.  The Upper Confidence Bounds for Trees (UCT) algorithm is used
to expand the tree in a way that balances the breadth and depth of the search appropriately. (The entire tree
that represents all possible sequence of game moves may never be constructed, but the tree is expanded such that
the chance of selecting a move that one would not have selected if the whole tree had been constructed decreases
with each expansion of the tree).

**re-read paper and confirm this is the right way to say this** Perhaps "keeps the tree within a constact factor of the best possible bound on the growth of regret.)

Each node in the tree represents a state of the game board.  Each child vertex represents a possible next move.
The value associated with each move that is calculated by the monte carlo simulations is negated at each subsequent level of the
tree (consistent with negamax-style algoithms) to reflect that the best results for player one are the worst results for player two.
*/
//be sure to implement optimizations, like not exploring beyond your own winning move..
var MCTS;
(function (MCTS) {
    var rootNode;
    var currNode;
    var startTime;
    var processingInterval = 25; //how long execute() runs before ceding control to anything that's queued up and need to run
    var timeoutHandle;
    var playout_counter = 0; //debug only
    var gameStartTime; //stats only
    MCTS.maxNodes = 100000;
    function start(board) {
        rootNode = new Node(new Connect4Board(board), null);
        MCTS.simulationState = 0 /* Paused */;
        resume();
    }
    MCTS.start = start;
    function resume() {
        if (MCTS.simulationState != 2 /* Stopped */) {
            MCTS.simulationState = 1 /* Running */;
            gameStartTime = Date.now();
            playout_counter = 0;
            execute();
        }
    }
    MCTS.resume = resume;
    function pause() {
        if (MCTS.simulationState != 2 /* Stopped */) {
            clearTimeout(timeoutHandle); // keeps MCTS_execute from being called again.
            MCTS.simulationState = 0 /* Paused */;
        }
    }
    MCTS.pause = pause;
    function stop() {
        pause();
        MCTS.simulationState = 2 /* Stopped */;
        rootNode = null; //do want this, just need to make sure no calls to execute have built up first (is causing crash when execute gets subsequently called)
        currNode = null;
    }
    MCTS.stop = stop;
    function getRecommendedMove() {
        if (MCTS.simulationState != 2 /* Stopped */) {
            return rootNode.board.availableMoves[bestChildIndex(rootNode, 0)];
        }
    }
    MCTS.getRecommendedMove = getRecommendedMove;
    function execute() {
        if (MCTS.simulationState != 1 /* Running */) {
            console.log('execute called while not running');
            return;
        }
        startTime = Date.now();
        while (Date.now() < startTime + processingInterval && rootNode.numChildren < MCTS.maxNodes) {
            playout_counter++;
            currNode = getNodeToTest(rootNode);
            updateStats(currNode, simulate(currNode));
        }
        debugSpan.innerHTML = "playouts*1000/second: " + Math.floor(playout_counter / ((Date.now() - gameStartTime))) + '<br>  processing time Limit: ' + processingInterval;
        debugSpan.innerHTML += '<br>playouts (M):' + Math.floor(playout_counter / 1000000);
        debugSpan.innerHTML += '<br>numberOfNodes: ' + rootNode.numChildren + '  repeat visits: ' + (rootNode.timesVisted - rootNode.numChildren);
        debugSpan.innerHTML += '<br>rootnode P1 win ratio: ' + rootNode.numP1Wins + " / " + rootNode.timesVisted + " currentPlayer: ";
        if (rootNode.board.gameState == 0 /* Player1sTurn */)
            debugSpan.innerHTML += "1";
        else if (rootNode.board.gameState == 1 /* Player2sTurn */)
            debugSpan.innerHTML += "2";
        else
            debugSpan.innerHTML += "game over";
        debugSpan.innerHTML += "<br> Move to make:" + getRecommendedMove();
        for (var i = 0; i < rootNode.board.availableMoves.length; i++) {
            if (rootNode.child[i]) {
                if (rootNode.board.gameState == 0 /* Player1sTurn */) {
                    debugSpan.innerHTML += "<br>" + Math.round(100 * rootNode.child[i].timesVisted / rootNode.timesVisted) + " | " + Math.round((rootNode.child[i].numP1Wins + drawWeight * rootNode.child[i].numDraws) * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + Math.round(rootNode.child[i].numP1Wins + drawWeight * rootNode.child[i].numDraws) + " / " + rootNode.child[i].timesVisted;
                    debugSpan.innerHTML += "   |   " + Math.round(rootNode.child[i].numP1Wins * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + rootNode.child[i].numP1Wins + " / " + rootNode.child[i].timesVisted;
                }
                else if (rootNode.board.gameState == 1 /* Player2sTurn */) {
                    debugSpan.innerHTML += "<br>" + Math.round(100 * rootNode.child[i].timesVisted / rootNode.timesVisted) + " | " + Math.round((rootNode.child[i].numP2Wins + drawWeight * rootNode.child[i].numDraws) * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + Math.round(rootNode.child[i].numP2Wins + drawWeight * rootNode.child[i].numDraws) + " / " + rootNode.child[i].timesVisted;
                    debugSpan.innerHTML += "   |   " + Math.round(rootNode.child[i].numP2Wins * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + rootNode.child[i].numP2Wins + " / " + rootNode.child[i].timesVisted;
                }
                else {
                    console.log('gamestate not as expected in MCTS debug printout code');
                }
            }
            else {
                debugSpan.innerHTML += "<br>--% = child not created";
            }
        }
        //
        if (rootNode.numChildren < MCTS.maxNodes) {
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
            //child node hasn't been created yet, so we are essentially starting again from scratch.
            rootNode = new Node(new Connect4Board(rootNode.board, move), null);
        }
        if (rootNode.board.gameState != 0 /* Player1sTurn */ && rootNode.board.gameState != 1 /* Player2sTurn */) {
            stop();
        }
        //note: simulation state remains paused at end of this function (done so execute won't interfere with animation of the move); a call to resume is necessary, and is made at the end of the UI's animation of the move.
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
                    //if a child that can exist doesn't yet exist, we create the child and return it to be tested.
                    curr.child[index] = new Node(new Connect4Board(curr.board, curr.board.availableMoves[index]), curr);
                    incrementNumChildren(curr);
                    return curr.child[index];
                }
            }
            //if reach here, all children of curr exist, so now we want to descend down the tree; bestChild selects the route.
            curr = curr.child[bestChildIndex(curr, c_sub_p)];
        }
        return curr; //we have reached a terminal state (no moves are available), so this position will be "tested"
    }
    var drawWeight = 0.5; //Value between 1 (same as a win) and 0 (same as a loss) of a draw
    function bestChildIndex(curr, cp) {
        var currChild;
        var maxIndex = 0;
        var maxValue = -Infinity;
        var currValue;
        for (var index = 0; index < curr.child.length; index++) {
            if (!(currChild = curr.child[index]))
                break; //change to continue if children can be incomplete, but created out of order (not the case now).
            //note: Javascript makes division by zero = infinity, so the line below works correctly even if currChild.timesVisited is zero.
            //first term must be in [0,1]
            if (curr.board.gameState == 0 /* Player1sTurn */) {
                currValue = (currChild.numP1Wins + currChild.numDraws * drawWeight) / currChild.timesVisted + cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted); // consider pulling out the *2.
            }
            else if (curr.board.gameState == 1 /* Player2sTurn */) {
                currValue = (currChild.numP2Wins + currChild.numDraws * drawWeight) / currChild.timesVisted + cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted);
            }
            else {
                alert('error -- bestchild is looking for children of board that is in a terminal state!  This code should be unreachable'); //eliminate this from final code.
            }
            if ((currValue > maxValue) || (currValue == maxValue && Math.random() < 0.5)) {
                maxValue = currValue;
                maxIndex = index;
            }
        }
        return maxIndex;
    }
    //returns a GameState based on random game play if node represents an in-progress game; else return resolution of game
    function simulate(node) {
        if (node.board.gameState == 0 /* Player1sTurn */ || node.board.gameState == 1 /* Player2sTurn */) {
            var board = new Connect4Board(node.board);
            var moveIndex;
            while (board.gameState == 0 /* Player1sTurn */ || board.gameState == 1 /* Player2sTurn */) {
                moveIndex = Math.floor(Math.random() * board.availableMoves.length); //move randomly.
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
            if (endState == 3 /* Player1Wins */) {
                curr.numP1Wins += 1;
            }
            else if (endState == 4 /* Player2Wins */) {
                curr.numP2Wins += 1;
            }
            else if (endState == 5 /* Draw */) {
                curr.numDraws += 1;
            }
            else {
                console.log('in MCTS.updateStats -- reached code that never should have been reached');
            }
            curr.timesVisted += 1;
            curr = curr.parent;
        }
    }
    var c_sub_p = 8; //Math.SQRT1_2; //0.01 // Cp must be >0 for there to be exploration (0 is just always choosing the currently most promising node).
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