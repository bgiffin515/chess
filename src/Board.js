import React, { useEffect, useState } from 'react';
import './Board.css';

const pieces = {
    'r': '\u265C', // Black Rook
    'n': '\u265E', // Black Knight
    'b': '\u265D', // Black Bishop
    'q': '\u265B', // Black Queen
    'k': '\u265A', // Black King
    'p': '\u265F', // Black Pawn
    'R': '\u2656', // White Rook
    'N': '\u2658', // White Knight
    'B': '\u2657', // White Bishop
    'Q': '\u2655', // White Queen
    'K': '\u2654', // White King
    'P': '\u2659'  // White Pawn
};

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

function Board() {
    const [boardState, setBoardState] = useState(initialBoard);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [turn, setTurn] = useState('white');
    const [customMessage, setCustomMessage] = useState(null);

    const handleSquareClick = (row, col) => {
        const clickedPiece = boardState[row][col];
        if (selectedPiece) {
            attemptMove(row, col);
        } else if (clickedPiece && isPieceOwnedByCurrentPlayer(clickedPiece)) {
            setSelectedPiece({ row, col, piece: clickedPiece });
        }
    };

    const isPieceOwnedByCurrentPlayer = (piece) => {
        return (turn === 'white' && piece === piece.toUpperCase()) ||
               (turn === 'black' && piece === piece.toLowerCase());
    };

    const attemptMove = (targetRow, targetCol) => {
        if (!selectedPiece) return;

        const { row, col, piece } = selectedPiece;
        const isValid = validateMove(row, col, targetRow, targetCol, piece);

        if (isValid) {
            const newBoard = boardState.map(row => [...row]);
            newBoard[targetRow][targetCol] = piece;
            newBoard[row][col] = null;

            setBoardState(newBoard);
            setSelectedPiece(null);
            setTurn(turn === 'white' ? 'black' : 'white');
            setCustomMessage(null); // Clear any custom messages
        } else {
            setCustomMessage('Invalid move! Try again.');
            setTimeout(() => setCustomMessage(null), 3000); // Clear message after 3 seconds
        }
    };

    const validateMove = (startRow, startCol, endRow, endCol, piece) => {
        const targetPiece = boardState[endRow][endCol];
        const isSameTeam = targetPiece &&
            ((piece === piece.toUpperCase() && targetPiece === targetPiece.toUpperCase()) ||
            (piece === piece.toLowerCase() && targetPiece === targetPiece.toLowerCase()));

        if (isSameTeam) return false; // Cannot capture your own pieces

        switch (piece.toLowerCase()) {
            case 'p': // Pawn
                return validatePawnMove(startRow, startCol, endRow, endCol, piece);
            case 'r': // Rook
                return validateRookMove(startRow, startCol, endRow, endCol);
            case 'n': // Knight
                return validateKnightMove(startRow, startCol, endRow, endCol);
            case 'b': // Bishop
                return validateBishopMove(startRow, startCol, endRow, endCol);
            case 'q': // Queen
                return validateQueenMove(startRow, startCol, endRow, endCol);
            case 'k': // King
                return validateKingMove(startRow, startCol, endRow, endCol);
            default:
                return false;
        }
    };

    const validatePawnMove = (startRow, startCol, endRow, endCol, piece) => {
        const direction = piece === 'P' ? -1 : 1;
        const startRowForPawn = piece === 'P' ? 6 : 1;

        if (endCol === startCol) {
            // Moving forward
            if (endRow === startRow + direction && !boardState[endRow][endCol]) {
                return true;
            }
            // Double step from starting position
            if (startRow === startRowForPawn && endRow === startRow + 2 * direction && 
                !boardState[startRow + direction][endCol] && !boardState[endRow][endCol]) {
                return true;
            }
        } else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction) {
            // Capturing diagonally
            if (boardState[endRow][endCol]) return true;
        }
        return false;
    };

    const validateRookMove = (startRow, startCol, endRow, endCol) => {
        if (startRow !== endRow && startCol !== endCol) return false; // Must move in a straight line

        const rowDirection = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
        const colDirection = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;

        let currentRow = startRow + rowDirection;
        let currentCol = startCol + colDirection;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (boardState[currentRow][currentCol]) return false; // Path is blocked
            currentRow += rowDirection;
            currentCol += colDirection;
        }
        return true;
    };

    const validateKnightMove = (startRow, startCol, endRow, endCol) => {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);

        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    };

    const validateBishopMove = (startRow, startCol, endRow, endCol) => {
        if (Math.abs(startRow - endRow) !== Math.abs(startCol - endCol)) return false; // Must move diagonally

        const rowDirection = endRow > startRow ? 1 : -1;
        const colDirection = endCol > startCol ? 1 : -1;

        let currentRow = startRow + rowDirection;
        let currentCol = startCol + colDirection;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (boardState[currentRow][currentCol]) return false; // Path is blocked
            currentRow += rowDirection;
            currentCol += colDirection;
        }
        return true;
    };

    const validateQueenMove = (startRow, startCol, endRow, endCol) => {
        return validateRookMove(startRow, startCol, endRow, endCol) || 
               validateBishopMove(startRow, startCol, endRow, endCol);
    };

    const validateKingMove = (startRow, startCol, endRow, endCol) => {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);
        return rowDiff <= 1 && colDiff <= 1; // King moves 1 square in any direction
    };

    return (
        <div className="App" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            <h1>AI Chess Game</h1>
            {customMessage && <div className="custom-message" style={{ color: 'blue', marginBottom: '10px' }}>{customMessage}</div>}
            <div id="chessboard" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 60px)',
                gridTemplateRows: 'repeat(8, 60px)',
                border: '2px solid #333',
                margin: '20px'
            }}>
                {boardState.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'} ${selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex ? 'selected' : ''}`}
                            onClick={() => handleSquareClick(rowIndex, colIndex)}
                        >
                            {cell && <div className="piece">{pieces[cell]}</div>}
                        </div>
                    ))
                ))}
            </div>
        </div>
    );
}

export default Board;
