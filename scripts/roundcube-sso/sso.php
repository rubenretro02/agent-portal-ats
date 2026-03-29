<?php
/**
 * Roundcube SSO Authentication Script
 *
 * Este script recibe un token JWT del portal, lo verifica,
 * y hace login automático a Roundcube.
 *
 * INSTALACIÓN:
 * 1. Copiar este archivo a /var/www/html/sso.php en el servidor de Roundcube
 * 2. Configurar la clave secreta SSO_SECRET (debe coincidir con el portal)
 */

// Configuración - CAMBIAR ESTOS VALORES
define('SSO_SECRET', 'your-sso-secret-key-min-32-chars!!');
define('TOKEN_EXPIRY', 120); // Token válido por 120 segundos (increased)
define('ROUNDCUBE_URL', '/');

// Evitar caché
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

/**
 * Decodificar y verificar token JWT simple
 */
function verifyToken($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return ['error' => 'Token invalido'];
    }

    list($headerB64, $payloadB64, $signatureB64) = $parts;

    // Verificar firma
    $expectedSignature = base64UrlEncode(
        hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true)
    );

    if (!hash_equals($expectedSignature, $signatureB64)) {
        return ['error' => 'Firma invalida'];
    }

    // Decodificar payload
    $payload = json_decode(base64UrlDecode($payloadB64), true);
    if (!$payload) {
        return ['error' => 'Payload invalido'];
    }

    // Verificar expiración
    if (!isset($payload['exp']) || $payload['exp'] < time()) {
        return ['error' => 'Token expirado'];
    }

    return $payload;
}

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Desencriptar contraseña (debe coincidir con el método del portal)
 */
function decryptPassword($encrypted, $key) {
    $decoded = base64_decode($encrypted);
    $result = '';
    $keyLen = strlen($key);

    for ($i = 0; $i < strlen($decoded); $i++) {
        $result .= chr(ord($decoded[$i]) ^ ord($key[$i % $keyLen]));
    }

    return $result;
}

/**
 * Mostrar página de error
 */
function showError($message) {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Error de Autenticacion</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
                color: white;
            }
            .error-box {
                text-align: center;
                padding: 2rem;
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                max-width: 400px;
            }
            .error-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            h2 { margin: 0 0 0.5rem; }
            p { color: rgba(255,255,255,0.7); margin: 0; }
            .retry-btn {
                margin-top: 1.5rem;
                padding: 0.75rem 1.5rem;
                background: #14b8a6;
                color: white;
                border: none;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;
            }
            .retry-btn:hover {
                background: #0d9488;
            }
        </style>
    </head>
    <body>
        <div class="error-box">
            <div class="error-icon">!</div>
            <h2>Error</h2>
            <p><?php echo htmlspecialchars($message); ?></p>
            <button class="retry-btn" onclick="window.parent.location.reload()">Reintentar</button>
        </div>
    </body>
    </html>
    <?php
    exit;
}

/**
 * Mostrar página de login con auto-submit
 * Maneja el logout previo si es necesario
 */
function autoLogin($email, $password, $forceLogout = false) {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Iniciando sesion...</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
                color: white;
            }
            .loading {
                text-align: center;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255,255,255,0.1);
                border-top-color: #14b8a6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="loading">
            <div class="spinner"></div>
            <p>Iniciando sesion...</p>
        </div>

        <form id="loginForm" method="POST" action="<?php echo ROUNDCUBE_URL; ?>?_task=login" style="display:none;">
            <input type="hidden" name="_action" value="login">
            <input type="hidden" name="_task" value="login">
            <input type="hidden" name="_user" value="<?php echo htmlspecialchars($email); ?>">
            <input type="hidden" name="_pass" value="<?php echo htmlspecialchars($password); ?>">
            <input type="hidden" name="_timezone" value="America/New_York">
            <input type="hidden" name="_url" value="">
        </form>

        <script>
            var forceLogout = <?php echo $forceLogout ? 'true' : 'false'; ?>;
            
            async function performLogin() {
                try {
                    // Si se requiere logout, primero cerrar cualquier sesión existente
                    if (forceLogout) {
                        console.log('Performing logout first...');
                        // Intentar logout primero
                        try {
                            await fetch('<?php echo ROUNDCUBE_URL; ?>?_task=logout', {
                                credentials: 'same-origin'
                            });
                            // Esperar un momento para que el logout se complete
                            await new Promise(resolve => setTimeout(resolve, 300));
                        } catch (e) {
                            console.log('Logout request failed, continuing anyway');
                        }
                    }
                    
                    // Cargar la página de login para obtener el token CSRF fresco
                    console.log('Fetching login page for CSRF token...');
                    var response = await fetch('<?php echo ROUNDCUBE_URL; ?>?_task=login', {
                        credentials: 'same-origin',
                        cache: 'no-store'
                    });
                    var html = await response.text();
                    
                    // Extraer el token CSRF del HTML
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    var tokenInput = doc.querySelector('input[name="_token"]');
                    
                    if (tokenInput) {
                        console.log('Found CSRF token');
                        // Agregar token al formulario
                        var input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = '_token';
                        input.value = tokenInput.value;
                        document.getElementById('loginForm').appendChild(input);
                    } else {
                        console.log('No CSRF token found, proceeding anyway');
                    }
                    
                    // Enviar formulario
                    console.log('Submitting login form...');
                    document.getElementById('loginForm').submit();
                    
                } catch (error) {
                    console.error('Login error:', error);
                    // Si falla, intentar sin token
                    document.getElementById('loginForm').submit();
                }
            }
            
            // Ejecutar el login
            performLogin();
        </script>
    </body>
    </html>
    <?php
    exit;
}

// ============================================
// MAIN
// ============================================

// Obtener token de la URL
$token = isset($_GET['token']) ? $_GET['token'] : '';
// Check if force logout is requested
$forceLogout = isset($_GET['_logout']) && $_GET['_logout'] === '1';

if (empty($token)) {
    showError('Token no proporcionado');
}

// Verificar token
$payload = verifyToken($token, SSO_SECRET);

if (isset($payload['error'])) {
    showError($payload['error']);
}

// Extraer datos
$email = isset($payload['email']) ? $payload['email'] : '';
$encryptedPass = isset($payload['pass']) ? $payload['pass'] : '';
$encryptionKey = isset($payload['key']) ? $payload['key'] : SSO_SECRET;

if (empty($email) || empty($encryptedPass)) {
    showError('Datos de autenticacion incompletos');
}

// Desencriptar contraseña
$password = decryptPassword($encryptedPass, $encryptionKey);

if (empty($password)) {
    showError('Error al procesar credenciales');
}

// Hacer login automático (with optional logout first)
autoLogin($email, $password, $forceLogout);
