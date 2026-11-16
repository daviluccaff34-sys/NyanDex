import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';

const SUPABASE_URL = 'https://jeqfsamjudycbkihfgda.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IRJlWZcK5G9BZxMom1CUEg_Mg8mTlZW';

// Supabase mantém a sessão no armazenamento local do navegador por padrão.
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

document.getElementById('year').textContent = new Date().getFullYear();

const modal = document.getElementById('auth-modal');
const dashboard = document.getElementById('dashboard');
const openButton = document.getElementById('auth-open');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const message = document.getElementById('auth-message');
const title = document.getElementById('auth-title');
const description = document.getElementById('auth-description');
const submitButton = document.getElementById('auth-submit');
const loginTab = document.getElementById('show-login');
const signupTab = document.getElementById('show-signup');
let mode = 'login';

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}
function openAuth(nextMode = 'login') {
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  setMode(nextMode);
  emailInput.focus();
}
function closeAuth() {
  modal.hidden = true;
  document.body.style.overflow = '';
}
function setMode(nextMode) {
  mode = nextMode;
  const signingUp = mode === 'signup';
  title.textContent = signingUp ? 'Crie sua conta.' : 'Entre no seu universo.';
  description.textContent = signingUp
    ? 'Crie sua conta NyanDex com e-mail e senha.'
    : 'Acesse seus projetos com seu e-mail e senha.';
  submitButton.innerHTML = signingUp ? 'Criar conta <span>→</span>' : 'Entrar <span>→</span>';
  passwordInput.autocomplete = signingUp ? 'new-password' : 'current-password';
  loginTab.classList.toggle('active', !signingUp);
  signupTab.classList.toggle('active', signingUp);
  loginTab.setAttribute('aria-selected', String(!signingUp));
  signupTab.setAttribute('aria-selected', String(signingUp));
  forgotButton.hidden = signingUp;
  showMessage('');
}
function showDashboard(user) {
  modal.hidden = true;
  document.body.style.overflow = '';
  document.querySelector('body > header').hidden = true;
  document.querySelector('body > main:not(#dashboard)').hidden = true;
  document.querySelector('body > footer').hidden = true;
  dashboard.hidden = false;
  const email = user.email || '';
  const shortName = email.includes('@') ? email.split('@')[0] : 'criador';
  document.getElementById('dashboard-user').textContent = shortName;
  document.getElementById('dashboard-email').textContent = email;
  openButton.textContent = 'Minha conta';
}
function showLanding() {
  dashboard.hidden = true;
  document.querySelector('body > header').hidden = false;
  document.querySelector('body > main:not(#dashboard)').hidden = false;
  document.querySelector('body > footer').hidden = false;
  openButton.textContent = 'Entrar ↗';
}
function readableError(error) {
  const raw = (error?.message || '').toLowerCase();
  if (raw.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (raw.includes('already registered') || raw.includes('already been registered')) return 'Esse e-mail já tem uma conta. Tente entrar.';
  if (raw.includes('password') && raw.includes('least')) return 'Use uma senha mais forte, com pelo menos 8 caracteres.';
  if (raw.includes('rate limit') || raw.includes('too many')) return 'Muitas tentativas. Espere um pouco e tente novamente.';
  if (raw.includes('email not confirmed')) return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  return error?.message || 'Não foi possível concluir. Confira os dados e tente novamente.';
}

openButton.addEventListener('click', () => openAuth('login'));
document.getElementById('hero-login').addEventListener('click', () => openAuth('signup'));
loginTab.addEventListener('click', () => setMode('login'));
signupTab.addEventListener('click', () => setMode('signup'));
document.getElementById('auth-close').addEventListener('click', closeAuth);
document.getElementById('auth-close-backdrop').addEventListener('click', closeAuth);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !modal.hidden) closeAuth();
});

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  if (!email || !password) return;
  submitButton.disabled = true;
  submitButton.textContent = mode === 'signup' ? 'Criando conta...' : 'Entrando...';
  showMessage('');
  try {
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        });
      if (error) throw error;
      if (data.session?.user) {
        showDashboard(data.session.user);
      } else {
        showMessage('Conta criada! Confira seu e-mail e clique no link de confirmação para ativá-la.');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) showDashboard(data.user);
    }
  } catch (error) {
    showMessage(readableError(error), true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = mode === 'signup' ? 'Criar conta <span>→</span>' : 'Entrar <span>→</span>';
  }
});

document.getElementById('create-first-repo').addEventListener('click', () => {
  document.getElementById('repo-message').textContent = 'A criação de repositórios está sendo construída. Seus projetos ficarão aqui!';
});
document.getElementById('dashboard-signout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    document.getElementById('repo-message').textContent = 'Não foi possível sair agora. Tente novamente.';
    return;
  }
  showLanding();
});

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) showDashboard(session.user);
  else showLanding();
});

// Restaura automaticamente a sessão salva ao abrir ou atualizar o site.
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) showDashboard(session.user);
else showLanding();
