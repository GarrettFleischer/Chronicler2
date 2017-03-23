import {List, Map, fromJS} from 'immutable';
import {TYPE, LINK_TYPE} from '../nodes'


// Recursively iterates over the state until it finds
// an element with a matching Id.
// Returns the substate with the id, or null if not found.
export function FindById(state, id) {
  let found = null;

  switch (state.get('Type'))
  {
    case TYPE.BASE:
      state.get('Scenes').forEach((scene) => {
        found = FindById(scene, id);
        return !found;
      });
    break;

    case TYPE.SCENE:
      if (state.get('Id') === id) {
        found = state;
      } else if (state.get('Nodes') !== null) {
        state.get('Nodes').forEach((node) => {
          found = FindById(node, id);
          return !found;
        });
      }
    break;

    case TYPE.NODE:
      if (state.get('Id') === id) {
        found = state;
      } else if (state.get('Actions') !== null) {
        state.get('Actions').forEach((action) => {
          found = FindById(action, id);
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

// Recursively iterates over the state until it finds
// all nodes that have a link to the given Id.
// Returns a list of the nodes that link to the id.
export function FindParents(state, id) {
  let found = List();

  switch (state.get('Type'))
  {
    case TYPE.BASE:
      state.get('Scenes').forEach((scene) => {
        let retval = FindParents(scene, id);
        found = found.concat(retval);
      });
    break;

    case TYPE.SCENE:
      if (state.get('Nodes') !== null) {
        state.get('Nodes').forEach((node) => {
          let retval = FindParents(node, id);
          found = found.concat(retval);
        });
      }
    break;

    case TYPE.NODE:
      if (state.get('Actions') !== null) {
        state.get('Actions').forEach((action) => {
          if (LinksToId(action, id)) {
            found = found.push(state);
            return false;
          }
        });
      }
    break;
  }

  return found;
}

// Recursively iterates over the actions of the node with the given id.
// Returns a list of the nodes that are linked to from the given node id.
export function FindChildren(state, id) {
  return FindChildrenRecursive(state, FindById(state, id));
};

// Helper function for FindConnections
function LinksToId(actionState, id) {
  let found = false;

  switch (actionState.get('Type'))
  {
    case TYPE.CHOICE:
      if (actionState.get('Links') !== null) {
        actionState.get('Links').forEach((link) => {
          if (link.get('LinkId') === id)
            found = true;
          return !found;
        });
      }
    break;

    case TYPE.GOTO:
    case TYPE.GOTO_SCENE:
    case TYPE.GOSUB:
    case TYPE.GOSUB_SCENE:
    case TYPE.NEXT:
      if (actionState.get('LinkId') === id)
        found = true;
    break;
  }

  return found;
}

// Helper function for FindChildren
function FindChildrenRecursive(state, substate) {
  let found = List();

  switch (substate.get('Type'))
  {
    case TYPE.NODE:
      if (substate.get('Actions') !== null) {
        substate.get('Actions').forEach((action) => {
          found = found.concat(FindChildrenRecursive(state, action));
        });
      }
    break;

    case TYPE.CHOICE:
      if (substate.get('Links') !== null) {
        substate.get('Links').forEach((link) => {
            found = found.push(FindById(state, link.get('LinkId')));
        });
      }
    break;

    case TYPE.GOTO:
    case TYPE.GOTO_SCENE:
    case TYPE.GOSUB:
    case TYPE.GOSUB_SCENE:
    case TYPE.NEXT:
        found = found.push(FindById(state, substate.get('LinkId')));
    break;
  }

  return found;
}
