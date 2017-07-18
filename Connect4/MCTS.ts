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

module MCTS {
    var rootNode: Node;
    var startTime: number;
    var processingInterval: number = 25; //how long execute() runs before ceding control to anything that's queued up and need to run
    var timeoutHandle: number;
    var playout_counter: number = 0;//debug only
    var gameStartTime: number; //stats only
    export var maxNodes: number = 100000;

    export const enum States { Paused = 0, Running = 1, Stopped = 2}
    export var simulationState: States;
    
    export function start(board: Connect4Board): void {
        rootNode = new Node(new Connect4Board(board), null);
        simulationState = States.Paused;
        resume();
    }
    
    export function resume() :void {
        if (simulationState != States.Stopped) {
            simulationState = States.Running;
            gameStartTime = Date.now();
            playout_counter = 0;
            execute();
        }
    }

    export function pause(): void {
        if (simulationState != States.Stopped) {
            clearTimeout(timeoutHandle); // keeps MCTS_execute from being called again.
            simulationState = States.Paused;
        } 
    }

    export function stop(): void {
        pause();
        simulationState = States.Stopped;
        rootNode = null; //do want this, just need to make sure no calls to execute have built up first (is causing crash when execute gets subsequently called)
    }

    export function getRecommendedMove(): number {
        if (simulationState != States.Stopped) {
            if(rootNode) {
                return rootNode.board.availableMoves[bestChildIndex(rootNode, 0)]
            } else {
                return null;
            }
        }
    }

    var debugSpanLastUpdate = 0;
    function execute(): void { //UCTSearch
        //if (simulationState != States.Running) {
        //    console.log('execute called while not running'); return;
        //}
        startTime = Date.now();
        var currNode: Node;
        while ( (Date.now() < startTime + processingInterval) && //stay within time interval (this is just the time interval for ceding control back to UI)
            (rootNode.numChildren < maxNodes) &&  //stay within space (memory) limitation
            (rootNode.timesVisted - rootNode.numChildren < maxNodes *10) //and towards the end of the game, don't keep processing once the answer is clear.
            ) {
            playout_counter++;
            currNode = getNodeToTest(rootNode);
            updateStats(currNode, simulate(currNode));
        }
        
        if ( (rootNode.numChildren < maxNodes) &&  //within space (memory limitiation)
            (rootNode.timesVisted - rootNode.numChildren < maxNodes * 10) // the answer is unclear enough to justify more processing
            ) {
            timeoutHandle = setTimeout(execute, 2);
        } else {
            pause();
        }
        

        if (simulationState == States.Paused || Date.now() >= debugSpanLastUpdate + 1000) {
            debugSpanLastUpdate = Date.now();
            debugSpan.innerHTML = Date.now() + "<br>";
            if (simulationState == States.Running) {
                debugSpan.innerHTML += "State is: Running<br>";
            } else if (simulationState == States.Paused) {
                debugSpan.innerHTML += "State is: Paused<br>";
            } else if (simulationState == States.Stopped) {
                debugSpan.innerHTML += "State is: Stopped<br>";
            }
            debugSpan.innerHTML += "Root times Visited: " + rootNode.timesVisted + "<br>";
            debugSpan.innerHTML += '<br>numberOfNodes: ' + rootNode.numChildren + '  repeat visits: ' + (rootNode.timesVisted - rootNode.numChildren) + "<br>";

            debugSpan.innerHTML += "playouts*1000/second: " + Math.floor(playout_counter / ((Date.now() - gameStartTime))) + '<br>  processing time Limit: ' + processingInterval;
            debugSpan.innerHTML += '<br>playouts (M):' + Math.floor(playout_counter / 1000000);
            debugSpan.innerHTML += '<br>rootnode P1 win ratio: ' + rootNode.numP1Wins + " / " + rootNode.timesVisted + " currentPlayer: ";
            if (rootNode.board.gameState == GameStates.Player1sTurn)
                debugSpan.innerHTML += "1";
            else if (rootNode.board.gameState == GameStates.Player2sTurn)
                debugSpan.innerHTML += "2";
            else
                debugSpan.innerHTML += "game over";
            debugSpan.innerHTML += "<br> Move to make:" + getRecommendedMove();
            for (var i = 0; i < rootNode.board.availableMoves.length; i++) {
                if (rootNode.child[i]) {
                    if (rootNode.board.gameState == GameStates.Player1sTurn) {
                        debugSpan.innerHTML += "<br>" + Math.round(100 * rootNode.child[i].timesVisted / rootNode.timesVisted) + " | " + Math.round((rootNode.child[i].numP1Wins + drawWeight * rootNode.child[i].numDraws) * 100 / rootNode.child[i].timesVisted) + "%";
                        debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + Math.round(rootNode.child[i].numP1Wins + drawWeight * rootNode.child[i].numDraws) + " / " + rootNode.child[i].timesVisted;

                        debugSpan.innerHTML += "   |   " + Math.round(rootNode.child[i].numP1Wins * 100 / rootNode.child[i].timesVisted) + "%";
                        debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + rootNode.child[i].numP1Wins + " / " + rootNode.child[i].timesVisted;
                    } else if (rootNode.board.gameState == GameStates.Player2sTurn) {
                        debugSpan.innerHTML += "<br>" + Math.round(100 * rootNode.child[i].timesVisted / rootNode.timesVisted) + " | " + Math.round((rootNode.child[i].numP2Wins + drawWeight * rootNode.child[i].numDraws) * 100 / rootNode.child[i].timesVisted) + "%";
                        debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + Math.round(rootNode.child[i].numP2Wins + drawWeight * rootNode.child[i].numDraws) + " / " + rootNode.child[i].timesVisted;

                        debugSpan.innerHTML += "   |   " + Math.round(rootNode.child[i].numP2Wins * 100 / rootNode.child[i].timesVisted) + "%";
                        debugSpan.innerHTML += ' = ' + rootNode.board.availableMoves[i] + ': ' + rootNode.child[i].numP2Wins + " / " + rootNode.child[i].timesVisted;
                    } else {
                        console.log('gamestate not as expected in MCTS debug printout code');
                    }
                } else {
                    debugSpan.innerHTML += "<br>--% = child not created";
                }
            }
        }

        //
    }

    export function pauseAndProcessMove(move: number): void {
        pause();
        var index: number;
        for (index = 0; index < rootNode.board.availableMoves.length; index++) {
            if (rootNode.board.availableMoves[index] == move) {
                break;
            }
        }
        if (index < rootNode.board.availableMoves.length && typeof rootNode.child[index] !== "undefined") {
            rootNode = rootNode.child[index];
            rootNode.parent = null;
        } else {
            //child node hasn't been created yet, so we are essentially starting again from scratch.
            rootNode = new Node(new Connect4Board(rootNode.board, move), null);
        }
        if (rootNode.board.gameState != GameStates.Player1sTurn && rootNode.board.gameState != GameStates.Player2sTurn) {
            stop();
        }
        //note: simulation state remains paused at end of this function (done so execute won't interfere with animation of the move); a call to resume is necessary, and is made at the end of the UI's animation of the move.
    }

    function incrementNumChildren(firstParent: Node): void {
        while (firstParent) {
            firstParent.numChildren++;
            firstParent = firstParent.parent;
        }
    }

    function getNodeToTest(root: Node): Node {
        var curr: Node = root;
        var index: number;
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
        return curr;//we have reached a terminal state (no moves are available), so this position will be "tested"
    }

    const drawWeight: number = 0.5; //Value between 1 (same as a win) and 0 (same as a loss) of a draw
    function bestChildIndex(curr: Node, cp: number): number {
        var currChild: Node;
        var maxIndex: number = 0;
        var maxValue: number = -Infinity;
        var currValue: number;
        for (var index: number = 0; index < curr.child.length; index++) {
            if (!(currChild = curr.child[index])) break; //change to continue if children can be incomplete, but created out of order (not the case now).
            //note: Javascript makes division by zero = infinity, so the line below works correctly even if currChild.timesVisited is zero.
            //first term must be in [0,1]
            if (curr.board.gameState == GameStates.Player1sTurn) {
                currValue = (currChild.numP1Wins + currChild.numDraws * drawWeight) / currChild.timesVisted + cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted); // consider pulling out the *2.
            } else if (curr.board.gameState == GameStates.Player2sTurn) {
                currValue = (currChild.numP2Wins + currChild.numDraws * drawWeight) / currChild.timesVisted + cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted)
            } else {
                alert('error -- bestchild is looking for children of board that is in a terminal state!  This code should be unreachable');  //eliminate this from final code.
            }
            if ((currValue > maxValue) || (currValue == maxValue && Math.random() < 0.5)) { //second part of the if breaks ties with a coin flip
                maxValue = currValue;
                maxIndex = index;
            }
        }
        return maxIndex;
    }

    //returns a GameState based on random game play if node represents an in-progress game; else return resolution of game
    function simulate(node: Node): GameStates {
        if (node.board.gameState == GameStates.Player1sTurn || node.board.gameState == GameStates.Player2sTurn) {
            var board: Connect4Board = new Connect4Board(node.board);
            var moveIndex: number;
            while (board.gameState == GameStates.Player1sTurn || board.gameState == GameStates.Player2sTurn) {
                moveIndex = Math.floor(Math.random() * board.availableMoves.length); //move randomly.
                board.makeMove(board.availableMoves[moveIndex]);
            }
            return board.gameState;
        } else {
            return node.board.gameState;
        }
    }


    function updateStats(v: Node, endState: GameStates): void {
        var curr: Node = v;
        while (curr) {
            if (endState == GameStates.Player1Wins) {
                curr.numP1Wins += 1;
            } else if (endState == GameStates.Player2Wins) {
                curr.numP2Wins += 1;
            } else if (endState == GameStates.Draw) {
                curr.numDraws += 1;
            } else {
                console.log('in MCTS.updateStats -- reached code that never should have been reached');
            }
            curr.timesVisted += 1;
            curr = curr.parent;
        }
    }


    const c_sub_p: number = 8; //Math.SQRT1_2; //0.01 // Cp must be >0 for there to be exploration (0 is just always choosing the currently most promising node).



    class Node {
        numP1Wins: number = 0;
        numP2Wins: number = 0;
        numDraws: number = 0;
        timesVisted: number = 0;
        numChildren: number = 0;
        board: Connect4Board;

        parent: Node;
        child: Node[];

        constructor(board: Connect4Board, parent: Node) {
            this.board = board;
            this.parent = parent;
            (this.child = []).length = board.availableMoves.length;
        }
    }
}