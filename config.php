<?php
// Global app configuration and security bootstrap

// Load .env
function env_load($path) {
    if (!file_exists($path)) return [];
    $vars = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $trim = trim($line);
        if ($trim === '' || strpos($trim, '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) $vars[trim($parts[0])] = trim($parts[1]);
    }
    return $vars;
}

// PDO connection helper
function get_pdo() {
    static $pdo = null;
    if ($pdo) return $pdo;
    $host = env_get('DB_HOST', 'localhost');
    $db   = env_get('DB_NAME', 'ecommerce_trae_v2');
    $user = env_get('DB_USER', 'root');
    $pass = env_get('DB_PASS', '');
    $charset = env_get('DB_CHARSET', 'utf8mb4');
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $opt = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, $user, $pass, $opt);
    return $pdo;
}

// Admin credentials validation
function admin_credentials_valid($user, $password) {
    try {
        $pdo = get_pdo();
        $stmt = $pdo->prepare('SELECT username, password_hash, is_active FROM admin_users WHERE username = :u LIMIT 1');
        $stmt->execute([':u' => $user]);
        $row = $stmt->fetch();
        if ($row && (int)$row['is_active'] === 1) {
            if (password_verify($password, (string)$row['password_hash'])) {
                return true;
            }
            return false;
        }
    } catch (Throwable $e) {
    }

    $envUser = env_get('ADMIN_USER', '');
    $hash = env_get('ADMIN_PASS_HASH', '');
    $plain = env_get('ADMIN_PASSWORD', '');
    if ($user !== $envUser || $envUser === '') return false;
    if ($hash !== '') return password_verify($password, $hash);
    return $plain !== '' && hash_equals($plain, $password);
}

$GLOBALS['APP_ENV'] = env_get('APP_ENV', 'development');
$GLOBALS['ENV_VARS'] = env_load(__DIR__ . '/.env');
function env_get($key, $default = '') {
    return $GLOBALS['ENV_VARS'][$key] ?? $default;
}

// Secure session and headers
if (session_status() === PHP_SESSION_NONE) {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// Error handling
$env = env_get('APP_ENV', 'development');
if ($env === 'production') {
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    $logDir = __DIR__ . '/storage/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    ini_set('error_log', $logDir . '/php-error.log');
} else {
    ini_set('display_errors', '1');
    ini_set('log_errors', '1');
}

// Security headers
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
// Minimal CSP allowing required CDNs (Bootstrap, Font Awesome, jQuery)
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; font-src 'self' data: https://cdnjs.cloudflare.com; object-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://code.jquery.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; connect-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://code.jquery.com");
if (!headers_sent()) {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    if ($secure) header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// CSRF utilities
function csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
function csrf_validate_request() {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (in_array($method, ['POST','PUT','PATCH','DELETE'])) {
        $hdr = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $bodyToken = $_POST['csrf_token'] ?? '';
        $token = $hdr ?: $bodyToken;
        return !empty($token) && hash_equals($_SESSION['csrf_token'] ?? '', $token);
    }
    return true;
}

// Simple rate limit (in-memory per session) for login
function rate_limit_check($key, $max = 10, $windowSeconds = 300) {
    $now = time();
    if (!isset($_SESSION['rl'][$key])) $_SESSION['rl'][$key] = [];
    // purge old (compatible closure for older PHP)
    $_SESSION['rl'][$key] = array_filter(
        $_SESSION['rl'][$key],
        function ($t) use ($now, $windowSeconds) { return $t > $now - $windowSeconds; }
    );
    if (count($_SESSION['rl'][$key]) >= $max) return false;
    $_SESSION['rl'][$key][] = $now;
    return true;
}

// Admin auth helpers
function admin_is_authenticated() {
    return !empty($_SESSION['admin_authenticated']) && $_SESSION['admin_authenticated'] === true;
}
function admin_login($user) {
    session_regenerate_id(true);
    $_SESSION['admin_authenticated'] = true;
    $_SESSION['admin_user'] = $user;
    try {
        $pdo = get_pdo();
        $stmt = $pdo->prepare('UPDATE admin_users SET last_login_at = NOW() WHERE username = :u');
        $stmt->execute([':u' => $user]);
    } catch (Throwable $e) {
    }
}
function admin_logout() {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}
