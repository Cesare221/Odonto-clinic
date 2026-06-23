import { useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FilePenLine,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { ANAMNESES_QUESTIONS } from '../../constants';
import { sanitizeDisplayText } from '../../utils/appointmentDisplay';
import { maskCEP, maskCPF, maskPhone } from '../../utils/masks';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const genderOptions = [
  { value: '', label: 'Gênero' },
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Outro', label: 'Outro' },
  { value: 'Nao informado', label: 'Prefiro não informar' },
];

const maritalStatusOptions = [
  { value: '', label: 'Estado civil' },
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União estável' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
];

const getInitials = (name = 'Paciente') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';

  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const formatDate = (value) => {
  if (!value) return 'Não informado';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('pt-BR');
};

const toDateInputValue = (value) => {
  if (!value) return '';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
};

const getAddress = (patient) => {
  const address = patient?.address || {};

  return {
    cep: address.cep || patient?.cep || '',
    street: address.street || patient?.street || '',
    number: address.number || patient?.number || '',
    complement: address.complement || patient?.complement || '',
    neighborhood: address.neighborhood || patient?.neighborhood || '',
    city: address.city || patient?.city || '',
    state: address.state || patient?.state || '',
  };
};

const looksCorrupted = (value = '') => /�|Ã|Â/.test(String(value));

const getCanonicalMedicalQuestion = (question, index) => {
  const fallbackQuestion = ANAMNESES_QUESTIONS[index];

  if (!question) {
    return fallbackQuestion || `Pergunta ${index + 1}`;
  }

  if (looksCorrupted(question) && fallbackQuestion) {
    return fallbackQuestion;
  }

  return question;
};

const getMedicalEntries = (patient) => {
  if (Array.isArray(patient?.medicalHistory) && patient.medicalHistory.length > 0) {
    return patient.medicalHistory.map((entry, index) => ({
      id: entry?._id || `${entry?.question || 'question'}-${index}`,
      question: getCanonicalMedicalQuestion(entry?.question, index),
      answer: entry?.answer === 'sim' ? 'sim' : 'nao',
      detail: entry?.detail || '',
    }));
  }

  return ANAMNESES_QUESTIONS.map((question, index) => ({
    id: `${question}-${index}`,
    question,
    answer: patient?.medAnswers?.[index] === 'sim' ? 'sim' : 'nao',
    detail: patient?.medAnswers?.[index] === 'sim' ? patient?.medDetails?.[index] || '' : '',
  }));
};

const getTreatmentEntries = (patient) => {
  if (!Array.isArray(patient?.treatmentHistory)) {
    return [];
  }

  return patient.treatmentHistory.map((entry, index) => {
    const procedures = Array.isArray(entry?.procedures)
      ? entry.procedures
          .map((procedure) => {
            if (typeof procedure === 'string') {
              return sanitizeDisplayText(procedure, 'Procedimento registrado');
            }

            return sanitizeDisplayText(procedure?.procedure || procedure?.category || '', 'Procedimento registrado');
          })
          .filter(Boolean)
      : [];

    return {
      id: entry?._id || `${entry?.date || entry?.createdAt || 'history'}-${index}`,
      date: formatDate(entry?.date || entry?.createdAt),
      totalValue: formatCurrency(entry?.totalValue ?? entry?.revenue ?? 0),
      procedures,
      status: entry?.status || '',
      notes: entry?.evolution || entry?.postOpInstructions || '',
      alertsCount: Array.isArray(entry?.anamnesis)
        ? entry.anamnesis.filter((item) => item?.answer === 'sim').length
        : 0,
      teethCount: Array.isArray(entry?.teethUpdates) ? entry.teethUpdates.length : 0,
    };
  });
};

const buildEditDraft = (patient) => {
  const address = getAddress(patient);

  return {
    name: patient?.name || '',
    cpf: patient?.cpf || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    birthdate: toDateInputValue(patient?.birthdate),
    rg: patient?.rg || '',
    gender: patient?.gender || 'Nao informado',
    maritalStatus: patient?.maritalStatus || '',
    profession: patient?.profession || '',
    dentalNotes: patient?.dentalNotes || '',
    address,
    medicalEntries: getMedicalEntries(patient),
  };
};

const optionalString = (value) => {
  const normalized = String(value || '').trim();
  return normalized ? normalized : undefined;
};

const buildUpdatePayload = (draft) => {
  const payload = {
    name: draft.name.trim(),
    address: {
      cep: optionalString(draft.address.cep) || '',
      street: optionalString(draft.address.street) || '',
      number: optionalString(draft.address.number) || '',
      complement: optionalString(draft.address.complement) || '',
      neighborhood: optionalString(draft.address.neighborhood) || '',
      city: optionalString(draft.address.city) || '',
      state: optionalString(draft.address.state)?.toUpperCase() || '',
    },
    medicalHistory: draft.medicalEntries.map((entry, index) => ({
      question: getCanonicalMedicalQuestion(entry.question, index),
      answer: entry.answer === 'sim' ? 'sim' : 'nao',
      detail: entry.answer === 'sim' ? optionalString(entry.detail) || '' : '',
    })),
  };

  const optionalFields = {
    cpf: optionalString(draft.cpf),
    phone: optionalString(draft.phone),
    email: optionalString(draft.email),
    birthdate: optionalString(draft.birthdate),
    rg: optionalString(draft.rg),
    gender: optionalString(draft.gender) || 'Nao informado',
    maritalStatus: optionalString(draft.maritalStatus),
    profession: optionalString(draft.profession),
    dentalNotes: optionalString(draft.dentalNotes),
  };

  Object.entries(optionalFields).forEach(([field, value]) => {
    if (value !== undefined) {
      payload[field] = value;
    }
  });

  return payload;
};

const infoCardClassName = 'rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]';
const sectionTitleClassName = 'flex items-center gap-2 text-base font-semibold text-[var(--copy-strong)]';
const selectClassName = `
  w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 text-sm text-[var(--copy-strong)]
  outline-none transition-all duration-200 hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)]
  focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]
`;
const textareaClassName = `
  w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 text-sm text-[var(--copy-strong)]
  outline-none transition-all duration-200 placeholder:text-[var(--copy-soft)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)]
  focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-panel)]
`;

const PatientDetailModal = ({
  patient,
  onClose,
  canEdit = false,
  canDelete = false,
  onUpdatePatient,
  onDeletePatient,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(() => buildEditDraft(patient));
  const isOpen = Boolean(patient);

  const patientId = String(patient?._id || patient?.id || '');
  const address = getAddress(patient);
  const medicalEntries = getMedicalEntries(patient);
  const treatmentEntries = getTreatmentEntries(patient);
  const affirmativeConditions = medicalEntries.filter((entry) => entry.answer === 'sim').length;
  const lastVisit = patient?.lastVisit ? formatDate(patient.lastVisit) : 'Sem atendimento registrado';
  const registrationReadiness = [
    patient?.cpf,
    patient?.phone,
    patient?.birthdate,
    patient?.email,
    patient?.profession,
    address.street,
    address.city,
  ].filter((value) => String(value || '').trim()).length;

  const topInfo = [
    { label: 'CPF', value: patient?.cpf || 'Não informado' },
    { label: 'Telefone', value: patient?.phone || 'Não informado' },
    { label: 'Última visita', value: lastVisit },
  ];

  const identityRows = [
    { label: 'Nome completo', value: patient?.name || 'Não informado' },
    { label: 'RG', value: patient?.rg || 'Não informado' },
    { label: 'Nascimento', value: formatDate(patient?.birthdate) },
    { label: 'Gênero', value: patient?.gender || 'Não informado' },
    { label: 'Estado civil', value: patient?.maritalStatus || 'Não informado' },
    { label: 'Profissão', value: patient?.profession || 'Não informado' },
  ];

  const contactRows = [
    { label: 'Celular / WhatsApp', value: patient?.phone || 'Não informado' },
    { label: 'E-mail', value: patient?.email || 'Não informado' },
  ];

  const addressRows = [
    { label: 'CEP', value: address.cep || 'Não informado' },
    { label: 'Rua', value: address.street || 'Não informado' },
    { label: 'Número', value: address.number || 'Não informado' },
    { label: 'Complemento', value: address.complement || 'Não informado' },
    { label: 'Bairro', value: address.neighborhood || 'Não informado' },
    { label: 'Cidade / UF', value: [address.city, address.state].filter(Boolean).join(' - ') || 'Não informado' },
  ];

  const longitudinalSummary = [
    {
      label: 'Atendimentos',
      value: treatmentEntries.length,
    },
    {
      label: 'Alertas clínicos',
      value: affirmativeConditions,
    },
    {
      label: 'Contato',
      value: patient?.phone ? 'Contato pronto' : 'Completar contato',
    },
    {
      label: 'Cadastro',
      value: registrationReadiness >= 5 ? 'Completo' : 'Revisar',
    },
  ];

  const handleDraftFieldChange = (field, value) => {
    let formattedValue = value;

    if (field === 'cpf') formattedValue = maskCPF(value);
    if (field === 'phone') formattedValue = maskPhone(value);

    setDraft((previousDraft) => ({
      ...previousDraft,
      [field]: formattedValue,
    }));
  };

  const handleAddressFieldChange = (field, value) => {
    let formattedValue = value;

    if (field === 'cep') formattedValue = maskCEP(value);
    if (field === 'state') formattedValue = value.toUpperCase().slice(0, 2);

    setDraft((previousDraft) => ({
      ...previousDraft,
      address: {
        ...previousDraft.address,
        [field]: formattedValue,
      },
    }));
  };

  const handleMedicalAnswerChange = (entryIndex, answer) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      medicalEntries: previousDraft.medicalEntries.map((entry, index) => (
        index === entryIndex
          ? { ...entry, answer, detail: answer === 'sim' ? entry.detail : '' }
          : entry
      )),
    }));
  };

  const handleMedicalDetailChange = (entryIndex, detail) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      medicalEntries: previousDraft.medicalEntries.map((entry, index) => (
        index === entryIndex
          ? { ...entry, detail }
          : entry
      )),
    }));
  };

  const handleStartEditing = () => {
    setDraft(buildEditDraft(patient));
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraft(buildEditDraft(patient));
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!canEdit || !patientId || !onUpdatePatient) {
      return;
    }

    setIsSaving(true);
    const result = await onUpdatePatient(patientId, buildUpdatePayload(draft));
    setIsSaving(false);

    if (result?.success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !patientId || !onDeletePatient) {
      return;
    }

    const shouldDelete = window.confirm(
      `Tem certeza de que deseja excluir o cadastro de ${patient?.name || 'este paciente'}? O prontuário será inativado.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    const result = await onDeletePatient(patientId);
    setIsDeleting(false);

    if (result?.success) {
      onClose();
    }
  };

  if (!patient) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar ficha do paciente' : 'Ficha do paciente'} size="xl">
      <form onSubmit={handleSave} className="space-y-6">
        <section className="page-hero-panel overflow-hidden rounded-[2rem] p-6 sm:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-700)] px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-sm)]">
                  <FileText size={14} />
                  {isEditing ? 'Edição de cadastro' : 'Prontuário'}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(145deg,var(--color-primary-500),var(--color-primary-700))] text-lg font-bold text-white shadow-[var(--shadow-md)]">
                  {getInitials(patient?.name)}
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-primary-700)]">
                    {isEditing ? 'Editar cadastro' : 'Ficha clínica'}
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight text-[var(--copy-strong)]">
                    {patient?.name || 'Paciente sem nome'}
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {topInfo.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[var(--border-soft)] bg-white/84 p-4 shadow-[var(--shadow-sm)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--copy-strong)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-[var(--border-soft)] bg-white/84 p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--copy-strong)]">
                    {isEditing ? 'Edição ativa' : 'Resumo'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {longitudinalSummary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[var(--copy-strong)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {canEdit && (
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-primary-700)] shadow-[var(--shadow-sm)]">
                      <FilePenLine size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--copy-strong)]">Atualização do cadastro</p>
                      {!isEditing ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="mt-4"
                          icon={FilePenLine}
                          onClick={handleStartEditing}
                        >
                          Editar cadastro
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          className="mt-4"
                          icon={X}
                          onClick={handleCancelEditing}
                        >
                          Cancelar edicao
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {canDelete && (
                <div className="rounded-2xl border border-rose-200 bg-[linear-gradient(180deg,rgba(255,245,245,1),rgba(255,236,236,0.96))] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-[var(--shadow-sm)]">
                      <ShieldAlert size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-rose-800">Controle administrativo</p>
                      <Button
                        type="button"
                        variant="danger"
                        className="mt-4"
                        icon={Trash2}
                        loading={isDeleting}
                        disabled={isDeleting || isSaving}
                        onClick={handleDelete}
                      >
                        {isDeleting ? 'Excluindo cadastro...' : 'Excluir cadastro'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <article className={infoCardClassName}>
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
                <h3 className={sectionTitleClassName}>
                  <UserRound size={18} className="text-[var(--color-primary-700)]" />
                  Identificacao pessoal
                </h3>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                  base cadastral
                </span>
              </div>

              {isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nome completo"
                    value={draft.name}
                    onChange={(event) => handleDraftFieldChange('name', event.target.value)}
                    required
                  />
                  <Input
                    label="CPF"
                    value={draft.cpf}
                    onChange={(event) => handleDraftFieldChange('cpf', event.target.value)}
                    required
                  />
                  <Input
                    label="RG"
                    value={draft.rg}
                    onChange={(event) => handleDraftFieldChange('rg', event.target.value)}
                  />
                  <Input
                    label="Data de nascimento"
                    type="date"
                    value={draft.birthdate}
                    onChange={(event) => handleDraftFieldChange('birthdate', event.target.value)}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[var(--copy-strong)]" htmlFor="patient-edit-gender">
                      Gênero
                    </label>
                    <select
                      id="patient-edit-gender"
                      className={selectClassName}
                      value={draft.gender}
                      onChange={(event) => handleDraftFieldChange('gender', event.target.value)}
                    >
                      {genderOptions.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[var(--copy-strong)]" htmlFor="patient-edit-marital-status">
                      Estado civil
                    </label>
                    <select
                      id="patient-edit-marital-status"
                      className={selectClassName}
                      value={draft.maritalStatus}
                      onChange={(event) => handleDraftFieldChange('maritalStatus', event.target.value)}
                    >
                      {maritalStatusOptions.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Profissão"
                      value={draft.profession}
                      onChange={(event) => handleDraftFieldChange('profession', event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {identityRows.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-[var(--surface-panel-soft)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--copy-strong)]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className={infoCardClassName}>
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
                <h3 className={sectionTitleClassName}>
                  <Phone size={18} className="text-[var(--color-primary-700)]" />
                  Contato e endereço
                </h3>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                  recepção
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Celular / WhatsApp"
                      value={draft.phone}
                      onChange={(event) => handleDraftFieldChange('phone', event.target.value)}
                    />
                    <Input
                      label="E-mail"
                      type="email"
                      value={draft.email}
                      onChange={(event) => handleDraftFieldChange('email', event.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="CEP"
                      value={draft.address.cep}
                      onChange={(event) => handleAddressFieldChange('cep', event.target.value)}
                    />
                    <Input
                      label="Rua"
                      value={draft.address.street}
                      onChange={(event) => handleAddressFieldChange('street', event.target.value)}
                    />
                    <Input
                      label="Numero"
                      value={draft.address.number}
                      onChange={(event) => handleAddressFieldChange('number', event.target.value)}
                    />
                    <Input
                      label="Complemento"
                      value={draft.address.complement}
                      onChange={(event) => handleAddressFieldChange('complement', event.target.value)}
                    />
                    <Input
                      label="Bairro"
                      value={draft.address.neighborhood}
                      onChange={(event) => handleAddressFieldChange('neighborhood', event.target.value)}
                    />
                    <Input
                      label="Cidade"
                      value={draft.address.city}
                      onChange={(event) => handleAddressFieldChange('city', event.target.value)}
                    />
                    <Input
                      label="UF"
                      value={draft.address.state}
                      maxLength={2}
                      onChange={(event) => handleAddressFieldChange('state', event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-[1.5rem] bg-[var(--surface-panel-soft)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--copy-strong)]">
                      <Phone size={16} className="text-[var(--copy-muted)]" />
                      Contato direto
                    </div>
                    {contactRows.map((item) => (
                      <div key={item.label}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-[var(--copy-strong)]">
                          {item.label === 'E-mail' ? (
                            <span className="inline-flex items-center gap-2">
                              <Mail size={14} className="text-[var(--copy-soft)]" />
                              {item.value}
                            </span>
                          ) : item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-[1.5rem] bg-[var(--surface-panel-soft)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--copy-strong)]">
                      <MapPin size={16} className="text-[var(--copy-muted)]" />
                      Endereço de referência
                    </div>
                    {addressRows.map((item) => (
                      <div key={item.label}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-[var(--copy-strong)]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>

          <div className="space-y-6">
            <article className={infoCardClassName}>
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
                <h3 className={sectionTitleClassName}>
                  <HeartPulse size={18} className="text-[var(--color-primary-700)]" />
                  Anamnese e condições
                </h3>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                  triagem inicial
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {draft.medicalEntries.map((entry, entryIndex) => {
                    const isPositive = entry.answer === 'sim';

                    return (
                      <div
                        key={entry.id}
                        className={`rounded-[1.25rem] border p-4 ${
                          isPositive
                            ? 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,249,239,1),rgba(255,244,224,0.96))]'
                            : 'border-[var(--border-soft)] bg-[var(--surface-panel-soft)]'
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <p className="text-sm font-medium leading-6 text-[var(--copy-strong)]">
                            {entry.question}
                          </p>
                          <div className="inline-flex rounded-full border border-[var(--border-soft)] bg-white p-1 shadow-[var(--shadow-sm)]">
                            {['sim', 'nao'].map((answer) => {
                              const isActive = entry.answer === answer;
                              return (
                                <button
                                  key={answer}
                                  type="button"
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                                    isActive
                                      ? answer === 'sim'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                      : 'text-[var(--copy-muted)] hover:text-[var(--copy-strong)]'
                                  }`}
                                  onClick={() => handleMedicalAnswerChange(entryIndex, answer)}
                                >
                                  {answer === 'sim' ? 'Sim' : 'Não'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {entry.answer === 'sim' && (
                          <div className="mt-3">
                            <Input
                              label="Detalhe clínico"
                              value={entry.detail}
                              onChange={(event) => handleMedicalDetailChange(entryIndex, event.target.value)}
                              placeholder="Descreva a observação clínica relevante"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4">
                    <label className="mb-1.5 block text-sm font-semibold text-[var(--copy-strong)]" htmlFor="patient-edit-dental-notes">
                      Observações odontológicas
                    </label>
                    <textarea
                      id="patient-edit-dental-notes"
                      rows={4}
                      className={textareaClassName}
                      value={draft.dentalNotes}
                      onChange={(event) => handleDraftFieldChange('dentalNotes', event.target.value)}
                      placeholder="Registre observações de acompanhamento que ajudem nas próximas consultas"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {medicalEntries.map((entry) => {
                    const isPositive = entry.answer === 'sim';

                    return (
                      <div
                        key={entry.id}
                        className={`rounded-[1.25rem] border p-4 ${
                          isPositive
                            ? 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,249,239,1),rgba(255,244,224,0.96))]'
                            : 'border-[var(--border-soft)] bg-[var(--surface-panel-soft)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium leading-6 text-[var(--copy-strong)]">
                            {entry.question}
                          </p>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                              isPositive
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isPositive ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        {entry.detail && (
                          <p className="mt-3 rounded-xl bg-white/72 px-3 py-2 text-sm leading-6 text-[var(--copy-body)]">
                            {entry.detail}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {patient?.dentalNotes && (
                    <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                        Observações odontológicas
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--copy-body)]">
                        {patient.dentalNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </article>

            <article className={infoCardClassName}>
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
                <h3 className={sectionTitleClassName}>
                  <ClipboardList size={18} className="text-[var(--color-primary-700)]" />
                  Histórico de atendimentos
                </h3>
              </div>

              {treatmentEntries.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-5 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--color-primary-700)] shadow-[var(--shadow-sm)]">
                    <Activity size={20} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--copy-strong)]">
                    Nenhum atendimento registrado ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {treatmentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,253,249,0.98),rgba(248,242,231,0.92))] p-4 shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                            <CalendarDays size={12} />
                            {entry.date}
                          </div>
                          <p className="mt-3 text-base font-semibold text-[var(--copy-strong)]">
                            Sessão registrada
                          </p>
                          {entry.status && (
                            <p className="mt-1 text-sm text-[var(--copy-body)]">
                              Status: {entry.status}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-[var(--border-soft)] bg-white/84 px-4 py-3 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                            Valor
                          </p>
                          <p className="mt-1 text-base font-semibold text-[var(--copy-strong)]">
                            {entry.totalValue}
                          </p>
                        </div>
                      </div>

                      {entry.procedures.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {entry.procedures.map((procedure) => (
                            <span
                              key={`${entry.id}-${procedure}`}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/78 px-3 py-1.5 text-xs font-medium text-[var(--copy-body)]"
                            >
                              <CheckCircle2 size={12} className="text-[var(--color-primary-700)]" />
                              {procedure}
                            </span>
                          ))}
                        </div>
                      )}

                      {(entry.alertsCount > 0 || entry.teethCount > 0) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {entry.alertsCount > 0 && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                              <HeartPulse size={12} />
                              {entry.alertsCount} alerta(s) de anamnese
                            </span>
                          )}
                          {entry.teethCount > 0 && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/78 px-3 py-1.5 text-xs font-medium text-[var(--copy-body)]">
                              <Activity size={12} className="text-[var(--color-primary-700)]" />
                              {entry.teethCount} dente(s) atualizado(s)
                            </span>
                          )}
                        </div>
                      )}

                      {entry.notes && (
                        <p className="mt-4 rounded-2xl bg-white/68 px-4 py-3 text-sm leading-6 text-[var(--copy-body)]">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-[var(--border-soft)] pt-2 sm:flex-row sm:justify-end">
          {isEditing ? (
            <>
              <Button type="button" variant="secondary" onClick={handleCancelEditing} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" icon={Save} loading={isSaving} disabled={isSaving}>
                {isSaving ? 'Salvando alterações...' : 'Salvar alterações'}
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar ficha
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default PatientDetailModal;
