/**
 * useSubscription — Re-export depuis SubscriptionContext
 *
 * Ce fichier est conservé pour la compatibilité rétroactive avec tous les
 * composants existants (InvoiceForm, SubscriptionGuard, SubscriptionStatusBanner…).
 * La logique est centralisée dans lib/context/SubscriptionContext.tsx.
 */

export { useSubscription, MAX_FREE_INVOICES } from '@/lib/context/SubscriptionContext';
export type { SubscriptionState } from '@/lib/context/SubscriptionContext';
