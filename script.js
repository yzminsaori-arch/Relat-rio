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
        report: document.getElementById('report-view'),
        drafts: document.getElementById('drafts-view'),
        reportEdit: document.getElementById('report-edit-view'),
        form: document.getElementById('form-view'),
        detail: document.getElementById('detail-view')
    };
    
    const projectGrid = document.getElementById('project-grid');
    const draftsGrid = document.getElementById('drafts-grid');
    const catalogNav = document.getElementById('catalog-nav');
    const projectForm = document.getElementById('project-form');
    const reportForm = document.getElementById('report-form');

    const carousel = document.getElementById('carousel');
    const carouselImg = document.getElementById('carousel-img');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const carouselIndicator = document.getElementById('carousel-indicator');

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const btnLightboxClose = document.getElementById('btn-lightbox-close');

    const userAvatar = document.getElementById('user-avatar');
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const userName = document.getElementById('user-name');
    const avatarUpload = document.getElementById('avatar-upload');

    let projects = JSON.parse(localStorage.getItem('elite_portfolio_data')) || [];
    let mainReport = localStorage.getItem('elite_main_report') || 'Relatório central vazio.';
    let currentAdminStatus = false;
    let currentActiveRole = '';
    let editingProjectId = null;
    let currentViewingProject = null;
    let currentImageIndex = 0;

    // Motor de Compressão de Imagens (Bypass do Limite do Navegador)
    function compressImage(base64Str, maxWidth, callback) {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.7)); // Qualidade 70%
        };
    }

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
        const badgeDraft = proj.status === 'draft' ? `<span class="card__badge">RASCUNHO</span>` : '';
        
        return `
            ${cover}
            <div class="card__content">
                <div class="card__meta">
                    ${badgeDraft}
                    <span class="card__badge">${proj.month}/${proj.year}</span>
                    <span class="card__badge card__badge--cat">${proj.category}</span>
                </div>
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
        
        const metaContainer = document.getElementById('detail-meta');
        metaContainer.innerHTML = `
            <span class="card__badge">${proj.month}/${proj.year}</span>
            <span class="card__badge card__badge--cat">${proj.category}</span>
        `;
        
        currentImageIndex = 0;
        updateCarousel();
        
        switchView('detail');
    }

    function saveProjectData(status) {
        const fileInput = document.getElementById('proj-files');
        const filesArray = Array.from(fileInput.files);
        
        const processSave = (compressedFiles) => {
            const projData = {
                id: editingProjectId || Date.now(),
                title: document.getElementById('proj-title').value,
                year: document.getElementById('proj-year').value,
                month: document.getElementById('proj-month').value,
                category: document.getElementById('proj-category').value,
                files: compressedFiles.length > 0 ? compressedFiles : (editingProjectId ? currentViewingProject.files : []),
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
                localStorage.setItem('elite_portfolio_data', JSON.stringify(projects));
                projectForm.reset();
                editingProjectId = null;
                renderGrids();
                switchView(status === 'published' ? 'home' : 'drafts');
            } catch (error) {
                alert("Erro crítico: A memória do seu navegador está completamente cheia. O sistema foi forçado a interromper a gravação.");
                if (!editingProjectId) projects.shift();
            }
        };

        if (filesArray.length > 0) {
            let processedFiles = [];
            let filesProcessed = 0;

            filesArray.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    compressImage(e.target.result, 1000, (compressedBase64) => {
                        processedFiles[index] = compressedBase64;
                        filesProcessed++;
                        if (filesProcessed === filesArray.length) {
                            processSave(processedFiles);
                        }
                    });
                };
                reader.readAsDataURL(file);
            });
        } else {
            processSave([]);
        }
    }

    // Sistema de Troca de Foto de Perfil
    btnChangeAvatar.addEventListener('click', () => {
        avatarUpload.click();
    });

    userAvatar.addEventListener('click', () => {
        avatarUpload.click();
    });

    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                compressImage(event.target.result, 300, (compressedBase64) => {
                    userAvatar.src = compressedBase64;
                    try {
                        localStorage.setItem(`elite_avatar_${currentActiveRole}`, compressedBase64);
                    } catch (error) {
                        alert("Falha ao salvar avatar. A memória do navegador está lotada.");
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    });

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

        if (user === 'admin' && pass === '09072223') {
            currentAdminStatus = true;
            currentActiveRole = 'admin';
            userName.textContent = "Yasmin_Soares";
        } else if (user === 'cliente' && pass === '1234567') {
            currentAdminStatus = false;
            currentActiveRole = 'cliente';
            userName.textContent = "Cliente Convidado";
        } else {
            document.getElementById('login-error').classList.remove('hidden');
            return;
        }

        const savedAvatar = localStorage.getItem(`elite_avatar_${currentActiveRole}`);
        userAvatar.src = savedAvatar || `https://ui-avatars.com/api/?name=${currentActiveRole}&background=ff1493&color=fff`;

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
    document.getElementById('btn-report').addEventListener('click', () => switchView('report'));
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
        document.getElementById('proj-year').value = currentViewingProject.year || '';
        document.getElementById('proj-month').value = currentViewingProject.month || 'Janeiro';
        document.getElementById('proj-category').value = currentViewingProject.category || 'Senac';
        document.getElementById('proj-summary').value = currentViewingProject.summary;
        document.getElementById('proj-content').value = currentViewingProject.content;
        document.getElementById('form-title').textContent = "Editar Projeto";
        switchView('form');
    });

    document.getElementById('btn-delete-proj').addEventListener('click', () => {
        if (!currentViewingProject) return;
        projects = projects.filter(p => p.id !== currentViewingProject.id);
        localStorage.setItem('elite_portfolio_data', JSON.stringify(projects));
        currentViewingProject = null;
        renderGrids();
        switchView('home');
    });

    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProjectData('published');
    });

    document.getElementById('btn-save-draft').addEventListener('click', () => {
        if(document.getElementById('proj-title').value === '') return;
        saveProjectData('draft');
    });

    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        mainReport = document.getElementById('main-report-input').value;
        localStorage.setItem('elite_main_report', mainReport);
        renderGrids();
        switchView('report');
    });
});
