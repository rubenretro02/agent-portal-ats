-- ============================================
-- AGENT MAIL SCHEMA
-- ============================================
-- Run this in your Supabase SQL Editor

-- 1. Tabla para credenciales de correo de cada agente
CREATE TABLE IF NOT EXISTS agent_mail_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Dirección de correo del agente
    email_address TEXT NOT NULL,

    -- Credenciales (encriptadas en la aplicación antes de guardar)
    -- IMPORTANTE: Encripta estas credenciales en tu código antes de guardarlas
    imap_password_encrypted TEXT,
    smtp_password_encrypted TEXT,

    -- Configuración personalizada (opcional, usa defaults si está vacío)
    imap_host TEXT,
    imap_port INTEGER DEFAULT 993,
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un agente solo puede tener una cuenta de correo
    UNIQUE(agent_id)
);

-- 2. Tabla para configuración del servidor de correo (admin)
CREATE TABLE IF NOT EXISTS mail_server_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Configuración IMAP
    imap_host TEXT NOT NULL,
    imap_port INTEGER DEFAULT 993,
    imap_secure BOOLEAN DEFAULT true,

    -- Configuración SMTP
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,

    -- Relay SMTP (opcional - Brevo, SendGrid, etc.)
    use_smtp_relay BOOLEAN DEFAULT false,
    smtp_relay_host TEXT,
    smtp_relay_port INTEGER,
    smtp_relay_user TEXT,
    smtp_relay_password_encrypted TEXT,

    -- Dominio de correo
    mail_domain TEXT NOT NULL, -- ej: "tuempresa.com"

    -- Solo puede haber una configuración activa
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla para firmas de correo personalizadas
CREATE TABLE IF NOT EXISTS agent_mail_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Nombre de la firma (un agente puede tener varias)
    name TEXT NOT NULL DEFAULT 'Default',

    -- Contenido de la firma (HTML)
    signature_html TEXT,

    -- ¿Es la firma por defecto?
    is_default BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla para borradores de correo (guardados localmente)
CREATE TABLE IF NOT EXISTS agent_mail_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Destinatarios
    to_addresses JSONB DEFAULT '[]',
    cc_addresses JSONB DEFAULT '[]',
    bcc_addresses JSONB DEFAULT '[]',

    -- Contenido
    subject TEXT,
    body_html TEXT,
    body_text TEXT,

    -- Adjuntos (referencias a storage)
    attachments JSONB DEFAULT '[]',

    -- Respuesta a / Reenvío de
    reply_to_message_id TEXT,
    forward_from_message_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla para contactos frecuentes
CREATE TABLE IF NOT EXISTS agent_mail_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    email TEXT NOT NULL,
    name TEXT,

    -- Frecuencia de uso (para autocompletar)
    use_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(agent_id, email)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_mail_accounts_agent ON agent_mail_accounts(agent_id);
CREATE INDEX IF NOT EXISTS idx_mail_drafts_agent ON agent_mail_drafts(agent_id);
CREATE INDEX IF NOT EXISTS idx_mail_contacts_agent ON agent_mail_contacts(agent_id);
CREATE INDEX IF NOT EXISTS idx_mail_contacts_email ON agent_mail_contacts(email);
CREATE INDEX IF NOT EXISTS idx_mail_signatures_agent ON agent_mail_signatures(agent_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE agent_mail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_mail_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_mail_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_mail_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_server_config ENABLE ROW LEVEL SECURITY;

-- Políticas para agent_mail_accounts
CREATE POLICY "Agents can view their own mail account"
    ON agent_mail_accounts FOR SELECT
    USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own mail account"
    ON agent_mail_accounts FOR UPDATE
    USING (auth.uid() = agent_id);

-- Solo admins pueden crear/eliminar cuentas de correo
CREATE POLICY "Admins can manage all mail accounts"
    ON agent_mail_accounts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'recruiter')
        )
    );

-- Políticas para agent_mail_signatures
CREATE POLICY "Agents can manage their own signatures"
    ON agent_mail_signatures FOR ALL
    USING (auth.uid() = agent_id);

-- Políticas para agent_mail_drafts
CREATE POLICY "Agents can manage their own drafts"
    ON agent_mail_drafts FOR ALL
    USING (auth.uid() = agent_id);

-- Políticas para agent_mail_contacts
CREATE POLICY "Agents can manage their own contacts"
    ON agent_mail_contacts FOR ALL
    USING (auth.uid() = agent_id);

-- Políticas para mail_server_config (solo admins)
CREATE POLICY "Only admins can view mail server config"
    ON mail_server_config FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can manage mail server config"
    ON mail_server_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_mail_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_agent_mail_accounts_updated_at
    BEFORE UPDATE ON agent_mail_accounts
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();

CREATE TRIGGER update_mail_server_config_updated_at
    BEFORE UPDATE ON mail_server_config
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();

CREATE TRIGGER update_agent_mail_signatures_updated_at
    BEFORE UPDATE ON agent_mail_signatures
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();

CREATE TRIGGER update_agent_mail_drafts_updated_at
    BEFORE UPDATE ON agent_mail_drafts
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();

-- ============================================
-- EJEMPLO: Insertar configuración inicial
-- ============================================

-- Descomenta y modifica para tu servidor:
/*
INSERT INTO mail_server_config (
    imap_host,
    imap_port,
    smtp_host,
    smtp_port,
    mail_domain,
    is_active
) VALUES (
    'mail.tudominio.com',
    993,
    'mail.tudominio.com',
    587,
    'tudominio.com',
    true
);
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
/*
1. NUNCA guardes contraseñas en texto plano
   - Usa encriptación AES-256 en tu código antes de guardar
   - La clave de encriptación debe estar en variables de entorno

2. Para crear un buzón de agente:
   a) Crea el buzón en tu servidor de correo (Stalwart/Mailcow)
   b) Inserta registro en agent_mail_accounts con credenciales encriptadas

3. Flujo de autenticación:
   - Agent se loguea → Tu app obtiene sus credenciales encriptadas
   - Tu app desencripta → Conecta a IMAP/SMTP
   - Muestra correos del agente

4. Ejemplo de uso en Next.js:

   // Obtener cuenta de correo del agente
   const { data: mailAccount } = await supabase
     .from('agent_mail_accounts')
     .select('*')
     .eq('agent_id', userId)
     .single();

   // Desencriptar contraseña (usa crypto en tu servidor)
   const password = decrypt(mailAccount.imap_password_encrypted);

   // Conectar a IMAP
   const client = new ImapFlow({
     host: mailAccount.imap_host,
     auth: { user: mailAccount.email_address, pass: password }
   });
*/
