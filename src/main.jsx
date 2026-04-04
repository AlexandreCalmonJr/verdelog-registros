import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Basic compatibility check for older browsers
try {
  console.log('VerdeIT: Initializing application...');
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error('VerdeIT: Critical initialization error:', error);
  // Show a simple error message on the screen if JS fails
  document.body.innerHTML = `
    <div style="padding: 20px; color: #ff4d6d; background: #0a0f0d; height: 100vh; font-family: sans-serif;">
      <h1 style="font-size: 1.5rem;">Erro de Compatibilidade</h1>
      <p>O navegador do seu tablet é muito antigo para rodar esta aplicação diretamente.</p>
      <p style="font-size: 0.8rem; color: #7aada0;">Erro: ${error.message}</p>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />
      <p style="font-weight: bold;">Sugestões:</p>
      <ul style="font-size: 0.9rem; line-height: 1.6;">
        <li>Atualize o <b>Android System WebView</b> na Play Store.</li>
        <li>Use o <b>Google Chrome</b> atualizado.</li>
        <li>Tente o navegador <b>Kiwi Browser</b>.</li>
      </ul>
    </div>
  `;
}
