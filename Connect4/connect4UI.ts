﻿//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
var debugSpan: HTMLSpanElement;//DELTE THIS WHEN DONE!      debugSpan.innerHTML = winWidth + " x " + winHeight;

//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------


window.onload = () => {
    Connect4BoardUI.init();
}; 

module Connect4BoardUI {
    //variables that describe the game board
    var canvas: HTMLCanvasElement;
    var divCanvas: HTMLDivElement;
    var ctx: CanvasRenderingContext2D;
    var scalePct: number = 0.97; //percentage of canvas that will be taken up by the board
    var holeDiameterPct: number = 0.85; //size of the holes on the board
    var boardWidth: number, boardHeight: number, holeSpacing: number, radius: number; //set dynamically as window is resized.
    var chipColors: string[] = ['red', 'yellow'];
    var board: Connect4Board;

    //animation parameters
    var columnOfFallingPiece: number;
    var lastDrawnColumnOfHoveringPiece: number;
    var currentYofFallingPiece: number;
    var animationRequestID: number = null; //null when not animating
    var timeOfLastFrameDraw: number = 0;
    var firstCallToAnimationLoop: boolean = false;
    var unprocessedMouseMoveEvent: MouseEvent = null;
    
    //Gameplay controls
    var AI_Player: number = 1; //0 is first player, 1 is second player.
    var AI_Player_Wait: number = 5000; //five seconds.

    //html Controls
    var pauseBtn: HTMLButtonElement;
    var widthSlider: HTMLInputElement;
    var heightSlider: HTMLInputElement;

    export function init(): void {
        debugSpan = <HTMLSpanElement>document.querySelector("#debugspan");
        pauseBtn = <HTMLButtonElement>document.querySelector("#pauseBtn");
        pauseBtn.addEventListener('click', pauseBtnPressed);

        //above is temporary, below should be kept.

        canvas = <HTMLCanvasElement>document.querySelector("#connect4MainCanvas");
        ctx = canvas.getContext('2d');
        divCanvas = <HTMLDivElement>document.querySelector("#connect4MainCanvasDiv");

        canvas.addEventListener('click', processClick);
        canvas.addEventListener('mousemove', processMouseMove);
       
        widthSlider = <HTMLInputElement>document.querySelector("#BoardWidth");
        widthSlider.addEventListener('change', changeBoardWidth);

        heightSlider = <HTMLInputElement>document.querySelector("#BoardHeight");
        heightSlider.addEventListener('change', changeBoardHeight);

        window.addEventListener('resize', function () { resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1)) }, false);
        initBoard();
    }

    function initBoard(): void {
        Connect4Board.numRows = parseInt(document.getElementById("heightValue").innerHTML);
        Connect4Board.numCols = parseInt(document.getElementById("widthValue").innerHTML);
        Connect4Board.threshold = 4;
        AI_Player = 1;
        MCTS.maxNodes = 300000;//300000;//300k max
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

    function changeBoardWidth(event: any): void {
        MCTS.stop();
        var size: any = parseInt(event.target.value);
        document.getElementById("widthValue").innerHTML = size;
        initBoard();
    }

    function changeBoardHeight(event: any): void {
        MCTS.stop();
        var size: any = parseInt(event.target.value);
        document.getElementById("heightValue").innerHTML = size;
        initBoard();
    }

    //since dropping a piece resumes, the button label is not currently kept up-to-date at all times. (fine because not sure if will be in final controls);
    function pauseBtnPressed():void {
        switch (MCTS.simulationState) {
            case MCTS.States.Paused:
                pauseBtn.innerText = "Pause";
                MCTS.resume();
                break;
            case MCTS.States.Running:
                pauseBtn.innerText = "Resume";
                MCTS.pause();
                break;
            case MCTS.States.Stopped:
                pauseBtn.innerText = "-----";
                break;
        }
        
        //playAIMove();
    }

    //resizes the canvas so it fits in the window vertically and within its parent div horizontally, maintianing aspectRatio
    function resizeCanvasAccordingToParentSize(aspectRatio: number): void {
        var winWidth: number = divCanvas.clientWidth;
        var winHeight: number = Math.floor(getWindowHeight() * 0.95); //set initial height to viewport
        if (divCanvas.style.height.length > 0) {
            //if height is set by __inline__ CSS, let that height control instead of the window's height
            //Note: this only makes sense where the inline CSS specifies an absolute height (eg. 500px), not a relative height.
            winHeight = divCanvas.clientHeight;
        }
                

        if ((winHeight > 0) && (winWidth / winHeight > aspectRatio)) { //if limiting dimension is height
            canvas.width = Math.floor(winHeight * aspectRatio);
            canvas.height = winHeight;
        } else {
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

    function getWindowHeight(): number {
        if (typeof (window.innerWidth) == 'number') {
            return window.innerHeight; //this should be the return for nearly all browsers.
        } else if (document.documentElement && document.documentElement.clientHeight) {
            return document.documentElement.clientHeight;
        } else if (document.body && document.body.clientHeight) {
            return document.body.clientHeight;
        } else {
            return -1
        }
    }


    function translateMouseCoordinates(event: MouseEvent): { x: number, y: number } {
        var mouseX: number = event.clientX - canvas.getBoundingClientRect().left; //mouseX&Y is now position over canvas.
        var mouseY: number = event.clientY - canvas.getBoundingClientRect().top;
        return { //below translates to coordinates where 0,0 is top left corner of the board
            x: mouseX - (canvas.width - boardWidth) / 2,
            y: mouseY - ((canvas.height / (Connect4Board.numRows + 1)) + ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2)
        };
    }

    //leaves canvas height/(numRows+1) at top of convas, and then centers the range between boardwidth/height and canvas width/height within the remaining space.
    //Result is that (0,0) is at top left corner of where want to draw board. 
    function translateCanvas(): void {
        ctx.translate((canvas.width - boardWidth) / 2, (canvas.height / (Connect4Board.numRows + 1)) + ((canvas.height - canvas.height / (Connect4Board.numRows + 1)) - boardHeight) / 2);
    }

    function makeMove(col: number): void {
        columnOfFallingPiece = col;
        MCTS.pauseAndProcessMove(columnOfFallingPiece);
            
        //Begin Animation!
        firstCallToAnimationLoop = true;
        currentYofFallingPiece = -holeSpacing / 2;
        animationRequestID = requestAnimationFrame(animateFallingPiece);
        lastDrawnColumnOfHoveringPiece = -1; //doesn't match any column, so forces conclusion that we are in new column (and need to redraw) on next mouse move.
    }

    function processClick(event: MouseEvent): void {
        if ((board.gameState == GameStates.Player1sTurn && AI_Player == 0) || (board.gameState == GameStates.Player2sTurn && AI_Player == 1)) {
            return; //don't handle a click if it is the AI's turn.
        }
        if (animationRequestID) {
            return; //don't handle another click while still animating last one
        }
        if (board.gameState != GameStates.Player1sTurn && board.gameState != GameStates.Player2sTurn) {
            return; //do nothing if game is over.
        }

        var mousePos: { x: number, y: number } = translateMouseCoordinates(event);
        if ((mousePos.y > 0) || (mousePos.x < 0) || (mousePos.x > holeSpacing * Connect4Board.numCols)) return; //clicks on board or beside board don't do anything.

        columnOfFallingPiece = Math.floor(mousePos.x / holeSpacing);

        if (board.colHeight[columnOfFallingPiece] < Connect4Board.numRows) {
            makeMove(columnOfFallingPiece);
        }
    }

    function processMouseMove(event: MouseEvent): void {
        if ((board.gameState == GameStates.Player1sTurn && AI_Player == 0) || (board.gameState == GameStates.Player2sTurn && AI_Player == 1)) {
            return; //don't draw mouse hover if it is the AI's turn.
        }
        if (animationRequestID) {
            unprocessedMouseMoveEvent = event;
            return; //don't handle a new mouse move while still animating last mouse click
        }
        unprocessedMouseMoveEvent = null;

        if (board.gameState != GameStates.Player1sTurn && board.gameState != GameStates.Player2sTurn) {
            return; //do nothing if game is over.
        }

        var mousePos: { x: number, y: number } = translateMouseCoordinates(event);
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
    var playAIMoveCalledBefore: boolean = false;
    //var countdown: number;
    function playAIMove(): void {
        //if player asks the computer to play for it
        if ((board.gameState == GameStates.Player2sTurn && AI_Player == 0) || (board.gameState == GameStates.Player1sTurn && AI_Player == 1)) {
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
                ctx.fillStyle = "#777777"
                ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1); //clear area above board
                ctx.fillText("Thinking", canvas.width / 2, -holeSpacing / 2);
                ctx.restore();
            }
            setTimeout(playAIMove, AI_Player_Wait);
        } else {
            playAIMoveCalledBefore = false;
            makeMove(MCTS.getRecommendedMove());
        }
    }

    //draws single loose piece at the height set by currentYofFallingPiece
    function drawSingleLoosePiece(column: number): void {
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
        var xCoordinate: number = holeSpacing / 2 + column * holeSpacing;
        ctx.fillStyle = chipColors[board.turnsCompleted % 2];
        ctx.beginPath();
        ctx.moveTo(xCoordinate + radius, currentYofFallingPiece);
        ctx.arc(xCoordinate, currentYofFallingPiece, radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function setShadow(): void {
        if (holeSpacing > 40) {
            ctx.shadowColor = 'black';
            ctx.shadowBlur = boardWidth * 0.009;
            ctx.shadowOffsetX = boardWidth * 0.004;
            ctx.shadowOffsetY = boardWidth * 0.004;
        }
    }


    function animateFallingPiece(timestamp: number): void {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var finalY: number = boardHeight - holeSpacing / 2 - board.colHeight[columnOfFallingPiece] * holeSpacing;

        var timeSinceLastFrameDraw: number = timestamp - timeOfLastFrameDraw;
        timeOfLastFrameDraw = timestamp;

        var yDropTime: number = 400; //time in ms it takes to traverse the board
        var yIncrement: number = (firstCallToAnimationLoop) ? 0 : boardHeight * timeSinceLastFrameDraw / yDropTime;
        currentYofFallingPiece += yIncrement;
    
        // call again to draw next frame
        if (currentYofFallingPiece < finalY) {
            //draw falling gamepiece.
            drawSingleLoosePiece(columnOfFallingPiece);

            drawBoard();
        
            firstCallToAnimationLoop = false;
            animationRequestID = requestAnimationFrame(animateFallingPiece);
        } else {
            if (animationRequestID) {
                cancelAnimationFrame(animationRequestID);
                animationRequestID = null;

                board.makeMove(columnOfFallingPiece);

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBoard();
                
                if (board.gameState == GameStates.Player1sTurn || board.gameState == GameStates.Player2sTurn) {
                    //now that animation is finished, prepare for next move
                    if ((board.gameState == GameStates.Player1sTurn && AI_Player == 0) || (board.gameState == GameStates.Player2sTurn && AI_Player == 1)) {
                        playAIMove();
                    } else { //show new piece ready to drop for human players
                        if (unprocessedMouseMoveEvent) {
                            processMouseMove(unprocessedMouseMoveEvent);
                        } else {
                            currentYofFallingPiece = -holeSpacing / 2;
                            drawSingleLoosePiece(columnOfFallingPiece);
                        }
                    }
                    //restart MCTS solver, which was paused during animation; 
                    //the 5 ms delay and the use of an anonymous function required to avoid stutter in the piece drop animation in some browsers. 
                    setTimeout(function () { MCTS.resume();},5);
                } else {
                    processEndOfGame();
                }
            }
        }
    }


    function drawBoard(): void {
        ctx.save();
        translateCanvas();

        var firstX: number = holeSpacing / 2; //coordinates of first hole.
        var firstY: number = boardHeight - holeSpacing / 2;

        ctx.save();
        setShadow();

        //Draw each game piece that has already been played
        var row: number, col: number;
        for (row = 0; row < Connect4Board.numRows; row++) {
            for (col = 0; col < Connect4Board.numCols; col++) {
                if (board.getPieceAt(row,col) != Space.Empty) {
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


    function processEndOfGame(): void {
        if (board.gameState == GameStates.Player1Wins)
            alert('connect4! by Player 1 - end of game handling not yet written');
        else if (board.gameState == GameStates.Player2Wins)
            alert('connect4! by Player 2 - end of game handling not yet written');
        else if (board.gameState == GameStates.Draw)
            alert('draw - end of game handling not yet written');
        else
            alert('processEndOfGame called, but board.gamestate does not match.');
    }
}

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

