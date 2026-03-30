document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById('btn-theme');
    let currentTheme = localStorage.getItem('port_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('port_theme', currentTheme);
    });

    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    
    const menuToggle = document.getElementById('btn-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    const views = {
        home: document.getElementById('home-view'),
        drafts: document.getElementById('drafts-view'),
        reportEdit: document.getElementById('report-edit-view'),
        form: document.getElementById('form-view'),
        detail: document.getElementById('detail-view')
    };
    
    const projectGrid = document.getElementById('project-grid');
    const draftsGrid = document.getElementById('drafts-grid');
    const catalogNav = document.getElementById('catalog-nav');
    const projectForm = document.getElementById('project-form');
    const btnSaveDraft = document.getElementById('btn-save-draft');
    const reportForm = document.getElementById('report-form');

    const carousel = document.getElementById('carousel');
    const carouselImg = document.getElementById('carousel-img');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const carouselIndicator = document.getElementById('carousel-indicator');

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const btnLightboxClose = document.getElementById('btn-lightbox-close');

    let projects = JSON.parse(localStorage.getItem('multi_portfolio_data')) || [];
    let mainReport = localStorage.getItem('multi_main_report') || 'Relatório central vazio.';
    let currentAdminStatus = false;
    let editingProjectId = null;
    let currentViewingProject = null;
    let currentImageIndex = 0;

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[viewName].classList.remove('hidden');
        if (window.innerWidth < 768) {
            mobileMenu.classList.add('hidden');
        }
        window.scrollTo(0, 0);
    }

    function generateCardHTML(proj) {
        const cover = proj.files && proj.files.length > 0 
            ? `<img src="${proj.files[0]}" class="card__image">` 
            : `<div class="card__image" style="display:flex;align-items:center;justify-content:center;font-size:0.8rem;color:var(--color-text-mut);">SEM ANEXO</div>`;
        const badge = proj.status === 'draft' ? `<span class="card__badge">RASCUNHO</span>` : '';
        
        return `
            ${cover}
            <div class="card__content">
                ${badge}
                <h3 class="card__title">${proj.title}</h3>
                <p class="card__summary">${proj.summary}</p>
            </div>
        `;
    }

    function renderGrids() {
        document.getElementById('main-report-content').textContent = mainReport;
        document.getElementById('main-report-input').value = mainReport;
        
        projectGrid.innerHTML = '';
        draftsGrid.innerHTML = '';
        catalogNav.innerHTML = '';

        projects.forEach(proj => {
            const card = document.createElement('article');
            card.classList.add('card');
            card.innerHTML = generateCardHTML(proj);
            card.addEventListener('click', () => openProject(proj));

            if (proj.status === 'published') {
                projectGrid.appendChild(card);
                
                const navBtn = document.createElement('button');
                navBtn.classList.add('header__link');
                navBtn.textContent = proj.title;
                navBtn.addEventListener('click', () => openProject(proj));
                catalogNav.appendChild(navBtn);
            } else {
                draftsGrid.appendChild(card);
            }
        });
    }

    function updateCarousel() {
        if (!currentViewingProject || !currentViewingProject.files || currentViewingProject.files.length === 0) {
            carousel.classList.add('hidden');
            return;
        }

        carousel.classList.remove('hidden');
        carouselImg.src = currentViewingProject.files[currentImageIndex];
        carouselIndicator.textContent = `${currentImageIndex + 1} / ${currentViewingProject.files.length}`;

        if (currentViewingProject.files.length > 1) {
            btnPrev.classList.remove('hidden');
            btnNext.classList.remove('hidden');
        } else {
            btnPrev.classList.add('hidden');
            btnNext.classList.add('hidden');
        }
    }

    function openProject(proj) {
        currentViewingProject = proj;
        document.getElementById('detail-title').textContent = proj.title;
        document.getElementById('detail-summary').textContent = proj.summary;
        document.getElementById('detail-body').textContent = proj.content;
        
        currentImageIndex = 0;
        updateCarousel();
        
        switchView('detail');
    }

    function saveProjectData(status) {
        const fileInput = document.getElementById('proj-files');
        const filesArray = Array.from(fileInput.files);
        
        const processSave = (base64Files) => {
            const projData = {
                id: editingProjectId || Date.now(),
                title: document.getElementById('proj-title').value,
                files: base64Files.length > 0 ? base64Files : (editingProjectId ? currentViewingProject.files : []),
                summary: document.getElementById('proj-summary').value,
                content: document.getElementById('proj-content').value,
                status: status
            };

            if (editingProjectId) {
                projects = projects.map(p => p.id === editingProjectId ? projData : p);
            } else {
                projects.unshift(projData);
            }

            try {
                localStorage.setItem('multi_portfolio_data', JSON.stringify(projects));
                projectForm.reset();
                editingProjectId = null;
                renderGrids();
                switchView(status === 'published' ? 'home' : 'drafts');
            } catch (error) {
                alert("OVERFLOW: Limite de 5MB atingido. Remova arquivos grandes.");
                if (!editingProjectId) projects.shift();
            }
        };

        if (filesArray.length > 0) {
            Promise.all(filesArray.map(file => {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            })).then(processSave);
        } else {
            processSave([]);
        }
    }

    btnPrev.addEventListener('click', () => {
        currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentViewingProject.files.length - 1;
        updateCarousel();
    });

    btnNext.addEventListener('click', () => {
        currentImageIndex = currentImageIndex < currentViewingProject.files.length - 1 ? currentImageIndex + 1 : 0;
        updateCarousel();
    });

    carouselImg.addEventListener('click', () => {
        lightboxImg.src = carouselImg.src;
        lightbox.classList.remove('hidden');
    });

    btnLightboxClose.addEventListener('click', () => {
        lightbox.classList.add('hidden');
        lightboxImg.src = "";
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === 'admin' && pass === '28765522') {
            currentAdminStatus = true;
        } else if (user === 'cliente' && pass === '1234567') {
            currentAdminStatus = false;
        } else {
            document.getElementById('login-error').classList.remove('hidden');
            return;
        }

        document.querySelectorAll('.admin-only').forEach(el => {
            currentAdminStatus ? el.classList.remove('hidden') : el.classList.add('hidden');
        });

        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        renderGrids();
        switchView('home');
    });

    menuToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

    document.getElementById('btn-logout').addEventListener('click', () => {
        appView.classList.add('hidden');
        loginView.classList.remove('hidden');
        if (window.innerWidth < 768) mobileMenu.classList.add('hidden');
        loginForm.reset();
        document.getElementById('login-error').classList.add('hidden');
    });

    document.getElementById('btn-home').addEventListener('click', () => switchView('home'));
    document.getElementById('btn-drafts').addEventListener('click', () => switchView('drafts'));
    document.getElementById('btn-edit-report').addEventListener('click', () => switchView('reportEdit'));
    document.getElementById('btn-back').addEventListener('click', () => switchView('home'));
    
    document.getElementById('btn-create').addEventListener('click', () => {
        editingProjectId = null;
        projectForm.reset();
        document.getElementById('form-title').textContent = "Novo Projeto";
        switchView('form');
    });

    document.getElementById('btn-edit-proj').addEventListener('click', () => {
        if (!currentViewingProject) return;
        editingProjectId = currentViewingProject.id;
        document.getElementById('proj-title').value = currentViewingProject.title;
        document.getElementById('proj-summary').value = currentViewingProject.summary;
        document.getElementById('proj-content').value = currentViewingProject.content;
        document.getElementById('form-title').textContent = "Editar Projeto";
        switchView('form');
    });

    document.getElementById('btn-delete-proj').addEventListener('click', () => {
        if (!currentViewingProject) return;
        projects = projects.filter(p => p.id !== currentViewingProject.id);
        localStorage.setItem('multi_portfolio_data', JSON.stringify(projects));
        currentViewingProject = null;
        renderGrids();
        switchView('home');
    });

    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProjectData('published');
    });

    btnSaveDraft.addEventListener('click', () => {
        if(document.getElementById('proj-title').value === '') return;
        saveProjectData('draft');
    });

    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        mainReport = document.getElementById('main-report-input').value;
        localStorage.setItem('multi_main_report', mainReport);
        renderGrids();
        switchView('home');
    });
});