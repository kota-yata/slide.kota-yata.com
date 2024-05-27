import { SLIDES, type SlideInterface } from "$lib/constants";

// export const prerender = true;

export const load = ({ params }) => {
  return {
    props: {
      path: params.path,
      metadata: SLIDES[params.path]
    }
  };
}
