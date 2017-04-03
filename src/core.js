import {List, Stack} from 'immutable';
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

export function CalculateCoords(state, colWidth, rowHeight) {
    let newState = state;

    newState.get('Scenes').forEach((scene) => {
        const startNode = scene.get('Nodes').get(0);

        let rows = BuildRows(state, startNode.get('Id'));
        const maxWidth = MaxWidth(rows);

        rows.forEach((row, y) => {
            const offset = maxWidth / (row.size + 1);
            row.forEach((id, x) => {
                const path = FindPathToId(state, id);
                newState = newState.setIn(path.push('X'), Math.round((x + offset) * colWidth));
                newState = newState.setIn(path.push('Y'), Math.round(y * rowHeight));
            });
        });
    });

    return newState;
}

/**
 * @return {boolean}
 */
export function ContainsLoop(state, id) {
    let stack = Stack.of(id);
    let visited = List();

    while (stack.size) {
        const top = stack.peek();
        stack = stack.pop();

        if (!visited.contains(top)) {
            visited = visited.push(top);

            const children = FindChildren(state, top);
            for (let i = 0; i < children.size; ++i) {
                if (children.getIn([i, 'Id']) === id)
                    return true;

                stack = stack.push(children.getIn([i, 'Id']));
            }
        }
    }

    return false;
}

function BuildRows(state, id) {
    let rows = List();

    let stack = Stack.of({Id: id, Row: 0});
    let visited = List();

    while (stack.size) {
        const top = stack.peek();
        stack = stack.pop();

        if(!visited.contains(top.Id)) {
            visited = visited.push(top.Id);

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
                            if (parent.get('Id') !== currentId)
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
 * @return {number}
 */
function RowOf(rows, id) {
    for (let y = 0; y < rows.size; ++y) {
        const row = rows.get(y);
        for (let x = 0; x < row.size; ++x) {
            if(row.get(x) === id)
                return y;
        }
    }

    return -1;
}

/**
 * @return {number}
 */
function MaxWidth(rows) {
    let width = 0;

    for(let y = 0; y < rows.size; ++y)
        width = Math.max(width, rows.get(y).size);

    return width;
}


//
// /**
//  * @return {number}
//  */
// function CalculateWidth(state, substate) {
//     let width = 0;
//
//     const children = FindChildren(state, substate.get('Id'));
//     if(children.size > 1) {
//         children.forEach((child) => {
//             const parents = FindParents(state, child.get('Id'));
//             if(parents.length === 1)
//                 width += CalculateWidth(state, child);
//         });
//     }
//
//     return width;
// }

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
