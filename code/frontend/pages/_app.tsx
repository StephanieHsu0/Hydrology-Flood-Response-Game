import type { AppProps } from "next/app";
import "../styles/globals.css";
import { LanguageProvider } from "../lib/LanguageContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}

export default MyApp;

