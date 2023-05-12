import { h, Component, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import HomePage from './pages/HomePage.jsx';
import app from './app/index.js';
import AppContext from './contexts/AppContext.jsx';

const App = () => {
  const [state, setState] = useState(app.state);

  useEffect(() => {
    app.addListener('change', () => {
      setState({...app.state});
    });
    setState({...app.state});
    return () => {
      app.removeListener('change', setState);
    }
  }, []);

  if (window.location.pathname === '/') {
    return (
      <AppContext.Provider value={state}>
        <HomePage />
      </AppContext.Provider>
    )
  }
};

render(<App />, document.getElementById('app'));
