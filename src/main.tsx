import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { getEdition } from './config/editions';
import './styles/global.css';

// 运行时按版别设置文档标题
const edition = getEdition();
document.title = edition.brandName;

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root mount element');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
