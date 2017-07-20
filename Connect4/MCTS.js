var MCTS;
(function (MCTS) {
    var rootNode;
    var startTime;
    var processingInterval = 25;
    var timeoutHandle;
    var playout_counter = 0;
    var gameStartTime;
    MCTS.maxNodes = 100000;
    function start(board) {
        rootNode = new Node(new Connect4Board(board), null);
        MCTS.simulationState = 0;
        resume();
    }
    MCTS.start = start;
    function resume() {
        if (MCTS.simulationState != 2) {
            MCTS.simulationState = 1;
            gameStartTime = Date.now();
            playout_counter = 0;
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
        if (MCTS.simulationState != 1) {
            console.log('execute called while not running');
            return;
        }
        startTime = Date.now();
        var currNode;
        while ((Date.now() < startTime + processingInterval) &&
            (rootNode.numChildren < MCTS.maxNodes) &&
            (rootNode.timesVisted - rootNode.numChildren < MCTS.maxNodes * 10)) {
            playout_counter++;
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
                console.log('in MCTS.updateStats -- reached code that never should have been reached');
            }
            curr.timesVisted += 1;
            curr = curr.parent;
        }
    }
    var c_sub_p = 8;
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
