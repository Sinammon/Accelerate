import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './app.css';
import { applyTheme, initialTheme } from './theme.js';

// Mount our homepage inside the root div in index.html.
applyTheme(initialTheme());
createRoot(document.getElementById('root')).render(<App />);
