export default function SpotifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: 'transparent', margin: 0, overflow: 'hidden', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
