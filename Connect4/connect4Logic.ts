const enum Space {Empty=-1,Player1=0,Player2=1}
const enum GameStates {Player1sTurn=0, Player2sTurn=1,Player1Wins=3, Player2Wins=4, Draw=5}


class Connect4Board {
    private pieces: number[]; //pieces[row * NumCols + column] = Space.Empty, .Player1, or .Player2
    colHeight: number[]; //number of pieces in the column <-- consider if can eliminate since have availableMoves array now.
    turnsCompleted: number = 0;
    gameState: GameStates = GameStates.Player1sTurn;
    availableMoves: number[];

    static numRows: number;// = 6;
    static numCols: number;// = 7;
    static threshold: number;// = 4; //threshold is number of pieces need to connect to win (usually 4)

    constructor(src?: Connect4Board, nextMove?:number) {
        if (!src) {
            var i: number;
            (this.pieces = []).length = Connect4Board.numRows * Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numRows*Connect4Board.numCols; i++) {
                    this.pieces[i] = Space.Empty;
            }
            (this.colHeight = []).length = Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numCols; i++) {
                this.colHeight[i] = 0;
            }
            this.updateAvailableMoves();
        } else {
            var i: number;
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
            } else {
                this.makeMove(nextMove); //makeMove will update availableMoves.
            }
        }
    }

    getPieceAt(row: number, column: number) : Space {
        return this.pieces[row * Connect4Board.numCols + column];
    }

    makeMove(column: number): void {
                    //this.colHeigh[column] is to row where the piece will be
        this.pieces[this.colHeight[column] * Connect4Board.numCols + column] = (this.turnsCompleted % 2) ? Space.Player2 : Space.Player1;
        this.colHeight[column] += 1;
        this.turnsCompleted++;

        if (this.turnsCompleted >= Connect4Board.threshold * 2 - 1) {
            this.checkForThresholdInARow(column); //will change this.gameState if game has been won.
        }

        if ((this.gameState == GameStates.Player1sTurn || this.gameState == GameStates.Player2sTurn) && (this.turnsCompleted == Connect4Board.numRows * Connect4Board.numCols)) {
            this.gameState = GameStates.Draw;
        } else if (this.gameState == GameStates.Player1sTurn) {
            this.gameState = GameStates.Player2sTurn;
        } else if (this.gameState == GameStates.Player2sTurn) {
            this.gameState = GameStates.Player1sTurn;
        }
        this.updateAvailableMoves();
    }

    private checkForThresholdInARow(column: number): GameStates {
        var connectionCount: number = 1; //the just-played piece counts towards the threshold
        var row: number, col: number;
        var playerNum: Space = (this.gameState == GameStates.Player1sTurn) ? Space.Player1 : Space.Player2;
    
        //look for a vertical connection
        row = this.colHeight[column] - 2; //-1 gets row of current piece; -2 is one row below current piece 
        while (row >= 0) {
            if (this.pieces[row*Connect4Board.numCols + column] == playerNum)
                connectionCount++
            else
                break;
            row--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == GameStates.Player1sTurn) ? GameStates.Player1Wins : GameStates.Player2Wins;
            return;
        }

        //look for a horizontal connection
        connectionCount = 1;
        row = this.colHeight[column] - 1;
        col = column + 1;
        while (col < Connect4Board.numCols) {
            if (this.pieces[row*Connect4Board.numCols+col] == playerNum)
                connectionCount++
            else
                break;
            col++;
        }
        col = column - 1;
        while (col >= 0) {
            if (this.pieces[row*Connect4Board.numCols+col] == playerNum)
                connectionCount++
            else
                break;
            col--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == GameStates.Player1sTurn) ? GameStates.Player1Wins : GameStates.Player2Wins;
            return;
        }

        //look for a diagonal connection in first direction (\).
        connectionCount = 1;
        row = this.colHeight[column] - 2;
        col = column + 1;
        while ((row >= 0) && (col < Connect4Board.numCols)) {
            if (this.pieces[row*Connect4Board.numCols + col] == playerNum)
                connectionCount++
            else
                break;
            row--;
            col++;
        }
        row = this.colHeight[column];
        col = column - 1;
        while ((row < Connect4Board.numRows) && (col >= 0)) {
            if (this.pieces[row*Connect4Board.numCols+col] == playerNum)
                connectionCount++
            else
                break;
            row++;
            col--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == GameStates.Player1sTurn) ? GameStates.Player1Wins : GameStates.Player2Wins;
            return;
        }

        //look for a diagonal connection in second direction (/).
        connectionCount = 1;
        row = this.colHeight[column] - 2;
        col = column - 1;
        while ((row >= 0) && (col >= 0)) {
            if (this.pieces[row*Connect4Board.numCols+col] == playerNum)
                connectionCount++
            else
                break;
            row--;
            col--;
        }
        row = this.colHeight[column];
        col = column + 1;
        while ((row < Connect4Board.numRows) && (col < Connect4Board.numCols)) {
            if (this.pieces[row*Connect4Board.numCols+col] == playerNum)
                connectionCount++
            else
                break;
            row++;
            col++;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == GameStates.Player1sTurn) ? GameStates.Player1Wins : GameStates.Player2Wins;
            return;
        }
    }

    private updateAvailableMoves(): void {
        this.availableMoves = [];
        if (this.gameState == GameStates.Player1sTurn || this.gameState == GameStates.Player2sTurn) {
            var col: number;
            for (col = 0; col < Connect4Board.numCols; col++) {
                if (this.colHeight[col] < Connect4Board.numRows)
                    this.availableMoves.push(col);
            }
        }
    }
}