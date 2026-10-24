/**
 * Service d'envoi et de formatage WhatsApp — IziFacture
 * 
 * Normes Afrique francophone (UEMOA / OHADA)
 * Supporte :
 * 1. Meta WhatsApp Cloud API (officiel Meta for Developers)
 * 2. Twilio WhatsApp API
 * 3. Génération de lien universel WhatsApp (wa.me) sans dépendance
 */

export interface InvoiceWhatsAppPayload {
  invoiceNumber: string;
  companyName: string;
  amount: number;
  dueDate: string;
  paymentUrl: string;
  pdfUrl?: string;
  clientName: string;
  clientPhone: string;
  clientCountry?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  provider: 'meta' | 'twilio' | 'direct_link' | 'none';
  providerMessageId?: string;
  error?: string;
  whatsappUrl: string;
  formattedMessage: string;
  recipient: string;
}

/**
 * Nettoie et standardise un numéro de téléphone au format international sans le '+'
 * Exemple : "+225 07 00 11 22 33" -> "2250700112233"
 */
export function formatInternationalPhone(phone: string, country: string = "Côte d'Ivoire"): string {
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Si le numéro commence par un 0 national (ex: 07..., 05... en Côte d'Ivoire)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    const c = country.toLowerCase();
    if (c.includes('ivoire') || c.includes('ci')) {
      cleaned = '225' + cleaned;
    } else if (c.includes('sénégal') || c.includes('senegal') || c.includes('sn')) {
      cleaned = '221' + cleaned;
    } else if (c.includes('mali') || c.includes('ml')) {
      cleaned = '223' + cleaned;
    } else if (c.includes('burkina') || c.includes('bf')) {
      cleaned = '226' + cleaned;
    } else if (c.includes('bénin') || c.includes('benin') || c.includes('bj')) {
      cleaned = '229' + cleaned;
    } else if (c.includes('togo') || c.includes('tg')) {
      cleaned = '228' + cleaned;
    } else if (c.includes('cameroun') || c.includes('cm')) {
      cleaned = '237' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Formate le message WhatsApp selon les directives strictes du projet IziFacture
 */
export function buildInvoiceWhatsAppMessage(data: InvoiceWhatsAppPayload): string {
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

/**
 * Envoie le message WhatsApp via l'API configurée (Meta ou Twilio) avec fallback direct wa.me
 */
export async function sendInvoiceWhatsApp(payload: InvoiceWhatsAppPayload): Promise<WhatsAppSendResult> {
  const recipient = formatInternationalPhone(payload.clientPhone, payload.clientCountry);
  const formattedMessage = buildInvoiceWhatsAppMessage(payload);
  const whatsappUrl = `https://wa.me/${recipient}?text=${encodeURIComponent(formattedMessage)}`;

  // 1. Essai via Meta WhatsApp Cloud API si configuré
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId && recipient) {
    try {
      console.log(`[WHATSAPP_SERVICE] Tentative d'envoi Meta Cloud API vers ${recipient}...`);
      const response = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: {
            preview_url: true,
            body: formattedMessage,
          },
        }),
      });

      const resJson = await response.json().catch(() => ({}));

      if (response.ok && resJson.messages?.[0]?.id) {
        console.log(`[WHATSAPP_SERVICE] ✅ Succès envoi Meta API msgId=${resJson.messages[0].id}`);
        return {
          success: true,
          provider: 'meta',
          providerMessageId: resJson.messages[0].id,
          whatsappUrl,
          formattedMessage,
          recipient,
        };
      }

      console.warn(`[WHATSAPP_SERVICE] Échec Meta API:`, resJson.error?.message || resJson);
    } catch (err: unknown) {
      console.error(`[WHATSAPP_SERVICE] Erreur réseau Meta Cloud API:`, err);
    }
  }

  // 2. Essai via Twilio WhatsApp API si configuré
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  if (twilioSid && twilioAuth && recipient) {
    try {
      console.log(`[WHATSAPP_SERVICE] Tentative d'envoi Twilio WhatsApp vers whatsapp:+${recipient}...`);
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
      formData.append('To', `whatsapp:+${recipient}`);
      formData.append('Body', formattedMessage);

      const twilioRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const twilioJson = await twilioRes.json().catch(() => ({}));

      if (twilioRes.ok && twilioJson.sid) {
        console.log(`[WHATSAPP_SERVICE] ✅ Succès envoi Twilio WhatsApp sid=${twilioJson.sid}`);
        return {
          success: true,
          provider: 'twilio',
          providerMessageId: twilioJson.sid,
          whatsappUrl,
          formattedMessage,
          recipient,
        };
      }

      console.warn(`[WHATSAPP_SERVICE] Échec Twilio WhatsApp:`, twilioJson.message || twilioJson);
    } catch (err: unknown) {
      console.error(`[WHATSAPP_SERVICE] Erreur réseau Twilio WhatsApp:`, err);
    }
  }

  // 3. Si aucune clé API n'est configurée dans l'environnement serveur
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`[WHATSAPP_SERVICE] Aucune clé API WhatsApp serveur (Meta ou Twilio) configurée. Lien direct généré pour redirection.`);

  return {
    success: false,
    provider: 'direct_link',
    error: 'Passerelle API WhatsApp non configurée côté serveur (Meta WHATSAPP_ACCESS_TOKEN ou TWILIO_ACCOUNT_SID manquants dans .env). Lien wa.me généré.',
    whatsappUrl,
    formattedMessage,
    recipient,
  };
}
