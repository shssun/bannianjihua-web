import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/styles/index.css';

/**
 * 应用入口：挂载根组件到 #root。
 * 若未找到 #root 容器则抛出明确错误，避免静默白屏。
 */
const container = document.getElementById('root');

if (!container) {
  throw new Error('未找到 #root 挂载节点，请检查 index.html');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
