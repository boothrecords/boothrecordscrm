export const metadata = {
  title: 'Política de Privacidad — Booth',
};

export default function PoliticaPrivacidadPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1a1a1a',
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Política de Privacidad</h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>Última actualización: septiembre de 2026</p>

      <p>
        Booth ("nosotros") es una plataforma interna de gestión de relaciones con clientes (CRM)
        operada por Booth Records para administrar contactos y enviar comunicaciones por WhatsApp
        y correo electrónico. Esta política explica qué información tratamos y cómo la usamos.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>
        1. Información que recopilamos
      </h2>
      <p>
        Recopilamos y almacenamos datos de contacto que nuestro equipo ingresa o importa de forma
        manual, tales como: nombre, número de teléfono, correo electrónico, etiquetas y campos
        personalizados relacionados con la relación comercial (por ejemplo, intereses o historial
        de compra de boletos/eventos).
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>
        2. Cómo usamos la información
      </h2>
      <p>
        Usamos esta información exclusivamente para enviar comunicaciones comerciales relacionadas
        con eventos, lanzamientos y novedades de Booth Records a través de WhatsApp (utilizando la
        API de WhatsApp Business de Meta) y correo electrónico. No vendemos ni compartimos esta
        información con terceros ajenos a la operación de la plataforma.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>
        3. Almacenamiento y seguridad
      </h2>
      <p>
        Los datos se almacenan de forma segura en infraestructura de Supabase, con acceso
        restringido únicamente al equipo autorizado de Booth Records.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>
        4. Eliminación de datos
      </h2>
      <p>
        Cualquier persona puede solicitar la eliminación de sus datos de contacto, o darse de baja
        de nuestras comunicaciones, escribiendo a{' '}
        <a href="mailto:hola@bookbooth.com">hola@bookbooth.com</a>. Atenderemos la solicitud en un
        plazo razonable.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>
        5. Contacto
      </h2>
      <p>
        Para preguntas sobre esta política, escríbenos a{' '}
        <a href="mailto:hola@bookbooth.com">hola@bookbooth.com</a>.
      </p>
    </main>
  );
}
