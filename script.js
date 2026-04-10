document.addEventListener("DOMContentLoaded", () => {
    // --- SELETORES DE INTERFACE ---
    const views = {
        login: document.getElementById('login-view'),
        register: document.getElementById('register-view'),
        app: document.getElementById('app-view'),
        home: document.getElementById('home-view'),
        report: document.getElementById('report-view'),
        drafts: document.getElementById('drafts-view'),
        reportEdit: document.getElementById('report-edit-view'),
        form: document.getElementById('form-view'),
        detail: document.getElementById('detail-view')
    };

    // --- ESTADO DO SISTEMA ---
    let projects = JSON.parse(localStorage.getItem('elite_portfolio_data')) || [];
    let users = JSON.parse(localStorage.getItem('elite_users')) || [
        {user: 'admin', pass: '09072223', cpf: '99022348512', role: 'admin', name: 'Yasmin_Soares'},
        {user: 'cliente', pass: '22678452', cpf: '10024543132', role: 'usuario', name: 'Convidado'}
    ];
    let currentUser = null;
    let editingProjectId = null;
    let currentViewingProject = null;

    // --- FUNÇÕES DE NAVEGAÇÃO ---
    function switchView(target) {
        Object.values(views).forEach(v => v?.classList.add('hidden'));
        views[target].classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // --- SISTEMA DE LOGIN E REGISTRO ---
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userIn = document.getElementById('username').value;
        const passIn = document.getElementById('password').value;

        const found = users.find(u => u.user === userIn && u.pass === passIn);

        if (found) {
            currentUser = found;
            document.getElementById('user-name').textContent = found.name;
            setupPermissions(found.role);
            switchView('app');
            switchView('home');
            renderGrids();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    });

    document.getElementById('go-to-register').onclick = () => switchView('register');
    document.getElementById('back-to-login').onclick = () => switchView('login');

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newUser = {
            user: document.getElementById('reg-username').value,
            pass: document.getElementById('reg-password').value,
            cpf: document.getElementById('reg-cpf').value,
            role: 'usuario',
            name: document.getElementById('reg-username').value
        };
        users.push(newUser);
        localStorage.setItem('elite_users', JSON.stringify(users));
        alert("Conta criada! Use seus dados para logar.");
        switchView('login');
    });

    function setupPermissions(role) {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            role === 'admin' ? el.classList.remove('hidden') : el.classList.add('hidden');
        });
    }

    // --- GERENCIAMENTO DE PROJETOS ---
    function saveProject(status) {
        const projData = {
            id: editingProjectId || Date.now(),
            title: document.getElementById('proj-title').value,
            year: document.getElementById('proj-year').value,
            month: document.getElementById('proj-month').value,
            category: document.getElementById('proj-category').value,
            summary: document.getElementById('proj-summary').value,
            content: document.getElementById('proj-content').value,
            likes: editingProjectId && currentViewingProject ? currentViewingProject.likes : 0,
            reviews: editingProjectId && currentViewingProject ? currentViewingProject.reviews : [],
            status: status,
            author: currentUser.user
        };

        if (editingProjectId) {
            projects = projects.map(p => p.id === editingProjectId ? projData : p);
        } else {
            projects.unshift(projData);
        }

        localStorage.setItem('elite_portfolio_data', JSON.stringify(projects));
        renderGrids();
        switchView(status === 'published' ? 'home' : 'drafts');
    }

    function renderGrids() {
        const projectGrid = document.getElementById('project-grid');
        const draftsGrid = document.getElementById('drafts-grid');
        if(!projectGrid) return;

        projectGrid.innerHTML = '';
        draftsGrid.innerHTML = '';

        projects.forEach(proj => {
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="card__content">
                    <span class="card__badge">${proj.category}</span>
                    <h3 class="card__title">${proj.title}</h3>
                    <p class="card__summary">${proj.summary}</p>
                    <div class="card__footer">❤️ ${proj.likes || 0}</div>
                </div>
            `;
            card.onclick = () => openProject(proj);

            if (proj.status === 'published') projectGrid.appendChild(card);
            else if (proj.author === currentUser.user) draftsGrid.appendChild(card);
        });
    }

    function openProject(proj) {
        currentViewingProject = proj;
        document.getElementById('detail-title').textContent = proj.title;
        document.getElementById('detail-body').textContent = proj.content;
        switchView('detail');
    }

    // --- LOGOUT ---
    document.getElementById('btn-logout').onclick = () => {
        currentUser = null;
        switchView('login');
    };

    // Inicialização
    renderGrids();
});
