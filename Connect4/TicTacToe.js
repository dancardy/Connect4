var TicTacToeBoard = (function () {
    function TicTacToeBoard(src, nextMove) {
        this.turnsCompleted = 0;
        this.gameState = 0;
        if (!src) {
            var i, j;
            (this.pieces = []).length = TicTacToeBoard.numRows;
            for (i = 0; i < TicTacToeBoard.numRows; i++) {
                (this.pieces[i] = []).length = TicTacToeBoard.numCols;
                for (j = 0; j < TicTacToeBoard.numCols; j++) {
                    this.pieces[i][j] = -1;
                }
            }
            this.updateAvailableMoves();
        }
        else {
            var i, j;
            (this.pieces = []).length = TicTacToeBoard.numRows;
            for (i = 0; i < TicTacToeBoard.numRows; i++) {
                (this.pieces[i] = []).length = TicTacToeBoard.numCols;
                for (j = 0; j < TicTacToeBoard.numCols; j++) {
                    this.pieces[i][j] = src.pieces[i][j];
                }
            }
            this.turnsCompleted = src.turnsCompleted;
            this.gameState = src.gameState;
            if (typeof nextMove === "undefined") {
                this.updateAvailableMoves();
            }
            else {
                this.makeMove(nextMove);
            }
        }
    }
    TicTacToeBoard.prototype.makeMove = function (spaceNumber) {
        if (this.gameState == 0) {
            this.pieces[Math.floor(spaceNumber / 3)][spaceNumber % 3] = 0;
            this.turnsCompleted++;
        }
        else if (this.gameState == 1) {
            this.pieces[Math.floor(spaceNumber / 3)][spaceNumber % 3] = 1;
            this.turnsCompleted++;
        }
        else {
            alert('error - addPiece called when game is not still in play.');
            return;
        }
        if (this.turnsCompleted >= TicTacToeBoard.threshold * 2 - 1) {
            this.checkForThresholdInARow(spaceNumber);
        }
        if ((this.gameState == 0 || this.gameState == 1) && (this.turnsCompleted == TicTacToeBoard.numRows * TicTacToeBoard.numCols)) {
            this.gameState = 5;
        }
        else if (this.gameState == 0) {
            this.gameState = 1;
        }
        else if (this.gameState == 1) {
            this.gameState = 0;
        }
        this.updateAvailableMoves();
    };
    TicTacToeBoard.prototype.checkForThresholdInARow = function (spaceNumber) {
        var connectionCount = 0;
        var row, col;
        var playerNum = (this.gameState == 0) ? 0 : 1;
        var spaceNumberRow = Math.floor(spaceNumber / 3);
        var spaceNumberCol = spaceNumber % 3;
        row = 0;
        col = spaceNumberCol;
        while (row < TicTacToeBoard.numRows) {
            if (this.pieces[row][col] == playerNum)
                connectionCount++;
            else
                break;
            row++;
        }
        if (connectionCount >= TicTacToeBoard.threshold) {
            if (this.gameState == 0)
                this.gameState = 3;
            else
                this.gameState = 4;
            return;
        }
        connectionCount = 0;
        row = spaceNumberRow;
        col = 0;
        while (col < TicTacToeBoard.numCols) {
            if (this.pieces[row][col] == playerNum)
                connectionCount++;
            else
                break;
            col++;
        }
        if (connectionCount >= TicTacToeBoard.threshold) {
            if (this.gameState == 0)
                this.gameState = 3;
            else
                this.gameState = 4;
            return;
        }
        connectionCount = 0;
        row = 2;
        col = 0;
        while ((row >= 0) && (col < TicTacToeBoard.numCols)) {
            if (this.pieces[row][col] == playerNum)
                connectionCount++;
            else
                break;
            row--;
            col++;
        }
        if (connectionCount >= TicTacToeBoard.threshold) {
            if (this.gameState == 0)
                this.gameState = 3;
            else
                this.gameState = 4;
            return;
        }
        connectionCount = 0;
        row = 0;
        col = 0;
        while ((row < TicTacToeBoard.numRows) && (col < TicTacToeBoard.numCols)) {
            if (this.pieces[row][col] == playerNum)
                connectionCount++;
            else
                break;
            row++;
            col++;
        }
        if (connectionCount >= TicTacToeBoard.threshold) {
            if (this.gameState == 0)
                this.gameState = 3;
            else
                this.gameState = 4;
            return;
        }
    };
    TicTacToeBoard.prototype.updateAvailableMoves = function () {
        this.availableMoves = [];
        if (this.gameState == 0 || this.gameState == 1) {
            var row, col;
            for (row = 0; row < TicTacToeBoard.numRows; row++) {
                for (col = 0; col < TicTacToeBoard.numCols; col++) {
                    if (this.pieces[row][col] == -1)
                        this.availableMoves.push(3 * row + col);
                }
            }
        }
    };
    TicTacToeBoard.numRows = 3;
    TicTacToeBoard.numCols = 3;
    TicTacToeBoard.threshold = 3;
    return TicTacToeBoard;
})();
