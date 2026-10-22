<?php
declare(strict_types=1);

/**
 * Fernas — contact endpoint.
 * Deploy to public_html/contact.php.
 * Set DEMO_MODE to false and update CONTACT_TO before going live.
 */

const DEMO_MODE = false;
const CONTACT_TO = 'info@fernas.com.tr';
const FROM_EMAIL = 'no-reply@fernas.com.tr';
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

$input = $_POST;

// Honeypot + time trap: accept silently so bots do not learn.
$honeypot = trim((string)($input['website'] ?? ''));
$startedAt = (int)($input['started_at'] ?? 0);
$nowMs = (int)round(microtime(true) * 1000);
if ($honeypot !== '' || ($startedAt > 0 && $nowMs - $startedAt < 2500)) {
    respond(true);
}

$name = clean((string)($input['name'] ?? ''), 120);
$email = clean((string)($input['email'] ?? ''), 180);
$company = clean((string)($input['company'] ?? ''), 160);
$subject = clean((string)($input['subject'] ?? 'Genel bilgi'), 80);
$message = trim(strip_tags((string)($input['message'] ?? '')));
$consent = (string)($input['consent'] ?? '');

$allowedSubjects = [
    'Genel bilgi',
    'Proje ve iş geliştirme',
    'Satın alma',
    'İnsan kaynakları',
    'Basın ve iletişim',
];

if (text_length($name) < 2 || text_length($name) > 120) {
    respond(false, 'Lütfen adınızı girin.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Lütfen geçerli bir e-posta adresi girin.', 422);
}
if (!in_array($subject, $allowedSubjects, true)) {
    $subject = 'Genel bilgi';
}
if (text_length($message) < 10 || text_length($message) > 5000) {
    respond(false, 'Mesaj en az 10, en fazla 5000 karakter olmalıdır.', 422);
}
if (!in_array($consent, ['on', '1', 'true'], true)) {
    respond(false, 'KVKK onayı gereklidir.', 422);
}

// Basic throttle per session.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$last = (int)($_SESSION['fernas_contact_last'] ?? 0);
if ($last > 0 && time() - $last < 45) {
    respond(false, 'Çok kısa sürede tekrar gönderim yapıldı. Lütfen biraz bekleyin.', 429);
}

if (DEMO_MODE) {
    $_SESSION['fernas_contact_last'] = time();
    respond(true);
}

$subjectLine = '=?UTF-8?B?' . base64_encode('Fernas web: ' . $subject) . '?=';
$body = "Ad ve soyad: {$name}\n"
    . "E-posta: {$email}\n"
    . "Kurum: " . ($company !== '' ? $company : '-') . "\n"
    . "Konu: {$subject}\n"
    . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\n"
    . "Tarih: " . date('c') . "\n\n"
    . "Mesaj:\n{$message}\n";

$headers = [
    'From: Fernas Web <' . FROM_EMAIL . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: Fernas-Web',
];

$sent = mail(CONTACT_TO, $subjectLine, $body, implode("\r\n", $headers));

if (!$sent) {
    error_log('Fernas contact mail failed for ' . $email);
    respond(false, 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.', 500);
}

$_SESSION['fernas_contact_last'] = time();
respond(true);
