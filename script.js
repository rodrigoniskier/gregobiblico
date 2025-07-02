document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos HTML
    const courseTitleEl = document.getElementById('course-title');
    const courseDescriptionEl = document.getElementById('course-description');
    const theoryListEl = document.getElementById('theory-module-list');
    const practiceListEl = document.getElementById('practice-module-list');
    const moduleTitleEl = document.getElementById('module-title');
    const moduleDisplayAreaEl = document.getElementById('module-display-area'); // A nova área de exibição central
    
    // Referências à janela (modal) da prova
    const quizModal = document.getElementById('quiz-modal');
    const openQuizBtn = document.getElementById('custom-quiz-btn');
    const closeQuizBtn = document.querySelector('.close-button');
    const quizSetupForm = document.getElementById('quiz-setup-form');
    const quizModuleOptionsEl = document.getElementById('quiz-module-options');
    const quizErrorMsgEl = document.getElementById('quiz-error-message');

    const TOTAL_MODULES = 15;
    let allModulesData = []; // Armazenará os dados de todos os módulos

    // Função para buscar TODOS os módulos de uma vez
    async function fetchAllModules() {
        try {
            const fetchPromises = [];
            for (let i = 1; i <= TOTAL_MODULES; i++) {
                const url = `./data/modulo_${String(i).padStart(2, '0')}.json`;
                fetchPromises.push(fetch(url).then(res => res.json()));
            }
            allModulesData = await Promise.all(fetchPromises);
            return true;
        } catch (error) {
            console.error("Erro fatal ao carregar os dados dos módulos:", error);
            moduleTitleEl.textContent = "Erro ao carregar os dados do curso.";
            return false;
        }
    }

    // Função para popular as informações do curso e as listas de módulos
    function populateCourseFramework() {
        const firstModuleData = allModulesData[0];
        courseTitleEl.textContent = firstModuleData.courseTitle;
        courseDescriptionEl.textContent = firstModuleData.courseDescription;

        // Limpa listas antes de popular
        theoryListEl.innerHTML = '';
        practiceListEl.innerHTML = '';
        quizModuleOptionsEl.innerHTML = '';

        allModulesData.forEach((moduleContainer, index) => {
            const module = moduleContainer.modules[0];
            const moduleId = index + 1;
            
            // Cria botões para a lista de Teoria
            const theoryLi = document.createElement('li');
            const theoryBtn = document.createElement('button');
            theoryBtn.textContent = module.moduleTitle;
            theoryBtn.dataset.moduleId = moduleId;
            theoryBtn.addEventListener('click', () => displayModuleContent(moduleId, 'theory'));
            theoryLi.appendChild(theoryBtn);
            theoryListEl.appendChild(theoryLi);

            // Cria botões para a lista de Prática
            const practiceLi = document.createElement('li');
            const practiceBtn = document.createElement('button');
            practiceBtn.textContent = module.moduleTitle;
            practiceBtn.dataset.moduleId = moduleId;
            practiceBtn.addEventListener('click', () => displayModuleContent(moduleId, 'practice'));
            practiceLi.appendChild(practiceBtn);
            practiceListEl.appendChild(practiceLi);

            // Cria checkboxes para a prova
            const quizLabel = document.createElement('label');
            const quizCheckbox = document.createElement('input');
            quizCheckbox.type = 'checkbox';
            quizCheckbox.value = moduleId;
            quizLabel.appendChild(quizCheckbox);
            quizLabel.append(` ${module.moduleTitle}`);
            quizModuleOptionsEl.appendChild(quizLabel);
        });
    }

    // NOVA FUNÇÃO UNIFICADA para exibir qualquer tipo de conteúdo no centro
    function displayModuleContent(moduleId, contentType) {
        const module = allModulesData[moduleId - 1].modules[0];
        moduleTitleEl.textContent = `${module.moduleId}: ${module.moduleTitle}`;
        let contentHTML = '';

        if (contentType === 'theory') {
            contentHTML = module.content.html;
            updateActiveButton(theoryListEl, moduleId);
        } else { // 'practice'
            const flashcardsHTML = `<h3>Flashcards</h3>` + module.flashcards.map(card => `
                <div class="flashcard"><div class="front">${card.front}</div><div class="back">${card.back}</div></div>
            `).join('');
            
            const exercisesHTML = `<h3>Exercícios</h3>` + module.exercises.map((ex, index) => `
                <div class="exercise">
                    <p class="prompt">${index + 1}. ${ex.prompt}</p>
                    <div class="options">${ex.options ? ex.options.map((opt, i) => `<label><input type="radio" name="ex${index}" value="${i}"> ${opt}</label>`).join('') : '<input type="text">'}</div>
                    <button class="check-answer" data-explanation="${ex.explanation}">Ver Resposta</button>
                    <div class="explanation"></div>
                </div>
            `).join('');
            
            contentHTML = flashcardsHTML + exercisesHTML;
            updateActiveButton(practiceListEl, moduleId);
        }

        moduleDisplayAreaEl.innerHTML = contentHTML;

        // Adiciona os listeners de evento aos botões de exercício SE for conteúdo prático
        if (contentType === 'practice') {
            addExerciseListeners();
        }
    }
    
    // Função para adicionar listeners aos botões "Ver Resposta"
    function addExerciseListeners() {
        document.querySelectorAll('.check-answer').forEach(button => {
            button.addEventListener('click', e => {
                const explanationText = e.target.dataset.explanation;
                const explanationDiv = e.target.nextElementSibling;
                explanationDiv.innerHTML = `<b>Explicação:</b> ${explanationText}`;
                explanationDiv.style.display = explanationDiv.style.display === 'block' ? 'none' : 'block';
            });
        });
    }

    function updateActiveButton(activeList, moduleId) {
        // Remove 'active' de todos os botões em AMBAS as listas
        document.querySelectorAll('#nav-left button, #nav-right button').forEach(b => b.classList.remove('active'));
        // Adiciona 'active' apenas ao botão clicado na lista correta
        const activeButton = activeList.querySelector(`button[data-module-id="${moduleId}"]`);
        if (activeButton) activeButton.classList.add('active');
    }

    // Lógica da Prova Personalizada (sem alterações)
    openQuizBtn.onclick = () => { quizModal.style.display = 'block'; quizErrorMsgEl.textContent = ''; };
    closeQuizBtn.onclick = () => { quizModal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == quizModal) { quizModal.style.display = 'none'; } };

    quizSetupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedCheckboxes = quizModuleOptionsEl.querySelectorAll('input:checked');
        
        if (selectedCheckboxes.length < 1 || selectedCheckboxes.length > 5) {
            quizErrorMsgEl.textContent = 'Erro: Você deve selecionar entre 1 e 5 módulos.';
            return;
        }
        
        quizErrorMsgEl.textContent = '';
        let hardQuestions = [];
        selectedCheckboxes.forEach(checkbox => {
            const moduleId = parseInt(checkbox.value, 10);
            const module = allModulesData[moduleId - 1].modules[0];
            const questions = module.exercises.filter(ex => ex.difficulty === 'hard');
            hardQuestions.push(...questions);
        });

        if (hardQuestions.length === 0) {
            quizErrorMsgEl.textContent = 'Os módulos selecionados não possuem questões difíceis para a prova.';
            return;
        }

        const quizData = { title: 'Prova Personalizada', questions: hardQuestions };
        localStorage.setItem('customQuizData', JSON.stringify(quizData));
        
        window.open('prova.html', '_blank');
        quizModal.style.display = 'none';
    });


    // Função de inicialização
    async function init() {
        const success = await fetchAllModules();
        if (success) {
            populateCourseFramework();
            // Carrega o conteúdo teórico do primeiro módulo por padrão
            displayModuleContent(1, 'theory');
        }
    }

    init();
});
