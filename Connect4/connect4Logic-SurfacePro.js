var Connect4Board = (function () {
    function Connect4Board(src, nextMove) {
        this.turnsCompleted = 0;
        this.gameState = 0;
        if (!src) {
            var i;
            (this.pieces = []).length = Connect4Board.numRows * Connect4Board.numCols;
            for (i = 0; i < Connect4Board.numRows * Connect4Board.numCols; i++) {
                this.pieces[i] = -1;
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
                this.makeMove(nextMove);
            }
        }
    }
    Connect4Board.prototype.getPieceAt = function (row, column) {
        return this.pieces[row * Connect4Board.numCols + column];
    };
    Connect4Board.prototype.makeMove = function (column) {
        this.pieces[this.colHeight[column] * Connect4Board.numCols + column] = (this.turnsCompleted % 2) ? 1 : 0;
        this.colHeight[column] += 1;
        this.turnsCompleted++;
        if (this.turnsCompleted >= Connect4Board.threshold * 2 - 1) {
            this.checkForThresholdInARow(column);
        }
        if ((this.gameState == 0 || this.gameState == 1) && (this.turnsCompleted == Connect4Board.numRows * Connect4Board.numCols)) {
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
    Connect4Board.prototype.checkForThresholdInARow = function (column) {
        var connectionCount = 1;
        var row, col;
        var playerNum = (this.gameState == 0) ? 0 : 1;
        row = this.colHeight[column] - 2;
        while (row >= 0) {
            if (this.pieces[row * Connect4Board.numCols + column] == playerNum)
                connectionCount++;
            else
                break;
            row--;
        }
        if (connectionCount >= Connect4Board.threshold) {
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
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
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
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
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
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
            this.gameState = (this.gameState == 0) ? 3 : 4;
            return;
        }
    };
    Connect4Board.prototype.updateAvailableMoves = function () {
        this.availableMoves = [];
        if (this.gameState == 0 || this.gameState == 1) {
            var col;
            for (col = 0; col < Connect4Board.numCols; col++) {
                if (this.colHeight[col] < Connect4Board.numRows)
                    this.availableMoves.push(col);
            }
        }
    };
    Connect4Board.numRows = 6;
    Connect4Board.numCols = 7;
    Connect4Board.threshold = 4;
    return Connect4Board;
})();
