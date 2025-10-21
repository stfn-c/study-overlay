'use client';

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style jsx global>{`
        html, body {
          background-color: transparent !important;
        }
      `}</style>
      <div
        style={{
          margin: 0,
          overflow: 'hidden',
          minHeight: '100vh',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </div>
    </>
  );
}
