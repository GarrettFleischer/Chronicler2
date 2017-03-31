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

export function CalculateCoords(state, minDist) {
    const friction = 0.1;
    const threshold = 0.1;
    let newState = state;
    let visited = List();
    let done = false;

    while(!done) {
        done = true;
        state.get('Scenes').forEach((scene) => {
            scene.get('Nodes').forEach((node) => {
                if (!visited.contains(node.get('Id'))) {
                    visited = visited.push(node.get('Id'));
                    const parents = FindParents(state, node.get('Id'));
                    const children = FindChildren(state, node.get('Id'));
                    let x = node.get('X');
                    let y = node.get('Y');
                    const ix = x;
                    const iy = y;

                    parents.forEach((child) => {
                        const cx = child.get('X');
                        const cy = child.get('Y');
                        const dx = (cx - x) + Math.sign(cx - x) * minDist;
                        const dy = (cy - y) + Math.sign(cy - y) * minDist;
                        x += dx * friction;
                        y += dy * friction;
                    });
                    children.forEach((child) => {
                        const cx = child.get('X');
                        const cy = child.get('Y');
                        const dx = (cx - x) + Math.sign(cx - x) * minDist;
                        const dy = (cy - y) + Math.sign(cy - y) * minDist;
                        x += dx * friction;
                        y += dy * friction;
                    });

                    if (Math.abs(ix - x) > threshold || Math.abs(iy - y) > threshold)
                        done = false;

                    const path = FindPathToId(state, node.get('Id'));
                    newState = newState.setIn(path.push('X'), x);
                    newState = newState.setIn(path.push('Y'), y);
                }
            });
        });
    }

    return newState;
}

// export function CalculateCoords(state, colWidth, rowHeight, offset = 0) {
//     let newState = state;
//     let visited = List();
//
//     state.get('Scenes').forEach((scene) => {
//         scene.get('Nodes').forEach((node) => {
//             if (!visited.contains(node.get('Id'))) {
//                 visited = visited.push(node.get('Id'));
//                 const children = FindChildren(state, node.get('Id'));
//                 const width = CalculateWidth(state, node);
//                 const path = FindPathToId(node.get('Id'));
//                 newState.setIn(path.push('X'), )
//             }
//         });
//     });
//
//     return newState;
// }

/**
 * @return {boolean}
 */
function ContainsLoop(state, id, substate = null, visited = List()) {
    const children = FindChildren(state, substate ? substate.get('Id') : id);
    children.forEach((child) => {
        if(child.get('Id') === id)
            return true;
        if(!visited.contains(substate.get('Id')))
            return ContainsLoop(state, id, child, visited.push(substate.get('Id')));
    });

    return false;
}

/**
 * @return {number}
 */
function CalculateWidth(state, substate) {
    let width = 0;

    const children = FindChildren(state, substate.get('Id'));
    if(children.length > 1) {
        children.forEach((child) => {
            const parents = FindParents(state, child.get('Id'));
            if(parents.length === 1)
                width += CalculateWidth(state, child);
        });
    }

    return width;
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

    if(substate) {
        switch (substate.get('Type')) {
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
                        const linkedNode = FindById(state, link.get('LinkId'));
                        if (linkedNode) found = found.push(linkedNode);
                    });
                }
                break;

            case NODE.GOTO:
            case NODE.GOTO_SCENE:
            case NODE.GOSUB:
            case NODE.GOSUB_SCENE:
            case NODE.NEXT:
                const linkedNode = FindById(state, substate.get('LinkId'));
                if (linkedNode) found = found.push(linkedNode);
                break;
        }
    }

    return found;
}
