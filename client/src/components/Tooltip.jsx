import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, visible: false });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // If tooltip hasn't rendered yet (width/height are 0), schedule recalculation
    if (tooltipRect.width === 0 || tooltipRect.height === 0) {
      requestAnimationFrame(() => {
        calculatePosition();
      });
      return;
    }

    // For fixed positioning, use viewport coordinates (getBoundingClientRect) directly
    // Don't add scroll offsets since fixed is relative to viewport
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + 8;
        break;
    }

    setTooltipPosition({ top, left, visible: true });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      // Wait for next frame to ensure tooltip is rendered
      const frameId = requestAnimationFrame(() => {
        // Double RAF to ensure dimensions are calculated
        requestAnimationFrame(() => {
          calculatePosition();
        });
      });

      const handleScroll = () => {
        calculatePosition();
      };

      const handleResize = () => {
        calculatePosition();
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setTooltipPosition({ top: 0, left: 0, visible: false });
    }
  }, [isVisible, calculatePosition]);

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-4 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1 border-4 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1 border-4 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-2xl whitespace-normal max-w-xs pointer-events-none"
            style={{
              zIndex: 99999,
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              visibility: tooltipPosition.visible ? 'visible' : 'hidden',
            }}
          >
            <div className="relative">
              {content}
              <div
                className={`absolute w-0 h-0 ${arrowClasses[position]}`}
              ></div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default Tooltip;
