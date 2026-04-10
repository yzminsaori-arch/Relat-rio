document.addEventListener("DOMContentLoaded", () => {
    const state = {
        users: JSON.parse(localStorage.getItem('elite_users')) || [
            { user: 'admin', pass: 'hashed_09072223', name: 'Yasmin' }
        ]
    };

    const loginForm = document.getElementById('login-form');
    const loginView = document.getElementById('login-view');
    const regView = document.getElementById('register-view');
    const appView = document.getElementById('app-view');

    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        // Verificação Lógica
        const found = state.users.find(x => x.user === u && x.pass === p);

        if (found) {
            loginView.classList.add('hidden');
            appView.classList.remove('hidden');
            console.log("Acesso Garantido. Bem-vinda, " + found.name);
        } else {
            const err = document.getElementById('login-error');
            err.classList.remove('hidden');
            err.style.animation = "shake 0.4s";
            setTimeout(() => err.style.animation = "", 400);
        }
    };

    // Alternância de Telas com Fluidez
    document.getElementById('go-to-register').onclick = () => {
        loginView.classList.add('hidden');
        regView.classList.remove('hidden');
    };

    document.getElementById('back-to-login').onclick = () => {
        regView.classList.add('hidden');
        loginView.classList.remove('hidden');
    };
});
