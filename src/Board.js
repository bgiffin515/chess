import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client'; // Import Socket.IO client
import './Board.css';

const socket = io('https://chess-server-p5zd.onrender.com'); // Replace with your deployed server URL if hosting remotely

const pieces = {
    'r': '\u265C', 'n': '\u265E', 'b': '\u265D', 'q': '\u265B', 'k': '\u265A', 'p': '\u265F',
    'R': '\u2656', 'N': '\u2658', 'B': '\u2657', 'Q': '\u2655', 'K': '\u2654', 'P': '\u2659'
};

function Board() {
    const [boardState, setBoardState] = useState([]);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [turn, setTurn] = useState('white');
    const [customMessage, setCustomMessage] = useState(null);

    useEffect(() => {
        console.log('Requesting initial game state...');
        socket.emit('requestGameState');

        // Listen for game state updates from the server
        socket.on('gameState', (gameState) => {
            console.log('Received game state:', gameState);
            setBoardState(gameState.board);
            setTurn(gameState.turn);
        });

        // Fallback to initial board state if no response is received within 3 seconds
        const timeout = setTimeout(() => {
            if (boardState.length === 0) {
                console.log('No response from server. Using initial board state.');
                setBoardState([
                    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
                    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
                    [null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null],
                    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
                ]);
                setTurn('white');
            }
        }, 3000);

        // Cleanup listeners and timeout on unmount
        return () => {
            socket.off('gameState');
            clearTimeout(timeout);
        };
    }, []);

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

            console.log('Emitting move:', {
                board: newBoard,
                turn: turn === 'white' ? 'black' : 'white'
            });

            // Emit the new state to the server
            socket.emit('move', {
                board: newBoard,
                turn: turn === 'white' ? 'black' : 'white'
            });

            setSelectedPiece(null);
            setCustomMessage(null);
        } else {
            setCustomMessage('Invalid move! Try again.');
            setTimeout(() => setCustomMessage(null), 3000);
        }
    };

    const validateMove = (startRow, startCol, endRow, endCol, piece) => {
        const targetPiece = boardState[endRow][endCol];
        const isSameTeam = targetPiece &&
            ((piece === piece.toUpperCase() && targetPiece === targetPiece.toUpperCase()) ||
            (piece === piece.toLowerCase() && targetPiece === targetPiece.toLowerCase()));

        if (isSameTeam) return false;

        switch (piece.toLowerCase()) {
            case 'p': return validatePawnMove(startRow, startCol, endRow, endCol, piece);
            case 'r': return validateRookMove(startRow, startCol, endRow, endCol);
            case 'n': return validateKnightMove(startRow, startCol, endRow, endCol);
            case 'b': return validateBishopMove(startRow, startCol, endRow, endCol);
            case 'q': return validateQueenMove(startRow, startCol, endRow, endCol);
            case 'k': return validateKingMove(startRow, startCol, endRow, endCol);
            default: return false;
        }
    };

    const validatePawnMove = (startRow, startCol, endRow, endCol, piece) => {
        const direction = piece === 'P' ? -1 : 1;
        const startRowForPawn = piece === 'P' ? 6 : 1;

        if (endCol === startCol) {
            if (endRow === startRow + direction && !boardState[endRow][endCol]) return true;
            if (startRow === startRowForPawn && endRow === startRow + 2 * direction &&
                !boardState[startRow + direction][endCol] && !boardState[endRow][endCol]) return true;
        } else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction) {
            if (boardState[endRow][endCol]) return true;
        }
        return false;
    };

    const validateRookMove = (startRow, startCol, endRow, endCol) => {
        if (startRow !== endRow && startCol !== endCol) return false;

        const rowDirection = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
        const colDirection = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;

        let currentRow = startRow + rowDirection;
        let currentCol = startCol + colDirection;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (boardState[currentRow][currentCol]) return false;
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
        if (Math.abs(startRow - endRow) !== Math.abs(startCol - endCol)) return false;

        const rowDirection = endRow > startRow ? 1 : -1;
        const colDirection = endCol > startCol ? 1 : -1;

        let currentRow = startRow + rowDirection;
        let currentCol = startCol + colDirection;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (boardState[currentRow][currentCol]) return false;
            currentRow += rowDirection;
            currentCol += colDirection;
        }
        return true;
    };

    const validateQueenMove = (startRow, startCol, endRow, endCol) => {
        return validateRookMove(startRow, startCol, endRow, endCol) || validateBishopMove(startRow, startCol, endRow, endCol);
    };

    const validateKingMove = (startRow, startCol, endRow, endCol) => {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);
        return rowDiff <= 1 && colDiff <= 1;
    };

    return (
        <div className="App" style={{ textAlign: 'center' }}>
            <h1>Multiplayer Chess</h1>
            {customMessage && <div className="custom-message" style={{ color: 'blue', marginBottom: '10px' }}>{customMessage}</div>}
            <div id="chessboard" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 60px)',
                gridTemplateRows: 'repeat(8, 60px)',
                margin: '0 auto'
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
