import React, { useRef, useEffect } from 'react';

export default function PinInput({ value, onChange, length = 4, disabled = false, variant = 'dark' }) {
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function handleChange(index, digit) {
    const cleaned = digit.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = cleaned || '';
    const next = chars.join('').replace(/\s/g, '').slice(0, length);
    onChange(next);
    if (cleaned && index < length - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !value[index] && index > 0) inputsRef.current[index - 1]?.focus();
  }

  const boxClass = variant === 'dark'
    ? 'w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#7C5CFC]'
    : 'w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#7C5CFC]';

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={boxClass}
        />
      ))}
    </div>
  );
}
