import "./globals.css";
import InitDB from "@/components/InitDB";
import { POSProvider } from "@/context/POSContext";

export const metadata = {
  title: "POS System",
  description: "Modern Point of Sale System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <InitDB />
        <POSProvider>
          {children}
        </POSProvider>
      </body>
    </html>
  );
}
