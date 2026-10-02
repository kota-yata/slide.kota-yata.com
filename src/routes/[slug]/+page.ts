import { error } from '@sveltejs/kit';
import { findSlide, slides } from '../../lib/slides';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => slides.map(({ slug }) => ({ slug }));

export const load: PageLoad = ({ params }) => {
  const slide = findSlide(params.slug);

  if (!slide) {
    error(404, 'スライドが見つかりません');
  }

  return { slide };
};
