
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for debugging white screens
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Terjadi Kesalahan (Runtime Error)</h2>
      <p>${message}</p>
      <small>${source}:${lineno}</small>
    </div>`;
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
