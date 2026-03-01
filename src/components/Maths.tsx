import React, { useRef, useState, useEffect } from "react";

const decodeLatexFromUrl = (url: string): string | null => {
  try {
    if (!url.includes('chart.apis.google.com') || !url.includes('cht=tx')) {
      return null;
    }
    const urlObj = new URL(url);
    const chl = urlObj.searchParams.get('chl');
    if (!chl) return null;
    
    return decodeURIComponent(chl)
      .replace(/\\frac/g, '\\frac')
      .replace(/\\sqrt/g, '\\sqrt')
      .replace(/\\sum/g, '\\sum')
      .replace(/\\int/g, '\\int')
      .replace(/\\alpha/g, '\\alpha')
      .replace(/\\beta/g, '\\beta')
      .replace(/\\gamma/g, '\\gamma')
      .replace(/\\delta/g, '\\delta')
      .replace(/\\theta/g, '\\theta')
      .replace(/\\pi/g, '\\pi')
      .replace(/\\omega/g, '\\omega')
      .replace(/\\infty/g, '\\infty')
      .replace(/\\le/g, '\\leq')
      .replace(/\\ge/g, '\\geq')
      .replace(/\\ne/g, '\\neq')
      .replace(/\\pm/g, '\\pm')
      .replace(/\\times/g, '\\times')
      .replace(/\\div/g, '\\div');
  } catch {
    return null;
  }
};

const mathSymbolMap: Record<string, string> = {
  '&alpha;': 'α', '&Alpha;': 'Α', '&beta;': 'β', '&Beta;': 'Β',
  '&gamma;': 'γ', '&Gamma;': 'Γ', '&delta;': 'δ', '&Delta;': 'Δ',
  '&epsilon;': 'ε', '&theta;': 'θ', '&lambda;': 'λ', '&mu;': 'μ',
  '&pi;': 'π', '&rho;': 'ρ', '&sigma;': 'σ', '&tau;': 'τ',
  '&phi;': 'φ', '&omega;': 'ω', '&infin;': '∞',
  '&le;': '≤', '&ge;': '≥', '&ne;': '≠', '&plusmn;': '±',
  '&times;': '×', '&divide;': '÷', '&radic;': '√',
  '&int;': '∫', '&sum;': '∑', '&sup2;': '²', '&sup3;': '³'
};

const renderMathSymbols = (text: string): string => {
  let result = text;
  Object.entries(mathSymbolMap).forEach(([entity, symbol]) => {
    result = result.replace(new RegExp(entity, 'g'), symbol);
  });
  return result;
};

// 2. ADD THIS OPTIONAL MATH COMPONENT (only used when needed)

interface OptionalMathContentProps {
  content: string;
  fallback?: string;
  className?: string;
}

export const OptionalMathContent: React.FC<OptionalMathContentProps> = ({ 
  content, 
  fallback, 
  className = "" 
}) => {
  const mathRef = useRef<HTMLDivElement>(null);
  const [mathJaxReady, setMathJaxReady] = useState(false);
  const [shouldUseMath, setShouldUseMath] = useState(false);

  // Only initialize MathJax if we detect mathematical content
  useEffect(() => {
    const hasMathContent = content.includes('chart.apis.google.com') ||
                          content.includes('&alpha;') ||
                          content.includes('&beta;') ||
                          content.includes('$$') ||
                          content.includes('π') ||
                          content.includes('∫');
    
    setShouldUseMath(hasMathContent);
    
    if (!hasMathContent) return;

    const initMathJax = () => {
      if (window.MathJax) {
        setMathJaxReady(true);
        return;
      }

      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true
        },
        options: { processHtmlClass: 'tex2jax_process' },
        svg: { fontCache: 'global' },
        startup: {
          ready: () => {
            window.MathJax.startup.defaultReady();
            setMathJaxReady(true);
          }
        }
      };
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js';
      script.async = true;
      document.head.appendChild(script);
    };

    initMathJax();
  }, [content]);

  useEffect(() => {
    if (mathJaxReady && shouldUseMath && mathRef.current) {
      const timer = setTimeout(() => {
        if (window.MathJax?.typesetPromise) {
          window.MathJax.typesetPromise([mathRef.current]).catch(() => {
            // Silently fall back to regular text on error
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [content, mathJaxReady, shouldUseMath]);

  // If no mathematical content, return original content
  if (!shouldUseMath) {
    return <span className={className}>{renderMathSymbols(content)}</span>;
  }

  const processContent = (): string => {
    if (content.includes('chart.apis.google.com')) {
      const latex = decodeLatexFromUrl(content);
      return latex ? `$$${latex}$$` : fallback || content;
    }
    return content;
  };

  return (
    <div ref={mathRef} className={`tex2jax_process ${className}`}>
      {mathJaxReady ? (
        <span dangerouslySetInnerHTML={{ __html: processContent() }} />
      ) : (
        <span>{fallback || renderMathSymbols(content)}</span>
      )}
    </div>
  );
};

// 3. ENHANCED IMAGE COMPONENT (preserves original functionality)

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className = "rounded-lg max-w-full h-auto mx-auto",
  loading = "lazy" 
}) => {
  // Check if it's a Google Chart API URL
  if (src.includes('chart.apis.google.com') && src.includes('cht=tx')) {
    const extractedLatex = decodeLatexFromUrl(src);
    
    if (extractedLatex) {
      return (
        <div className="relative">
          {/* Show the enhanced math rendering */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-xs mb-2 text-center">
              📊 Enhanced Mathematical Expression
            </div>
            <div className="text-center">
              <OptionalMathContent 
                content={src} 
                fallback={`Mathematical expression: ${extractedLatex}`}
                className="text-xl"
              />
            </div>
          </div>
          
          {/* Fallback: Still try to load the original image */}
          <img 
            src={src} 
            alt={alt} 
            className={`${className} mt-2 opacity-30`}
            loading={loading}
            style={{ display: 'none' }} // Hide but keep for compatibility
            onError={(e) => {
              // If original image fails, show nothing (we already have math above)
              e.currentTarget.style.display = 'none';
            }}
            onLoad={(e) => {
              // If original image surprisingly works, hide our enhanced version
              const mathDiv = e.currentTarget.previousElementSibling as HTMLElement;
              if (mathDiv) mathDiv.style.display = 'none';
              e.currentTarget.style.display = 'block';
              e.currentTarget.style.opacity = '1';
            }}
          />
        </div>
      );
    }
  }
  
  // For regular images, use normal img tag (preserves all existing functionality)
  return <img src={src} alt={alt} className={className} loading={loading} />;
};


declare global {
  interface Window {
    MathJax: any;
  }
}