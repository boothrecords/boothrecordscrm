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

  useEffect(() => {
    async function completeConnection(
      phoneNumberId: string | undefined,
      wabaId: string | undefined,
      businessName: string | undefined
    ) {
      if (!phoneNumberId || !wabaId) {
        setStatus('error');
        setMessage('No se recibió el número o la cuenta de WhatsApp Business.');
        return;
      }

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

      const json = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(json.error ?? 'No se pudo guardar la conexión.');
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

    function handleMessage(event: MessageEvent) {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA') {
          const { phone_number_id, waba_id, business_name } = data.data ?? {};
          void completeConnection(phone_number_id, waba_id, business_name);
        } else if (data.event === 'CANCEL') {
          setStatus('error');
          setMessage('Conexión cancelada antes de terminar.');
        } else if (data.event === 'ERROR') {
          setStatus('error');
          setMessage(data.data?.error_message ?? 'Ocurrió un error durante la conexión.');
        }
      } catch {
        // Mensajes que no son JSON (u otros eventos de Facebook) se ignoran.
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  async function handleClick() {
    if (!APP_ID || !CONFIG_ID) {
      setStatus('error');
      setMessage('Falta configurar NEXT_PUBLIC_META_APP_ID / NEXT_PUBLIC_META_CONFIG_ID en Vercel.');
      return;
    }

    setStatus('loading');
    setMessage(null);
    await loadFacebookSdk();

    window.FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          lastAuthCodeRef.current = response.authResponse.code;
        }
        setStatus('connecting');
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
