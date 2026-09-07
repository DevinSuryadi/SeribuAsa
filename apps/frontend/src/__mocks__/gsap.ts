// Mock gsap module with all required methods
const mockGsap = {
  to: () => ({}),
  from: () => ({}),
  fromTo: () => ({}),
  set: () => ({}),
  timeline: () => ({ to: () => ({}), from: () => ({}), fromTo: () => ({}) }),
  registerPlugin: () => {},
  context: () => ({ revert: () => {} }),
};

export const ScrollTrigger = {
  create: () => ({}),
  refresh: () => {},
};

export default mockGsap;
