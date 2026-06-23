import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Loader2,
  MapPin,
  User,
} from 'lucide-react';
import { ANAMNESES_QUESTIONS } from '../../constants';
import { maskCEP, maskCPF, maskPhone } from '../../utils/masks';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Input from '../ui/Input';

const identificationFields = [
  { field: 'name', placeholder: 'Nome completo *', required: true, className: 'md:col-span-4' },
  { field: 'cpf', placeholder: 'CPF *', required: true },
  { field: 'rg', placeholder: 'RG' },
  { field: 'birthdate', placeholder: 'Data de nascimento *', required: true, type: 'date' },
  { field: 'phone', placeholder: 'Celular / WhatsApp (opcional)' },
  { field: 'email', placeholder: 'E-mail', type: 'email', className: 'md:col-span-2' },
  { field: 'profession', placeholder: 'Profissão', className: 'md:col-span-2' },
];

const addressFields = [
  { field: 'street', placeholder: 'Logradouro / Rua *', required: true, className: 'md:col-span-3' },
  { field: 'number', placeholder: 'Número *', required: true },
  { field: 'complement', placeholder: 'Complemento' },
  { field: 'neighborhood', placeholder: 'Bairro *', required: true, className: 'md:col-span-2' },
  { field: 'city', placeholder: 'Cidade *', required: true },
  { field: 'state', placeholder: 'UF *', required: true, maxLength: 2 },
];

const sectionStyles = {
  shell: 'rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)] sm:p-6',
  header: 'flex flex-col gap-3 border-b border-[var(--border-soft)] pb-5 sm:flex-row sm:items-start sm:justify-between',
  eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--copy-muted)]',
  title: 'mt-2 text-xl font-bold text-[var(--copy-strong)]',
};

const selectClassName = `
  w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-3 text-sm text-[var(--copy-strong)]
  outline-none transition-all duration-200 hover:border-[var(--border-strong)] focus:border-[var(--color-primary-500)]
  focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-app)]
`;

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

const NewPatientView = ({ onAddPatient, onGoToPatients, onDirtyChange }) => {
  const [success, setSuccess] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birthdate: '',
    phone: '',
    email: '',
    rg: '',
    gender: '',
    maritalStatus: '',
    profession: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [medAnswers, setMedAnswers] = useState(() => Object.fromEntries(
    ANAMNESES_QUESTIONS.map((_, index) => [index, 'nao'])
  ));
  const [medDetails, setMedDetails] = useState({});
  const latestCepLookupRef = useRef(0);

  useEffect(() => {
    const hasFormData = Object.values(formData).some((value) => String(value || '').trim() !== '');
    const hasMedicalChoice = Object.values(medAnswers).some((value) => value === 'sim');
    const hasMedicalDetail = Object.values(medDetails).some((value) => String(value || '').trim() !== '');

    onDirtyChange?.(hasFormData || hasMedicalChoice || hasMedicalDetail);
  }, [formData, medAnswers, medDetails, onDirtyChange]);

  useEffect(() => {
    return () => {
      onDirtyChange?.(false);
    };
  }, [onDirtyChange]);

  const handleInputChange = async (field, value) => {
    let formattedValue = value;

    if (field === 'cpf') formattedValue = maskCPF(value);
    if (field === 'phone') formattedValue = maskPhone(value);
    if (field === 'cep') {
      formattedValue = maskCEP(value);
      latestCepLookupRef.current += 1;
      const requestId = latestCepLookupRef.current;

      if (formattedValue.length === 9) {
        lookupCEP(formattedValue, requestId);
      } else {
        setLoadingCEP(false);
        setCepError(false);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const lookupCEP = async (cep, requestId) => {
    setLoadingCEP(true);
    setCepError(false);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      const data = await res.json();

      if (requestId !== latestCepLookupRef.current) {
        return;
      }

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      } else {
        setCepError(true);
      }
    } catch {
      if (requestId !== latestCepLookupRef.current) {
        return;
      }

      setCepError(true);
    } finally {
      if (requestId === latestCepLookupRef.current) {
        setLoadingCEP(false);
      }
    }
  };

  const buildMedicalHistory = () => {
    return ANAMNESES_QUESTIONS.map((question, index) => ({
      question,
      answer: medAnswers[index] === 'sim' ? 'sim' : 'nao',
      detail: medAnswers[index] === 'sim' ? medDetails[index] || undefined : undefined,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      cpf: formData.cpf,
      rg: formData.rg || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      birthdate: formData.birthdate || undefined,
      gender: formData.gender || undefined,
      maritalStatus: formData.maritalStatus || undefined,
      profession: formData.profession || undefined,
      address: {
        cep: formData.cep || undefined,
        street: formData.street || undefined,
        number: formData.number || undefined,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
      },
      medicalHistory: buildMedicalHistory(),
    };

    const result = await onAddPatient(payload);
    setIsSubmitting(false);

    if (!result?.success) {
      return;
    }

    onDirtyChange?.(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onGoToPatients();
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-6xl pb-8 animate-fade-in">
      {success && (
        <div className="mt-6">
          <Alert type="success" message="Paciente cadastrado com sucesso! Redirecionando..." />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={sectionStyles.shell}>
          <div className={sectionStyles.header}>
            <div>
              <p className={sectionStyles.eyebrow}>Etapa 1</p>
              <h3 className={sectionStyles.title}>Identificação pessoal</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
              <User size={20} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {identificationFields.map(({ field, className = '', ...inputProps }) => (
              <div key={field} className={className}>
                <Input
                  value={formData[field]}
                  onChange={(event) => handleInputChange(field, event.target.value)}
                  {...inputProps}
                />
              </div>
            ))}
            <div>
              <select
                value={formData.gender}
                onChange={(event) => handleInputChange('gender', event.target.value)}
                className={selectClassName}
                aria-label="Gênero"
              >
                {genderOptions.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={formData.maritalStatus}
                onChange={(event) => handleInputChange('maritalStatus', event.target.value)}
                className={selectClassName}
                aria-label="Estado civil"
              >
                {maritalStatusOptions.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className={sectionStyles.shell}>
          <div className={sectionStyles.header}>
            <div>
              <p className={sectionStyles.eyebrow}>Etapa 2</p>
              <h3 className={sectionStyles.title}>Endereço</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
              <MapPin size={20} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <Input
                placeholder="CEP *"
                required
                value={formData.cep}
                onChange={(event) => handleInputChange('cep', event.target.value)}
                error={cepError ? 'CEP não encontrado' : undefined}
                helperText={loadingCEP ? 'Buscando endereço...' : undefined}
              />
              {loadingCEP && <Loader2 className="mt-3 animate-spin text-[var(--color-primary-700)]" size={18} />}
            </div>

            {addressFields.map(({ field, className = '', ...inputProps }) => (
              <div key={field} className={className}>
                <Input
                  value={formData[field]}
                  onChange={(event) => handleInputChange(field, event.target.value)}
                  {...inputProps}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={sectionStyles.shell}>
          <div className={sectionStyles.header}>
            <div>
              <p className={sectionStyles.eyebrow}>Etapa 3</p>
              <h3 className={sectionStyles.title}>Questionário clínico</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
              <Activity size={20} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {ANAMNESES_QUESTIONS.map((question, idx) => {
              const answer = medAnswers[idx];

              return (
                <section
                  key={idx}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel-soft)] p-4 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-6 text-[var(--copy-strong)]">
                        {question}
                      </p>
                    </div>

                    <div
                      className="flex shrink-0 rounded-2xl border border-[var(--border-soft)] bg-white p-1"
                      role="radiogroup"
                      aria-label={question}
                    >
                      <button
                        type="button"
                        onClick={() => setMedAnswers((previous) => ({ ...previous, [idx]: 'sim' }))}
                        aria-pressed={answer === 'sim'}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                          answer === 'sim'
                            ? 'bg-[var(--surface-tint)] text-[var(--color-primary-800)]'
                            : 'text-[var(--copy-muted)]'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMedAnswers((previous) => ({ ...previous, [idx]: 'nao' }));
                          setMedDetails((previous) => {
                            if (!(idx in previous)) return previous;

                            const next = { ...previous };
                            delete next[idx];
                            return next;
                          });
                        }}
                        aria-pressed={answer === 'nao'}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                          answer === 'nao'
                            ? 'bg-[var(--surface-panel-strong)] text-[var(--copy-strong)]'
                            : 'text-[var(--copy-muted)]'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {answer === 'sim' && (
                    <div className="mt-4">
                      <Input
                        placeholder="Especifique..."
                        value={medDetails[idx] || ''}
                        onChange={(event) => setMedDetails({ ...medDetails, [idx]: event.target.value })}
                      />
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[rgba(255,252,247,0.98)] p-4 shadow-[var(--shadow-md)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copy-muted)]">
                Revisão final
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={onGoToPatients} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting} loading={isSubmitting} icon={CheckCircle2}>
                {isSubmitting ? 'Salvando...' : 'Confirmar cadastro'}
              </Button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default NewPatientView;
