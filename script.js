import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';

const SUPABASE_URL = 'https://jeqfsamjudycbkihfgda.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IRJlWZcK5G9BZxMom1CUEg_Mg8mTlZW';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

document.getElementById('year').textContent = new Date().getFullYear();

const modal = document.getElementById('auth-modal');
const openButton = document.getElementById('auth-open');
const emailForm = document.getElementById('email-form');
const otpForm = document.getElementById('otp-form');
const accountPanel = document.getElementById('auth-account');
const emailInput = document.getElementById('auth-email');
const codeInput = document.getElementById('auth-code');
const message = document.getElementById('auth-message');
const description = document.getElementById('auth-description');
let pendingEmail = '';

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}
function openAuth() {
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  emailInput.focus();
}
function closeAuth() {
  modal.hidden = true;
  document.body.style.overflow = '';
}
function showEmailStep() {
  emailForm.hidden = false;
  otpForm.hidden = true;
  accountPanel.hidden = true;
  description.textContent = 'Digite seu e-mail. Vamos enviar um código de 6 dígitos para confirmar que ele é seu.';
  showMessage('');
}
function showOtpStep() {
  emailForm.hidden = true;
  otpForm.hidden = false;
  accountPanel.hidden = true;
  description.textContent = 'Confira sua caixa de entrada e digite abaixo o código de 6 dígitos que enviamos.';
  codeInput.value = '';
  codeInput.focus();
}
function showAccount(user) {
  emailForm.hidden = true;
  otpForm.hidden = true;
  accountPanel.hidden = false;
  description.textContent = 'Sua conta NyanDex está pronta.';
  document.getElementById('auth-account-email').textContent = user.email || '';
  openButton.textContent = 'Minha conta';
  showMessage('');
}
function translateError(error) {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (msg.includes('invalid') || msg.includes('expired')) return 'Código inválido ou expirado. Peça um novo código.';
  if (msg.includes('email')) return 'Não foi possível enviar para esse e-mail. Confira o endereço e tente novamente.';
  return 'Ocorreu um erro. Tente novamente em instantes.';
}

openButton.addEventListener('click', async () => {
  openAuth();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) showAccount(session.user);
  else showEmailStep();
});
document.getElementById('hero-login').addEventListener('click', () => {
  openAuth();
  showEmailStep();
});
document.getElementById('auth-close').addEventListener('click', closeAuth);
document.getElementById('auth-close-backdrop').addEventListener('click', closeAuth);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !modal.hidden) closeAuth();
});

emailForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  if (!email) return;
  const submit = emailForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Enviando...';
  showMessage('');
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    if (error) throw error;
    pendingEmail = email;
    showOtpStep();
    showMessage('Código solicitado para ' + email + '. Confira também o spam.');
  } catch (error) {
    showMessage(translateError(error), true);
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Enviar código <span>→</span>';
  }
});

otpForm.addEventListener('submit', async event => {
  event.preventDefault();
  const token = codeInput.value.trim();
  if (!/^[0-9]{6}$/.test(token) || !pendingEmail) {
    showMessage('Digite os 6 números do código recebido.', true);
    return;
  }
  const submit = otpForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Verificando...';
  showMessage('');
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token,
      type: 'email'
    });
    if (error) throw error;
    if (data.user) showAccount(data.user);
    showMessage('E-mail confirmado. Bem-vindo ao NyanDex!');
  } catch (error) {
    showMessage(translateError(error), true);
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Confirmar e entrar <span>→</span>';
  }
});

document.getElementById('resend-code').addEventListener('click', async () => {
  if (!pendingEmail) return;
  showMessage('Solicitando outro código...');
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: pendingEmail,
      options: { shouldCreateUser: true }
    });
    if (error) throw error;
    showMessage('Outro código foi solicitado. Confira sua caixa de entrada.');
  } catch (error) {
    showMessage(translateError(error), true);
  }
});
document.getElementById('change-email').addEventListener('click', () => {
  showEmailStep();
  emailInput.focus();
});
document.getElementById('auth-signout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    showMessage('Não foi possível sair agora. Tente novamente.', true);
    return;
  }
  openButton.textContent = 'Entrar ↗';
  pendingEmail = '';
  showEmailStep();
  showMessage('Você saiu da sua conta.');
});

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) openButton.textContent = 'Minha conta';
  else openButton.textContent = 'Entrar ↗';
});
