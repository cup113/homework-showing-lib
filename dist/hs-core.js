"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hso_to_html_file = exports.default_hc_object = exports.hc_compile = void 0;
const txml_js_1 = require("txml/dist/txml.js");
const HC_VERSION = "2.0.0";
const DEFAULT_COLORS = ["#ff9900", "#00ffdd", "#00dd00", "#9999ff", "#ff6666"];
function hc_compile(_content) {
    const parsedXml = (0, txml_js_1.parse)(_content);
    const xmlHomeworkElements = (parsedXml.find(el => typeof el !== 'string' && el.tagName === 'Homework')).children;
    const xmlMetaElements = xmlHomeworkElements[0].children, xmlSubjectElements = xmlHomeworkElements[1].children, xmlNoteElements = xmlHomeworkElements[2].children;
    const meta = hc_parse_meta(xmlMetaElements), subjects = hc_parse_subjects(xmlSubjectElements), notes = hc_parse_notes(xmlNoteElements);
    function hc_parse_inline(elements) {
        return elements.map(el => {
            if (typeof el === 'string')
                return el;
            switch (el.tagName) {
                case 'a':
                    return `<a href="${el.attributes.href}" target="_blank">${hc_parse_inline(el.children)}</a>`;
                case 'b':
                    return `<strong>${hc_parse_inline(el.children)}</strong>`;
                case 'bg': {
                    let bgColor;
                    if (el.attributes.color === undefined)
                        bgColor = meta.modifies[parseInt(el.attributes.v)].color;
                    else
                        bgColor = el.attributes.color;
                    return `<span style="background-color: ${bgColor};">${hc_parse_inline(el.children)}</span>`;
                }
                case 'del':
                    return `<del>${hc_parse_inline(el.children)}</del>`;
                case 'i':
                    return `<i>${hc_parse_inline(el.children)}</i>`;
                case 'img': {
                    let widthStr = el.attributes.w ? ` width="${el.attributes.w}"` : "";
                    let heightStr = el.attributes.h ? ` height="${el.attributes.h}"` : "";
                    return `<img src="${el.attributes.src}" alt="${el.attributes.alt}"${widthStr}${heightStr}>`;
                }
                case 'note':
                    return `<sup class="hs-inline-note">[${el.attributes.v}]</sup>`;
            }
        }).join("");
    }
    function hc_parse_meta(xmlMetaElements) {
        let meta = {
            lang: "en",
            author: "",
            id: "",
            date: "",
            created: "",
            modifies: [],
        };
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
                        };
                    }));
                    break;
                default:
                    tagName;
                    break;
            }
        }
        return meta;
    }
    function hc_parse_subjects(xmlSubjectElements) {
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
                    };
                })
            };
        });
    }
    function hc_parse_notes(xmlNoteElements) {
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
exports.hc_compile = hc_compile;
function default_hc_object() {
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
            modifies: [],
        },
    };
}
exports.default_hc_object = default_hc_object;
function get_html_head(meta) {
    return `<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="Homework Showing Compiler">
<meta name="author" content="${meta.author}">
<link rel="stylesheet" href="./style.css">
<title>Homework ${meta.date}</title>
</head>`;
}
function hso_to_html_file(obj) {
    let { meta } = obj;
    let count = 0;
    let lastEditTime = meta.modifies.length > 0 ? meta.modifies[meta.modifies.length - 1].time : meta.created;
    let subjectsHtml = obj.subjects.map(subject => subject.items.map((item, index) => {
        ++count;
        let text = item.text;
        if (item.deleted)
            text = `<del style="background-color: ${meta.modifies[item.deleted - 1].color};">${text}</del>`;
        if (item.new)
            text = `<span style="background-color: ${meta.modifies[item.new - 1].color};"></span>`;
        let lastTwoCell = `<td>${count}</td><td>${text}</td>`;
        if (index === 0)
            return `<tr class="hs-row-3 hs-subject"><td rowspan="${subject.items.length}">${subject.name}</td>${lastTwoCell}</tr>`;
        else
            return `<tr class="hs-row-2 hs-subject">${lastTwoCell}</tr>`;
    }).join("\n")).join("\n");
    count = 0;
    let notesHtml = obj.notes.map((note, index) => {
        ++count;
        let lastTwoCell = `<td>${count}</td><td>${note}</td>`;
        if (index === 0)
            return `<tr class="hs-row-3 hs-notes"><td rowspan="${obj.notes.length}">Notes</td>${lastTwoCell}</tr>`;
        else
            return `<tr class="hs-row-2 hs-notes">${lastTwoCell}</tr>`;
    });
    let editNote = `${obj.meta.created} created` + obj.meta.modifies.map(modify => {
        return ` / <strong style="background-color: ${modify.color}">${modify.time} modified</strong>`;
    }).join("");
    return `<!DOCTYPE html>
<html lang="${meta.lang}">
${get_html_head(meta)}
<body>
<p class="hs-header">Posted at ${lastEditTime}</p>
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
exports.hso_to_html_file = hso_to_html_file;
//# sourceMappingURL=hs-core.js.map