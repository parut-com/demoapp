import { h, Component, render } from 'preact';
import Menu from '../components/Menu.jsx';
import { useContext } from 'preact/hooks';
import AppContext from '../contexts/AppContext.jsx';

function NotesList({ notes }) {
  if (!notes) {
    return (
      <main>
        Login to see your notes.
      </main>
    );
  }

  return (
    <main>
      <h1>Notes</h1>
      <p>Here are your notes:</p>
      <ul>
        {notes.map(note => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
    </main>
  );
}

const HomePage = () => {
  const state = useContext(AppContext);

  return (
    <aside>
      <Menu />
      <NotesList notes={state.notes} />
    </aside>
  );
};

export default HomePage;
