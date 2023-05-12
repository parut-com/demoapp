import EventEmitter from 'events';
const app = new EventEmitter();

app.state = {};

app.setState = newState => {
  app.state = newState;
  app.emit('change');
}

export default app;
