import React, { useRef, useEffect } from 'react';

export default function PinInput({ value, onChange, length = 4, disabled = false, className = '' }) {
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
    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  return (
    <div className={`flex gap-2 sm:gap-3 justify-center ${className}`} onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#7C5CFC] transition-colors disabled:opacity-50"
          aria-label={`Chiffre ${i + 1}`}
        />
      ))}
    </div>
  );
}
