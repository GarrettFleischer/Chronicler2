import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {findNode} from '../src/core';
import {INITIAL_STATE, TYPE} from '../initial_state.js'


describe('application logic', () => {

  describe('findNode', () => {

    it('can find an object from its id', () => {
      let found = (findNode(INITIAL_STATE, 4));
      expect(found).to.equal(fromJS(
        {
          Type: TYPE.NODE,
          Id: 4,
          Actions:
          [
            {
              Type: TYPE.NEXT,
              Id: 5,
              Text: "Carry on"
            }
          ]
        }
      ));

      // let found = (findNode(INITIAL_STATE, 8));
      // expect(found).to.equal(fromJS(
      //   {
      //     Type: TYPE.LABEL,
      //     Id: 8,
      //     Label: "Middle"
      //   }
      // ));
    });

  });

});
