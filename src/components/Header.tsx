import React from "react";

const Header: React.FC = () => {
  return (
    <header className="text-center relative">
      <p className="text-xs text-slate-400 font-medium mb-4 md:mb-8 md:absolute md:top-6 md:left-[-4rem] lg:left-[-6rem]">
        v.0.1.0
      </p>
      <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-5">
        AI-Assisted Rice Grading
      </h1>
      <p className="text-slate-500 mt-4 md:mt-6 max-w-2xl mx-auto text-sm md:text-base px-2">
        We analyze your rice sample images with AI-powered quality detection,
        that ensures
        <br className="hidden md:block" />
        accurate grading and meets PNS/BAFS-290:2019 standards.
      </p>
    </header>
  );
};

export default Header;
