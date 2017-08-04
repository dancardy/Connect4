/* ****************************************************************************
This file implements a Monte Carlo Tree Search.  The Upper Confidence Bounds 
for Trees (UCT) algorithm is used to expand the tree in a way that balances the 
breadth and depth of the search appropriately -- the more promising branches are
prioritized for expansion over the less promising branches. 

Each node in the tree represents a state of the game board.  Each child vertex
represents a possible next move.  The value associated with each move that is 
calculated by the monte carlo simulations is negated at each subsequent level of
the tree (consistent with negamax-style algoithms) to reflect that the best results
for player one are the worst results for player two.

This Module will work with any game logic that implements the MCTS.Board interface
and provides the constructor indicated immediately below.
**************************************************************************** */

module MCTS {
    export interface Board {
        availableMoves: number[];
        gameState: GameStates;
        makeMove(moveNum: number): void;
    }
    //The Constructor signature for Board is: constructor(src ?: Connect4Board, nextMove ?:number)
    //The constructor must: 
    //(1) construct an empty board when no arguments are passed
    //(2) construct a copy when another Board is passed as the first parameter
    //(3) perform nextMove on the copy when nextMove is passed
    //Although TypeScript does support constructor interfaces, one is not used here
    //because TypeScript won't enforce constructor signatures with optional parameters

    var boardClass: any; //the specific class of the Board to be used. (e.g. Connect4Board)

    var rootNode: Node;
    var startTime: number;
    var processingInterval: number = 25; //how long execute() blocks waiting scripts from running
    var timeoutHandle: number;
    export var maxNodes: number = 100000;

    // c_sup_p is the exploration factor.  It must be >0 for there to be exploration.
    // 1 is a common default for large trees, but set it higher here to ensure small 
    // trees don't miss obvious moves
    const c_sub_p: number = 8; 

    export const enum States { Paused = 0, Running = 1, Stopped = 2}
    export var simulationState: States;
    
    export function start(board: Board, boardClassName:any): void {
        boardClass = boardClassName;
        rootNode = new Node(new boardClass(board), null);
        simulationState = States.Paused;
        resume();
    }
    
    export function resume() :void {
        if (simulationState == States.Paused) {
            simulationState = States.Running;
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
        rootNode = null;
    }

    export function getRecommendedMove(): number {
        if(rootNode && rootNode.numChildren > 0) {
            return rootNode.board.availableMoves[bestChildIndex(rootNode, 0)];
        } else {
            return null;
        }
    }

    //Tells you what percentage of the maxNodes have been explored.
    //Indicates 99 instead of 100 if nodes explored but (simulationState != States.paused)
    //The remaining 1 pct is iterating over the existing tree nodes to update stats
    export function getProcessingPct() : number {
        if (simulationState == States.Paused) {
            return 100;
        }
        var pct:number = Math.floor(rootNode.numChildren*100/maxNodes);
        if (pct >= 99) return 99;
        return pct;
    }

    function execute(): void { //UCTSearch
        startTime = Date.now();
        var currNode: Node;
        while ( (Date.now() < startTime + processingInterval) && //stop when it's time to allow other scripts to run
            (rootNode.numChildren < maxNodes) &&  //stay within space (memory) limitation
            (rootNode.timesVisted - rootNode.numChildren < maxNodes *10) //and towards the end of the game, don't keep processing once the answer is clear.
            ) {

            currNode = getNodeToTest(rootNode);
            updateStats(currNode, simulate(currNode));
        }
        
        if ( (rootNode.numChildren < maxNodes) && 
            (rootNode.timesVisted - rootNode.numChildren < maxNodes * 10)
            ) {
            timeoutHandle = setTimeout(execute, 2); //continue processing once give other scripts a chance to run
        } else {
            pause();
        }     
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
            rootNode = new Node(new boardClass(rootNode.board, move), null);
        }
        if (rootNode.board.gameState != GameStates.Player1sTurn && rootNode.board.gameState != GameStates.Player2sTurn) {
            stop();
        }
        //note: simulation state remains paused at end of this function
        //This is done so processing (the execute function) won't interfere with animation
        //The caller (the UI) will call resume to continue processing when animation is complete
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
                    curr.child[index] = new Node(new boardClass(curr.board, curr.board.availableMoves[index]), curr);
                    incrementNumChildren(curr);
                    return curr.child[index];
                }
            }
            //if reach here, all children of curr exist, so now we want to descend down the tree; bestChild selects the route.
            curr = curr.child[bestChildIndex(curr, c_sub_p)];
        }
        return curr;//we have reached a terminal state (no moves are available), so this position will be "tested"
    }


    function bestChildIndex(curr: Node, cp: number): number {
        var currChild: Node;
        var maxIndex: number = 0;
        var maxValue: number = -Infinity;
        var currValue: number; //value indicating importance of visiting this child node
        var winRate: number;
        for (var index: number = 0; index < curr.child.length; index++) {
            currChild = curr.child[index];
            if (!currChild) continue; 

            winRate = currChild.p1winTally / currChild.timesVisted;
            if (curr.board.gameState == GameStates.Player2sTurn) {
                winRate = 1 - winRate;
            }

            //This is the UCT formula for balancing exploitation with exploration
            //Javascript division by zero = infinity, so formula works even if currChild.timesVisited is zero.
            currValue = winRate + cp * Math.sqrt(2 * Math.log(curr.timesVisted) / currChild.timesVisted);

            //break ties with a coin flip (not necessary, but avoids always checking same move if there's a tie)
            if ((currValue > maxValue) || (currValue == maxValue && Math.random() < 0.5)) { 
                maxValue = currValue;
                maxIndex = index;
            }
        }
        return maxIndex;
    }

    //returns a GameState based on random game play if node represents an in-progress game; else returns resolution of game
    function simulate(node: Node): GameStates {
        if (node.board.gameState == GameStates.Player1sTurn || node.board.gameState == GameStates.Player2sTurn) {
            var board: Board = new boardClass(node.board);
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
                curr.p1winTally += 1;
            } else if (endState == GameStates.Draw) {
                curr.p1winTally += 0.5;
            }

            curr.timesVisted += 1;
            curr = curr.parent;
        }
    }

    class Node {
        p1winTally: number = 0; //includes p1 wins and 0.5*draws
        timesVisted: number = 0;
        numChildren: number = 0;
        board: Board;

        parent: Node;
        child: Node[];

        constructor(board: Board, parent: Node) {
            this.board = board;
            this.parent = parent;
            (this.child = []).length = board.availableMoves.length;
        }
    }
}