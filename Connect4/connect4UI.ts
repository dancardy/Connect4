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
    var AI_Player_Max_Wait: number = 10000;

    //html Controls
    var newGameBtn: HTMLButtonElement;
    var widthSlider: HTMLInputElement;
    var heightSlider: HTMLInputElement;
    var difficultySlider: HTMLInputElement;
    var textOutputSpan: HTMLSpanElement
    var processingTimeSlider: HTMLInputElement;
    var connectNumSlider: HTMLInputElement;


    export function init(): void {
        //debugSpan = <HTMLSpanElement>document.querySelector("#debugspan");
        //above is temporary, below should be kept.

        textOutputSpan = <HTMLSpanElement>document.querySelector("#textOutputSpan");

        newGameBtn = <HTMLButtonElement>document.querySelector("#newGameBtn");
        newGameBtn.addEventListener('click', newGameBtnPressed);

        canvas = <HTMLCanvasElement>document.querySelector("#connect4MainCanvas");
        ctx = canvas.getContext('2d');
        divCanvas = <HTMLDivElement>document.querySelector("#connect4MainCanvasDiv");

        canvas.addEventListener('click', processClick);
        canvas.addEventListener('mousemove', processMouseMove);
       
        widthSlider = <HTMLInputElement>document.querySelector("#boardWidth");
        widthSlider.addEventListener('change', changeBoardWidth);

        heightSlider = <HTMLInputElement>document.querySelector("#boardHeight");
        heightSlider.addEventListener('change', changeBoardHeight);
    
        difficultySlider = <HTMLInputElement>document.querySelector("#difficulty");
        difficultySlider.addEventListener('change', changeDifficulty);

        processingTimeSlider = <HTMLInputElement>document.querySelector("#processingTime");
        processingTimeSlider.addEventListener('change', changeProcessingTime);

        connectNumSlider = <HTMLInputElement>document.querySelector("#connectNum");
        connectNumSlider.addEventListener('change', changeConnectNum);

        resetSliderValues();

        window.addEventListener('resize', function () { resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1)) }, false);
        initBoard();
    }

    function initBoard(): void {
        Connect4Board.numRows = parseInt(document.getElementById("heightValue").innerHTML);
        Connect4Board.numCols = parseInt(document.getElementById("widthValue").innerHTML);
        Connect4Board.threshold = parseInt(document.getElementById("connectNumValue").innerHTML);
        AI_Player = 1;
        AI_Player_Max_Wait = parseInt(document.getElementById("processingTimeValue").innerHTML)*1000;
        
        var targetDepth : number = parseFloat(document.getElementById("difficultyValue").innerHTML);
        //Use Finite Geometric series summation [that sum from n=0 to N of r^n = (1-r^(N+1))/(1-r) ], to set maxNodes to a number that
        // approximates the tree depth received from getMaxDepth;  This is the max depth if the tree were full; in reality it will be a little more.
        MCTS.maxNodes = (1-Math.pow(Connect4Board.numCols,targetDepth+1))/(1-Connect4Board.numCols);
       
        board = new Connect4Board();
        MCTS.start(board);
            
        resizeCanvasAccordingToParentSize(Connect4Board.numCols / (Connect4Board.numRows + 1));
        enableControls(true);
    }

    var controlsEnabledNow:boolean = true;
    function enableControls(enable:boolean) :void {
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
            if ( (board.gameState == GameStates.Player1sTurn) || (board.gameState == GameStates.Player2sTurn) ) {
                newGameBtn.innerText = "Restore Defaults";
            } else {
                newGameBtn.innerText = "New Game";
            }
        } else if (!enable && controlsEnabledNow) {
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

    function getDepthTarget(difficulty: number): number {
        if (difficulty <= 0) return 1;
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

    function changeConnectNum(event: any): void {
        MCTS.stop();
        var num: any = parseInt(event.target.value);
        document.getElementById("connectNumValue").innerHTML = num;
        initBoard();
    }

    function changeDifficulty(event: any): void {
        MCTS.stop();
        var difficultyNum: number = parseInt(event.target.value);
        document.getElementById("difficultyValue").innerHTML = <any>getDepthTarget(difficultyNum);
        initBoard();
    }

    function changeProcessingTime(event: any) :void {
        var time:any = parseInt(event.target.value)
        document.getElementById("processingTimeValue").innerHTML = time;
        AI_Player_Max_Wait = parseInt(time)*1000;
        if ((board.gameState == GameStates.Player1sTurn && AI_Player == 0) || (board.gameState == GameStates.Player2sTurn && AI_Player == 1)) {
            textOutputSpan.innerHTML = "Change to Max Thinking Time will take effect on the next move.";
        }
    }

    function resetSliderValues() {
        difficultySlider.value = "6"
        document.getElementById("difficultyValue").innerHTML = <any>getDepthTarget(parseInt(difficultySlider.value));
        widthSlider.value = "7";
        document.getElementById("widthValue").innerHTML = widthSlider.value;
        heightSlider.value = "6";
        document.getElementById("heightValue").innerHTML = heightSlider.value;
        processingTimeSlider.value = "10";
        document.getElementById("processingTimeValue").innerHTML = processingTimeSlider.value;
        connectNumSlider.value = "4";
        document.getElementById("connectNumValue").innerHTML = connectNumSlider.value;
    }

    function newGameBtnPressed():void {
        MCTS.stop();
        if (newGameBtn.innerText == "Restore Defaults") {
            resetSliderValues();
        }
        initBoard();
    }

    //resizes the canvas so it fits in the window vertically and within its parent div horizontally, maintianing aspectRatio
    function resizeCanvasAccordingToParentSize(aspectRatio: number): void {
        var winWidth: number = divCanvas.clientWidth;
        var winHeight: number = Math.floor(getWindowHeight() * 0.95); //set initial height to viewport
        
        if (divCanvas.className == "c4-fixed-height") {
            //if height is set by the c4-fixed-height class, let the Div's fixed-height set maximum Height
            if (getWindowWidth() > 768) {//divCanvas sets a height at this screen width
                winHeight = Math.min(divCanvas.clientHeight, winHeight); 
            } else {//divCanvas doesn't set a height at this screen width, but set a cap so it doesn't jump up 
                winHeight = Math.min(winHeight, 500); 
            }
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
    function getWindowWidth(): number {
        if (typeof (window.innerWidth) == 'number') {
            return window.innerWidth; //this should be the return for nearly all browsers.
        } else if (document.documentElement && document.documentElement.clientWidth) {
            return document.documentElement.clientWidth;
        } else if (document.body && document.body.clientWidth) {
            return document.body.clientWidth;
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
        enableControls(false);
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
        textOutputSpan.innerHTML = "";
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

    var thinkingIndicated : boolean = false;
    var cutofftime : number;
    function playAIMove(): void {
        //if player asks the computer to play for it
        if ((board.gameState == GameStates.Player2sTurn && AI_Player == 0) || (board.gameState == GameStates.Player1sTurn && AI_Player == 1)) {
            var move = MCTS.getRecommendedMove()
            if (move != null) {
                makeMove(move);
            } else {
                console.log("when player asked computer to play for it, move could not be processed because MCTS could not recommend a move");
            }
            return;
        }
        
        if (MCTS.simulationState == MCTS.States.Running) {
            if (!thinkingIndicated) {
                ctx.save();
                translateCanvas();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 30pt Calibri';
                ctx.fillStyle = "#777777"
                ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1); //clear area above board
                ctx.fillText("Thinking", canvas.width / 2, -holeSpacing / 2);
                ctx.restore();
                thinkingIndicated = true;
                cutofftime = Date.now() + AI_Player_Max_Wait;
            }
            if (Date.now() < cutofftime) {
                setTimeout(playAIMove, 250);
            } else {
                thinkingIndicated = false;
                textOutputSpan.innerHTML = "Max thinking time was reached.  Processing was about " + MCTS.getProcessingPct() + "% done.";
                makeMove(MCTS.getRecommendedMove());
            }
        } else { //MCTS paused itself.
            thinkingIndicated = false;
            textOutputSpan.innerHTML = "";
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
                        setTimeout(function () { MCTS.resume(); playAIMove(); },5);
                    } else { //show new piece ready to drop for human players
                        if (unprocessedMouseMoveEvent) {
                            processMouseMove(unprocessedMouseMoveEvent);
                        } else {
                            currentYofFallingPiece = -holeSpacing / 2;
                            drawSingleLoosePiece(columnOfFallingPiece);
                        }
                        //restart MCTS solver, which was paused during animation; 
                        //the 5 ms delay and the use of an anonymous function required to avoid stutter in the piece drop animation in some browsers. 
                        setTimeout(function () { MCTS.resume(); },5);
                    }
                    
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
        ctx.save();
        translateCanvas();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 30pt Calibri';
        ctx.fillStyle = "#777777"
        ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, Connect4Board.numCols * holeSpacing / scalePct, holeSpacing - 1); //clear area above board
        if ( (AI_Player==0 && board.gameState == GameStates.Player2Wins) || (AI_Player==1 && board.gameState == GameStates.Player1Wins) ) {
            ctx.fillText("You Win!", canvas.width / 2, -holeSpacing / 2);
        } else if ( (AI_Player==0 && board.gameState == GameStates.Player1Wins) || (AI_Player==1 && board.gameState == GameStates.Player2Wins) ) {
            ctx.fillText("You Lost", canvas.width / 2, -holeSpacing / 2);
        } else if (board.gameState == GameStates.Draw) {
            ctx.fillText("Draw", canvas.width / 2, -holeSpacing / 2);
        } else {
            console.log('processEndOfGame called, but board.gamestate does not match.');
        }
        ctx.restore();
        enableControls(true);
        textOutputSpan.innerHTML = "";
    }
}
