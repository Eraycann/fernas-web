<?php
declare(strict_types=1);

/**
 * Fernas — job application endpoint.
 * Deploy to public_html/application.php.
 * CV files are stored outside public_html in ../storage/applications.
 * Update HR_TO before going live.
 */

const DEMO_MODE = false;
const HR_TO = 'ik@fernas.com.tr';
const FROM_EMAIL = 'no-reply@fernas.com.tr';
const MAX_CV_BYTES = 5 * 1024 * 1024;
const SITE_HOSTS = ['www.fernas.com.tr', 'fernas.com.tr'];

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(bool $ok, string $message = '', int $status = 200): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'error' => $ok ? null : $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(string $value, int $max = 500): string
{
    $value = trim(strip_tags($value));
    $value = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    return $length > $max ? (function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max)) : $value;
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Yöntem desteklenmiyor.', 405);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $host = parse_url($origin, PHP_URL_HOST);
    if (!is_string($host) || !in_array($host, SITE_HOSTS, true)) {
        respond(false, 'Geçersiz istek kaynağı.', 403);
    }
}

$honeypot = trim((string)($_POST['website'] ?? ''));
$startedAt = (int)($_POST['started_at'] ?? 0);
$nowMs = (int)round(microtime(true) * 1000);
if ($honeypot !== '' || ($startedAt > 0 && $nowMs - $startedAt < 2500)) {
    respond(true);
}

$name = clean((string)($_POST['name'] ?? ''), 120);
$email = clean((string)($_POST['email'] ?? ''), 180);
$phone = clean((string)($_POST['phone'] ?? ''), 40);
$position = clean((string)($_POST['position'] ?? ''), 80);
$message = trim(strip_tags((string)($_POST['message'] ?? '')));
$consent = (string)($_POST['consent'] ?? '');

$allowedPositions = [
    'Genel başvuru',
    'Mühendislik',
    'Saha ve operasyon',
    'Finans ve muhasebe',
    'İnsan kaynakları',
    'Satın alma',
    'Diğer',
];

if (text_length($name) < 2) {
    respond(false, 'Lütfen adınızı girin.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Lütfen geçerli bir e-posta adresi girin.', 422);
}
if (!in_array($position, $allowedPositions, true)) {
    $position = 'Genel başvuru';
}
if (text_length($message) > 2000) {
    respond(false, 'Kısa not en fazla 2000 karakter olabilir.', 422);
}
if (!in_array($consent, ['on', '1', 'true'], true)) {
    respond(false, 'KVKK onayı gereklidir.', 422);
}

if (!isset($_FILES['cv']) || !is_array($_FILES['cv'])) {
    respond(false, 'Lütfen CV dosyanızı yükleyin.', 422);
}

$file = $_FILES['cv'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    respond(false, 'CV yüklenemedi. Lütfen tekrar deneyin.', 422);
}
if (($file['size'] ?? 0) > MAX_CV_BYTES) {
    respond(false, 'CV dosyası en fazla 5 MB olabilir.', 422);
}
if (!is_uploaded_file((string)$file['tmp_name'])) {
    respond(false, 'Geçersiz dosya yüklemesi.', 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = (string)$finfo->file((string)$file['tmp_name']);
$allowedMimes = [
    'application/pdf' => 'pdf',
    'application/msword' => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
];
if (!isset($allowedMimes[$mime])) {
    respond(false, 'CV yalnızca PDF, DOC veya DOCX olabilir.', 422);
}

// Basic throttle per session.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$last = (int)($_SESSION['fernas_application_last'] ?? 0);
if ($last > 0 && time() - $last < 60) {
    respond(false, 'Çok kısa sürede tekrar başvuru yapıldı. Lütfen biraz bekleyin.', 429);
}

if (DEMO_MODE) {
    $_SESSION['fernas_application_last'] = time();
    respond(true);
}

$storageDir = __DIR__ . '/../storage/applications';
if (!is_dir($storageDir) && !mkdir($storageDir, 0700, true) && !is_dir($storageDir)) {
    error_log('Fernas application storage could not be created: ' . $storageDir);
    respond(false, 'Başvuru kaydedilemedi. Lütfen daha sonra tekrar deneyin.', 500);
}

$baseName = date('Ymd-His') . '-' . bin2hex(random_bytes(6));
$cvPath = $storageDir . '/' . $baseName . '.' . $allowedMimes[$mime];

if (!move_uploaded_file((string)$file['tmp_name'], $cvPath)) {
    error_log('Fernas application CV move failed: ' . $cvPath);
    respond(false, 'CV kaydedilemedi. Lütfen tekrar deneyin.', 500);
}

$record = [
    'received_at' => date('c'),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'position' => $position,
    'message' => $message,
    'cv' => basename($cvPath),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
];

$jsonPath = $storageDir . '/' . $baseName . '.json';
file_put_contents(
    $jsonPath,
    json_encode($record, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR),
    LOCK_EX
);

$subjectLine = '=?UTF-8?B?' . base64_encode('Fernas başvuru: ' . $position) . '?=';
$body = "Ad ve soyad: {$name}\n"
    . "E-posta: {$email}\n"
    . "Telefon: " . ($phone !== '' ? $phone : '-') . "\n"
    . "Pozisyon: {$position}\n"
    . "CV: {$cvPath}\n"
    . "Tarih: " . date('c') . "\n\n"
    . "Kısa not:\n" . ($message !== '' ? $message : '-') . "\n";

$headers = [
    'From: Fernas Web <' . FROM_EMAIL . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: Fernas-Web',
];

if (!mail(HR_TO, $subjectLine, $body, implode("\r\n", $headers))) {
    error_log('Fernas application mail failed; record saved at ' . $jsonPath);
}

$_SESSION['fernas_application_last'] = time();
respond(true);
