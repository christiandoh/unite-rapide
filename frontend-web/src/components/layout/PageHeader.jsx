import React from 'react';

export default function PageHeader({ label, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        {label && <p className="section-label mb-2">{label}</p>}
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        {description && <p className="text-white/50 text-sm sm:text-base mt-1 max-w-xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}
