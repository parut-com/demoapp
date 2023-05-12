import { h, Component } from 'preact';
import { useContext } from 'preact/hooks';
import auth from '../services/auth.js';
import AppContext from '../contexts/AppContext.jsx';

const Menu = () => {
  const state = useContext(AppContext);
  return (
    <nav>
      <ul>
        <li class="active" style={{ flexGrow: 1 }}><a href="/">My Notes</a></li>
        {state.session
          ? (
            <>
              <li>
                {state.session.email}
              </li>
              <li>
                <li><a onClick={auth.logout}>Logout</a></li>
              </li>
            </>
          )
          : (
            <>
              <li><a onClick={auth.login}>Login</a></li>
              <li><a href="/join">Join</a></li>
            </>
          )}
      </ul>
    </nav>
  )
}

export default Menu;
