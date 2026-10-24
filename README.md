# IziFacture — Logiciel SaaS de Facturation B2B & Encaissement OHADA / UEMOA

IziFacture est une solution professionnelle de facturation, devis et recouvrement en ligne adaptée aux entreprises de la zone UEMOA / CEMAC (Côte d'Ivoire, Sénégal, Mali, etc.).
Elle intègre les passerelles de paiement locales en direct (**Wave**, **Orange Money**, **MTN MoMo**, **Moov Money**) et cartes bancaires via CinetPay V2.

---

## ⚡ Flux "Émettre et envoyer" (1 Clic)

Lorsqu'un utilisateur clique sur **"Émettre et envoyer"** depuis une facture :
1. **Émission immédiate** : La facture passe au statut `Envoyée au client` (`envoyee`).
2. **Jeton unique non devinable (192 bits)** : Un jeton aléatoire cryptographique `payment_token` est généré et stocké en base de données.
3. **Lien de paiement stable** : Un lien permanent et indépendant de CinetPay est créé : `https://<mon-domaine>/pay/<token>`.
4. **Envoi automatique WhatsApp** : Le message pré-formaté est immédiatement transmis au client avec le numéro, le montant en FCFA, l'échéance et le lien sécurisé.
5. **Paiement différé & Découplé** : Lorsque le client ouvre son lien `/pay/<token>`, la facture s'affiche. C'est uniquement au clic sur **"Payer"** que la session CinetPay est initialisée.
   - En cas d'indisponibilité de CinetPay, un message clair et non technique est affiché au client avec un bouton "Réessayer". L'émission et l'envoi de la facture ne sont jamais bloqués.
6. **Réconciliation automatique** : Dès que CinetPay valide la transaction (via Webhook IPN sécurisé HMAC & contre-vérification serveur), la facture passe au statut `Payée`.

---

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 🔐 Configuration des Variables d'Environnement (.env.local)

Consultez `.env.example` pour la liste complète :
- `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`
- `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`
- (Optionnel) `WHATSAPP_ACCESS_TOKEN` ou `TWILIO_ACCOUNT_SID` pour l'envoi WhatsApp serveur direct.
