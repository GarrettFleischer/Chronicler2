import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {FindById, FindParents, FindChildren} from '../src/core';
const nodes = require('../nodes');

// TODO don't use INITIAL_STATE
describe('application logic', () => {

  describe('FindById', () => {

    // TODO break it up into each type of node that has an id
    it('can find an object from its id', () => {
      const expected = nodes.MakeNode(4, null, List.of(
        nodes.MakeNextAction(null, 3)
      ));
      let result = FindById(nodes.INITIAL_STATE, 4);

      expect(result).to.equal(expected);
    });

  });

  describe('FindParents', () => {

    // TODO break it up into each type of node that can link
    it('can find the nodes with connections to the given id', () => {
      const expected = List.of(
        nodes.MakeNode(2, "Start", List.of(
          nodes.MakeTextAction("A knight..."),
          nodes.MakeChoiceAction(List.of(
            nodes.MakeLink(nodes.LINK_TYPE.NORMAL, "Fly...", 3, List.of(
              nodes.MakeSetAction("disdain", "%+", "10")
            )),
            nodes.MakeLink(nodes.LINK_TYPE.NORMAL, "Charge...", 4, null)
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
