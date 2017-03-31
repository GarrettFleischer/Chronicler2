import {List, Map, fromJS} from 'immutable';
import {NODE, LINK} from './nodes'

export function Enum(constantsList) {
    for (var i in constantsList) {
        this[constantsList[i]] = i;
    }
    Object.freeze(this);
}

export function FindPathToId(state, id) {
    return FindPathRecursive(state, id, List());
}

// Recursively searches over the state until it finds an element with a matching Id.
// Returns the substate with the id, or null if not found.
/**
 * @return {null}
 */
export function FindById(state, id) {
    const path = FindPathToId(state, id);
    return path ? state.getIn(path) : null;
}

// Recursively searches over the state until it finds all nodes that have a link to the given Id.
// Returns a list of the nodes that link to the id.
export function FindParents(state, id) {
    let found = List();

    switch (state.get('Type'))
    {
        case NODE.BASE:
            state.get('Scenes').forEach((scene) => {
                found = found.concat(FindParents(scene, id));
            });
            break;

        case NODE.SCENE:
            if (state.get('Nodes') !== null) {
                state.get('Nodes').forEach((node) => {
                    found = found.concat(FindParents(node, id));
                });
            }
            break;

        case NODE.NODE:
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

// Recursively searches over the actions of the node with the given id.
// Returns a list of the nodes that are linked to from the given node id.
export function FindChildren(state, id) {
    return FindChildrenRecursive(state, FindById(state, id));
}

// Recursively searches over the state until it finds the scene containing the given id.
// Returns the scene containing the given id.
export function FindSceneContainingId(state, id) {
    let found = null;

    switch (state.get('Type')) {
        case NODE.BASE:
            state.get('Scenes').forEach((scene) => {
                found = FindSceneContainingId(scene, id);
                return !found;
            });
            break;

        case NODE.SCENE:
            if (state.get('Nodes') !== null) {
                state.get('Nodes').forEach((node) => {
                    if (node.get('Id') === id) {
                        found = state;
                    } else if (node.get('Actions') !== null) {
                        node.get('Actions').forEach((action) => {
                            if (action.get('Type') === NODE.LABEL && action.get('Id') === id)
                                found = state;
                            return !found;
                        });
                    }
                    return !found;
                });
            }
            break;
    }

    return found;
}

export function CalculateCoords(state) {
    let newState = state;

    state.get('Scenes').forEach((scene) => {

    })

    return newState;
}

// Helper function for FindPathToId
function FindPathRecursive(state, id, currentPath) {
    let found = null;

    switch (state.get('Type')) {
        case NODE.BASE:
            state.get('Scenes').forEach((scene, sceneIndex) => {
                found = FindPathRecursive(scene, id, List.of('Scenes', sceneIndex));
                return !found;
            });
            break;

        case NODE.SCENE:
            if (state.get('Id') === id) {
                found = currentPath;
            } else if (state.get('Nodes') !== null) {
                state.get('Nodes').forEach((node, nodeIndex) => {
                    found = FindPathRecursive(node, id, currentPath.concat(['Nodes', nodeIndex]));
                    return !found;
                });
            }
            break;

        case NODE.NODE:
            if (state.get('Id') === id) {
                found = currentPath;
            } else if (state.get('Actions') !== null) {
                state.get('Actions').forEach((action, actionIndex) => {
                    found = FindPathRecursive(action, id, currentPath.concat(['Actions', actionIndex]));
                    return !found;
                });
            }
            break;

        case NODE.LABEL:
            if (state.get('Id') === id) {
                found = currentPath;
            }
            break;
    }

    return found;
}

// Helper function for FindParents
/**
 * @return {boolean}
 */
function LinksToId(actionState, id) {
    let found = false;

    switch (actionState.get('Type'))
    {
        case NODE.CHOICE:
            if (actionState.get('Links') !== null) {
                actionState.get('Links').forEach((link) => {
                    if (link.get('LinkId') === id)
                        found = true;
                    return !found;
                });
            }
            break;

        case NODE.GOTO:
        case NODE.GOTO_SCENE:
        case NODE.GOSUB:
        case NODE.GOSUB_SCENE:
        case NODE.NEXT:
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
        case NODE.NODE:
            if (substate.get('Actions') !== null) {
                substate.get('Actions').forEach((action) => {
                    found = found.concat(FindChildrenRecursive(state, action));
                });
            }
            break;

        case NODE.CHOICE:
            if (substate.get('Links') !== null) {
                substate.get('Links').forEach((link) => {
                    found = found.push(FindById(state, link.get('LinkId')));
                });
            }
            break;

        case NODE.GOTO:
        case NODE.GOTO_SCENE:
        case NODE.GOSUB:
        case NODE.GOSUB_SCENE:
        case NODE.NEXT:
            found = found.push(FindById(state, substate.get('LinkId')));
            break;
    }

    return found;
}
