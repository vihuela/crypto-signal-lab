"use client";

import { measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext";
import { useEffect, useMemo, useRef, useState } from "react";

const WALK_LOOP_MS = 4_600;
const WALK_RESET_PAUSE_MS = 560;
const SPACE_FALLBACK_RATIO = 0.28;

type HeroMarioTitleProps = {
  title: string;
};

type LayoutState = {
  widths: number[];
  positions: number[];
  totalWidth: number;
  titleHeight: number;
  marioHeight: number;
  marioWidth: number;
  bumpDistance: number;
};

type MotionState = {
  progress: number;
  activeIndex: number;
  direction: 1 | -1;
};

const INITIAL_MOTION: MotionState = {
  progress: 0,
  activeIndex: -1,
  direction: 1,
};

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function HeroMarioTitle({ title }: HeroMarioTitleProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const graphemes = useMemo(() => splitGraphemes(title), [title]);
  const walkableIndices = useMemo(
    () => graphemes.flatMap((grapheme, index) => (grapheme.trim() ? [index] : [])),
    [graphemes]
  );
  const [layout, setLayout] = useState<LayoutState | null>(null);
  const [travelProgress, setTravelProgress] = useState(0);

  useEffect(() => {
    const node = titleRef.current;
    if (!node) {
      return;
    }

    let cancelled = false;
    let retryTimerId = 0;
    let observer: ResizeObserver | null = null;

    const updateLayout = () => {
      if (cancelled || !titleRef.current) {
        return;
      }

      const element = titleRef.current;
      const renderedLetters = Array.from(
        element.querySelectorAll<HTMLElement>("[data-hero-letter]")
      );
      const style = window.getComputedStyle(element);
      const font =
        style.font && style.font !== ""
          ? style.font
          : `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const fontSize = Number.parseFloat(style.fontSize) || 64;
      const referenceIndex = walkableIndices[0] ?? 0;
      const referenceLetter = element.querySelector<HTMLElement>(
        `[data-hero-letter="${referenceIndex}"]`
      );
      const widths = graphemes.map((grapheme, index) => {
        const domWidth = renderedLetters[index]?.getBoundingClientRect().width ?? 0;
        const content = grapheme === " " ? "\u00A0" : grapheme;
        let width = domWidth;

        try {
          const measuredWidth = measureNaturalWidth(prepareWithSegments(content, font));
          if (Number.isFinite(measuredWidth) && measuredWidth > 0) {
            width = measuredWidth;
          }
        } catch {
          width = domWidth;
        }

        if (grapheme === " " && width === 0) {
          return fontSize * SPACE_FALLBACK_RATIO;
        }

        return width || domWidth;
      });

      const bounds = element.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0 || widths.every((width) => width === 0)) {
        retryTimerId = window.setTimeout(() => {
          updateLayout();
        }, 34);
        return;
      }

      let x = 0;
      const positions = widths.map((width) => {
        const current = x;
        x += width;
        return current;
      });

      const titleHeight = bounds.height || fontSize;
      const referenceHeight =
        referenceLetter?.getBoundingClientRect().height || titleHeight || fontSize;
      const marioHeight = referenceHeight * 0.98;
      const marioWidth = marioHeight * 0.92;

      if (!cancelled) {
        setLayout({
          widths,
          positions,
          totalWidth: x,
          titleHeight,
          marioHeight,
          marioWidth,
          bumpDistance: referenceHeight * 0.22,
        });
      }
    };

    updateLayout();

    observer = new ResizeObserver(() => {
      updateLayout();
    });
    observer.observe(node);

    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled) {
          updateLayout();
        }
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimerId);
      observer?.disconnect();
    };
  }, [graphemes, walkableIndices]);

  useEffect(() => {
    if (!layout || walkableIndices.length === 0) {
      return;
    }

    let frameId = 0;
    let startAt = 0;
    const cycleDuration = WALK_LOOP_MS + WALK_RESET_PAUSE_MS;

    const animate = (now: number) => {
      if (startAt === 0) {
        startAt = now;
      }

      const elapsed = (now - startAt) % cycleDuration;
      const nextProgress =
        elapsed >= WALK_LOOP_MS ? 0 : Math.max(0, Math.min(1, elapsed / WALK_LOOP_MS));

      setTravelProgress(nextProgress);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [layout, walkableIndices.length]);

  const motion = useMemo<MotionState>(() => {
    if (!layout || walkableIndices.length === 0) {
      return INITIAL_MOTION;
    }

    const startLeft = -layout.marioWidth * 0.82;
    const endLeft = layout.totalWidth - layout.marioWidth * 0.08;
    const marioLeft = startLeft + (endLeft - startLeft) * travelProgress;
    const marioCenter = marioLeft + layout.marioWidth / 2;
    let activeIndex = -1;
    let activeWalkableOrder = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    walkableIndices.forEach((index, order) => {
      const letterCenter = layout.positions[index] + layout.widths[index] / 2;
      const distance = Math.abs(letterCenter - marioCenter);
      const threshold = Math.max(layout.widths[index] * 0.54, layout.marioWidth * 0.24);

      if (distance <= threshold && distance < closestDistance) {
        activeIndex = index;
        activeWalkableOrder = order;
        closestDistance = distance;
      }
    });

    return {
      progress: travelProgress,
      activeIndex,
      direction:
        activeIndex === -1 ? 1 : getBumpDirection(title, activeWalkableOrder, activeIndex),
    };
  }, [layout, title, travelProgress, walkableIndices]);

  const marioLeft = useMemo(() => {
    if (!layout) {
      return 0;
    }

    const startLeft = -layout.marioWidth * 0.82;
    const endLeft = layout.totalWidth - layout.marioWidth * 0.08;

    return startLeft + (endLeft - startLeft) * motion.progress;
  }, [layout, motion.progress]);

  return (
    <>
      <span className="display-face block max-w-[8ch] text-[clamp(2.35rem,12.6vw,4.05rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-[#f8f2e8] md:hidden">
        {title}
      </span>

      <div
        ref={titleRef}
        aria-label={title}
        className="relative hidden whitespace-pre md:inline-flex md:items-end md:text-[clamp(3.65rem,6.9vw,6.45rem)] md:font-semibold md:leading-[0.89] md:tracking-[-0.074em] md:text-[#f8f2e8]"
      >
        {graphemes.map((grapheme, index) => {
          const width = layout?.widths[index];
          const isActive = motion.activeIndex === index;

          return (
            <span
              key={`${grapheme}-${index}`}
              aria-hidden="true"
              data-hero-letter={index}
              className="hero-title-letter display-face relative z-10 inline-flex items-end"
              style={{
                width: width ? `${width}px` : undefined,
                transform:
                  isActive && layout
                    ? `translateY(${motion.direction * layout.bumpDistance}px)`
                    : "translateY(0px)",
              }}
            >
              {grapheme === " " ? "\u00A0" : grapheme}
            </span>
          );
        })}

        {layout ? (
          <div
            aria-hidden="true"
            className="hero-mario-runner pointer-events-none absolute bottom-0 left-0 z-20"
            style={{
              width: `${layout.marioWidth}px`,
              height: `${layout.marioHeight}px`,
              transform: `translate3d(${marioLeft}px, 0, 0)`,
            }}
          >
            <div className="hero-mario-bob relative h-full w-full">
              <div className="hero-mario-frame hero-mario-frame-a h-full w-full">
                <PixelMarioFrameA />
              </div>
              <div className="hero-mario-frame hero-mario-frame-b absolute inset-0 h-full w-full">
                <PixelMarioFrameB />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function splitGraphemes(text: string) {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
  }

  return Array.from(text);
}

function getBumpDirection(title: string, step: number, activeIndex: number): 1 | -1 {
  let hash = 2166136261;
  const input = `${title}:${step}:${activeIndex}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 2 === 0 ? 1 : -1;
}

function PixelMarioFrameA() {
  return (
    <svg viewBox="0 0 160 144" className="h-full w-full" shapeRendering="crispEdges">
      <g transform="scale(8)">
        <rect x="8" y="1" width="7" height="1" fill="#f45d52" />
        <rect x="6" y="2" width="10" height="2" fill="#f45d52" />
        <rect x="5" y="4" width="6" height="1" fill="#f6c3a6" />
        <rect x="4" y="5" width="8" height="3" fill="#f6c3a6" />
        <rect x="7" y="4" width="6" height="1" fill="#3a1f13" />
        <rect x="10" y="6" width="3" height="1" fill="#3a1f13" />
        <rect x="6" y="8" width="8" height="3" fill="#2e68dc" />
        <rect x="5" y="9" width="2" height="2" fill="#f8d77d" />
        <rect x="13" y="9" width="2" height="2" fill="#f8d77d" />
        <rect x="7" y="11" width="3" height="3" fill="#7f4b30" />
        <rect x="10" y="11" width="3" height="3" fill="#7f4b30" />
        <rect x="6" y="14" width="3" height="2" fill="#7f4b30" />
        <rect x="12" y="14" width="3" height="2" fill="#7f4b30" />
        <rect x="5" y="16" width="4" height="2" fill="#462415" />
        <rect x="12" y="16" width="4" height="2" fill="#462415" />
      </g>
    </svg>
  );
}

function PixelMarioFrameB() {
  return (
    <svg viewBox="0 0 160 144" className="h-full w-full" shapeRendering="crispEdges">
      <g transform="scale(8)">
        <rect x="8" y="1" width="7" height="1" fill="#f45d52" />
        <rect x="6" y="2" width="10" height="2" fill="#f45d52" />
        <rect x="5" y="4" width="6" height="1" fill="#f6c3a6" />
        <rect x="4" y="5" width="8" height="3" fill="#f6c3a6" />
        <rect x="7" y="4" width="6" height="1" fill="#3a1f13" />
        <rect x="10" y="6" width="3" height="1" fill="#3a1f13" />
        <rect x="6" y="8" width="8" height="3" fill="#2e68dc" />
        <rect x="5" y="9" width="2" height="2" fill="#f8d77d" />
        <rect x="13" y="9" width="2" height="2" fill="#f8d77d" />
        <rect x="7" y="11" width="3" height="3" fill="#7f4b30" />
        <rect x="10" y="11" width="3" height="3" fill="#7f4b30" />
        <rect x="5" y="14" width="3" height="2" fill="#7f4b30" />
        <rect x="11" y="14" width="3" height="2" fill="#7f4b30" />
        <rect x="4" y="16" width="4" height="2" fill="#462415" />
        <rect x="11" y="16" width="5" height="2" fill="#462415" />
      </g>
    </svg>
  );
}
