import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create opportunities
  const techCare = await prisma.opportunity.upsert({
    where: { id: 'opp-techcare' },
    update: {},
    create: {
      id: 'opp-techcare',
      name: 'TechCare Premium Support',
      description: 'Provide technical support for premium software customers. Handle escalated issues and ensure customer satisfaction.',
      client: 'TechCare Inc.',
      status: 'active',
      category: 'Technical Support',
      requirements: JSON.stringify({
        minScore: 75,
        languages: ['English'],
        skills: ['Technical Support', 'Customer Service'],
        minExperience: 6,
        requiredDocuments: ['w9', 'nda', 'contract'],
        equipmentRequirements: { hasComputer: true, hasHeadset: true, internetSpeed: 50 },
        backgroundCheckRequired: true,
      }),
      compensation: JSON.stringify({
        type: 'hourly',
        baseRate: 18,
        bonusStructure: 'Performance bonus up to $200/month',
        currency: 'USD',
      }),
      training: JSON.stringify({
        required: true,
        duration: 40,
        modules: [],
      }),
      maxAgents: 50,
      currentAgents: 32,
      openPositions: 18,
      tags: JSON.stringify(['Technical', 'Premium', 'Full-time']),
    },
  });

  // Add questions for TechCare
  await prisma.applicationQuestion.createMany({
    data: [
      {
        opportunityId: techCare.id,
        question: 'Why are you interested in this technical support opportunity?',
        questionEs: '¿Por qué te interesa esta oportunidad de soporte técnico?',
        type: 'textarea',
        required: true,
        order: 1,
        placeholder: 'Share your motivation and relevant experience...',
        placeholderEs: 'Comparte tu motivación y experiencia relevante...',
      },
      {
        opportunityId: techCare.id,
        question: 'How many years of technical support experience do you have?',
        questionEs: '¿Cuántos años de experiencia en soporte técnico tienes?',
        type: 'select',
        required: true,
        order: 2,
        options: JSON.stringify([
          { value: '0-1', label: 'Less than 1 year', labelEs: 'Menos de 1 año' },
          { value: '1-2', label: '1-2 years', labelEs: '1-2 años' },
          { value: '3-5', label: '3-5 years', labelEs: '3-5 años' },
          { value: '5+', label: '5+ years', labelEs: '5+ años' },
        ]),
      },
      {
        opportunityId: techCare.id,
        question: 'What troubleshooting tools are you familiar with?',
        questionEs: '¿Con qué herramientas de diagnóstico estás familiarizado?',
        type: 'multiselect',
        required: true,
        order: 3,
        options: JSON.stringify([
          { value: 'remote_desktop', label: 'Remote Desktop', labelEs: 'Escritorio Remoto' },
          { value: 'ticketing_systems', label: 'Ticketing Systems', labelEs: 'Sistemas de Tickets' },
          { value: 'crm', label: 'CRM Software', labelEs: 'Software CRM' },
          { value: 'network_diagnostics', label: 'Network Diagnostics', labelEs: 'Diagnóstico de Red' },
        ]),
      },
      {
        opportunityId: techCare.id,
        question: 'Are you comfortable working weekends if needed?',
        questionEs: '¿Estás cómodo trabajando fines de semana si es necesario?',
        type: 'radio',
        required: true,
        order: 4,
        options: JSON.stringify([
          { value: 'yes', label: 'Yes', labelEs: 'Sí' },
          { value: 'no', label: 'No', labelEs: 'No' },
          { value: 'sometimes', label: 'Sometimes', labelEs: 'A veces' },
        ]),
      },
    ],
    
  });

  // Create HealthLine opportunity
  const healthLine = await prisma.opportunity.upsert({
    where: { id: 'opp-healthline' },
    update: {},
    create: {
      id: 'opp-healthline',
      name: 'HealthLine Bilingual Support',
      description: 'Provide customer support for healthcare insurance inquiries in English and Spanish.',
      client: 'HealthLine Insurance',
      status: 'active',
      category: 'Healthcare',
      requirements: JSON.stringify({
        minScore: 80,
        languages: ['English', 'Spanish'],
        skills: ['Healthcare', 'Bilingual (English/Spanish)'],
        minExperience: 12,
        requiredDocuments: ['w9', 'nda', 'contract', 'background_consent'],
        equipmentRequirements: { hasComputer: true, hasHeadset: true, hasQuietSpace: true },
        backgroundCheckRequired: true,
      }),
      compensation: JSON.stringify({
        type: 'hourly',
        baseRate: 22,
        bonusStructure: 'Quality bonus + $2/hour for bilingual',
        currency: 'USD',
      }),
      training: JSON.stringify({
        required: true,
        duration: 60,
        modules: [],
      }),
      maxAgents: 30,
      currentAgents: 12,
      openPositions: 18,
      tags: JSON.stringify(['Healthcare', 'Bilingual', 'Premium Pay']),
    },
  });

  // Add questions for HealthLine
  await prisma.applicationQuestion.createMany({
    data: [
      {
        opportunityId: healthLine.id,
        question: 'Describe your experience in healthcare or insurance customer service.',
        questionEs: 'Describe tu experiencia en servicio al cliente de salud o seguros.',
        type: 'textarea',
        required: true,
        order: 1,
        placeholder: 'Include specific roles and responsibilities...',
        placeholderEs: 'Incluye roles y responsabilidades específicas...',
      },
      {
        opportunityId: healthLine.id,
        question: 'Rate your Spanish language proficiency',
        questionEs: 'Califica tu nivel de español',
        type: 'select',
        required: true,
        order: 2,
        options: JSON.stringify([
          { value: 'native', label: 'Native Speaker', labelEs: 'Hablante Nativo' },
          { value: 'fluent', label: 'Fluent', labelEs: 'Fluido' },
          { value: 'conversational', label: 'Conversational', labelEs: 'Conversacional' },
          { value: 'basic', label: 'Basic', labelEs: 'Básico' },
        ]),
      },
      {
        opportunityId: healthLine.id,
        question: 'Are you HIPAA certified or willing to get certified?',
        questionEs: '¿Tienes certificación HIPAA o estás dispuesto a obtenerla?',
        type: 'radio',
        required: true,
        order: 3,
        options: JSON.stringify([
          { value: 'certified', label: 'Already certified', labelEs: 'Ya certificado' },
          { value: 'willing', label: 'Willing to get certified', labelEs: 'Dispuesto a certificarme' },
          { value: 'not_sure', label: 'Not sure', labelEs: 'No estoy seguro' },
        ]),
      },
      {
        opportunityId: healthLine.id,
        question: 'When can you start?',
        questionEs: '¿Cuándo puedes comenzar?',
        type: 'date',
        required: true,
        order: 4,
      },
    ],
    
  });

  // Create ShopEasy opportunity
  const shopEasy = await prisma.opportunity.upsert({
    where: { id: 'opp-shopeasy' },
    update: {},
    create: {
      id: 'opp-shopeasy',
      name: 'ShopEasy Customer Care',
      description: 'Handle order inquiries, returns, and general customer support for e-commerce platform.',
      client: 'ShopEasy',
      status: 'active',
      category: 'Customer Service',
      requirements: JSON.stringify({
        minScore: 70,
        languages: ['English'],
        skills: ['Customer Service', 'E-commerce'],
        minExperience: 3,
        requiredDocuments: ['w9', 'nda', 'contract'],
        equipmentRequirements: { hasComputer: true, hasHeadset: true },
        backgroundCheckRequired: false,
      }),
      compensation: JSON.stringify({
        type: 'hourly',
        baseRate: 15,
        bonusStructure: 'Sales commission on upsells',
        currency: 'USD',
      }),
      training: JSON.stringify({
        required: true,
        duration: 20,
        modules: [],
      }),
      maxAgents: 100,
      currentAgents: 67,
      openPositions: 33,
      tags: JSON.stringify(['E-commerce', 'Entry Level', 'Flexible']),
    },
  });

  // Add questions for ShopEasy
  await prisma.applicationQuestion.createMany({
    data: [
      {
        opportunityId: shopEasy.id,
        question: 'Have you worked in e-commerce customer support before?',
        questionEs: '¿Has trabajado en soporte al cliente de e-commerce antes?',
        type: 'radio',
        required: true,
        order: 1,
        options: JSON.stringify([
          { value: 'yes', label: 'Yes', labelEs: 'Sí' },
          { value: 'no', label: 'No', labelEs: 'No' },
        ]),
      },
      {
        opportunityId: shopEasy.id,
        question: 'How many hours per week can you commit?',
        questionEs: '¿Cuántas horas por semana puedes comprometer?',
        type: 'number',
        required: true,
        order: 2,
        placeholder: 'Enter hours (e.g., 40)',
        placeholderEs: 'Ingresa horas (ej: 40)',
        validation: JSON.stringify({
          min: 10,
          max: 60,
          message: 'Must be between 10 and 60 hours',
        }),
      },
      {
        opportunityId: shopEasy.id,
        question: 'Tell us about a time you turned an unhappy customer into a satisfied one.',
        questionEs: 'Cuéntanos sobre una vez que convertiste un cliente insatisfecho en uno satisfecho.',
        type: 'textarea',
        required: true,
        order: 3,
        placeholder: 'Describe the situation and how you handled it...',
        placeholderEs: 'Describe la situación y cómo la manejaste...',
      },
    ],
    
  });

  // Create a test admin user
  await prisma.user.upsert({
    where: { email: 'admin@agenthub.com' },
    update: {},
    create: {
      id: 'user-admin-001',
      email: 'admin@agenthub.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true,
    },
  });

  // Create a test agent user
  const agentUser = await prisma.user.upsert({
    where: { email: 'maria.garcia@example.com' },
    update: {},
    create: {
      id: 'user-agent-001',
      email: 'maria.garcia@example.com',
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '+1 (555) 123-4567',
      role: 'agent',
      isActive: true,
    },
  });

  // Create agent profile
  await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      id: 'agent-001',
      userId: agentUser.id,
      atsId: 'ATS-2024-001',
      pipelineStatus: 'training',
      pipelineStage: 4,
      languages: JSON.stringify(['English', 'Spanish']),
      skills: JSON.stringify(['Customer Service', 'Technical Support', 'Bilingual (English/Spanish)']),
      scores: JSON.stringify({
        overall: 85,
        communication: 90,
        technical: 80,
        reliability: 88,
        customerService: 92,
        typing: 65,
        assessment: 87,
      }),
      equipment: JSON.stringify({
        hasComputer: true,
        computerType: 'laptop',
        operatingSystem: 'Windows 11',
        hasHeadset: true,
        internetSpeed: 100,
        hasQuietSpace: true,
        hasBackupInternet: true,
      }),
      availability: JSON.stringify({
        hoursPerWeek: 40,
        preferredShifts: ['morning', 'afternoon'],
        weekendsAvailable: true,
        holidaysAvailable: false,
      }),
      preferredLanguage: 'en',
      timezone: 'America/New_York',
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
