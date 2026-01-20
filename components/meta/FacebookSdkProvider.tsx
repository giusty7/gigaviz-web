"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Script from "next/script";

type Props = {
  children: ReactNode;
};

const SDK_URL = "https://connect.facebook.net/en_US/sdk.js";
const DEFAULT_GRAPH_VERSION = "v24.0";

export function FacebookSdkProvider({ children }: Props) {
  const initializedRef = useRef(false);
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const version = DEFAULT_GRAPH_VERSION;

  useEffect(() => {
    if (initializedRef.current) return;
    if (!appId) return;

    if (typeof window !== "undefined" && window.FB) {
      initializedRef.current = true;
      return;
    }

    if (typeof window !== "undefined") {
      window.fbAsyncInit = () => {
        if (!window.FB) return;
        window.FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version,
        });
        initializedRef.current = true;
        window.dispatchEvent(new Event("fb-sdk-ready"));
      };
    }
  }, [appId, version]);

  return (
    <>
      <div id="fb-root" />
      {appId ? (
        <Script src={SDK_URL} strategy="afterInteractive" />
      ) : null}
      {children}
    </>
  );
}
