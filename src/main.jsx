import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-phone-input-2/lib/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';
import "./ClientOnboarding/styles/fonts.css";
import "./index.css";
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { toastConfig } from './utils/toastConfig';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/seqwens-frontend">
      <App />
      <ToastContainer {...toastConfig} />
    </BrowserRouter>
  </React.StrictMode>
);
