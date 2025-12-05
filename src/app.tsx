import { useState, useRef } from "react";
import "./app.css";
import Header from "./components/Header";
import UploadForm from "./components/UploadForm";
import ResultCard from "./components/ResultCard";

export function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = (r: any) => {
    setResult(r);
    // Scroll to results after a brief delay to allow render
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="text-slate-900 h-full w-full overflow-x-hidden">
      <div className="w-full max-w-full md:w-1/2 mx-auto px-3 md:px-0 box-border">
        <div className="flex flex-col justify-between my-8">
          <div className="space-y-8">
            <Header />
            <UploadForm
              preview={imageSrc}
              onPreview={(src: string | null) => {
                setImageSrc(src);
                setResult(null);
              }}
              onAnalyze={handleAnalyze}
              annotations={result?.annotations}
            />
          </div>
          <div ref={resultRef}>
            <ResultCard result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}
