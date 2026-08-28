import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps }) {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Head>
        <title>MailSense AI — Intelligent Email Assistant</title>
        <meta
          name="description"
          content="AI-Powered Email Management with automated executive summaries, tone-aware reply drafting, and encrypted Gmail integration."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
