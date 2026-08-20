<?php
declare(strict_types=1);

// Formulario de contacto de Sentio — envía los mensajes al correo del consultorio.
$to = 'sentio.to@gmail.com';

function respond(bool $success, string $message): void
{
    $isAjax = (
        !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
    );

    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $success, 'message' => $message]);
        exit;
    }

    // Fallback sin JavaScript: página simple con el resultado.
    header('Content-Type: text/html; charset=utf-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $color = $success ? '#3F9088' : '#c0392b';
    echo <<<HTML
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Sentio — Contacto</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center; color: #2A2730;">
          <p style="color: {$color}; font-size: 1.1rem;">{$safeMessage}</p>
          <a href="index.html#contacto" style="color: #3F9088;">Volver al sitio</a>
        </body>
        </html>
        HTML;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Método no permitido.');
}

// Honeypot: si este campo oculto viene lleno, es un bot. Fingimos éxito y no enviamos nada.
if (!empty($_POST['website'])) {
    respond(true, 'Gracias por escribirnos. Te responderemos pronto.');
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Por favor completa los campos obligatorios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'El correo ingresado no es válido.');
}

// Evita inyección de cabeceras: ningún campo puede contener saltos de línea.
$stripLines = static fn (string $value): string => str_replace(["\r", "\n"], ' ', $value);
$name = $stripLines($name);
$email = $stripLines($email);
$phone = $stripLines($phone);

$subject = 'Nuevo mensaje de contacto - Sentio';

$body = "Has recibido un nuevo mensaje desde el formulario de Sentio.\n\n"
    . "Nombre: {$name}\n"
    . "Correo: {$email}\n"
    . "Teléfono: " . ($phone !== '' ? $phone : 'No proporcionado') . "\n\n"
    . "Mensaje:\n{$message}\n";

$domain = $_SERVER['SERVER_NAME'] ?? 'sentio.com';
$fromAddress = 'no-reply@' . preg_replace('/^www\./', '', $domain);

$headers = [
    'From: Sentio Web <' . $fromAddress . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=utf-8',
];

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    respond(true, 'Gracias por escribirnos. Te responderemos pronto.');
}

respond(false, 'Hubo un problema al enviar tu mensaje. Intenta de nuevo o escríbenos directamente por correo.');
