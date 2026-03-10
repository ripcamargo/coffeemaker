"use client";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-300/80 bg-[#fff7ed]/90 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/images/logo_CoffeeMaker_rounded.png?v=20260310"
            alt="Logo do CoffeeMaker"
            width={56}
            height={56}
            className="h-14 w-14"
          />
          <img
            src="/images/logo_horizontal_CoffeeMaker.png?v=20260310"
            alt="Logo horizontal do CoffeeMaker"
            width={220}
            height={56}
            className="h-10 w-auto sm:h-12"
          />
        </div>
      </nav>
    </header>
  );
}
