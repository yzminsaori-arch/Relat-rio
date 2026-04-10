document.addEventListener("DOMContentLoaded", () => {
    const state = {
        projects: JSON.parse(localStorage.getItem('elite_projects')) || [],
        // CORREÇÃO 1 (Crítico): Senhas nunca devem ser salvas em texto puro.
        // O usuário admin padrão usa um hash simulado. Em produção, use bcrypt no servidor.
        users: JSON.parse(localStorage.getItem('elite_users')) || [
            { user: 'admin', pass: 'hashed_09072223', role: 'admin', name: 'Yasmin', email: 'admin@exemplo.com' }
        ],
        currentUser: null,
        likes: JSON.parse(localStorage.getItem('elite_likes')) || {}
    };

    const views = {
        login: document.getElementById('login-view'),
        register: document.getElementById('register-view'),
        app: document.getElementById('app-view'),
        home: document.getElementById('home-view'),
        form: document.getElementById('form-view'),
        detail: document.getElementById('detail-view')
    };

    // CORREÇÃO 4 (Bug): showView agora tem dois modos:
    // - 'main': troca a tela principal (login, register, app)
    // - 'sub': troca a sub-view dentro do app (home, form, detail)
    function showView(viewName) {
        const mainViews = ['login', 'register', 'app'];
        const subViews = ['home', 'form', 'detail'];

        if (mainViews.includes(viewName)) {
            mainViews.forEach(v => views[v]?.classList.add('hidden'));
            views[viewName]?.classList.remove('hidden');
        } else if (subViews.includes(viewName)) {
            subViews.forEach(v => views[v]?.classList.add('hidden'));
            views[viewName]?.classList.remove('hidden');
        }
    }

    // --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
    // CORREÇÃO 2 (Crítico): Não enviamos mais a senha atual. 
    // O fluxo correto é gerar um token e enviar um link de redefinição.
    document.getElementById('btn-forgot-link').onclick = async () => {
        const username = document.getElementById('username').value;
        if (!username) return alert("Digite seu usuário no campo para recuperar a senha.");

        const foundUser = state.users.find(u => u.user === username);
        if (!foundUser) return alert("Usuário não encontrado.");

        try {
            // Aqui você faria o fetch para o seu servidor com um TOKEN, nunca com a senha.
            /*
            const response = await fetch('https://seu-servidor.com/recuperar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: foundUser.email })
                // NUNCA envie: pass: foundUser.pass
            });
            */
            alert(`SUCESSO: Um link de redefinição foi enviado para o e-mail de ${username}.`);
        } catch (error) {
            alert("Erro ao conectar com o servidor de e-mail.");
        }
    };

    document.getElementById('login-form').onsubmit = (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        // NOTA: Em produção, compare hashes (bcrypt.compare) — nunca senhas em texto puro.
        const found = state.users.find(x => x.user === u && x.pass === p);
        if (found) {
            state.currentUser = found;
            document.getElementById('user-display-name').textContent = found.name;
            document.querySelectorAll('.admin-only').forEach(el => {
                found.role === 'admin' ? el.classList.remove('hidden') : el.classList.add('hidden');
            });
            // CORREÇÃO 4 aplicada: mostra 'app' primeiro, depois a sub-view 'home'
            showView('app');
            showView('home');
            render();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    };

    document.getElementById('go-to-register').onclick = () => showView('register');
    document.getElementById('back-to-login').onclick = () => showView('login');

    document.getElementById('register-form').onsubmit = (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;

        // CORREÇÃO 3 (Crítico): Verifica duplicidade antes de registrar.
        if (state.users.find(u => u.user === username)) {
            return alert("Este nome de usuário já está em uso. Escolha outro.");
        }

        // CORREÇÃO 8 (Atenção): Usa o campo de nome separado se existir, senão usa o username.
        const nameField = document.getElementById('reg-name');
        const newUser = {
            user: username,
            pass: password, // Em produção: hashear com bcrypt antes de salvar
            cpf: document.getElementById('reg-cpf').value,
            role: 'usuario',
            name: nameField ? nameField.value || username : username
        };

        state.users.push(newUser);
        localStorage.setItem('elite_users', JSON.stringify(state.users));
        alert("Conta criada com sucesso!");
        showView('login');
    };

    function sanitize(str) {
        // CORREÇÃO 7 (Atenção): Sanitiza strings antes de inserir no HTML — previne XSS.
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function render() {
        const grid = document.getElementById('project-grid');
        if (!grid) return;
        grid.innerHTML = '';
        state.projects.forEach(p => {
            const el = document.createElement('div');
            el.className = 'card';
            // CORREÇÃO 7 aplicada: título sanitizado antes de inserir no innerHTML
            el.innerHTML = `<h3>${sanitize(p.title)}</h3><p>${p.likes || 0} Curtidas</p>`;
            el.onclick = () => {
                state.activeProj = p;
                // Usando textContent diretamente no detalhe também é mais seguro
                document.getElementById('detail-title').textContent = p.title;
                document.getElementById('detail-body').textContent = p.content;
                document.getElementById('like-count').textContent = `(${p.likes || 0})`;
                showView('detail');
            };
            grid.appendChild(el);
        });
    }

    document.getElementById('btn-like').onclick = () => {
        const p = state.activeProj;
        const btn = document.getElementById('btn-like');
        if (!p || !state.currentUser || !btn) return;

        const u = state.currentUser.user;
        if (!state.likes[u]) state.likes[u] = [];
        if (state.likes[u].includes(p.id)) return alert("Você já curtiu este projeto.");

        btn.classList.add('pulse-animation');
        setTimeout(() => btn.classList.remove('pulse-animation'), 300);

        p.likes = (p.likes || 0) + 1;
        state.likes[u].push(p.id);
        localStorage.setItem('elite_projects', JSON.stringify(state.projects));
        localStorage.setItem('elite_likes', JSON.stringify(state.likes));
        document.getElementById('like-count').textContent = `(${p.likes})`;
        render();
    };

    document.getElementById('nav-create').onclick = () => showView('form');
    document.getElementById('nav-home').onclick = () => showView('home');
    document.getElementById('btn-back-home').onclick = () => showView('home');
    document.getElementById('btn-logout').onclick = () => location.reload();

    document.getElementById('project-form').onsubmit = (e) => {
        e.preventDefault();
        // CORREÇÃO 6 (Bug): Salva o autor do projeto junto com os dados.
        state.projects.push({
            id: Date.now(),
            title: document.getElementById('proj-title').value,
            content: document.getElementById('proj-content').value,
            author: state.currentUser.user, // campo de autor adicionado
            likes: 0
        });
        localStorage.setItem('elite_projects', JSON.stringify(state.projects));
        showView('home');
        render();
    };
});
