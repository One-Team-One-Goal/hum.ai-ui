import React from "react";

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <p className="text-xs text-slate-400 font-medium mb-8 absolute top-6 left-64">
        v.0.1.0
      </p>
      <h1 className="text-5xl md:text-5xl font-bold leading-tight mt-5">
        AI-Assisted Rice Grading
      </h1>
      <p className="text-slate-500 mt-6 max-w-2xl mx-auto text-base">
        We analyze your rice sample images with AI-powered quality detection,
        that ensures
        <br />
        accurate grading and meets PNS/BAFS-290:2019 standards.
      </p>
    </header>
  );
};

export default Header;
