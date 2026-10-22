import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let media: gsap.MatchMedia | null = null;
let tickerAttached = false;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setupLenis() {
  if (prefersReducedMotion() || lenis) return;

  lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  lenis.on("scroll", ScrollTrigger.update);

  if (!tickerAttached) {
    gsap.ticker.add((time) => {
      lenis?.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    tickerAttached = true;
  }
}

function setupTimeline() {
  media?.revert();
  media = gsap.matchMedia();

  media.add(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    () => {
      const pin = document.querySelector<HTMLElement>(".timeline-pin");
      const track = pin?.querySelector<HTMLElement>(".timeline-track");
      if (!pin || !track) return;

      const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);
      if (distance() <= 0) return;

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top 88px",
          end: () => `+=${distance() + 160}`,
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    },
  );
}

function boot() {
  setupLenis();
  requestAnimationFrame(() => {
    lenis?.resize();
    setupTimeline();
    ScrollTrigger.refresh();
  });
}

boot();
