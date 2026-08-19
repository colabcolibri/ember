#!/usr/bin/env node
/**
 * Sobe Mailpit local (SMTP + UI web) para capturar emails em dev.
 * Prefere o binário nativo (brew install mailpit); Docker só como fallback.
 * Portas: config/dev-ports.json → mailpitSmtp, mailpitWeb.
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ports = JSON.parse(readFileSync(resolve(ROOT, 'config/dev-ports.json'), 'utf8'));
const smtpPort = ports.mailpitSmtp ?? 1025;
const webPort = ports.mailpitWeb ?? 8025;

function resolveMailpitBinary() {
  const probe = spawnSync('which', ['mailpit'], { encoding: 'utf8' });
  const binary = probe.stdout?.trim();
  return probe.status === 0 && binary ? binary : null;
}

function startNativeMailpit(binary) {
  const args = ['--smtp', `127.0.0.1:${smtpPort}`, '--listen', `127.0.0.1:${webPort}`];

  console.info(`[mailpit] nativo (${binary})`);
  console.info(`[mailpit] SMTP :${smtpPort} | UI http://127.0.0.1:${webPort}`);
  console.info('[mailpit] Ctrl+C para encerrar');

  return spawn(binary, args, { stdio: 'inherit' });
}

function startDockerMailpit() {
  const args = [
    'run',
    '--rm',
    '--name',
    'ember-mailpit',
    '-p',
    `${smtpPort}:1025`,
    '-p',
    `${webPort}:8025`,
    'axllent/mailpit',
  ];

  console.info('[mailpit] Docker (fallback — instale nativo: brew install mailpit)');
  console.info(`[mailpit] SMTP :${smtpPort} | UI http://127.0.0.1:${webPort}`);
  console.info('[mailpit] Ctrl+C para encerrar');

  return spawn('docker', args, { stdio: 'inherit' });
}

const mailpitBinary = resolveMailpitBinary();
const child = mailpitBinary ? startNativeMailpit(mailpitBinary) : startDockerMailpit();

child.on('error', (error) => {
  if (mailpitBinary) {
    console.error('[mailpit] Falha ao iniciar:', error.message);
  } else {
    console.error('[mailpit] Mailpit não encontrado e Docker indisponível:', error.message);
    console.error('[mailpit] Instale: brew install mailpit');
  }
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
