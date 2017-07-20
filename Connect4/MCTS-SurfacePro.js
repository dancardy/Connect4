var MCTS;
(function (MCTS) {
    var rootNode;
    var currNode;
    var startTime;
    MCTS.processingInterval = 100;
    var timeoutHandle;
    var playout_counter = 0;
    var gameStartTime;
    function initialize(board) {
        rootNode = new Node(new Connect4Board(board), null);
        MCTS.processingInterval = 100;
        gameStartTime = Date.now();
        execute();
    }
    MCTS.initialize = initialize;
    function execute() {
        startTime = Date.now();
        while (Date.now() < startTime + MCTS.processingInterval) {
            playout_counter++;
            currNode = getNodeToTest(rootNode);
            updateStats(currNode, simulate(currNode));
        }
        debugSpan.innerHTML = "playouts/second: " + playout_counter * 1000 / ((Date.now() - startTime));
        debugSpan.innerHTML += '<br>playouts:' + playout_counter + 'processing time Limit: ' + MCTS.processingInterval;
        debugSpan.innerHTML += '<br>rootnode: ' + rootNode.numP1Wins + " / " + rootNode.timesVisted + " currentPlayer: ";
        if (rootNode.board.gameState == 0)
            debugSpan.innerHTML += "1";
        else if (rootNode.board.gameState == 1)
            debugSpan.innerHTML += "2";
        else
            debugSpan.innerHTML += "game over";
        debugSpan.innerHTML += "<br> Move to make:" + rootNode.board.availableMoves[bestChildIndex(rootNode, 0)];
        for (var i = 0; i < rootNode.board.availableMoves.length; i++) {
            if (rootNode.child[i]) {
                if (rootNode.board.gameState == 0) {
                    debugSpan.innerHTML += "<br>" + Math.round(100 * rootNode.child[i].timesVisted / rootNode.timesVisted) + " | " + Math.round((rootNode.child[i].numP1Wins + drawWeight * rootNode.child[i].numDraws) * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + Math.round(rootNode.child[i].numP1Wins + drawWeight * rootNode.child[i].numDraws) + " / " + rootNode.child[i].timesVisted;
                    debugSpan.innerHTML += "   |   " + Math.round(rootNode.child[i].numP1Wins * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + rootNode.child[i].numP1Wins + " / " + rootNode.child[i].timesVisted;
                }
                else if (rootNode.board.gameState == 1) {
                    debugSpan.innerHTML += "<br>" + Math.round(100 * rootNode.child[i].timesVisted / rootNode.timesVisted) + " | " + Math.round((rootNode.child[i].numP2Wins + drawWeight * rootNode.child[i].numDraws) * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + Math.round(rootNode.child[i].numP2Wins + drawWeight * rootNode.child[i].numDraws) + " / " + rootNode.child[i].timesVisted;
                    debugSpan.innerHTML += "   |   " + Math.round(rootNode.child[i].numP2Wins * 100 / rootNode.child[i].timesVisted) + "%";
                    debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + rootNode.child[i].numP2Wins + " / " + rootNode.child[i].timesVisted;
                }
                else {
                    alert('gamestate not as expected in MCTS debug printout code');
                }
            }
            else {
                debugSpan.innerHTML += "<br>--% = child not created";
            }
        }
        timeoutHandle = setTimeout(execute, 0);
    }
    function processMove(move) {
        clearTimeout(timeoutHandle);
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
        if (rootNode.board.gameState == 0 || rootNode.board.gameState == 1) {
            execute();
        }
    }
    MCTS.processMove = processMove;
    function getNodeToTest(root) {
        var curr = root;
        var index;
        while (curr.board.availableMoves.length > 0) {
            for (index = 0; index < curr.board.availableMoves.length; index++) {
                if (!curr.child[index]) {
                    curr.child[index] = new Node(new Connect4Board(curr.board, curr.board.availableMoves[index]), curr);
                    return curr.child[index];
                }
            }
            curr = curr.child[bestChildIndex(curr, c_sub_p)];
        }
        return curr;
    }
    var drawWeight = 0.2;
    function bestChildIndex(curr, cp) {
        var currChild;
        var maxIndex = 0;
        var maxValue = -Infinity;
        var currValue;
        for (var index = 0; index < curr.child.length; index++) {
            if (!(currChild = curr.child[index]))
                break;
            if (curr.board.gameState == 0) {
                currValue = (currChild.numP1Wins + currChild.numDraws * drawWeight) / currChild.timesVisted + cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted);
            }
            else if (curr.board.gameState == 1) {
                currValue = (currChild.numP2Wins + currChild.numDraws * drawWeight) / currChild.timesVisted + cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted);
            }
            else {
                alert('error -- bestchild is looking for children of board that is in a terminal state!  This code should be unreachable');
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
            else {
                alert('this code never should have been reached');
            }
            curr.timesVisted += 1;
            curr = curr.parent;
        }
    }
    var c_sub_p = 16;
    var Node = (function () {
        function Node(board, parent) {
            this.numP1Wins = 0;
            this.numP2Wins = 0;
            this.numDraws = 0;
            this.timesVisted = 0;
            this.board = board;
            this.parent = parent;
            (this.child = []).length = board.availableMoves.length;
        }
        return Node;
    })();
})(MCTS || (MCTS = {}));
