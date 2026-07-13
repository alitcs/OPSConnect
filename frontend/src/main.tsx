import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './styles/global.css';

// NOTE: React.StrictMode is intentionally omitted. In development it double-invokes the
// mount/unmount/remount cycle, which the 3D connection graph's WebGL library
// (react-force-graph-3d) cannot survive — it throws internally ("reading 'tick'") and
// leaves a blank canvas that only a lucky refresh fixes. StrictMode has no effect on the
// production build, so dropping it changes nothing shipped while making the graph load
// reliably every time in dev.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
