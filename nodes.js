import {List, Map, fromJS} from 'immutable';
import {Enum} from './src/core';

export const TYPE = new Enum(['BASE', 'SCENE', 'NODE', 'LINK', 'IF_LINK', 'NEXT',
															'TEXT', 'CHOICE', 'FAKE_CHOICE', 'CREATE', 'TEMP',
															'SET', 'IF', 'LABEL', 'GOTO', 'GOTO_SCENE', 'GOSUB',
															'GOSUB_SCENE']);

export const LINK_TYPE = new Enum(['NORMAL', 'DISABLE', 'HIDE', 'ALLOW']);

export const INITIAL_STATE = MakeBase(List.of(
	// SCENE 1
	MakeScene(1, "startup", List.of(
		// NODE 2
		MakeNode(2, "Start", List.of(
			MakeTextAction("A knight..."),
			MakeChoiceAction(List.of(
				MakeLink(LINK_TYPE.NORMAL, "Fly...", 3, List.of(
					MakeSetAction("disdain", "%+", "10")
				)),
				MakeLink(LINK_TYPE.NORMAL, "Charge...", 4, null)
			))
		)),
		// NODE 3
		MakeNode(3, null, List.of(
			MakeNextAction("End Act 1", 5)
		)),
		// NODE 4
		MakeNode(4, null, List.of(
			MakeNextAction(null, 3)
		)),
		// NODE 5
		MakeNode(5, null, List.of(
			MakeGotoScene(6, 8)
		))
	)),
	// SCENE 6
	MakeScene(6, "scene_2", List.of(
		// NODE 7
		MakeNode(7, null, List.of(
			MakeTextAction("..."),
			// LABEL 8
			MakeLabelAction(8, "middle")
		))
	))
));

export function MakeBase(scenes) {
	return Map({Type: TYPE.BASE, Scenes: scenes});
}

export function MakeScene(id, name, nodes) {
	return Map({Type: TYPE.SCENE, Id: id, Name: name, Nodes: nodes});
}

export function MakeNode(id, label, actions) {
	return Map({Type: TYPE.NODE, Id: id, Label: label, Actions: actions});
}

export function MakeLink(linkType, text, linkId, actions) {
	return Map({Type: TYPE.LINK, LinkType: linkType, Text: text, LinkId: linkId, Actions: actions});
}

export function MakeIfLink(expr, text, linkId, actions) {
	return Map({Type: TYPE.IF_LINK, Expr: expr, Text: text, LinkId: linkId, Actions: actions});
}

export function MakeNextAction(text, linkId) {
	return Map({Type: TYPE.NEXT, Text: text, LinkId: linkId});
}

export function MakeTextAction(text) {
	return Map({Type: TYPE.TEXT, Text: text});
}

export function MakeChoiceAction(links) {
	return Map({Type: TYPE.CHOICE, Links: links});
}

export function MakeFakeChoice(choices, linkId) {
	return Map({Type: TYPE.FAKE_CHOICE, Choices: choices, LinkId: linkId});
}

export function MakeCreateAction(name) {
	return Map({Type: TYPE.CREATE, Name: name});
}

export function MakeTempAction(name) {
	return Map({Type: TYPE.TEMP, Name: name});
}

export function MakeSetAction(name, op, expr) {
	return Map({Type: TYPE.SET, Name: name, Op: op, Expr: expr});
}

export function MakeIfAction(expr, actions, elses) {
	return Map({Type: TYPE.IF, Name: name, Elses: elses});
}

export function MakeLabelAction(id, label) {
	return Map({Type: TYPE.LABEL, Id: id, Label: label});
}

export function MakeGoto(linkId) {
	return Map({Type: TYPE.GOTO, LinkId: linkId});
}

export function MakeGotoScene(sceneId, linkId) {
	return Map({Type: TYPE.GOTO_SCENE, SceneId: sceneId, LinkId: linkId});
}

export function MakeGosub(linkId) {
	return Map({Type: TYPE.GOSUB, LinkId: linkId});
}

export function MakeGosubScene(sceneId, linkId) {
	return Map({Type: TYPE.GOSUB_SCENE, SceneId: sceneId, LinkId: linkId});
}
