import test from 'node:test';
import assert from 'node:assert/strict';

import { updatePatientSchema } from '../backend/validators/patientValidator.js';

test('updatePatientSchema preserva os campos completos do cadastro do paciente', () => {
  const payload = {
    body: {
      name: 'Maria da Silva',
      cpf: '123.456.789-09',
      rg: '12.345.678-9',
      phone: '(11) 98888-7777',
      email: 'maria@clinica.com',
      birthdate: '1990-05-10',
      gender: 'Feminino',
      maritalStatus: 'casado',
      profession: 'Dentista',
      dentalNotes: 'Paciente sensivel a frio.',
      address: {
        cep: '01001-000',
        street: 'Rua das Flores',
        number: '100',
        complement: 'Sala 5',
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
      },
      medicalHistory: [
        {
          question: 'Usa medicacao continua?',
          answer: 'sim',
          detail: 'Controla hipertensao.',
        },
      ],
    },
  };

  const parsed = updatePatientSchema.safeParse(payload);

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.body.cpf, payload.body.cpf);
  assert.equal(parsed.data.body.rg, payload.body.rg);
  assert.equal(parsed.data.body.maritalStatus, payload.body.maritalStatus);
  assert.equal(parsed.data.body.profession, payload.body.profession);
});
