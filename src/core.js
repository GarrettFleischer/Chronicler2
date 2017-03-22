import {List, Map} from 'immutable';
import {TYPE} from '../initial_state.js'


// Recursively iterates over the state until it finds
// an element with a matching Id.
// Returns the substate with the id, or null if not found.
export function findNode(state, id) {
  let found = null;

  switch (state.get('Type'))
  {
    case TYPE.BASE:
      state.get('Scenes').forEach((scene) => {
        found = findNode(scene, id);
        return !found;
      });
    break;

    case TYPE.SCENE:
      if (state.get('Id') === id) {
        found = state;
      } else if (state.has('Nodes')) {
        state.get('Nodes').forEach((node) => {
          found = findNode(node, id);
          return !found;
        });
      }
    break;

    case TYPE.NODE:
      if (state.get('Id') === id) {
        found = state;
      } else if (state.has('Actions')) {
        state.get('Actions').forEach((action) => {
          found = findNode(action, id);
          return !found;
        });
      }
    break;

    case TYPE.LABEL:
      if (state.get('Id') === id) {
        found = state;
      }
    break;
  }

  return found;
}
