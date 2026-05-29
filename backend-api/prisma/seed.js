const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  const hash = await bcrypt.hash('Hacker@117', 12);

  const admin = await prisma.user.upsert({
    where: { telephone: '0711118582' },
    update: { email: 'christiandoh29@gmail.com', motDePasseHash: hash },
    create: {
      nom: 'Admin',
      prenom: 'Super',
      telephone: '0711118582',
      email: 'christiandoh29@gmail.com',
      motDePasseHash: hash,
      statut: 'actif',
      role: 'admin',
    },
  });
  console.log(`✓ Admin créé: ${admin.telephone} / ${admin.email}`);

  const operateurs = await Promise.all([
    prisma.operateur.upsert({
      where: { nom: 'Orange' },
      update: {},
      create: { nom: 'Orange', prefixe: '07', codePays: '+225' },
    }),
    prisma.operateur.upsert({
      where: { nom: 'MTN' },
      update: {},
      create: { nom: 'MTN', prefixe: '05', codePays: '+225' },
    }),
    prisma.operateur.upsert({
      where: { nom: 'Moov' },
      update: {},
      create: { nom: 'Moov', prefixe: '01', codePays: '+225' },
    }),
  ]);
  console.log(`✓ ${operateurs.length} opérateurs créés`);

  const orange = operateurs[0];
  const mtn = operateurs[1];
  const moov = operateurs[2];

  const services = [
    { operateurId: orange.id, nom: 'Internet 2Go', typeService: 'forfait_internet', codeUssd: '*143*1#', sequenceUssd: ['1', '2', '1'], montantWave: 2000, volumeData: '2Go', dureeValidite: '7 jours', populaire: true },
    { operateurId: orange.id, nom: 'Internet 10Go', typeService: 'forfait_internet', codeUssd: '*143*1#', sequenceUssd: ['1', '5', '1'], montantWave: 10000, volumeData: '10Go', dureeValidite: '30 jours', populaire: true },
    { operateurId: orange.id, nom: 'Crédit 5000F', typeService: 'credit_appel', codeUssd: '*144*1#', sequenceUssd: ['1', '3'], montantWave: 5000, populaire: true },
    { operateurId: orange.id, nom: 'Internet 500Mo', typeService: 'forfait_internet', codeUssd: '*143*1#', sequenceUssd: ['1', '1', '1'], montantWave: 500, volumeData: '500Mo', dureeValidite: '24 heures' },
    { operateurId: mtn.id, nom: 'Forfait 3Go', typeService: 'forfait_internet', codeUssd: '*133*1#', sequenceUssd: ['1', '3', '2'], montantWave: 3000, volumeData: '3Go', dureeValidite: '14 jours', populaire: true },
    { operateurId: mtn.id, nom: 'Crédit 10000F', typeService: 'credit_appel', codeUssd: '*136*1#', sequenceUssd: ['1', '5'], montantWave: 10000, populaire: true },
    { operateurId: mtn.id, nom: 'Forfait 1Go', typeService: 'forfait_internet', codeUssd: '*133*1#', sequenceUssd: ['1', '1', '1'], montantWave: 1000, volumeData: '1Go', dureeValidite: '7 jours' },
    { operateurId: moov.id, nom: 'Forfait 2Go', typeService: 'forfait_internet', codeUssd: '*155#', sequenceUssd: ['9', '4', '1', '5', '1', '0003'], montantWave: 2000, volumeData: '2Go', dureeValidite: '7 jours' },
    { operateurId: moov.id, nom: 'Crédit 2000F', typeService: 'credit_appel', codeUssd: '*126*1#', sequenceUssd: ['1', '2'], montantWave: 2000 },
  ];

  await prisma.serviceCatalogue.createMany({
    data: services,
    skipDuplicates: true,
  });
  console.log(`✓ ${services.length} services créés`);

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
