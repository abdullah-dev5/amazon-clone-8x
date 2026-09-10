"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

/**
 * Lightweight horizontal scroller — native CSS scroll-snap + scrollBy, no
 * carousel dependency. Touch works for free (native momentum scrolling);
 * prev/next buttons are real <button>s for mouse/keyboard. If the items
 * already fit without scrolling (few products), the controls simply never
 * render — no awkward disabled-forever arrows.
 */
export function ProductCarousel({ products }: { products: ProductCardData[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setScrollable(maxScroll > 4);
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < maxScroll - 4);
  }

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => updateScrollState();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {scrollable && canScrollPrev && (
        <button
          type="button"
          aria-label="Scroll to previous products"
          onClick={() => scrollByAmount(-1)}
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 shadow-md hover:bg-gray-50 sm:flex"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
      )}
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.slug} className="w-[45%] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[15%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {scrollable && canScrollNext && (
        <button
          type="button"
          aria-label="Scroll to more products"
          onClick={() => scrollByAmount(1)}
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 shadow-md hover:bg-gray-50 sm:flex"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      )}
    </div>
  );
}
