import {List, Map, fromJS} from 'immutable';

export function Enum(constantsList) {
	for (var i in constantsList) {
		this[constantsList[i]] = i;
	}
	Object.freeze(this);
}

export const TYPE = new Enum(['BASE', 'SCENE', 'NODE', 'LABEL', 'TEXT', 'CHOICE', 'LINK', 'NEXT', 'GOTO_SCENE']);

export const INITIAL_STATE = fromJS(
{
  Type: TYPE.BASE,
  Scenes:
  [
    {
      Type: TYPE.SCENE,
      Id: 1,
      Name: "startup",
      Nodes:
      [
        // NODE 2
        {
          Type: TYPE.NODE,
          Id: 2,
          Label: "Start",
          Actions:
          [
            {
              Type: TYPE.TEXT,
              Text: "A knight..."
            },
            {
              Type: TYPE.CHOICE,
              Links:
              [
                {
                  Type: TYPE.LINK,
                  Text: "Fly...",
                  Id: 3
                },
                {
                  Type: TYPE.LINK,
                  Text: "Charge...",
                  Id: 4
                }
              ]
            }
          ]
        },
        // NODE 3
        {
          Type: TYPE.NODE,
          Id: 3,
          Actions:
          [
            {
              Type: TYPE.NEXT,
              Text: "End Act 1"
            }
          ]
        },
        // NODE 4
        {
          Type: TYPE.NODE,
          Id: 4,
          Actions:
          [
            {
              Type: TYPE.NEXT,
              Text: "Carry on",
              Id: 5
            }
          ]
        },
        // NODE 5
        {
          Type: TYPE.NODE,
          Id: 5
        },
      ]
    }
  ]
});
