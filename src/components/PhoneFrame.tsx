import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

/** Responsive application shell. The legacy name remains to avoid churn in App. */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="h-dvh min-h-0 bg-[#0b0d10] text-white flex flex-col font-sans overflow-hidden">
      <main className="flex-1 min-h-0 flex flex-col w-full max-w-[1440px] mx-auto">
        {children}
      </main>
    </div>
  );
};
