const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

const VALIDATED_STATUSES = new Set(['paiement_valide', 'en_cours_execution', 'execute']);

/**
 * Valide un paiement et déclenche l'exécution USSD si pas déjà fait.
 * Utilisé par le webhook Wave, la validation IA et la revalidation admin.
 */
async function confirmPaymentAndScheduleUssd(commandeId, source, details = {}) {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    select: { id: true, statutCommande: true, referenceUnique: true },
  });

  if (!commande) {
    return { skipped: true, reason: 'commande_introuvable' };
  }

  if (VALIDATED_STATUSES.has(commande.statutCommande)) {
    logger.info('Paiement déjà validé, ignoré', { commandeId, source });
    return { skipped: true, reason: 'deja_valide', commandeId };
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingTask = await tx.tacheUSSD.findFirst({
      where: { commandeId },
      orderBy: { createdAt: 'desc' },
    });

    await tx.commande.update({
      where: { id: commandeId },
      data: { statutCommande: 'paiement_valide' },
    });

    let task = existingTask;
    if (!task || task.statutExecution === 'echoue') {
      task = await tx.tacheUSSD.create({
        data: {
          commandeId,
          priorite: 5,
          statutExecution: 'en_attente',
          logsExecution: [],
          nombreTentatives: 0,
          tentativeMax: 3,
        },
      });
    }

    await tx.transactionLog.create({
      data: {
        typeEvenement: 'paiement_valide',
        severite: 'info',
        details: { ...details, via: source },
        commandeId,
      },
    });

    return task;
  });

  const { executionQueue } = require('../jobs/executionJob');
  await executionQueue.add(
    { taskId: result.id, commandeId },
    { jobId: `ussd-${commandeId}-${result.id}` },
  );

  logger.info('Paiement confirmé, tâche USSD planifiée', {
    commandeId,
    taskId: result.id,
    source,
  });

  return { skipped: false, commandeId, taskId: result.id };
}

module.exports = { confirmPaymentAndScheduleUssd, VALIDATED_STATUSES };
