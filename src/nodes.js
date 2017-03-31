import {List, Map} from 'immutable';
import {Enum} from './core';

export const NODE = new Enum([  'BASE', 'SCENE', 'NODE', 'LINK', 'IF_LINK', 'NEXT',
                                'TEXT', 'CHOICE', 'FAKE_CHOICE', 'CREATE', 'TEMP',
                                'SET', 'IF', 'LABEL', 'GOTO', 'GOTO_SCENE', 'GOSUB',
                                'GOSUB_SCENE']);

export const LINK = new Enum(['NORMAL', 'DISABLE', 'HIDE', 'ALLOW']);

export const INITIAL_STATE = MakeBase(List.of(
	// SCENE 1
	MakeScene(1, "startup", List.of(
		// NODE 2
		MakeNode(2, "Start", List.of(
			MakeTextAction("A knight..."),
			MakeChoiceAction(List.of(
				MakeLink(LINK.NORMAL, "Fly...", 3, List.of(
					MakeSetAction("disdain", "%+", "10")
				)),
				MakeLink(LINK.NORMAL, "Charge...", 4, null)
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
	return Map({Type: NODE.BASE, Scenes: scenes});
}

export function MakeScene(id, name, nodes) {
	return Map({Type: NODE.SCENE, Id: id, Name: name, Nodes: nodes});
}

export function MakeNode(id, label, actions) {
	return Map({Type: NODE.NODE, X: 0, Y: 0, Id: id, Label: label, Actions: actions});
}

export function MakeLink(linkType, text, linkId, actions) {
	return Map({Type: NODE.LINK, LinkType: linkType, Text: text, LinkId: linkId, Actions: actions});
}

export function MakeIfLink(expr, text, linkId, actions) {
	return Map({Type: NODE.IF_LINK, Expr: expr, Text: text, LinkId: linkId, Actions: actions});
}

export function MakeNextAction(text, linkId) {
	return Map({Type: NODE.NEXT, Text: text, LinkId: linkId});
}

export function MakeTextAction(text) {
	return Map({Type: NODE.TEXT, Text: text});
}

export function MakeChoiceAction(links) {
	return Map({Type: NODE.CHOICE, Links: links});
}

export function MakeFakeChoice(choices, linkId) {
	return Map({Type: NODE.FAKE_CHOICE, Choices: choices, LinkId: linkId});
}

export function MakeCreateAction(name) {
	return Map({Type: NODE.CREATE, Name: name});
}

export function MakeTempAction(name) {
	return Map({Type: NODE.TEMP, Name: name});
}

export function MakeSetAction(name, op, expr) {
	return Map({Type: NODE.SET, Name: name, Op: op, Expr: expr});
}

export function MakeIfAction(expr, actions, elses) {
	return Map({Type: NODE.IF, Expr, expr, Actions: actions, Elses: elses});
}

export function MakeLabelAction(id, label) {
	return Map({Type: NODE.LABEL, Id: id, Label: label});
}

export function MakeGoto(linkId) {
	return Map({Type: NODE.GOTO, LinkId: linkId});
}

export function MakeGotoScene(sceneId, linkId) {
	return Map({Type: NODE.GOTO_SCENE, SceneId: sceneId, LinkId: linkId});
}

export function MakeGosub(linkId) {
	return Map({Type: NODE.GOSUB, LinkId: linkId});
}

export function MakeGosubScene(sceneId, linkId) {
	return Map({Type: NODE.GOSUB_SCENE, SceneId: sceneId, LinkId: linkId});
}
