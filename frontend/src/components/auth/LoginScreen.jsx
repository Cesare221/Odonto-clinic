import { useState } from 'react';
import { Loader2, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import infinityCodeLoop from '../../assets/infinityCodeLogo.mp4';
import { useAuth } from '../../contexts/useAuthContext';
import Alert from '../ui/Alert';

const inputClassName = `
  w-full rounded-2xl border border-[rgba(160,186,225,0.24)] bg-[rgba(244,248,255,0.94)] px-4 py-3 text-sm font-medium text-[#16324b]
  outline-none transition-all duration-200 placeholder:text-[#6f86a2]
  backdrop-blur-md hover:border-[rgba(129,169,227,0.44)] focus:border-[rgba(91,151,234,0.7)]
  focus-visible:ring-2 focus-visible:ring-[rgba(91,151,234,0.22)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
`;

const LoginScreen = () => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    clearError();

    await login(email, password);

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#06111f_0%,#10233e_40%,#18365b_72%,#214a79_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(150,198,255,0.26),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(104,159,232,0.22),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(225,238,255,0.12),transparent_34%)]" />
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[rgba(88,148,231,0.22)] blur-3xl" />
      <div className="absolute bottom-8 right-[-4rem] h-96 w-96 rounded-full bg-[rgba(30,86,163,0.3)] blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <section className="mx-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[rgba(175,210,255,0.26)] bg-[linear-gradient(180deg,rgba(10,26,46,0.54),rgba(22,42,73,0.36))] shadow-[0_40px_100px_-46px_rgba(1,8,18,0.86)] backdrop-blur-[34px] sm:rounded-[2rem]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(188,217,255,0.06))]" />

            <div className="relative p-5 sm:p-10">
              <div className="flex justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border border-[rgba(214,232,255,0.3)] bg-[rgba(220,236,255,0.12)] p-1.5 shadow-[0_30px_70px_-38px_rgba(3,16,32,0.8)] backdrop-blur-2xl sm:h-52 sm:w-52 sm:rounded-[2.35rem]">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(190,221,255,0.06))]" />
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.95rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_34px_-22px_rgba(4,15,31,0.48)]">
                    <video
                      className="relative h-full w-full scale-[1.18] object-cover object-center"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                    >
                      <source src={infinityCodeLoop} type="video/mp4" />
                    </video>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3 text-center">
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(223,236,255,0.34)] bg-[rgba(220,236,255,0.18)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#eff6ff] backdrop-blur-xl">
                    <Sparkles size={13} />
                    Área de acesso
                  </span>
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#f8fbff]">
                  CliniDent
                </h2>

                <p className="text-sm leading-7 text-[#d8e7fb]">
                  Entre no sistema com segurança e gestão odontológica organizada.
                </p>
              </div>

              {error && (
                <div className="mt-6">
                  <Alert type="error" message={error} />
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#edf5ff]">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClassName}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#edf5ff]">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClassName}
                    placeholder="Digite sua senha"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(214,232,255,0.28)] bg-[linear-gradient(135deg,rgba(245,249,255,0.96),rgba(206,224,250,0.92))] px-5 py-3 text-sm font-semibold text-[#16324b] shadow-[0_26px_50px_-30px_rgba(0,0,0,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_32px_58px_-30px_rgba(0,0,0,0.58)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LockKeyhole size={18} />
                      Entrar no sistema
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginScreen;
