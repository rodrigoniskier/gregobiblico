document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS GLOBAIS E ESTADO ---
    let allModulesData = [];
    let pilhaNavegacao = []; // Guarda o histórico para o botão voltar
    
    // IMPORTANTE: Começamos agora na tela de boas-vindas
    let telaAtual = 'screen-welcome'; 

    // --- ELEMENTOS DA INTERFACE ---
    const moduleTitleEl = document.getElementById('module-title');
    const moduleDisplayAreaEl = document.getElementById('module-display-area');
    const lessonsContainer = document.getElementById('lessons-container');
    const listTitle = document.getElementById('list-title');
    const sideMenuLinks = document.getElementById('side-menu-links');
    const sideMenu = document.getElementById('side-menu');

    // --- NAVEGAÇÃO SPA ---
    
    // Função exclusiva para sair da tela de boas-vindas para o menu principal
    window.irParaHome = function() {
        document.getElementById('screen-welcome').style.display = 'none';
        document.getElementById('screen-home').style.display = 'block';
        telaAtual = 'screen-home';
        window.scrollTo(0, 0);
    };

    // Navegação geral do site
    window.irPara = function(idNovaTela) {
        if(telaAtual !== idNovaTela) {
            document.getElementById(telaAtual).style.display = 'none';
            pilhaNavegacao.push(telaAtual); // Guarda a tela de onde viemos
            telaAtual = idNovaTela;
            document.getElementById(idNovaTela).style.display = 'block';
            window.scrollTo(0, 0); // Sobe para o topo
            
            // Se mudou de tela, garante que o menu lateral fecha
            sideMenu.style.width = "0"; 
        }
    };

    window.voltar = function() {
        if (pilhaNavegacao.length > 0) {
            document.getElementById(telaAtual).style.display = 'none';
            telaAtual = pilhaNavegacao.pop(); // Retira a última tela do histórico
            document.getElementById(telaAtual).style.display = 'block';
            window.scrollTo(0, 0);
        }
    };

    // --- CARREGAMENTO DE DADOS (JSON) ---
    async function fetchAllModules() {
        try {
            const moduleFilenames = [
                'modulo_01.json', 'modulo_02.json', 'modulo_02b.json', 'modulo_03.json',
                'modulo_04.json', 'modulo_05.json', 'modulo_06.json', 'modulo_07.json',
                'modulo_08.json', 'modulo_09.json', 'modulo_10.json', 'modulo_11.json',
                'modulo_12.json', 'modulo_13.json', 'modulo_14.json', 'modulo_15.json'
            ];
            
            // Faz o fetch de todos os arquivos JSON de dados
            const fetchPromises = moduleFilenames.map(filename =>
                fetch(`./data/${filename}`).then(res => res.ok ? res.json() : Promise.reject(`Falha ao carregar ${filename}`))
            );
            allModulesData = await Promise.all(fetchPromises);
            
            // Preenche o modal de Prova Personalizada
            const quizModuleOptionsEl = document.getElementById('quiz-module-options');
            if(quizModuleOptionsEl) {
                quizModuleOptionsEl.innerHTML = '';
                allModulesData.forEach((moduleContainer, index) => {
                    const module = moduleContainer.modules[0];
                    const label = document.createElement('label');
                    label.innerHTML = `<input type="checkbox" value="${index + 1}"> ${module.moduleId}: ${module.moduleTitle}`;
                    quizModuleOptionsEl.appendChild(label);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar os dados:", error);
            alert("Não foi possível carregar as lições. Verifique a sua conexão.");
        }
    }

    // --- LISTA DE LIÇÕES (Teoria ou Prática) ---
    window.irParaLista = function(tipo) {
        lessonsContainer.innerHTML = ''; // Limpa a lista atual
        sideMenuLinks.innerHTML = '';    // Limpa o menu lateral

        listTitle.innerText = tipo === 'theory' ? 'Lições de Teoria' : 'Exercícios Práticos';

        allModulesData.forEach((moduleContainer, index) => {
            const module = moduleContainer.modules[0];
            const conceptualModuleId = index + 1;
            const buttonText = `${module.moduleId}: ${module.moduleTitle}`;

            // 1. Cria botão na tela de lista
            let btn = document.createElement('button');
            btn.innerText = buttonText;
            btn.onclick = () => carregarConteudo(conceptualModuleId, tipo);
            lessonsContainer.appendChild(btn);

            // 2. Adiciona link no menu hambúrguer para navegação rápida
            let menuLink = document.createElement('a');
            menuLink.href = "javascript:void(0)";
            menuLink.innerText = module.moduleId;
            menuLink.onclick = () => {
                carregarConteudo(conceptualModuleId, tipo);
                toggleMenu(); // Fecha o menu lateral após clicar
            };
            sideMenuLinks.appendChild(menuLink);
        });
        
        irPara('screen-lessons-list');
    };

    // --- CARREGAR CONTEÚDO (Lição) ---
    function carregarConteudo(conceptualModuleId, contentType) {
        const module = allModulesData[conceptualModuleId - 1].modules[0];
        moduleTitleEl.textContent = `${module.moduleId}: ${module.moduleTitle}`;

        if (contentType === 'theory') {
            moduleDisplayAreaEl.innerHTML = renderTheoryContent(module);
        } else {
            moduleDisplayAreaEl.innerHTML = renderPracticeContent(module);
            bindFlashcardInteractions(module);
        }

        irPara('screen-module-content');
    }

    function renderTheoryContent(module) {
        const content = module.content || {};
        const intro = content.intro || {};
        const objectives = Array.isArray(module.learningObjectives) ? module.learningObjectives : [];
        const sections = Array.isArray(content.sections) ? content.sections : [];
        const summary = Array.isArray(content.summary) ? content.summary : [];

        const introHTML = `
            <section class="theory-intro">
                <h2>${escapeHtml(intro.title || module.moduleTitle)}</h2>
                ${intro.lead ? `<p>${escapeHtml(intro.lead)}</p>` : ''}
                ${intro.importance ? `<p>${escapeHtml(intro.importance)}</p>` : ''}
            </section>`;

        const objectivesHTML = objectives.length ? `
            <section class="theory-objectives">
                <h3>Objetivos de aprendizagem</h3>
                <ul>${objectives.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </section>` : '';

        const sectionsHTML = sections.length ? sections.map(section => {
            let blockHTML = '';
            if (section.dataKey && Array.isArray(content[section.dataKey])) {
                blockHTML = renderDataBlock(section.title, content[section.dataKey], section.dataKey);
            }
            return `
                <section class="theory-section">
                    <h3>${escapeHtml(section.title || '')}</h3>
                    ${section.summary ? `<p><strong>Visão geral:</strong> ${escapeHtml(section.summary)}</p>` : ''}
                    ${Array.isArray(section.body) ? section.body.map(par => `<p>${escapeHtml(par)}</p>`).join('') : ''}
                    ${blockHTML}
                </section>`;
        }).join('') : (content.html || '<p>Conteúdo indisponível.</p>');

        const summaryHTML = summary.length ? `
            <section class="theory-summary">
                <h3>Resumo para revisão</h3>
                <ul>${summary.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </section>` : '';

        return `<div class="module-theory">${introHTML}${objectivesHTML}${sectionsHTML}${summaryHTML}</div>`;
    }

    function renderDataBlock(title, items, dataKey) {
        if (!Array.isArray(items) || !items.length) return '';

        if (dataKey === 'alphabet') {
            return `
                <div class="data-table-wrapper">
                    <table class="greek-table">
                        <thead>
                            <tr>
                                <th>Maiúscula</th><th>Minúscula</th><th>Nome</th><th>Transliteração</th><th>Pronúncia</th><th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${escapeHtml(item.uppercase || '')}</td>
                                    <td>${escapeHtml(item.lowercase || '')}</td>
                                    <td>${escapeHtml(item.name || '')}</td>
                                    <td>${escapeHtml(item.transliteration || '')}</td>
                                    <td>${escapeHtml(item.pronunciation || '')}</td>
                                    <td>${escapeHtml(item.notes || '')}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        if (dataKey === 'diphthongs' || dataKey === 'diacritics' || dataKey === 'punctuation') {
            return `<div class="content-cards">${items.map(item => `
                <article class="content-card">
                    <h4>${escapeHtml(item.form || item.name || item.mark || '')}</h4>
                    ${item.pronunciation ? `<p><strong>Pronúncia:</strong> ${escapeHtml(item.pronunciation)}</p>` : ''}
                    ${item.function ? `<p><strong>Função:</strong> ${escapeHtml(item.function)}</p>` : ''}
                    ${item.equivalent ? `<p><strong>Equivalência:</strong> ${escapeHtml(item.equivalent)}</p>` : ''}
                    ${item.example ? `<p><strong>Exemplo:</strong> ${escapeHtml(item.example)}</p>` : ''}
                    ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}
                    ${item.importance ? `<p><strong>Importância:</strong> ${escapeHtml(item.importance)}</p>` : ''}
                </article>`).join('')}</div>`;
        }

        return '';
    }

    function renderPracticeContent(module) {
        const flashcards = Array.isArray(module.flashcards) ? module.flashcards : [];
        const exercises = Array.isArray(module.exercises) ? module.exercises : [];

        const flashcardsHTML = flashcards.length ? `
            <section class="flashcards-section">
                <div class="flashcards-toolbar">
                    <button type="button" id="flashcard-prev">◀ Anterior</button>
                    <button type="button" id="flashcard-flip">Virar card</button>
                    <button type="button" id="flashcard-next">Próximo ▶</button>
                    <button type="button" id="flashcard-shuffle">Embaralhar</button>
                </div>
                <div class="flashcards-meta">
                    <span id="flashcard-counter">1 / ${flashcards.length}</span>
                    <span id="flashcard-category">${escapeHtml(flashcards[0]?.category || 'geral')}</span>
                </div>
                <div class="flashcard-stage">
                    <article class="flashcard" id="flashcard" data-index="0" data-side="front" tabindex="0" role="button" aria-label="Virar flashcard">
                        <div class="flashcard-face flashcard-front">
                            <h3>Frente</h3>
                            <p id="flashcard-front">${escapeHtml(flashcards[0]?.front || '')}</p>
                            <small id="flashcard-hint">${escapeHtml(flashcards[0]?.hint || 'Clique para virar')}</small>
                        </div>
                        <div class="flashcard-face flashcard-back" hidden>
                            <h3>Verso</h3>
                            <p id="flashcard-back">${escapeHtml(flashcards[0]?.back || '')}</p>
                            <small id="flashcard-details">${escapeHtml(flashcards[0]?.details || '')}</small>
                        </div>
                    </article>
                </div>
            </section>` : '';

        const exercisesHTML = exercises.length ? `
            <section class="exercises-section">
                <h3>Exercícios</h3>
                <div class="exercises-list">
                    ${exercises.map((ex, index) => `
                        <article class="exercise-card">
                            <h4>${index + 1}. ${escapeHtml(ex.prompt || '')}</h4>
                            <p><strong>Dificuldade:</strong> ${escapeHtml(ex.difficulty || 'não informada')}</p>
                            <p><strong>Tipo:</strong> ${escapeHtml(ex.type || 'não informado')}</p>
                            ${Array.isArray(ex.options) ? `<ol>${ex.options.map(opt => `<li>${escapeHtml(opt)}</li>`).join('')}</ol>` : ''}
                            ${ex.correctAnswer ? `<p><strong>Resposta esperada:</strong> ${escapeHtml(ex.correctAnswer)}</p>` : ''}
                            ${Number.isInteger(ex.correctAnswerIndex) && Array.isArray(ex.options) ? `<p><strong>Resposta correta:</strong> ${escapeHtml(ex.options[ex.correctAnswerIndex] || '')}</p>` : ''}
                            ${ex.explanation ? `<details><summary>Ver explicação</summary><p>${escapeHtml(ex.explanation)}</p></details>` : ''}
                        </article>`).join('')}
                </div>
            </section>` : '';

        return `<div class="module-practice">${flashcardsHTML}${exercisesHTML}</div>`;
    }

    function bindFlashcardInteractions(module) {
        const flashcards = Array.isArray(module.flashcards) ? module.flashcards : [];
        if (!flashcards.length) return;

        const cardEl = document.getElementById('flashcard');
        const frontEl = document.getElementById('flashcard-front');
        const backEl = document.getElementById('flashcard-back');
        const hintEl = document.getElementById('flashcard-hint');
        const detailsEl = document.getElementById('flashcard-details');
        const categoryEl = document.getElementById('flashcard-category');
        const counterEl = document.getElementById('flashcard-counter');
        const frontFace = cardEl?.querySelector('.flashcard-front');
        const backFace = cardEl?.querySelector('.flashcard-back');
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');
        const flipBtn = document.getElementById('flashcard-flip');
        const shuffleBtn = document.getElementById('flashcard-shuffle');

        let deck = [...flashcards];
        let currentIndex = 0;
        let isFront = true;

        function updateCard() {
            const current = deck[currentIndex];
            if (!current || !cardEl) return;
            frontEl.textContent = current.front || '';
            backEl.textContent = current.back || '';
            hintEl.textContent = current.hint || 'Clique para virar';
            detailsEl.textContent = current.details || '';
            categoryEl.textContent = current.category || 'geral';
            counterEl.textContent = `${currentIndex + 1} / ${deck.length}`;
            isFront = true;
            cardEl.dataset.side = 'front';
            frontFace.hidden = false;
            backFace.hidden = true;
        }

        function flipCard() {
            if (!cardEl) return;
            isFront = !isFront;
            cardEl.dataset.side = isFront ? 'front' : 'back';
            frontFace.hidden = !isFront;
            backFace.hidden = isFront;
        }

        function nextCard() {
            currentIndex = (currentIndex + 1) % deck.length;
            updateCard();
        }

        function prevCard() {
            currentIndex = (currentIndex - 1 + deck.length) % deck.length;
            updateCard();
        }

        function shuffleDeck() {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            currentIndex = 0;
            updateCard();
        }

        cardEl.addEventListener('click', flipCard);
        cardEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                flipCard();
            }
            if (event.key === 'ArrowRight') nextCard();
            if (event.key === 'ArrowLeft') prevCard();
        });
        prevBtn?.addEventListener('click', prevCard);
        nextBtn?.addEventListener('click', nextCard);
        flipBtn?.addEventListener('click', flipCard);
        shuffleBtn?.addEventListener('click', shuffleDeck);

        updateCard();
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

// Inicializa carregando os dados JSON assim que a página abre
    fetchAllModules();
});
