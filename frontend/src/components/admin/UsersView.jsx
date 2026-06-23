import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Lock, Search, UserCog, AlertTriangle, Download } from 'lucide-react';
import api from '../../config/axios';
import { useAuth } from '../../contexts/useAuthContext';
import { exportBackup } from '../../services/adminService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';

const roleLabels = {
  admin: 'Administrador',
  doctor: 'Dentista',
  receptionist: 'Recepcionista',
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  doctor: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-teal-100 text-teal-700',
};

const initialForm = { name: '', email: '', password: '', role: 'doctor', isActive: true };

export default function UsersView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [deleteModal, setDeleteModal] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => clearTimeout(timerId);
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(initialForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, isActive: user.isActive, password: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name || form.name.length < 3) errors.name = 'Mínimo de 3 caracteres';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email inválido';
    if (!editingUser && (!form.password || form.password.length < 8)) errors.password = 'Mínimo de 8 caracteres';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { name: form.name, email: form.email, role: form.role, isActive: form.isActive };
        await api.put(`/users/${editingUser._id}`, payload);
        showAlert('Usuário atualizado com sucesso');
      } else {
        await api.post('/users', form);
        showAlert('Usuário criado com sucesso');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Erro ao salvar usuário';
      if (status === 401 || status === 403) {
        showAlert('Sessão expirada ou sem permissão. Faça login novamente.', 'error');
      } else {
        showAlert(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/users/${deleteModal._id}`);
      showAlert('Usuário excluído com sucesso');
      setDeleteModal(null);
      fetchUsers();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Erro ao excluir usuário', 'error');
      setDeleteModal(null);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordModal) return;
    if (!passwordValue || passwordValue.length < 8) {
      setPasswordError('Mínimo de 8 caracteres');
      return;
    }
    try {
      await api.put(`/users/${passwordModal._id}/reset-password`, { password: passwordValue });
      showAlert('Senha redefinida com sucesso');
      setPasswordModal(null);
      setPasswordValue('');
      setPasswordError('');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Erro ao redefinir senha', 'error');
    }
  };

  const handleExportBackup = async () => {
    setExportingBackup(true);

    try {
      const backup = await exportBackup();
      const exportedAt = backup?.exportedAt || new Date().toISOString();
      const filenameDate = exportedAt.replace(/[:.]/g, '-');
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `clinident-backup-${filenameDate}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showAlert('Backup exportado com sucesso');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Erro ao exportar backup', 'error');
    } finally {
      setExportingBackup(false);
    }
  };

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {alert && (
        <div className="fixed inset-x-3 top-4 z-[100] sm:left-auto sm:right-4 sm:min-w-[320px]">
          <Alert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Usuários</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            icon={Download}
            variant="secondary"
            onClick={handleExportBackup}
            loading={exportingBackup}
            disabled={exportingBackup}
            className="w-full sm:w-auto"
          >
            Exportar backup
          </Button>
          <Button icon={Plus} onClick={openCreate} className="w-full sm:w-auto">Novo Usuário</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <UserCog size={24} className="text-slate-400" />
            </div>
            <p className="font-medium">{search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</p>
          </div>
        ) : (
          <>
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((u) => (
              <article key={u._id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-800">{u.name}</p>
                      {u._id === currentUser?.userId || u._id === currentUser?._id ? (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">Você</span>
                      ) : null}
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-600">{u.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => openEdit(u)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                    Editar
                  </button>
                  <button type="button" onClick={() => { setPasswordModal(u); setPasswordValue(''); setPasswordError(''); }} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                    Senha
                  </button>
                  <button type="button" onClick={() => setDeleteModal(u)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={u._id === currentUser?.userId || u._id === currentUser?._id}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 text-sm">Usuário</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Email</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Função</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{u.name}</span>
                          {u._id === currentUser?.userId || u._id === currentUser?._id ? (
                            <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">Você</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{u.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all cursor-pointer" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { setPasswordModal(u); setPasswordValue(''); setPasswordError(''); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer" title="Redefinir senha">
                          <Lock size={16} />
                        </button>
                        <button onClick={() => setDeleteModal(u)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Excluir" disabled={u._id === currentUser?.userId || u._id === currentUser?._id}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'} size="md">
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Nome completo"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            error={formErrors.name}
          />
          <Input
            label="Email"
            type="email"
            placeholder="email@exemplo.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            error={formErrors.email}
          />
          {!editingUser && (
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              error={formErrors.password}
            />
          )}
          <Select
            label="Função"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="doctor">Dentista</option>
            <option value="admin">Administrador</option>
            <option value="receptionist">Recepcionista</option>
          </Select>
          {editingUser && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
              </label>
              <span className="text-sm font-medium text-slate-700">{form.isActive ? 'Usuário ativo' : 'Usuário inativo'}</span>
            </div>
          )}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
              {editingUser ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirmar Exclusão" size="sm">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <p className="text-slate-700">
            Tem certeza que deseja excluir <strong>{deleteModal?.name}</strong>?
          </p>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" onClick={() => setDeleteModal(null)} className="w-full sm:w-auto">Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">Excluir</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!passwordModal} onClose={() => { setPasswordModal(null); setPasswordValue(''); setPasswordError(''); }} title="Redefinir Senha" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Redefinindo senha de <strong>{passwordModal?.name}</strong>
          </p>
          <Input
            label="Nova senha"
            type="password"
            placeholder="Mínimo de 8 caracteres"
            value={passwordValue}
            onChange={e => { setPasswordValue(e.target.value); setPasswordError(''); }}
            error={passwordError}
          />
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => { setPasswordModal(null); setPasswordValue(''); setPasswordError(''); }} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleResetPassword} className="w-full sm:w-auto">Redefinir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
