// pages/_app.js
import Head from "next/head"
import { AuthProvider } from "../context/AuthContext"
import "../styles/globals.css"

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2d6a4f" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
