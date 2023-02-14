import { HcItem, HcSubject, HcObject, hc_compile, default_hc_object } from './hs-core';

const HM_VERSION = "2.0.0";

export const enum ItemStatus {
  /** I haven't started it. */
  NotStarted = "not-started",
  /** I'm doing it. */
  Underway = "underway",
  /** I've done it after school. */
  Done = "done",
  /** I've done it at school or days before. */
  DoneEarlier = "done-earlier",
  /** It's not my homework. */
  NotMine = "not-mine",
  /** I don't want to do it. */
  Delayed = "delayed",
}

export type HmItem = HcItem & {
  status: ItemStatus,
  minutesSpent: number,
  minutesEstimated: number,
  /** Ratio */
  progress: number,
};

export interface HmSubject extends HcSubject {
  items: HmItem[],
}

export interface HmObject extends HcObject {
  raw: string,
  subjects: HmSubject[],
  timeBackHome: Date,
  minutesBuffer: number,
}

export function hm_compile(content: string, prevObj?: HmObject): HmObject {
  const hcObj = hc_compile(content);
  let prevMap: Map<string, Map<string, HmItem>> | undefined;
  if (prevObj === undefined) {
    prevMap = undefined;
  } else {
    if (prevObj.meta.id !== hcObj.meta.id || prevObj.meta.date !== hcObj.meta.date) {
      prevMap = undefined;
    } else {
      prevMap = new Map(prevObj.subjects.map(subject => [
        subject.name,
        new Map(subject.items.map(item => [item.id, item]))
      ]));
    }
  }
  const subjects: HmSubject[] = hcObj.subjects.map(subject => {
    const prevSubject = prevMap?.get(subject.name);
    return {
      name: subject.name,
      items: subject.items.map(item => prevSubject?.get(item.id) ?? {
        ...item,
        status: ItemStatus.NotStarted,
        minutesSpent: 0,
        minutesEstimated: 0,
        progress: 0,
      } satisfies HmItem),
    };
  });
  let ans = {
    ...default_hm_object(),
    raw: content,
    meta: hcObj.meta,
    notes: hcObj.notes,
    subjects,
  }
  if (prevObj !== undefined) {
    ans.minutesBuffer = prevObj.minutesBuffer;
    ans.timeBackHome = prevObj.timeBackHome;
  }
  return ans;
}

export function default_hm_object(): HmObject {
  let defaultHcObject = default_hc_object();
  return {
    version: HM_VERSION,
    raw: "",
    minutesBuffer: 0,
    generated: new Date(),
    meta: defaultHcObject.meta,
    notes: defaultHcObject.notes,
    subjects: [],
    timeBackHome: new Date(),
  };
}

export interface StoredHmObject extends Object {
  version: string,
  raw: string,
  minutesBuffer: number,
  /** Locale */
  generated: string,
  meta: {
    lang: string,
    author: string,
    id: string,
    date: string,
    created: string,
    modifies: {
      time: string,
      color: string,
    }[],
  },
  notes: string[],
  subjects: HmSubject[],
  /** Locale */
  timeBackHome: string,
}

/** Make the object JSON-friendly.
 */
export function hm_serialize(obj: HmObject): StoredHmObject {
  return {
    ...obj,
    generated: obj.generated.toLocaleString(),
    timeBackHome: obj.timeBackHome.toLocaleString(),
  };
}

export function hm_deserialize(obj: StoredHmObject): HmObject {
  return {
    ...obj,
    timeBackHome: new Date(obj.timeBackHome),
    generated: new Date(obj.generated)
  };
}
