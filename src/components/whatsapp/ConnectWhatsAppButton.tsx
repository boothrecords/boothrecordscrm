'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID;

function loadFacebookSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }
    window.fbAsyncInit = function () {
      window.FB!.init({
        appId: APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/es_LA/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
}

export function ConnectWhatsAppButton() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'connecting' | 'error' | 'success'>(
    'idle'
  );
  const [message, setMessage] = useState<string | null>(null);
  const lastAuthCodeRef = useRef<string | undefined>(undefined);
  // Evita completar la conexion dos veces: una por el postMessage "FINISH"
  // (numero nuevo creado con el wizard completo) y otra por el respaldo que
  // se dispara desde el callback de FB.login (numero/WABA que ya existia en
  // otro negocio y solo se compartio, caso en el que Meta no manda FINISH).
  const handledRef = useRef(false);

  async function completeConnection(
    phoneNumberId: string | undefined,
    wabaId: string | undefined,
    businessName: string | undefined
  ) {
    if (handledRef.current) return;
    handledRef.current = true;

    setStatus('connecting');

    const res = await fetch('/api/whatsapp/embedded-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumberId,
        wabaId,
        businessName,
        code: lastAuthCodeRef.current,
      }),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = { error: 'Respuesta inesperada del servidor.' };
    }

    if (!res.ok) {
      setStatus('error');
      setMessage(json?.error ?? 'No se pudo guardar la conexión.');
      return;
    }

    setStatus('success');
    setMessage(
      json.warning
        ? `Conectado, pero: ${json.warning}`
        : '¡WhatsApp Business conectado correctamente!'
    );
    router.refresh();
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA') {
          const { phone_number_id, waba_id, business_name } = data.data ?? {};
          void completeConnection(phone_number_id, waba_id, business_name);
        } else if (data.event === 'CANCEL') {
          handledRef.current = true;
          setStatus('error');
          setMessage('Conexión cancelada antes de terminar.');
        } else if (data.event === 'ERROR') {
          handledRef.current = true;
          setStatus('error');
          setMessage(data.data?.error_message ?? 'Ocurrió un error durante la conexión.');
        }
      } catch {
        // Mensajes que no son JSON (u otros eventos de Facebook) se ignoran.
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleClick() {
    if (!APP_ID || !CONFIG_ID) {
      setStatus('error');
      setMessage('Falta configurar NEXT_PUBLIC_META_APP_ID / NEXT_PUBLIC_META_CONFIG_ID en Vercel.');
      return;
    }

    handledRef.current = false;
    setStatus('loading');
    setMessage(null);
    await loadFacebookSdk();

    window.FB.login(
      (response: any) => {
        if (!response.authResponse?.code) {
          if (!handledRef.current) {
            handledRef.current = true;
            setStatus('error');
            setMessage('Conexión cancelada antes de terminar.');
          }
          return;
        }

        lastAuthCodeRef.current = response.authResponse.code;
        setStatus('connecting');

        // Si en unos segundos no llego el postMessage "FINISH" (pasa cuando
        // se comparte un numero/WABA que ya existia en otro negocio, en vez
        // de crear uno nuevo con el wizard completo), seguimos de todas
        // formas con el codigo que tenemos: el backend busca el numero y la
        // cuenta autorizados via la Graph API.
        setTimeout(() => {
          void completeConnection(undefined, undefined, undefined);
        }, 2500);
      },
      {
        config_id: CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: '3',
        },
      }
    );
  }

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
        disabled={status === 'loading' || status === 'connecting'}
      >
        {status === 'loading' && 'Abriendo Facebook...'}
        {status === 'connecting' && 'Conectando...'}
        {(status === 'idle' || status === 'error' || status === 'success') &&
          'Conectar WhatsApp Business'}
      </Button>
      {message && (
        <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-400' : 'text-booth-textMuted'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
