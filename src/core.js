import {List, Stack} from 'immutable';
import {NodeType, LinkType} from './nodes'

export function Enum(constantsList) {
    for (var i in constantsList) {
        this[constantsList[i]] = i;
    }
    Object.freeze(this);
}

/**
 * @brief   public function to find the path through the map to the given id
 * @param   state
 * @param   id
 * @returns {*}
 * @constructor
 */
export function FindPathToId(state, id) {
    return FindPathRecursive(state, id, List());
}

/**
 * @brief   Recursively searches over the state until it finds an element with a matching Id.
 *          Returns the substate with the id, or null if not found.
 * @param   state   the current state
 * @param   id      the id of node to find
 * @returns {null|*}
 * @constructor
 */
export function FindById(state, id) {
    const path = FindPathToId(state, id);
    return path ? state.getIn(path) : null;
}

/**
 * @brief   Recursively searches over the state until it finds all nodes that have a link to the given Id.
 *          Returns a list of the nodes that link to the id.
 * @param   state   the current state
 * @param   id      the id of the node to find the parents of
 * @returns {List<NodeType>}
 * @constructor
 */
export function FindParents(state, id) {
    let found = List();

    switch (state.get('Type'))
    {
        case NodeType.BASE:
            state.get('Scenes').forEach((scene) => {
                found = found.concat(FindParents(scene, id));
            });
            break;

        case NodeType.SCENE:
            if (state.get('Nodes') !== null) {
                state.get('Nodes').forEach((node) => {
                    found = found.concat(FindParents(node, id));
                });
            }
            break;

        case NodeType.NODE:
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

//
//
/**
 * @brief   Recursively searches over the actions of the node with the given id.
 *          Returns a list of the nodes that are linked to from the given node id.
 * @param   state   the current state
 * @param   id      the id of the node to find the children of
 * @returns {list<Map>}
 * @constructor
 */
export function FindChildren(state, id) {
    return FindChildrenRecursive(state, FindById(state, id));
}

/**
 * @brief   Recursively searches over the state until it finds the scene containing the given id.
 *          Returns the scene containing the given id.
 * @param state
 * @param id
 * @returns {*}
 * @constructor
 */
export function FindSceneContainingId(state, id) {
    let found = null;

    switch (state.get('Type')) {
        case NodeType.BASE:
            state.get('Scenes').forEach((scene) => {
                found = FindSceneContainingId(scene, id);
                return !found;
            });
            break;

        case NodeType.SCENE:
            if (state.get('Nodes') !== null) {
                state.get('Nodes').forEach((node) => {
                    if (node.get('Id') === id) {
                        found = state;
                    } else if (node.get('Actions') !== null) {
                        node.get('Actions').forEach((action) => {
                            if (action.get('Type') === NodeType.LABEL && action.get('Id') === id)
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

/**
 * @brief   Based on the connections, updates the rows that nodes should be in
 *          Returns the updated state
 * @param   state
 * @returns {*}
 * @constructor
 */
export function UpdateNodeRows(state) {
    let newState = state;

    newState.get('Scenes').forEach((scene) => {
        const startNode = scene.get('Nodes').get(0);

        let rows = BuildRows(state, startNode.get('Id'));

        rows.forEach((row, y) => {
            row.forEach((id, x) => {
                const path = FindPathToId(state, id);
                newState = newState.setIn(path.push('X'), x);
                newState = newState.setIn(path.push('Y'), y);
            });
        });
    });

    return newState;
}

/**
 * @brief   Searches over the state using iterative recursion starting at the given id.
 *          Returns true if there is a path that loops back to the given id.
 * @param   state
 * @param   nodeId
 * @returns {boolean}
 * @constructor
 */
export function ContainsLoop(state, nodeId) {
    let stack = Stack.of(nodeId);
    let visited = List();

    while (stack.size) {
        const top = stack.peek();
        stack = stack.pop();

        if (!visited.contains(top)) {
            visited = visited.push(top);

            const children = FindChildren(state, top);
            for (let i = 0; i < children.size; ++i) {
                if (children.getIn([i, 'Id']) === nodeId)
                    return true;

                stack = stack.push(children.getIn([i, 'Id']));
            }
        }
    }

    return false;
}

/**
 * @brief   Helper function for UpdateNodeRows
 * @param   state
 * @param   nodeId
 * @returns {*}
 * @constructor
 */
function BuildRows(state, nodeId) {
    let rows = List();

    let stack = Stack.of({Id: nodeId, Row: 0});
    let visited = List();

    while (stack.size) {
        const top = stack.peek();
        stack = stack.pop();

        if(!visited.contains(top.Id)) {
            visited = visited.push(top.Id);

            // add rows to list of rows if there is less rows than the position of the node
            while (top.Row >= rows.size) rows = rows.push(List());
            let currentRow = rows.get(top.Row);
            currentRow = currentRow.push(top.Id);
            rows = rows.set(top.Row, currentRow);

            const children = FindChildren(state, top.Id);
            for (let i = children.size - 1; i >= 0; --i) {
                stack = stack.push({Id: children.get(i).get('Id'), Row: top.Row + 1});
            }
        }
    }

    return HandleMultipleParents(state, rows);
}

/**
 * @brief   Helper function for BuildRows
 * @param   state
 * @param   rows
 * @returns {*}
 * @constructor
 */
function HandleMultipleParents(state, rows) {
    let newRows = rows;
    let done = false;
    let visited = List();

    // reset iteration whenever a change is made
    while (!done) {
        done = true;

        for (let y = 0; y < newRows.size && done; ++y) {
            let row = newRows.get(y);

            for (let x = 0; x < row.size && done; ++x) {
                const currentId = row.get(x);

                // ignore this node if already processed
                if (!visited.contains(currentId)) {
                    visited = visited.push(currentId);

                    // if (!ContainsLoop(state, currentId)) {
                        // calc max parent row + 1
                        const parents = FindParents(state, currentId);
                        let newY = y;
                        parents.forEach((parent) => {
                            const below = IsBelow(newRows, currentId, parent.get('Id'));
                            if (parent.get('Id') !== currentId && below)
                                newY = Math.max(newY, RowOf(newRows, parent.get('Id')) + 1);
                        });

                        if (newY !== y) {
                            done = false;
                            while (newY >= newRows.size) newRows = newRows.push(List());
                            let newRow = newRows.get(newY).push(currentId);
                            row = row.delete(x);
                            newRows = newRows.set(y, row);
                            newRows = newRows.set(newY, newRow);
                        }
                    // }
                }
            }
        }
    }

    return newRows;
}

/**
 * @brief   Helper function for HandleMultipleParents
 * @param   rows
 * @param   childId
 * @param   parentId
 * @returns {boolean}
 * @constructor
 */
function IsBelow(rows, childId, parentId) {
    for (let y = 0; y < rows.size; ++y) {
        const row = rows.get(y);
        let foundParent = false;
        // find the parent in the row
        for (let x = 0; x < row.size; ++x) {
            const id = row.get(x);
            if(id === parentId) foundParent = true;
        }
        // find the child in the row
        for (let x = 0; x < row.size; ++x) {
            const id = row.get(x);
            if(id === childId && !foundParent) return false;
        }
        if(foundParent) return true;
    }

    return false;
}

/**
 * @brief   Helper function for BuildRows
 * @param   rows
 * @param   nodeId
 * @returns {number}
 * @constructor
 */
function RowOf(rows, nodeId) {
    for (let y = 0; y < rows.size; ++y) {
        const row = rows.get(y);
        for (let x = 0; x < row.size; ++x) {
            if(row.get(x) === nodeId)
                return y;
        }
    }

    return -1;
}

/**
 * @brief   Helper function for FindPathToId
 * @param   state
 * @param   id
 * @param   currentPath
 * @returns {null|Map}
 * @constructor
 */
function FindPathRecursive(state, id, currentPath) {
    let found = null;

    switch (state.get('Type')) {
        case NodeType.BASE:
            state.get('Scenes').forEach((scene, sceneIndex) => {
                found = FindPathRecursive(scene, id, List.of('Scenes', sceneIndex));
                return !found;
            });
            break;

        case NodeType.SCENE:
            if (state.get('Id') === id) {
                found = currentPath;
            } else if (state.get('Nodes') !== null) {
                state.get('Nodes').forEach((node, nodeIndex) => {
                    found = FindPathRecursive(node, id, currentPath.concat(['Nodes', nodeIndex]));
                    return !found;
                });
            }
            break;

        case NodeType.NODE:
            if (state.get('Id') === id) {
                found = currentPath;
            } else if (state.get('Actions') !== null) {
                state.get('Actions').forEach((action, actionIndex) => {
                    found = FindPathRecursive(action, id, currentPath.concat(['Actions', actionIndex]));
                    return !found;
                });
            }
            break;

        case NodeType.LABEL:
            if (state.get('Id') === id) {
                found = currentPath;
            }
            break;
    }

    return found;
}

/**
 * @brief   Helper function for FindParents
 * @param   actionState
 * @param   id
 * @returns {boolean}
 * @constructor
 */
function LinksToId(actionState, id) {
    let found = false;

    switch (actionState.get('Type'))
    {
        case NodeType.CHOICE:
            if (actionState.get('Links') !== null) {
                actionState.get('Links').forEach((link) => {
                    if (link.get('LinkId') === id)
                        found = true;
                    return !found;
                });
            }
            break;

        case NodeType.GOTO:
        case NodeType.GOTO_SCENE:
        case NodeType.GOSUB:
        case NodeType.GOSUB_SCENE:
        case NodeType.NEXT:
            if (actionState.get('LinkId') === id)
                found = true;
            break;
    }

    return found;
}

// Helper function for FindChildren
function FindChildrenRecursive(state, substate) {
    let found = List();

    switch (substate.get('Type')) {
        case NodeType.NODE:
            if (substate.get('Actions') !== null) {
                substate.get('Actions').forEach((action) => {
                    found = found.concat(FindChildrenRecursive(state, action));
                });
            }
            break;

        case NodeType.CHOICE:
            if (substate.get('Links') !== null) {
                substate.get('Links').forEach((link) => {
                    const linkedNode = FindById(state, link.get('LinkId'));
                    if (linkedNode) found = found.push(linkedNode);
                });
            }
            break;

        case NodeType.GOTO:
        case NodeType.GOTO_SCENE:
        case NodeType.GOSUB:
        case NodeType.GOSUB_SCENE:
        case NodeType.NEXT:
            const linkedNode = FindById(state, substate.get('LinkId'));
            if (linkedNode) found = found.push(linkedNode);
            break;
    }

    return found;
}


// function sign(x) {
//     return x < 0 ? -1 : 1;
// }
//
// function getRandomInt(min, max) {
//     min = Math.ceil(min);
//     max = Math.floor(max);
//     return Math.floor(Math.random() * (max - min)) + min;
// }
