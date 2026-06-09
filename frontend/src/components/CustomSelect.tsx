import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (val: string) => void;
}

export default function CustomSelect({ value, options, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full bg-black/50 border-2 rounded-xl p-3 text-white text-left font-bold outline-none transition-all flex justify-between items-center backdrop-blur-sm ${isOpen ? 'border-gold shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'border-white/10 hover:border-gold/50'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-4">{selectedOption?.label}</span>
        <span className={`text-gold transition-transform duration-300 text-xs ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0a1428] border-2 border-gold/40 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl overflow-hidden origin-top animate-in fade-in zoom-in-95 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-4 py-3 font-bold transition-colors ${option.value === value ? 'bg-gold/20 text-gold border-l-4 border-gold' : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-4 border-transparent'}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
