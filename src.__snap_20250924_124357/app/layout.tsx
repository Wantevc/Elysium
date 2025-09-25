import "./globals.css";

export const metadata = {
  title: "AI Social Manager",
  description: "Black & Gold Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
