import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';
import {AppComponent} from './App.component';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppComponent/>
    </StrictMode>,
);
