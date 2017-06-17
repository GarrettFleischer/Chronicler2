import {List, Map} from 'immutable';
import {Enum} from './core';

export const NodeType = new Enum(['BASE', 'SCENE', 'NODE', 'LINK', 'IF_LINK', 'NEXT',
                                'TEXT', 'CHOICE', 'FAKE_CHOICE', 'CREATE', 'TEMP',
                                'SET', 'IF', 'LABEL', 'GOTO', 'GOTO_SCENE', 'GOSUB',
                                'GOSUB_SCENE']);

export const LinkType = new Enum(['NORMAL', 'DISABLE', 'HIDE', 'ALLOW']);

export const INITIAL_STATE = MakeBase(List.of(
	// SCENE 1
	MakeScene(1, "startup", List.of(
		// NodeType 2
		MakeNode(2, "Start", List.of(
			MakeTextAction("A knight..."),
			MakeChoiceAction(List.of(
				MakeLink(LinkType.NORMAL, "Fly...", 3, List.of(
					MakeSetAction("disdain", "%+", "10")
				)),
				MakeLink(LinkType.NORMAL, "Charge...", 4, null)
			))
		)),
		// NodeType 3
		MakeNode(3, null, List.of(
			MakeNextAction("End Act 1", 5)
		)),
		// NodeType 4
		MakeNode(4, null, List.of(
			MakeNextAction(null, 3)
		)),
		// NodeType 5
		MakeNode(5, null, List.of(
			MakeGotoScene(6, 8)
		))
	)),
	// SCENE 6
	MakeScene(6, "scene_2", List.of(
		// NodeType 7
		MakeNode(7, null, List.of(
			MakeTextAction("..."),
			// LABEL 8
			MakeLabelAction(8, "middle")
		))
	))
));

export function MakeBase(scenes) {
	return Map({Type: NodeType.BASE, Scenes: scenes});
}

export function MakeScene(id, name, nodes) {
	return Map({Type: NodeType.SCENE, Id: id, Name: name, Nodes: nodes});
}

export function MakeNode(id, label, actions, x = 0, y = 0) {
	return Map({Type: NodeType.NODE, X: x, Y: y, Id: id, Label: label, Actions: actions});
}

export function MakeLink(linkType, text, linkId, actions) {
	return Map({Type: NodeType.LINK, LinkType: linkType, Text: text, LinkId: linkId, Actions: actions});
}

export function MakeIfLink(expr, text, linkId, actions) {
	return Map({Type: NodeType.IF_LINK, Expr: expr, Text: text, LinkId: linkId, Actions: actions});
}

export function MakeNextAction(text, linkId) {
	return Map({Type: NodeType.NEXT, Text: text, LinkId: linkId});
}

export function MakeTextAction(text) {
	return Map({Type: NodeType.TEXT, Text: text});
}

export function MakeChoiceAction(links) {
	return Map({Type: NodeType.CHOICE, Links: links});
}

export function MakeFakeChoice(choices, linkId) {
	return Map({Type: NodeType.FAKE_CHOICE, Choices: choices, LinkId: linkId});
}

export function MakeCreateAction(name) {
	return Map({Type: NodeType.CREATE, Name: name});
}

export function MakeTempAction(name) {
	return Map({Type: NodeType.TEMP, Name: name});
}

export function MakeSetAction(name, op, expr) {
	return Map({Type: NodeType.SET, Name: name, Op: op, Expr: expr});
}

export function MakeIfAction(expr, actions, elses) {
	return Map({Type: NodeType.IF, Expr, expr, Actions: actions, Elses: elses});
}

export function MakeLabelAction(id, label) {
	return Map({Type: NodeType.LABEL, Id: id, Label: label});
}

export function MakeGoto(linkId) {
	return Map({Type: NodeType.GOTO, LinkId: linkId});
}

export function MakeGotoScene(sceneId, linkId) {
	return Map({Type: NodeType.GOTO_SCENE, SceneId: sceneId, LinkId: linkId});
}

export function MakeGosub(linkId) {
	return Map({Type: NodeType.GOSUB, LinkId: linkId});
}

export function MakeGosubScene(sceneId, linkId) {
	return Map({Type: NodeType.GOSUB_SCENE, SceneId: sceneId, LinkId: linkId});
}
