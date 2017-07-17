/*class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;

    constructor(element: HTMLElement) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement('span');
        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500);
        //console.log("debug message");
    }

    stop() {
        clearTimeout(this.timerToken);
    }

}*/
/*  //This sytax is nicer, but wait until fully understand lambdas before using.
window.onload = () => {
    var el = document.getElementById('content');
    var greeter = new Greeter(el);
    greeter.start();
};
*/
//console.log("random execution");
//todo idea: save (using the html5 cookies equivalents) your last settings, game success/failure history, etc.
/*
function init() {
    canvas = document.querySelector("#mainCanvas");
    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 100, 200);
    ctx.fillStyle = 'blue';
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 3;
    ctx.fillRect(100, 100, 100, 100);
    ctx.strokeRect(100, 100, 100, 100);

    ctx.clearRect(20, 20, 15, 15);//use this to get your circles w/ bkg showing throught!


    ctx.font = 'italic 20pt Calibri';
    ctx.fillText("hello", 70, 22);
    context.fillText("Hello World!", 10, 160, 250); //last argument is max-width of the text can also use ctx.measureText(); see 3.3 for text baseline.
    context.strokeText("Hello World!", 10, 160, 250);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.strokeText("hello", 170, 22);
    
    ctx.translate(100, 100);
    drawMonster(0, 0);
    ctx.translate(-100, -100);
    //consider: do everyting in SVG instead of in a canvas since svg is resolution independent.
    //ctx.scale(2, 0.5);


    
    //Call drawing methods that work in path mode, for example call ctx.rect(...) instead of ctx.strokeRect(...) or ctx.fillRect(...)
    //Call ctx.stroke() or ctx.fill() to draw the buffer's contents,
    //Beware that the buffer is never emptied, two consecutive calls to ctx.stroke() will draw the buffer contents twice! Instead, use ctx.beginPath() to empty it if needed.
    

    canvas.addEventListener('mouseup', function (evt) {
        var message = "Mouse up at position: " + mousePos.x + ',' + mousePos.y;
        //writeMessage(canvas, message);
    }, false);
}
*/
/*
function drawMonster(x, y) {
    // head
    ctx.fillStyle = 'lightgreen';
    ctx.fillRect(0, 0, 200, 200);
     
    // eyes
    ctx.fillStyle = 'red';
    ctx.fillRect(35, 30, 20, 20);
    ctx.fillRect(140, 30, 20, 20);
     
    // interior of eye
    ctx.fillStyle = 'yellow';
    ctx.fillRect(43, 37, 10, 10);
    ctx.fillRect(143, 37, 10, 10);
     
    // Nose
    ctx.fillStyle = 'black';
    ctx.fillRect(90, 70, 20, 80);
     
    // Mouth
    ctx.fillStyle = 'purple';
    ctx.fillRect(60, 165, 80, 20);
     
    // coordinate system at (0, 0)
    drawArrow(ctx, 0, 0, 100, 0, 10, 'red');
    drawArrow(ctx, 0, 0, 0, 100, 10, 'red');


    //how to add arcs/circles to the path:

    //ctx.arc(centerX, centerY, radius, startAngle, endAngle); // clockwise drawing
    //ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);



}
*/
/*
function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth, colorOfFallingPiece) {
    //variables to be used when creating the arrow
    var headlen = 10;
    var angle = Math.atan2(toy - fromy, tox - fromx);

    ctx.save(); // always save and restore at the beginning and end of a drawing function.
    ctx.strokeStyle = colorOfFallingPiece;
    //note that context on drawing includes shadows (find command and use )


    //starting path of the arrow from the start square to the end square and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = arrowWidth;
    ctx.stroke();

    //starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7), toy - headlen * Math.sin(angle + Math.PI / 7));

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));

    //draws the paths created above
    ctx.stroke();
    ctx.restore();
}
*/
/*
function drawCircle() {
    ctx.beginPath();
    // Add to the path a full circle (from 0 to 2PI)
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    // With path drawing you can change the context
    // properties until a call to stroke() or fill() is performed
    ctx.fillStyle = "lightBlue";
    // Draws the filled circle in light blue
    ctx.fill();
    // Prepare for the outline
    ctx.lineWidth = 5;
    ctx.strokeStyle = "black";
    // draws the path (the circle) AGAIN, this
    // time in wireframe
    ctx.stroke();
    // Notice we called ctx.arc() only once ! And drew it twice
    // with different styles
}
*/
/*
var roundedRect = function (ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    // draw top and top right corner
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    // draw right side and bottom right corner
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    // draw bottom and bottom left corner
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    // draw left and top left corner
    ctx.arcTo(x, y, x + radius, y, radius);
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }

*/
//var ctx = canvas.getContext('2d');
//ctx.strokeStyle = 'rgb(150,0,0)';
//ctx.fillStyle = 'rgb(0,150,0)';
//ctx.lineWidth = 7;
//roundedRect(ctx, 15, 15, 160, 120, 20, true, true);
//animaion calls: http://jsbin.com/dafuta/edit?html,output
//javascript how to register a callback:
/*
document.getElementById('someDiv').addEventListener('click', function (evt) {
    alert('clicked!');
}, false);
*/
//interactive controls: http://jsbin.com/fatube/edit?html,output
//http://jsbin.com/qigoro/edit?html,js,output
//android radio buttons with input type =range; 0-1; step 1. (not sure if the step will work, but if not, can force on the js).
//details, including how to style w/ css to get desired look: Week 5: HTML5 Forms > 5.4 New input types > &lt;input type="range"&gt;
//https://courses.edx.org/courses/course-v1:W3Cx+HTML5.1x+4T2015/courseware/36a27299952f4ecf87066b10a1928bb5/66d1519efebf474f9e44a38f27c87070/
//<input id="range" name="range" type="range" min="0" max="100" step="5"/>
//per 6.4, use local storage to save default skill levels, etc.
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------
var debugSpan; //DELTE THIS WHEN DONE!      debugspan.innerHTML = winWidth + " x " + winHeight;
var canvas;
var divCanvas; //div containing the above canvas 
var ctx; //context for above canvas
var numRows = 6; //6 is standard connect 4
var numCols = 7; //7 is standard connect 4
var canvasAspectRatio = numCols / (numRows + 1);
var scalePct = 0.97; //percentage of canvas that will be taken up by the board
var holeDiameterPct = 0.8;
var boardWidth, boardHeight, holeSpacing, radius; //gets set dynamically as board is resized.
window.onload = init;
function init() {
    canvas = document.querySelector("#connect4MainCanvas");
    ctx = canvas.getContext('2d');
    divCanvas = document.querySelector("#connect4MainCanvasDiv");
    debugSpan = document.querySelector("#debugspan");
    window.addEventListener('resize', function () { resizeCanvasAccordingToParentSize(canvasAspectRatio); }, false);
    resizeCanvasAccordingToParentSize(canvasAspectRatio);
    canvas.addEventListener('click', processClick);
    canvas.addEventListener('mousemove', processMouseMove);
}
//This function resizes the canvas so it fits in the window vertically, and within its parent div (which may be more narrow than the window) horizontally
//The canvas is kept at a fixed aspect ratio.
function resizeCanvasAccordingToParentSize(aspectRatio) {
    var winHeight = Math.floor(getWindowHeight() * 0.95);
    var winWidth = divCanvas.clientWidth;
    if ((winHeight > 0) && (winWidth / winHeight > aspectRatio)) {
        //limiting dimension is height
        canvas.width = Math.floor(winHeight * aspectRatio);
        canvas.height = winHeight;
    }
    else {
        // limiting dimension is width (or couldn't obtain height)
        canvas.width = winWidth;
        canvas.height = Math.floor(winWidth / aspectRatio);
    }
    boardWidth = canvas.width * scalePct;
    boardHeight = (canvas.height - canvas.height / (numRows + 1)) * scalePct;
    holeSpacing = boardWidth / numCols;
    radius = holeDiameterPct * holeSpacing / 2;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    drawBoard();
}
function getWindowHeight() {
    if (typeof (window.innerWidth) == 'number') {
        //Non-IE
        return window.innerHeight;
    }
    else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        return document.documentElement.clientHeight;
    }
    else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        return document.body.clientHeight;
    }
    else {
        return -1;
    }
}
function translateMouseCoordinates(event, axis) {
    if (axis == 'x') {
        var mouseX = event.clientX - canvas.getBoundingClientRect().left; //mouseX&Y is now position over canvas.
        return mouseX - (canvas.width - boardWidth) / 2; //mouseX&Y now translated to coordinates where 0,0 is top left corner of the board
    }
    else if (axis == 'y') {
        var mouseY = event.clientY - canvas.getBoundingClientRect().top;
        return mouseY - ((canvas.height / (numRows + 1)) + ((canvas.height - canvas.height / (numRows + 1)) - boardHeight) / 2);
    }
}
function processClick(event) {
    if (animationRequestID) {
        return; //don't handle another click while still animating last one
    }
    var mouseX = translateMouseCoordinates(event, 'x');
    var mouseY = translateMouseCoordinates(event, 'y');
    if ((mouseY > 0) || (mouseX < 0) || (mouseX > holeSpacing * numCols))
        return; //clicks on board or beside board don't do anything.
    var positionPct = (mouseX % holeSpacing) / holeSpacing;
    if ((positionPct < 0.2) || (positionPct > 0.8))
        return; // clicks on borders between columns don't do anything.
    columnOfFallingPiece = Math.floor(mouseX / holeSpacing);
    //Begin Animation! (clean up the call)
    colorOfFallingPiece = 'red'; //remember the default as well(?)<<< need to set this based on gameplay.
    currentYofFallingPiece = -holeSpacing / 2;
    animationRequestID = requestAnimationFrame(drawFallingPiece);
    //debugSpan.innerHTML = 'position:' + positionPct + '<br>columnOfFallingPiece:' + columnOfFallingPiece;
    // alert('position:' + positionPct + '<br>columnOfFallingPiece:' + columnOfFallingPiece);
    //var columnOfFallingPiece = mouseX
}
function processMouseMove(event) {
    if (animationRequestID) {
        return; //don't handle a new mouse move while still animating last mouse click
    }
    var mouseX = translateMouseCoordinates(event, 'x');
    var mouseY = translateMouseCoordinates(event, 'y');
    var drawPiece = true;
    debugSpan.innerHTML = "Mouse: " + mouseX + " x " + mouseY + "<br>holeSpacing: " + holeSpacing + " (xNumCols=" + holeSpacing * numCols + ")<br>";
    if ((mouseY > 0) || (mouseX < 0) || (mouseX > holeSpacing * numCols))
        drawPiece = false; //hovering on board or beside board
    var positionPct = (mouseX % holeSpacing) / holeSpacing;
    columnOfFallingPiece = Math.floor(mouseX / holeSpacing);
    var xCoordinateFallingPiece = holeSpacing / 2 + columnOfFallingPiece * holeSpacing;
    ctx.save();
    //leave canvas height/(numRows+1) at top of convas, and then center the range between boardwidth/height and canvas width/height within the remaining space.
    //Result is that (0,0) is at top left corner of where want to draw board. 
    ctx.translate((canvas.width - boardWidth) / 2, (canvas.height / (numRows + 1)) + ((canvas.height - canvas.height / (numRows + 1)) - boardHeight) / 2);
    ctx.clearRect(-(canvas.width - boardWidth) / 2, -holeSpacing, numCols * holeSpacing / scalePct, holeSpacing - 1); //PROBLEM: ARE OVERSHADOWING BOARD! (SO CLEARING undrawn area ISN'T ENOUGH! FIX by making new function to draw just top edge rather than re-doing whole board)
    if (drawPiece) {
        setShadow(boardWidth);
        ctx.fillStyle = 'red'; //colorOfFallingPiece;
        currentYofFallingPiece = -holeSpacing / 2;
        ctx.beginPath();
        ctx.moveTo(xCoordinateFallingPiece + radius, currentYofFallingPiece);
        ctx.arc(xCoordinateFallingPiece, currentYofFallingPiece, radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}
function setShadow(boardWidth) {
    ctx.shadowColor = 'black';
    ctx.shadowBlur = boardWidth * 0.009; //was 0.01
    ctx.shadowOffsetX = boardWidth * 0.004;
    ctx.shadowOffsetY = boardWidth * 0.004; //was 0.005
}
var currentYofFallingPiece;
var animationRequestID;
var columnOfFallingPiece;
var colorOfFallingPiece;
function drawFallingPiece() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    //leave canvas height/(numRows+1) at top of convas, and then center the range between boardwidth/height and canvas width/height within the remaining space.
    //Result is that (0,0) is at top left corner of where want to draw board. 
    ctx.translate((canvas.width - boardWidth) / 2, (canvas.height / (numRows + 1)) + ((canvas.height - canvas.height / (numRows + 1)) - boardHeight) / 2);
    setShadow(boardWidth);
    var finalX = holeSpacing / 2 + columnOfFallingPiece * holeSpacing;
    var finalY = boardHeight - holeSpacing / 2 - 0 * holeSpacing; //TODO: need to set row based on bame board.
    //draw gamepiece.
    ctx.beginPath();
    ctx.moveTo(finalX + radius, currentYofFallingPiece);
    ctx.arc(finalX, currentYofFallingPiece, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = colorOfFallingPiece;
    ctx.fill();
    ctx.stroke();
    //overlay board
    ctx.restore();
    drawBoard();
    //move location for next time draw
    currentYofFallingPiece = currentYofFallingPiece + 4;
    // call again to draw next frame
    if (currentYofFallingPiece < finalY) {
        animationRequestID = requestAnimationFrame(drawFallingPiece);
    }
    else {
        if (animationRequestID) {
            cancelAnimationFrame(animationRequestID);
            animationRequestID = null;
        }
    }
}
function drawBoard() {
    ctx.save();
    //leave canvas height/(numRows+1) at top of convas, and then center the range between boardwidth/height and canvas width/height within the remaining space.
    //Result is that (0,0) is at top left corner of where want to draw board. 
    ctx.translate((canvas.width - boardWidth) / 2, (canvas.height / (numRows + 1)) + ((canvas.height - canvas.height / (numRows + 1)) - boardHeight) / 2);
    var firstX = holeSpacing / 2; //coordinates of first hole.
    var firstY = boardHeight - holeSpacing / 2;
    ctx.save();
    setShadow(boardWidth);
    //Draw each game piece here; for now, just one yellow gamepiece in mid-fall., but in future, it needs to be only the non-animated pieces.
    //ctx.beginPath();
    //ctx.moveTo(firstX + 3 * holeSpacing + radius, firstY - 7 * holeSpacing/2);
    //ctx.arc(firstX + 3 * holeSpacing, firstY - 7 * holeSpacing/2, radius, 0, Math.PI * 2, false);
    //ctx.fillStyle = 'yellow';
    //ctx.fill();
    //ctx.stroke();
    //trace blue overlay around every hole (so overlay doesn't cover pieces)
    ctx.beginPath();
    ctx.moveTo(0, boardHeight);
    var i, j;
    for (i = 0; i < numCols; i++) {
        ctx.lineTo(firstX + i * holeSpacing, boardHeight);
        for (j = 0; j < numRows; j++) {
            ctx.arc(firstX + i * holeSpacing, firstY - j * holeSpacing, radius, Math.PI / 2, 3 * Math.PI / 2, false);
        }
        for (j = numRows - 1; j >= 0; j--) {
            ctx.arc(firstX + i * holeSpacing, firstY - j * holeSpacing, radius, 3 * Math.PI / 2, Math.PI / 2, false);
        }
        ctx.lineTo(firstX + i * holeSpacing, boardHeight);
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
    for (i = 0; i < numCols; i++) {
        for (j = 0; j < numRows; j++) {
            ctx.moveTo(firstX + i * holeSpacing + radius, firstY - j * holeSpacing);
            ctx.arc(firstX + i * holeSpacing, firstY - j * holeSpacing, radius, 0, Math.PI * 2, false);
        }
    }
    ctx.stroke();
    ctx.restore();
}
//Todos:
//-- event handlers to hover piece over columns when user just holds the mouse there
//-- store state and re-draw all dropped pieces ///
//4) correct the Y values on the animated piece drop so it drops smoothly.
//-- detect connect 4 in stored state and flag win
//-- adjust aspect ratio and initial drawing algorithm so that only 1/2 of a row goes up top. (???????)
//--make play algorithm (s)
//--add controls (sliders, etc.), so can control rows and columns, colors, difficulty, more. 
//# sourceMappingURL=app.js.map