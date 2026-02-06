// src/App.js
import React from 'react';
import Chatbot from './Components/Chatbot';
// import PdfReader from './Components/PdfReader';
import './App.css'; // Include any necessary styles
// import PdfViewer from './Components/PdfViewer';
const App = () => {
    return (
        <div className="App">
            <h1>Chatbot</h1>
            <Chatbot />
            {/* <PdfReader />
            <PdfViewer /> */}
           
        </div>
    );
};

export default App;
