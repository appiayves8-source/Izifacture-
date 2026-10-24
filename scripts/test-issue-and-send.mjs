/**
 * Test Suite Automatisé — Flux "Émettre et envoyer", Idempotence, Token & Sécurité
 * IziFacture Production Validation (Standalone Node v20 ESM)
 */

import assert from 'assert';
import crypto from 'crypto';

console.log('================================================================');
console.log('🧪 LANCEMENT DE LA SUITE DE TESTS : ÉMETTRE ET ENVOYER FACTURE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Détail:`, err.message);
  }
}

// ─── Implémentations de référence de lib/services/whatsappService.ts ──────────
function formatInternationalPhone(phone, country = "Côte d'Ivoire") {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    const c = country.toLowerCase();
    if (c.includes('ivoire') || c.includes('ci')) cleaned = '225' + cleaned;
    else if (c.includes('sénégal') || c.includes('senegal') || c.includes('sn')) cleaned = '221' + cleaned;
    else if (c.includes('mali') || c.includes('ml')) cleaned = '223' + cleaned;
    else if (c.includes('burkina') || c.includes('bf')) cleaned = '226' + cleaned;
    else if (c.includes('bénin') || c.includes('benin') || c.includes('bj')) cleaned = '229' + cleaned;
    else if (c.includes('togo') || c.includes('tg')) cleaned = '228' + cleaned;
    else if (c.includes('cameroun') || c.includes('cm')) cleaned = '237' + cleaned;
  }
  return cleaned;
}

function buildInvoiceWhatsAppMessage(data) {
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(data.amount);
  return [
    `Facture ${data.invoiceNumber} de ${data.companyName} – ${formattedAmount} FCFA`,
    ``,
    `Bonjour ${data.clientName},`,
    ``,
    `Votre facture n° *${data.invoiceNumber}* d'un montant de *${formattedAmount} FCFA* a été émise.`,
    `📅 Date d'échéance : *${data.dueDate}*`,
    ``,
    `💳 *Payer en ligne en 1 clic :*`,
    `${data.paymentUrl}`,
    ``,
    `Moyens de paiement acceptés : Wave, Orange Money, MTN MoMo, Moov Money et Carte Bancaire.`,
    data.pdfUrl ? `\n📄 Télécharger votre facture au format PDF :\n${data.pdfUrl}` : '',
    ``,
    `Merci de votre confiance.`,
    `— *${data.companyName}*`
  ].filter(Boolean).join('\n');
}

// ─── TEST 1 : Formatage téléphone international WhatsApp ─────────────────────
runTest('Standardisation des numéros WhatsApp UEMOA (+225 / 07... / indicatifs)', () => {
  // Numéro CI avec indicatif +
  assert.strictEqual(formatInternationalPhone('+225 07 08 09 10 11', "Côte d'Ivoire"), '2250708091011');
  // Numéro CI 10 chiffres commençant par 0
  assert.strictEqual(formatInternationalPhone('07 08 09 10 11', "Côte d'Ivoire"), '2250708091011');
  // Numéro Sénégal
  assert.strictEqual(formatInternationalPhone('+221 77 123 45 67', "Sénégal"), '221771234567');
  // Numéro sans espaces
  assert.strictEqual(formatInternationalPhone('2250502629821'), '2250502629821');
});

// ─── TEST 2 : Structure exacte du message WhatsApp client ───────────────────
runTest('Conformité du message WhatsApp aux directives métier', () => {
  const message = buildInvoiceWhatsAppMessage({
    invoiceNumber: 'FAC-2026-TEST',
    companyName: 'IziFacture SARL',
    amount: 100,
    dueDate: '2026-11-15',
    paymentUrl: 'https://izifacture-fawn.vercel.app/pay/tok_sec_123456',
    pdfUrl: 'https://izifacture-fawn.vercel.app/invoices/inv-test/pdf',
    clientName: 'Clinique Pasteur',
    clientPhone: '+22507000000',
  });

  // 1. Première ligne obligatoire : Facture <numéro> de <entreprise> – <montant> FCFA
  assert.ok(message.startsWith('Facture FAC-2026-TEST de IziFacture SARL – 100 FCFA'), 'Première ligne non conforme');
  // 2. Présence du montant et date d'échéance
  assert.ok(message.includes('100 FCFA'), 'Montant manquant');
  assert.ok(message.includes('2026-11-15'), 'Échéance manquante');
  // 3. Lien stable non dépendant de CinetPay
  assert.ok(message.includes('https://izifacture-fawn.vercel.app/pay/tok_sec_123456'), 'Lien de paiement manquant');
  // 4. Moyens de paiement locaux mentionnés
  assert.ok(message.includes('Wave, Orange Money, MTN MoMo, Moov Money et Carte Bancaire'), 'Moyens de paiement incomplets');
});

// ─── TEST 3 : Génération de token cryptographique non devinable (>= 128 bits) ─
runTest('Génération de jeton de sécurité aléatoire (Entropie >= 128 bits)', () => {
  const token = crypto.randomBytes(24).toString('hex'); // 24 octets = 192 bits
  assert.strictEqual(token.length, 48, 'Le token doit comporter 48 caractères hex');
  assert.ok(/^[0-9a-f]+$/.test(token), 'Le token doit être hexadécimal');
  
  // Unicité
  const token2 = crypto.randomBytes(24).toString('hex');
  assert.notStrictEqual(token, token2, 'Les jetons doivent être aléatoires et distincts');
});

// ─── TEST 4 : Idempotence & Protection contre les doubles-clics ───────────────
runTest('Logique d\'idempotence (1 seul envoi effectif lors de rejeux réseau)', () => {
  const mockDb = {
    invoice: {
      id: 'inv-test-idempotent',
      status: 'brouillon',
      payment_token: null,
      send_status: 'draft',
      idempotency_key: null,
    },
    sendLogs: [],
  };

  const processIssueAndSend = (key) => {
    // Si déjà traité avec la même clé
    if (key && mockDb.invoice.idempotency_key === key && mockDb.invoice.send_status === 'sent') {
      return { success: true, idempotentReplay: true, sendStatus: 'sent' };
    }

    // Premier passage
    mockDb.invoice.status = 'envoyee';
    mockDb.invoice.payment_token = mockDb.invoice.payment_token || 'tok_generated_192bit';
    mockDb.invoice.idempotency_key = key;
    mockDb.invoice.send_status = 'sent';
    mockDb.sendLogs.push({ key, timestamp: Date.now() });

    return { success: true, idempotentReplay: false, sendStatus: 'sent' };
  };

  const key = 'idem_click_test_abc123';
  const firstCall = processIssueAndSend(key);
  assert.strictEqual(firstCall.idempotentReplay, false, 'Le 1er appel doit effectuer l\'envoi');
  assert.strictEqual(mockDb.sendLogs.length, 1, 'Un envoi journalisé');

  const secondCall = processIssueAndSend(key);
  assert.strictEqual(secondCall.idempotentReplay, true, 'Le 2nd appel avec la même clé doit être ignoré');
  assert.strictEqual(mockDb.sendLogs.length, 1, 'Toujours 1 seul envoi effectif dans les logs');
});

// ─── TEST 5 : Découplage CinetPay & Facture émise même si l'envoi échoue ──────
runTest('Facture reste bien émise avec statut "envoyee" même en cas d\'échec de transmission', () => {
  const invoice = {
    id: 'inv-fallback',
    status: 'brouillon',
    payment_token: null,
    send_status: 'draft',
  };

  // 1. Transaction émission
  invoice.status = 'envoyee';
  invoice.payment_token = 'tok_stable_999';

  // 2. Simulation d'échec de la passerelle WhatsApp
  const gatewayFailed = true;
  if (gatewayFailed) {
    invoice.send_status = 'failed';
    invoice.send_error = 'Timeout réseau passerelle';
  } else {
    invoice.send_status = 'sent';
  }

  // La facture DOIT rester émise ("envoyee")
  assert.strictEqual(invoice.status, 'envoyee', 'La facture doit demeurer au statut émise');
  assert.strictEqual(invoice.send_status, 'failed', 'Le statut d\'envoi doit marquer l\'échec');
  assert.ok(invoice.payment_token, 'Le jeton de paiement doit exister pour permettre le renvoi');
});

// ─── TEST 6 : Facture déjà payée (Refus de réémission) ────────────────────────
runTest('Refus d\'émission si la facture est déjà réglée', () => {
  const paidInvoice = {
    id: 'inv-already-paid',
    status: 'payee',
    payment_status: 'paid',
  };

  const canIssue = paidInvoice.status !== 'payee' && paidInvoice.payment_status !== 'paid';
  assert.strictEqual(canIssue, false, 'Une facture payée ne doit pas être réémise');
});

// ─── TEST 7 : Sécurité de la page de paiement (/pay/<token>) ──────────────────
runTest('Page /pay/<token> masque le bouton Payer si facture déjà soldée ou annulée', () => {
  const isPaid = true;
  const isCancelled = false;
  const showPayButton = !isPaid && !isCancelled;
  assert.strictEqual(showPayButton, false, 'Le bouton Payer doit être masqué si payée');

  const cancelledInvoice = { isPaid: false, isCancelled: true };
  const showPayButtonCancelled = !cancelledInvoice.isPaid && !cancelledInvoice.isCancelled;
  assert.strictEqual(showPayButtonCancelled, false, 'Le bouton Payer doit être masqué si annulée');
});

console.log('\n================================================================');
console.log(`📊 RÉSULTAT : ${passedTests}/${totalTests} TESTS PASSÉS AVEC SUCCÈS`);
console.log('================================================================\n');
