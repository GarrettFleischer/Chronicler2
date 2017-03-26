import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {FindPathToId, FindById, FindParents, FindChildren} from '../src/core';
const nodes = require('../nodes');

// TODO don't use INITIAL_STATE
describe('application logic', () => {

  describe('FindPathToId', () => {

    it('returns null if not found', () => {
      const data = nodes.MakeBase(List.of(
        nodes.MakeScene(1, "startup", List.of(
          nodes.MakeNode(2, null, null)
        )),
        nodes.MakeScene(3, "scene_2", List.of(
          nodes.MakeNode(4, null, List.of(
            nodes.MakeLabelAction(5, "label_test")
          )),
          nodes.MakeNode(6, null, null)
        )),
      ));
      expect(FindPathToId(data, 7)).to.equal(null);
    });

    it('can find the path to a scene', () => {
      const data = nodes.MakeBase(List.of(
        nodes.MakeScene(1, "startup", List.of(
          nodes.MakeNode(2, null, null)
        )),
        nodes.MakeScene(3, "scene_2", List.of(
          nodes.MakeNode(4, null, List.of(
            nodes.MakeLabelAction(5, "label_test")
          ))
        )),
      ));
      const expected1 = List.of('Scenes', 0);
      const expected2 = List.of('Scenes', 1);

      let result1 = FindPathToId(data, 1);
      expect(result1).to.equal(expected1);

      let result2 = FindPathToId(data, 3);
      expect(result2).to.equal(expected2);
    });

    it('can find the path to a node', () => {
      const data = nodes.MakeBase(List.of(
        nodes.MakeScene(1, "startup", List.of(
          nodes.MakeNode(2, null, null)
        )),
        nodes.MakeScene(3, "scene_2", List.of(
          nodes.MakeNode(4, null, List.of(
            nodes.MakeLabelAction(5, "label_test")
          )),
          nodes.MakeNode(6, null, null)
        )),
      ));
      const expected1 = List.of('Scenes', 0, 'Nodes', 0);
      const expected2 = List.of('Scenes', 1, 'Nodes', 0);
      const expected3 = List.of('Scenes', 1, 'Nodes', 1);

      const result1 = FindPathToId(data, 2);
      expect(result1).to.equal(expected1);

      const result2 = FindPathToId(data, 4);
      expect(result2).to.equal(expected2);

      const result3 = FindPathToId(data, 6);
      expect(result3).to.equal(expected3);
    });

    it('can find the path to a label', () => {
      const data = nodes.MakeBase(List.of(
        nodes.MakeScene(1, "startup", List.of(
          nodes.MakeNode(2, null, null)
        )),
        nodes.MakeScene(3, "scene_2", List.of(
          nodes.MakeNode(4, null, List.of(
            nodes.MakeLabelAction(5, "label_test")
          )),
          nodes.MakeNode(6, null, List.of(
            nodes.MakeTextAction("Text"),
            nodes.MakeLabelAction(7, "label_test")
          ))
        )),
      ));
      const expected1 = List.of('Scenes', 1, 'Nodes', 0, 'Actions', 0);
      const expected2 = List.of('Scenes', 1, 'Nodes', 1, 'Actions', 1);

      const result1 = FindPathToId(data, 5);
      expect(result1).to.equal(expected1);

      const result2 = FindPathToId(data, 7);
      expect(result2).to.equal(expected2);
    });

  });

  describe('FindById', () => {

    // TODO break it up into each type of node that has an id
    it('returns null if not found', () => {
      const data = nodes.MakeBase(List.of(
        nodes.MakeScene(1, "startup", List.of(
          nodes.MakeNode(2, null, null)
        )),
        nodes.MakeScene(3, "scene_2", List.of(
          nodes.MakeNode(4, null, List.of(
            nodes.MakeLabelAction(5, "label_test")
          )),
          nodes.MakeNode(6, null, null)
        )),
      ));
      expect(FindById(data, 7)).to.equal(null);
    });

    it('can find a scene from its id', () => {
      const data = nodes.MakeBase(List.of(
        nodes.MakeScene(1, "startup", List.of(
          nodes.MakeNode(2, null, null)
        )),
        nodes.MakeScene(3, "scene_2", List.of(
          nodes.MakeNode(4, null, List.of(
            nodes.MakeLabelAction(5, "label_test")
          ))
        )),
      ));
      const expected1 = nodes.MakeScene(1, "startup", List.of(
        nodes.MakeNode(2, null, null)
      ));
      const expected2 = nodes.MakeScene(3, "scene_2", List.of(
        nodes.MakeNode(4, null, List.of(
          nodes.MakeLabelAction(5, "label_test")
        ))
      ));

      let result1 = FindById(data, 1);
      expect(result1).to.equal(expected1);

      let result2 = FindById(data, 3);
      expect(result2).to.equal(expected2);
    });

    it('can find a node from its id', () => {
      const expected = nodes.MakeNode(4, null, List.of(
        nodes.MakeNextAction(null, 3)
      ));
      let result = FindById(nodes.INITIAL_STATE, 4);

      expect(result).to.equal(expected);
    });

  });

  describe('FindParents', () => {

    it('returns an empty list if not found', () => {
      expect(FindParents(nodes.INITIAL_STATE, 7)).to.equal(List());
    });

    // TODO break it up into each type of node that can link
    it('can find the nodes with connections to the given id', () => {
      const expected = List.of(
        nodes.MakeNode(2, "Start", List.of(
          nodes.MakeTextAction("A knight..."),
          nodes.MakeChoiceAction(List.of(
            nodes.MakeLink(nodes.LINK.NORMAL, "Fly...", 3, List.of(
              nodes.MakeSetAction("disdain", "%+", "10")
            )),
            nodes.MakeLink(nodes.LINK.NORMAL, "Charge...", 4, null)
          ))
        )),
        nodes.MakeNode(4, null, List.of(
          nodes.MakeNextAction(null, 3)
        ))
      );
      let result = FindParents(nodes.INITIAL_STATE, 3);
      result = result.sort((a, b) => a.get('Id') > b.get('Id'));

      expect(result).to.equal(expected);
    });

  });

  describe('FindChildren', () => {

    // TODO break it up into each type of action that has links
    it('returns an empty list if not found', () => {

      expect(FindChildren(nodes.INITIAL_STATE, 7)).to.equal(List());
    });

    it('can find all children of a given node id', () => {
      const expected = List.of(
        nodes.MakeNode(3, null, List.of(
          nodes.MakeNextAction("End Act 1", 5)
        )),
        nodes.MakeNode(4, null, List.of(
          nodes.MakeNextAction(null, 3)
        ))
      );
      let result = FindChildren(nodes.INITIAL_STATE, 2);
      result = result.sort((a, b) => a.get('Id') > b.get('Id'));

      expect(result).to.equal(expected);
    });

  });

});
