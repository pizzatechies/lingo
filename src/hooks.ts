import { useEffect, useState } from 'react';

declare global { const __APP_VERSION__: string }
import { loadCourse, getLoadedCourse } from './content';
import type { Course, CourseId } from './content/types';
import { canSpeakLang, onVoicesChanged, recognitionSupported, recordingSupported } from './lib/audio';
import { useApp } from './state/store';

export function useCourse(id?: CourseId | null): Course | null {
  const active = useApp((s) => s.active);
  const cid = id ?? active;
  const [course, setCourse] = useState<Course | null>(cid ? getLoadedCourse(cid) ?? null : null);
  useEffect(() => {
    if (!cid) return;
    let live = true;
    if (course?.id !== cid) setCourse(getLoadedCourse(cid) ?? null);
    loadCourse(cid).then((c) => live && setCourse(c));
    return () => { live = false; };
  }, [cid]); // eslint-disable-line react-hooks/exhaustive-deps
  return course && course.id === cid ? course : null;
}

/** Whether the device can play this course's audio (synthetic voice). */
export function useAudioAvailable(course: Course | null) {
  const [, force] = useState(0);
  useEffect(() => { const off = onVoicesChanged(() => force((n) => n + 1)); return () => { off(); }; }, []);
  return !!course && canSpeakLang(course.ttsLang);
}

export const speakingAvailable = () => recognitionSupported() || recordingSupported();
