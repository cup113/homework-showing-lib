import type { tNode } from "txml/txml"

interface XmlSelfClosingElement extends tNode {
  tagName: string,
  attributes: Record<string, string | undefined>,
  children: [],
}

interface XmlGeneralElement extends tNode {
  tagName: string,
  attributes: Record<string, string | undefined>,
  children: XmlElement[],
}

type XmlElement = string | XmlSelfClosingElement | XmlGeneralElement;

interface XmlTerminalElement extends XmlGeneralElement {
  children: [string],
}

interface XmlMetaModElement extends XmlTerminalElement {
  tagName: 'Mod',
  attributes: { color: string },
}

interface XmlMetaModsElement extends XmlGeneralElement {
  tagName: 'Mods',
  children: XmlMetaModElement[],
}

interface XmlMetaTerminalElement extends XmlTerminalElement {
  tagName: 'Lang' | 'Author' | 'Id' | 'Date' | 'Created',
}

export type XmlMetaElement = XmlMetaTerminalElement | XmlMetaModsElement;

interface XmlInlineBaseElement extends XmlGeneralElement {
  children: XmlInlineElement[],
}

interface XmlInlineBoldElement extends XmlInlineBaseElement {
  tagName: 'b',
}

interface XmlInlineItalicElement extends XmlInlineBaseElement {
  tagName: 'i',
}

interface XmlInlineDeleteElement extends XmlInlineBaseElement {
  tagName: 'del',
}

interface XmlInlineBackgroundElement extends XmlInlineBaseElement {
  tagName: 'bg',
  attributes: { color: string, v: undefined } | { v: string, color: undefined },
}

interface XmlInlineAnchorElement extends XmlInlineBaseElement {
  tagName: 'a',
  attributes: { href: string },
}

interface XmlInlineImageElement extends XmlSelfClosingElement {
  tagName: 'img',
  attributes: { src: string, alt: string, w?: string, h?: string },
}

interface XmlInlineNoteElement extends XmlSelfClosingElement {
  tagName: 'note',
  attributes: { ref: string },
}

export type XmlInlineElement = string | XmlInlineAnchorElement | XmlInlineBackgroundElement | XmlInlineBoldElement | XmlInlineDeleteElement | XmlInlineImageElement | XmlInlineImageElement | XmlInlineItalicElement | XmlInlineNoteElement;

interface XmlItemElement extends XmlGeneralElement {
  tagName: 'Item',
  attributes: {
    id: string,
    deleted?: string,
    new?: string,
  },
  children: XmlInlineElement[],
}

export interface XmlSubjectElement extends XmlGeneralElement {
  tagName: 'Subject',
  attributes: { name: string },
  children: XmlItemElement[],
}

export interface XmlNoteElement extends XmlGeneralElement {
  tagName: 'Note',
  children: XmlInlineElement[],
}

export type XmlHomeworkElements = [
  { children: XmlMetaElement[] },
  { children: XmlSubjectElement[] },
  { children: XmlNoteElement[] },
]
