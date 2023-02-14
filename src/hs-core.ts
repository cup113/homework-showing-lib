import { parse as txml_parse, type tNode } from 'txml/dist/txml.js';
import type { XmlHomeworkElements, XmlInlineElement, XmlMetaElement, XmlNoteElement, XmlSubjectElement } from './hs-xml'

const HC_VERSION = "2.0.0";

export interface HcItem extends Object {
  text: string,
  id: string,
  deleted?: number,
  new?: number,
}

export interface HcSubject extends Object {
  name: string,
  items: HcItem[]
}

export interface HcModify extends Object {
  time: string,
  color: string
}

export interface HcMeta extends Object {
  lang: string,
  author: string,
  id: string,
  date: string,
  created: string,
  modifies: HcModify[],
}

export interface HcObject extends Object {
  version: string,
  generated: Date,
  meta: HcMeta,
  subjects: HcSubject[],
  notes: string[],
}

const DEFAULT_COLORS = ["#ffff22", "#00ffee", "#00ff00", "#9999ff", "#ff6666"];

export function hc_compile(_content: string): HcObject {
  const parsedXml = txml_parse(_content);
  const xmlHomeworkElements = ((parsedXml.find(el => typeof el !== 'string' && el.tagName === 'Homework')) as tNode).children as unknown as XmlHomeworkElements;
  const
    xmlMetaElements = xmlHomeworkElements[0].children,
    xmlSubjectElements = xmlHomeworkElements[1].children,
    xmlNoteElements = xmlHomeworkElements[2].children;
  const
    meta = hc_parse_meta(xmlMetaElements),
    subjects = hc_parse_subjects(xmlSubjectElements),
    notes = hc_parse_notes(xmlNoteElements);

  function hc_parse_inline(elements: XmlInlineElement[]): string {
    return elements.map(el => {
      if (typeof el === 'string')
        return el;
      switch (el.tagName) {
        case 'a':
          return `<a href="${el.attributes.href}" target="_blank">${hc_parse_inline(el.children)}</a>`;
        case 'b':
          return `<strong>${hc_parse_inline(el.children)}</strong>`;
        case 'bg': {
          let bgColor: string;
          if (el.attributes.color === undefined)
            bgColor = meta.modifies[parseInt(el.attributes.v)].color;
          else
            bgColor = el.attributes.color;
          return `<span style="background-color: ${bgColor};">${hc_parse_inline(el.children)}</span>`;
        }
        case 'del':
          return `<del>${hc_parse_inline(el.children)}</del>`
        case 'i':
          return `<i>${hc_parse_inline(el.children)}</i>`;
        case 'img': {
          let widthStr = el.attributes.w ? ` width="${el.attributes.w}"` : "";
          let heightStr = el.attributes.h ? ` height="${el.attributes.h}"` : "";
          return `<img src="${el.attributes.src}" alt="${el.attributes.alt}"${widthStr}${heightStr}>`;
        }
        case 'note':
          return `<sup class="hs-inline-note">[${el.attributes.ref}]</sup>`;
      }
    }).join("");
  }

  function hc_parse_meta(xmlMetaElements: XmlMetaElement[]): HcMeta {
    let meta = {
      lang: "en",
      author: "",
      id: "",
      date: "",
      created: "",
      modifies: [] as HcModify[],
    } satisfies HcMeta;
    for (const xmlMetaElement of xmlMetaElements) {
      const tagName = xmlMetaElement.tagName;
      switch (tagName) {
        case 'Author':
          meta['author'] = xmlMetaElement.children[0];
          break;
        case 'Created':
          meta['created'] = xmlMetaElement.children[0];
          break;
        case 'Date':
          meta['date'] = xmlMetaElement.children[0];
          break;
        case 'Id':
          meta['id'] = xmlMetaElement.children[0];
          break;
        case 'Lang':
          meta['lang'] = xmlMetaElement.children[0];
          break;
        case 'Mods':
          meta.modifies.push(...xmlMetaElement.children.map((el, index) => {
            return {
              time: el.children[0],
              color: el.attributes?.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            } satisfies HcModify;
          }));
          break;
        default:
          tagName satisfies never;
          break;
      }
    }
    return meta;
  }

  function hc_parse_subjects(xmlSubjectElements: XmlSubjectElement[]): HcSubject[] {
    return xmlSubjectElements.map(el => {
      return {
        name: el.attributes.name,
        items: el.children.map(el => {
          let text = hc_parse_inline(el.children);
          return {
            text,
            id: el.attributes.id,
            deleted: el.attributes.deleted === undefined ? undefined : parseInt(el.attributes.deleted),
            new: el.attributes.new === undefined ? undefined : parseInt(el.attributes.new),
          } satisfies HcItem;
        })
      };
    });
  }

  function hc_parse_notes(xmlNoteElements: XmlNoteElement[]): string[] {
    const notes = xmlNoteElements.map(el => hc_parse_inline(el.children));
    return notes;
  }

  return {
    version: HC_VERSION,
    subjects,
    notes,
    generated: new Date(),
    meta,
  };
}

export function default_hc_object(): HcObject {
  return {
    version: HC_VERSION,
    subjects: [],
    notes: [],
    generated: new Date(),
    meta: {
      lang: "en",
      author: "NONE",
      id: "00000000-0000-0000-0000-000000000000",
      date: new Date().toLocaleDateString(),
      created: new Date().toLocaleTimeString(),
      modifies: [] as HcModify[],
    },
  }
}

function get_html_head(meta: HcMeta) {
  return `<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="Homework Showing Compiler">
<meta name="author" content="${meta.author}">
<link rel="stylesheet" href="./style.css">
<title>Homework ${meta.date}</title>
</head>`
}

export function hso_to_html_file(obj: HcObject): string {
  let { meta } = obj;
  let count = 0;
  let subjectsHtml: string = obj.subjects.map(subject => subject.items.map((item, index) => {
    ++count;
    let text = item.text;
    if (item.deleted)
      text = `<del style="background-color: ${meta.modifies[item.deleted - 1].color};">${text}</del>`;
    if (item.new)
      text = `<span style="background-color: ${meta.modifies[item.new - 1].color};">${text}</span>`
    let lastTwoCell = `<td>${count}</td><td>${text}</td>`;
    if (index === 0)
      return `<tr class="hs-row-3 hs-subject"><td rowspan="${subject.items.length}">${subject.name}</td>${lastTwoCell}</tr>`;
    else
      return `<tr class="hs-row-2 hs-subject">${lastTwoCell}</tr>`;
  }).join("\n")).join("\n");
  count = 0;
  let notesHtml: string = obj.notes.map((note, index) => {
    ++count;
    let lastTwoCell = `<td>${count}</td><td>${note}</td>`;
    if (index === 0)
      return `<tr class="hs-row-3 hs-notes"><td rowspan="${obj.notes.length}">Notes</td>${lastTwoCell}</tr>`;
    else
      return `<tr class="hs-row-2 hs-notes">${lastTwoCell}</tr>`;
  }).join("\n");
  let editNote = `${obj.meta.created} created` + obj.meta.modifies.map(modify => {
    return ` / <strong style="background-color: ${modify.color}">${modify.time} modified</strong>`;
  }).join("");
  return `<!DOCTYPE html>
<html lang="${meta.lang}">
${get_html_head(meta)}
<body>
<p class="hs-header">Posted at ${new Date().toLocaleString()}</p>
<table>
<thead>
<tr>
<th colspan="3">Homework ${meta.date}</th>
</tr>
</thead>
<tbody>
${subjectsHtml}
${notesHtml}
</tbody>
</table>
<p class="hs-footer">${editNote}</p>
</body>
</html>`;
}
