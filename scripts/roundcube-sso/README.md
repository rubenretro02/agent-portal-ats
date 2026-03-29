# Roundcube SSO - Instrucciones de Instalación

Este script permite Single Sign-On (SSO) desde el portal de agentes hacia Roundcube.

## Cómo funciona

1. El usuario hace clic en "Agent Mail" en el portal
2. El portal genera un token JWT firmado con las credenciales del usuario
3. El token se envía al script `sso.php` en el servidor de Roundcube
4. El script verifica el token, extrae las credenciales y hace login automático
5. El usuario queda autenticado en Roundcube sin escribir su contraseña

## Instalación

### 1. Copiar el script al servidor de mail

Conecta al servidor por SSH:

```bash
ssh root@172.86.89.39
```

Entra al contenedor de Roundcube:

```bash
docker exec -it roundcube bash
```

Crea el archivo `sso.php`:

```bash
cat > /var/www/html/sso.php << 'EOFPHP'
[contenido del archivo sso.php]
EOFPHP
```

### 2. Configurar la clave secreta

Edita el archivo y cambia `SSO_SECRET`:

```php
define('SSO_SECRET', 'tu-clave-secreta-de-32-caracteres');
```

**IMPORTANTE**: Esta clave debe ser la MISMA que configures en Vercel.

### 3. Configurar Vercel

Agrega estas variables de entorno en Vercel:

| Variable | Valor |
|----------|-------|
| `SSO_SECRET` | `tu-clave-secreta-de-32-caracteres` |
| `MAIL_ENCRYPTION_KEY` | `default-key-change-in-production` |
| `WEBMAIL_URL` | `https://mail.agent-mail.online` |

### 4. Redeploy

Haz redeploy en Vercel después de agregar las variables.

## Seguridad

- El token JWT expira en 60 segundos
- Las credenciales están encriptadas en el token
- La firma del token se verifica antes de hacer login
- Las credenciales nunca se exponen al navegador del usuario

## Troubleshooting

### "Token inválido" o "Firma inválida"
- Verifica que `SSO_SECRET` sea igual en el PHP y en Vercel

### "Token expirado"
- El token tiene 60 segundos de vida, verifica la hora del servidor

### El login no funciona
- Verifica que Roundcube permita iframes (ya configurado)
- Revisa los logs de Apache: `tail -f /var/log/apache2/error.log`
