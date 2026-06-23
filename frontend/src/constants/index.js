// =============================================================================
// CONSTANTS/INDEX.JS - Reexporta as constantes da aplicação
// =============================================================================

export * from './theme.js';

export const APP_NAME = 'OdontoDEV';
export const APP_VERSION = '3.0.0';
export const COMPANY_NAME = 'Premium Odonto';

export const CLINIC_HOURS = {
  start: 8.5,
  end: 18,
  slotDuration: 30,
};

export const DAYS_OF_WEEK = [
  { id: 1, name: 'Segunda', shortName: 'Seg', date: '' },
  { id: 2, name: 'Terça', shortName: 'Ter', date: '' },
  { id: 3, name: 'Quarta', shortName: 'Qua', date: '' },
  { id: 4, name: 'Quinta', shortName: 'Qui', date: '' },
  { id: 5, name: 'Sexta', shortName: 'Sex', date: '' },
  { id: 6, name: 'Sábado', shortName: 'Sáb', date: '' },
  { id: 7, name: 'Domingo', shortName: 'Dom', date: '' },
];

export const DENTAL_ARCH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

export const PROCEDURES = {
  'Clínica geral e preventiva': [
    'Consulta odontológica inicial e de urgência',
    'Limpeza (profilaxia)',
    'Aplicação de flúor',
    'Selante',
    'Remoção de fatores de retenção de biofilme',
  ],
  'Dentística (restauração e estética)': [
    'Restauração (obturação)',
    'Clareamento dental',
    'Facetas de porcelana ou resina',
    'Núcleo de preenchimento',
  ],
  'Endodontia (tratamento de canal)': [
    'Pulpotomia/Pulpectomia',
  ],
  'Periodontia (tratamento da gengiva)': [
    'Raspagem subgengival',
  ],
  'Cirurgia oral e traumatologia': [
    'Exodontia',
    'Extração de siso',
    'Bichectomia',
    'Pequenas cirurgias ambulatoriais',
  ],
  'Implantodontia e prótese dentária': [
    'Implantes dentários',
    'Prótese fixa ou removível',
    'Coroa de aço',
  ],
  Ortodontia: [
    'Aparelhos ortodônticos',
  ],
  Odontopediatria: [
    'Atendimento infantil',
  ],
  'Outras especialidades': [
    'Disfunção temporomandibular e dor orofacial',
    'Radiologia odontológica',
    'Odontogeriatria',
  ],
};

export const ANAMNESES_QUESTIONS = [
  'Está sob tratamento médico atualmente?',
  'Faz uso de algum medicamento?',
  'Tem alergia a algum medicamento/anestesia?',
  'Sofre de problemas cardíacos?',
  'Tem diabetes?',
  'Sofre de hipertensão (pressão alta)?',
  'Tem problemas de cicatrização?',
  'Apresentou hemorragia após extração dental?',
];
