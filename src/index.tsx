import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Changed this line

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App /> {/* Changed this line */}
  </React.StrictMode>
);
