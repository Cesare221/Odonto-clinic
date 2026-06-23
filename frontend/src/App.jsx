import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useAuth } from './contexts/useAuthContext';
import { ANAMNESES_QUESTIONS } from './constants';

import MainLayout from './components/layout/MainLayout';
import LoginScreen from './components/auth/LoginScreen';
import PatientDetailModal from './components/patients/PatientDetailModal';

import {
  createAppointment as createAppointmentRequest,
  deleteAppointment as deleteAppointmentRequest,
  listAppointments,
  updateConfirmationHandled,
  updateAttendanceStatus,
  updateRescheduleRequest as updateAppointmentRescheduleRequestApi,
} from './services/appointmentsService';
import {
  createPatient as createPatientRequest,
  deletePatient as deletePatientRequest,
  getPatient as getPatientRequest,
  listPatients,
  updatePatient as updatePatientRequest,
} from './services/patientsService';
import {
  createTreatmentSession as createTreatmentSessionRequest,
  finalizeTreatmentSession as finalizeTreatmentSessionRequest,
  updateTreatmentSession as updateTreatmentSessionRequest,
} from './services/treatmentsService';
import {
  createTransaction as createTransactionRequest,
  deleteTransaction as deleteTransactionRequest,
  listTransactions,
} from './services/transactionsService';
import {
  getOperationalNextAction,
  getOperationalStatusMeta,
  isQueueActionable,
} from './utils/operationalStatus';
import { getAppointmentProcedureLabel, getAppointmentTypeLabel } from './utils/appointmentDisplay';

const DashboardView = lazy(() => import('./components/dashboard/DashboardView'));
const FinanceView = lazy(() => import('./components/finance/FinanceView'));
const CalendarView = lazy(() => import('./components/calendar/CalendarView'));
const NewPatientView = lazy(() => import('./components/patients/NewPatientView'));
const PatientsView = lazy(() => import('./components/patients/PatientsView'));
const AttendanceSessionView = lazy(() => import('./components/attendance/AttendanceSessionView'));
const UsersView = lazy(() => import('./components/admin/UsersView'));

const APPOINTMENT_COLOR_MAP = {
  eval: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },
  routine: { bg: '#ccfbf1', text: '#0d9488', border: '#99f6e4' },
  surgery: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  ortho: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
  aesthetic: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  emergency: { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
};

const toLocalDateKey = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayIdFromDate = (dateObj) => {
  const jsDay = dateObj.getDay();
  return jsDay === 0 ? 7 : jsDay;
};

const getDecimalHour = (dateObj) => {
  return dateObj.getHours() + (dateObj.getMinutes() >= 30 ? 0.5 : 0);
};

const formatHour = (decimalHour) => {
  const hour = Math.floor(Number(decimalHour));
  const minute = Number(decimalHour) % 1 === 0.5 ? '30' : '00';
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const safePtText = (value) => {
  return typeof value === 'string' ? value : value;
};

const normalizePatient = (patient) => {
  const lastVisit = patient?.lastVisit
    ? new Date(patient.lastVisit).toLocaleDateString('pt-BR')
    : 'N/A';

  return {
    ...patient,
    id: patient?._id || patient?.id,
    name: safePtText(patient?.name || ''),
    cpf: patient?.cpf || '',
    phone: patient?.phone || '',
    lastVisit,
  };
};

const normalizeTransaction = (transaction) => ({
  ...transaction,
  id: transaction?._id || transaction?.id,
  value: Number(transaction?.value || 0),
});

const decorateOperationalFields = (appointmentLike) => {
  const confirmationStatus = appointmentLike?.statusConfirmacao || 'pendente';
  const attendanceStatus = appointmentLike?.attendanceStatus || appointmentLike?.status || 'waiting';
  const operationalContext = {
    ...appointmentLike,
    status: appointmentLike?.status || attendanceStatus,
    attendanceStatus,
    statusConfirmacao: confirmationStatus,
  };
  const operationalMeta = getOperationalStatusMeta(operationalContext);

  return {
    ...appointmentLike,
    statusConfirmacao: confirmationStatus,
    attendanceStatus,
    operationalStatusKey: operationalMeta.key,
    operationalLabel: operationalMeta.label,
    operationalShortLabel: operationalMeta.shortLabel,
    nextAction: getOperationalNextAction({
      ...operationalContext,
      operationalStatusKey: operationalMeta.key,
    }),
  };
};

const mapApiAppointmentToUi = (appointment, patientById = new Map()) => {
  const startDate = new Date(appointment.start);
  const endDate = new Date(appointment.end);
  const type = appointment.type || 'routine';

  const patientId = typeof appointment.patient === 'string'
    ? appointment.patient
    : appointment.patient?._id;

  const patientFromMap = patientById.get(String(patientId));
  const resolvedPatient = typeof appointment.patient === 'object'
    ? appointment.patient
    : patientFromMap;

  const fallbackTitle = resolvedPatient?.name ? `Consulta - ${resolvedPatient.name}` : 'Consulta';

  return decorateOperationalFields({
    id: appointment._id || appointment.id,
    _id: appointment._id || appointment.id,
    title: safePtText(appointment.title || fallbackTitle),
    patient: resolvedPatient,
    patientId: patientId || resolvedPatient?._id || '',
    patientPhone: appointment.patientPhone || resolvedPatient?.phone || '',
    type,
    typeLabel: getAppointmentTypeLabel({ ...appointment, type }),
    procedure: getAppointmentProcedureLabel({ ...appointment, type }),
    start: getDecimalHour(startDate),
    duration: Math.max(0.5, (endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000)),
    day: getDayIdFromDate(startDate),
    appointmentDate: toLocalDateKey(startDate),
    date: startDate.toISOString(),
    statusConfirmacao: appointment.statusConfirmacao || 'pendente',
    confirmacaoObservacao: appointment.confirmacaoObservacao || '',
    confirmationUpdatedAt: appointment.confirmacaoRespondedAt || appointment.updatedAt || null,
    confirmationHandledAt: appointment.confirmacaoTratadaAt || null,
    attendanceStatus: appointment.attendanceStatus || 'waiting',
    rescheduleRequest: appointment?.rescheduleRequest || null,
    color: APPOINTMENT_COLOR_MAP[type] || APPOINTMENT_COLOR_MAP.routine,
  });
};

const updateAppointmentInList = (list, appointmentId, patch) => {
  return list.map((item) => (
    String(item.id) === String(appointmentId)
      ? decorateOperationalFields({ ...item, ...patch })
      : item
  ));
};

const buildAnamnesisPayload = (anamnesisData = {}) => {
  const answers = anamnesisData?.answers || {};
  const details = anamnesisData?.details || {};

  return Object.entries(answers).map(([index, answer]) => ({
    question: ANAMNESES_QUESTIONS[Number(index)] || `Pergunta ${Number(index) + 1}`,
    answer: answer === 'sim' ? 'sim' : 'nao',
    detail: answer === 'sim' ? details[index] || '' : '',
  }));
};

const buildTeethUpdatesPayload = (teethData = {}) => {
  return Object.entries(teethData).map(([tooth, toothData]) => ({
    tooth,
    status: toothData?.status || 'saudavel',
    note: toothData?.note || '',
  }));
};

export default function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const userRole = user?.role;
  const isReceptionist = userRole === 'receptionist';
  const canDeletePatient = userRole === 'admin';
  const canEditPatient = userRole === 'admin' || userRole === 'doctor';

  const [currentView, setCurrentView] = useState('dashboard');
  const [activeSession, setActiveSession] = useState(null);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPatientFormDirty, setIsPatientFormDirty] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({ receitas: 0, despesas: 0, saldo: 0 });
  const [isFinanceLoading, setIsFinanceLoading] = useState(false);

  const loadClinicalData = useCallback(async () => {
    try {
      const [patientsFromApiRaw, appointmentsFromApiRaw] = await Promise.all([
        listPatients({ limit: 300 }),
        listAppointments(),
      ]);

      const patientsFromApi = patientsFromApiRaw
        .filter((patient) => patient?.isActive !== false)
        .map(normalizePatient);

      const patientById = new Map(
        patientsFromApi
          .filter((patient) => patient?._id || patient?.id)
          .map((patient) => [String(patient._id || patient.id), patient])
      );

      const appointmentsFromApi = appointmentsFromApiRaw
        .map((appointment) => mapApiAppointmentToUi(appointment, patientById));

      setPatients(patientsFromApi);
      setAppointments(appointmentsFromApi);
    } catch {
      toast.error('Não foi possível sincronizar pacientes e agendamentos do servidor.');
    }
  }, []);

  const loadFinancialData = useCallback(async ({ silent = false } = {}) => {
    if (isReceptionist) {
      setTransactions([]);
      setFinancialSummary({ receitas: 0, despesas: 0, saldo: 0 });
      return { success: true };
    }

    if (!silent) {
      setIsFinanceLoading(true);
    }

    try {
      const financialData = await listTransactions({ limit: 300 });
      setTransactions((financialData.transactions || []).map(normalizeTransaction));
      setFinancialSummary(financialData.stats || { receitas: 0, despesas: 0, saldo: 0 });
      return { success: true };
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.message || 'Não foi possível sincronizar os dados financeiros do servidor.');
      }
      return { success: false };
    } finally {
      if (!silent) {
        setIsFinanceLoading(false);
      }
    }
  }, [isReceptionist]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timerId = window.setTimeout(() => {
      loadClinicalData();
      loadFinancialData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isAuthenticated, loadClinicalData, loadFinancialData]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const intervalId = window.setInterval(() => {
      loadClinicalData();
      loadFinancialData({ silent: true });
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, loadClinicalData, loadFinancialData]);

  const handleAddAppointment = async (appt) => {
    try {
      const patient = patients.find((item) => String(item._id || item.id) === String(appt.patientId));
      if (!patient) {
        return { success: false, message: 'Paciente não encontrado na base local.' };
      }

      const startHour = Math.floor(Number(appt.start));
      const startMinute = Number(appt.start) % 1 === 0.5 ? 30 : 0;
      const appointmentDate = appt.appointmentDate
        ? new Date(`${appt.appointmentDate}T00:00:00`)
        : new Date();
      appointmentDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date(appointmentDate);
      endDate.setMinutes(endDate.getMinutes() + Math.round(Number(appt.duration) * 60));

      const payload = {
        title: appt.title,
        patient: String(appt.patientId),
        start: appointmentDate.toISOString(),
        end: endDate.toISOString(),
        type: appt.type,
        procedure: getAppointmentProcedureLabel(appt),
        patientPhone: patient.phone || '',
        statusConfirmacao: 'pendente',
        attendanceStatus: 'waiting',
      };

      const createdAppointment = await createAppointmentRequest(payload);

      const mappedAppointment = mapApiAppointmentToUi(
        { ...createdAppointment, patient },
        new Map([[String(patient._id || patient.id), patient]])
      );

      setAppointments((previousAppointments) => [...previousAppointments, mappedAppointment]);
      toast.success('Agendamento salvo no servidor com sucesso.');
      return { success: true, data: mappedAppointment };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Não foi possível salvar o agendamento.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteAppointment = async (id) => {
    const idAsString = String(id);

    try {
      await deleteAppointmentRequest(idAsString);
      setAppointments((previousAppointments) => previousAppointments.filter((appointment) => String(appointment.id) !== idAsString));
      toast.success('Agendamento removido.');
      return { success: true };
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Falha ao remover agendamento.');
      return { success: false };
    }
  };

  const handleAddPatient = async (payload) => {
    try {
      const createdPatient = await createPatientRequest(payload);
      const normalizedPatient = normalizePatient(createdPatient);
      setPatients((previousPatients) => [normalizedPatient, ...previousPatients]);
      toast.success('Paciente cadastrado no servidor.');
      return { success: true, data: normalizedPatient };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Não foi possível cadastrar o paciente.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeletePatient = async (patientId) => {
    const idAsString = String(patientId);

    try {
      await deletePatientRequest(idAsString);
      setPatients((previousPatients) => previousPatients.filter((patient) => String(patient._id || patient.id) !== idAsString));
      setSelectedPatientProfile((previousProfile) => (
        previousProfile && String(previousProfile._id || previousProfile.id) === idAsString
          ? null
          : previousProfile
      ));
      toast.success('Cadastro do paciente removido com sucesso.');
      return { success: true };
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível remover o cadastro do paciente.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleUpdatePatient = async (patientId, payload) => {
    const idAsString = String(patientId);

    try {
      const updatedPatient = await updatePatientRequest(idAsString, payload);
      const normalizedPatient = normalizePatient(updatedPatient);

      setPatients((previousPatients) => previousPatients.map((patient) => (
        String(patient._id || patient.id) === idAsString
          ? normalizedPatient
          : patient
      )));

      setSelectedPatientProfile((previousProfile) => (
        previousProfile && String(previousProfile._id || previousProfile.id) === idAsString
          ? { ...previousProfile, ...updatedPatient }
          : previousProfile
      ));

      toast.success('Cadastro do paciente atualizado com sucesso.');
      return { success: true, data: updatedPatient };
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível atualizar o cadastro do paciente.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleAddTransaction = async (transaction) => {
    try {
      await createTransactionRequest({
        ...transaction,
        value: Number(transaction?.value || 0),
      });
      await loadFinancialData({ silent: true });
      toast.success('Transação registrada no servidor.');
      return { success: true };
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível registrar a transação.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await deleteTransactionRequest(String(transactionId));
      await loadFinancialData({ silent: true });
      toast.success('Transação removida com sucesso.');
      return { success: true };
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível remover a transação.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleViewPatientProfile = async (patient) => {
    const fallbackProfile = normalizePatient(patient);
    const patientId = String(patient?._id || patient?.id || '');

    setSelectedPatientProfile(fallbackProfile);

    if (!patientId) {
      return;
    }

    try {
      const detailedPatient = await getPatientRequest(patientId);
      setSelectedPatientProfile((previousProfile) => (
        previousProfile && String(previousProfile._id || previousProfile.id) === patientId
          ? detailedPatient
          : previousProfile
      ));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Não foi possível carregar a ficha completa do paciente.');
    }
  };

  const handleStartAttendance = async (session) => {
    if (isReceptionist) {
      toast.info('Recepcionista possui acesso somente ao painel da fila.');
      return;
    }

    if (!isQueueActionable(session)) {
      toast.info('Este caso precisa de ajuste de agenda antes de entrar em atendimento.');
      return;
    }

    let createdTreatmentSessionId = '';

    try {
      const treatmentSession = await createTreatmentSessionRequest({
        patient: String(session.patientId),
        appointment: String(session.id),
      });
      createdTreatmentSessionId = String(treatmentSession?._id || treatmentSession?.id || '');

      await updateAttendanceStatus(String(session.id), 'in-progress');
      setAppointments((previousAppointments) => updateAppointmentInList(previousAppointments, session.id, { attendanceStatus: 'in-progress' }));
      setActiveSession({
        ...session,
        status: 'in-progress',
        treatmentSessionId: createdTreatmentSessionId,
      });
      setCurrentView('attendance');
    } catch (error) {
      if (createdTreatmentSessionId) {
        await updateTreatmentSessionRequest(createdTreatmentSessionId, { status: 'cancelled' }).catch(() => undefined);
      }
      toast.error(error?.response?.data?.message || 'Não foi possível iniciar o atendimento.');
    }
  };

  const handleFinishAttendance = async (
    sessionId,
    revenue,
    procedures,
    teethData = {},
    evolutionText = '',
    anamnesisData = {}
  ) => {
    const appointment = appointments.find((item) => String(item.id) === String(sessionId));
    const targetPatientId = String(
      appointment?.patientId || appointment?.patient?._id || appointment?.patient?.id || ''
    );
    const todayLabel = new Date().toLocaleDateString('pt-BR');
    const treatmentSessionId = String(activeSession?.treatmentSessionId || '');

    try {
      if (!treatmentSessionId) {
        throw new Error('Sessão clínica não encontrada para este atendimento.');
      }

      await finalizeTreatmentSessionRequest(treatmentSessionId, {
        totalValue: revenue,
        procedures,
        paymentMethod: 'other',
        teethUpdates: buildTeethUpdatesPayload(teethData),
        anamnesis: buildAnamnesisPayload(anamnesisData),
        evolution: evolutionText,
      });
      await updateAttendanceStatus(String(sessionId), 'done');
      setAppointments((previousAppointments) => updateAppointmentInList(previousAppointments, sessionId, { attendanceStatus: 'done' }));
      await loadFinancialData({ silent: true });

      const detailedPatient = targetPatientId ? await getPatientRequest(targetPatientId) : null;
      if (detailedPatient) {
        const normalizedDetailedPatient = normalizePatient(detailedPatient);
        setPatients((previousPatients) => previousPatients.map((patient) => (
          String(patient._id || patient.id) === targetPatientId
            ? normalizedDetailedPatient
            : patient
        )));
        setSelectedPatientProfile((previousProfile) => (
          previousProfile && String(previousProfile._id || previousProfile.id) === targetPatientId
            ? detailedPatient
            : previousProfile
        ));
      } else {
        setPatients((previousPatients) => previousPatients.map((patient) => {
          if (String(patient._id || patient.id) === targetPatientId) {
            return {
              ...patient,
              lastVisit: todayLabel,
            };
          }
          return patient;
        }));
      }

      setActiveSession(null);
      setCurrentView('dashboard');
      toast.success('Sessão concluída. Você voltou ao dashboard da operação.');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Não foi possível finalizar o atendimento.',
      };
    }
  };

  const handleCancelAttendance = async () => {
    if (!activeSession) {
      setCurrentView('dashboard');
      return;
    }

    try {
      if (activeSession.treatmentSessionId) {
        await updateTreatmentSessionRequest(String(activeSession.treatmentSessionId), { status: 'cancelled' });
      }
      await updateAttendanceStatus(String(activeSession.id), 'waiting');
      setAppointments((previousAppointments) => updateAppointmentInList(previousAppointments, activeSession.id, { attendanceStatus: 'waiting' }));
      setActiveSession(null);
      setCurrentView('dashboard');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Não foi possível cancelar o atendimento.');
    }
  };

  const handleMarkConfirmationHandled = async (appointmentId, handled = true) => {
    try {
      const updatedAppointment = await updateConfirmationHandled(String(appointmentId), handled);
      const confirmationHandledAt = updatedAppointment?.confirmacaoTratadaAt || (handled ? new Date().toISOString() : null);
      setAppointments((previousAppointments) => updateAppointmentInList(previousAppointments, appointmentId, { confirmationHandledAt }));
      return { success: true };
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Não foi possível atualizar o status da solicitação.');
      return { success: false };
    }
  };

  const handleReviewRescheduleRequest = async (appointmentId, rescheduleDecision, note = '') => {
    try {
      const updatedAppointment = await updateAppointmentRescheduleRequestApi(String(appointmentId), {
        rescheduleDecision,
        note,
      });
      const patientById = new Map(
        patients
          .filter((patient) => patient?._id || patient?.id)
          .map((patient) => [String(patient._id || patient.id), patient])
      );
      const mappedAppointment = mapApiAppointmentToUi(updatedAppointment, patientById);

      setAppointments((previousAppointments) => previousAppointments.map((appointment) => (
        String(appointment.id) === String(appointmentId)
          ? mappedAppointment
          : appointment
      )));

      if (rescheduleDecision === 'approved') {
        toast.success('Consulta remarcada automaticamente e novo horário confirmado.');
      } else if (rescheduleDecision === 'released') {
        toast.success('Pre-reserva liberada para novo contato da recepção.');
      }

      return { success: true, data: mappedAppointment };
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível revisar a pré-reserva.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const requestViewChange = (nextView) => {
    if (nextView === currentView) {
      return true;
    }

    if (currentView === 'attendance') {
      const shouldLeaveAttendance = window.confirm('Tem certeza de que deseja sair? O progresso não salvo será perdido.');
      if (!shouldLeaveAttendance) {
        return false;
      }
    }

    if (currentView === 'new_patient' && isPatientFormDirty) {
      const shouldLeavePatientForm = window.confirm('Tem certeza de que deseja sair? O cadastro em andamento será perdido.');
      if (!shouldLeavePatientForm) {
        return false;
      }

      setIsPatientFormDirty(false);
    }

    if (nextView !== 'patients') {
      setSearchTerm('');
    }

    setCurrentView(nextView);
    return true;
  };

  const handleSearchChange = (term) => {
    const normalizedTerm = String(term || '');

    if (currentView === 'new_patient' && isPatientFormDirty && normalizedTerm.trim()) {
      toast.info('Finalize ou cancele o cadastro antes de iniciar uma busca.');
      return;
    }

    setSearchTerm(normalizedTerm);
    if (normalizedTerm.trim() && currentView !== 'patients') {
      requestViewChange('patients');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  const dailyRevenue = Number(financialSummary.receitas || 0);

  const todayDateKey = toLocalDateKey(new Date());

  const todayQueue = appointments
    .filter((appointment) => appointment?.appointmentDate === todayDateKey)
    .map((appointment) => decorateOperationalFields({
      id: appointment.id,
      patient: safePtText(appointment?.patient?.name || appointment?.title || 'Paciente'),
      patientId: appointment.patientId,
      time: formatHour(appointment.start),
      type: getAppointmentTypeLabel(appointment),
      title: appointment.title,
      procedure: getAppointmentProcedureLabel(appointment),
      status: appointment.attendanceStatus || 'waiting',
      attendanceStatus: appointment.attendanceStatus || 'waiting',
      statusConfirmacao: appointment.statusConfirmacao || 'pendente',
      appointmentDate: appointment.appointmentDate,
      confirmationHandledAt: appointment.confirmationHandledAt,
      confirmationUpdatedAt: appointment.confirmationUpdatedAt,
    }))
    .filter((item) => isQueueActionable(item));

  const loadingFallback = (
    <div className="p-6 text-sm text-slate-500">Carregando módulo...</div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Suspense fallback={loadingFallback}>
            <DashboardView
              queue={todayQueue}
              revenue={dailyRevenue}
              appointments={appointments}
              onStartAttendance={handleStartAttendance}
              hideRevenue={isReceptionist}
              readOnlyQueue={isReceptionist}
              onOpenCalendar={() => requestViewChange('calendar')}
              onMarkConfirmationHandled={handleMarkConfirmationHandled}
              onReviewRescheduleRequest={handleReviewRescheduleRequest}
            />
          </Suspense>
        );
      case 'finance':
        if (userRole !== 'admin' && userRole !== 'doctor') {
          return (
            <Suspense fallback={loadingFallback}>
              <DashboardView
                queue={todayQueue}
                revenue={dailyRevenue}
                appointments={appointments}
                onStartAttendance={handleStartAttendance}
                hideRevenue={isReceptionist}
                readOnlyQueue={isReceptionist}
                onOpenCalendar={() => requestViewChange('calendar')}
                onMarkConfirmationHandled={handleMarkConfirmationHandled}
                onReviewRescheduleRequest={handleReviewRescheduleRequest}
              />
            </Suspense>
          );
        }
        return (
          <Suspense fallback={loadingFallback}>
            <FinanceView
              transactions={transactions}
              loading={isFinanceLoading}
              canDeleteTransaction={userRole === 'admin'}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </Suspense>
        );
      case 'calendar':
        return (
          <Suspense fallback={loadingFallback}>
            <CalendarView
              appointments={appointments}
              patients={patients}
              onAddAppointment={handleAddAppointment}
              onDeleteAppointment={handleDeleteAppointment}
            />
          </Suspense>
        );
      case 'new_patient':
        return (
          <Suspense fallback={loadingFallback}>
            <NewPatientView
              onAddPatient={handleAddPatient}
              onGoToPatients={() => requestViewChange('patients')}
              onDirtyChange={setIsPatientFormDirty}
            />
          </Suspense>
        );
      case 'patients':
        return (
          <Suspense fallback={loadingFallback}>
            <PatientsView
              patients={patients}
              onViewProfile={handleViewPatientProfile}
              onGoToNewPatient={() => requestViewChange('new_patient')}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          </Suspense>
        );
      case 'confirmations':
        return (
          <Suspense fallback={loadingFallback}>
            <DashboardView
              queue={todayQueue}
              revenue={dailyRevenue}
              appointments={appointments}
              onStartAttendance={handleStartAttendance}
              hideRevenue={isReceptionist}
              readOnlyQueue={isReceptionist}
              onOpenCalendar={() => requestViewChange('calendar')}
              onlyConfirmations
              onMarkConfirmationHandled={handleMarkConfirmationHandled}
              onReviewRescheduleRequest={handleReviewRescheduleRequest}
            />
          </Suspense>
        );
      case 'users':
        if (userRole !== 'admin') {
          return (
            <Suspense fallback={loadingFallback}>
              <DashboardView
                queue={todayQueue}
                revenue={dailyRevenue}
                appointments={appointments}
                onStartAttendance={handleStartAttendance}
                hideRevenue={isReceptionist}
                readOnlyQueue={isReceptionist}
                onOpenCalendar={() => requestViewChange('calendar')}
                onMarkConfirmationHandled={handleMarkConfirmationHandled}
                onReviewRescheduleRequest={handleReviewRescheduleRequest}
              />
            </Suspense>
          );
        }
        return (
          <Suspense fallback={loadingFallback}>
            <UsersView />
          </Suspense>
        );
      case 'attendance':
        if (isReceptionist) {
          return (
            <Suspense fallback={loadingFallback}>
              <DashboardView
                queue={todayQueue}
                revenue={dailyRevenue}
                appointments={appointments}
                onStartAttendance={handleStartAttendance}
                hideRevenue
                readOnlyQueue
                onOpenCalendar={() => requestViewChange('calendar')}
                onMarkConfirmationHandled={handleMarkConfirmationHandled}
                onReviewRescheduleRequest={handleReviewRescheduleRequest}
              />
            </Suspense>
          );
        }
        return (
          <Suspense fallback={loadingFallback}>
            <AttendanceSessionView
              session={activeSession}
              onFinishAttendance={handleFinishAttendance}
              onCancelAttendance={handleCancelAttendance}
            />
          </Suspense>
        );
      default:
        return <div>Visualização não encontrada.</div>;
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <MainLayout
        user={user}
        currentView={currentView}
        onNavigate={requestViewChange}
        onLogout={logout}
        isAttending={currentView === 'attendance'}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchDisabled={currentView === 'new_patient' && isPatientFormDirty}
      >
        {renderContent()}
      </MainLayout>
      <PatientDetailModal
        key={selectedPatientProfile ? String(selectedPatientProfile._id || selectedPatientProfile.id) : 'patient-modal-empty'}
        patient={selectedPatientProfile}
        onClose={() => setSelectedPatientProfile(null)}
        canEdit={canEditPatient}
        canDelete={canDeletePatient}
        onUpdatePatient={handleUpdatePatient}
        onDeletePatient={handleDeletePatient}
      />
    </>
  );
}





