import React, { useState } from 'react';
import Board from './Board.js'; // Import the Board component
import './App.css';

function App() {
    const [showBoard, setShowBoard] = useState(false);

    return (
        <div className="App">
            {!showBoard ? (
                <header className="App-header">
                    <h1>Welcome to AI Chess Game</h1>
                    <button onClick={() => setShowBoard(true)}>
                        Go to Chess Board
                    </button>
                </header>
            ) : (
                <Board />
            )}
        </div>
    );
}

export default App;
