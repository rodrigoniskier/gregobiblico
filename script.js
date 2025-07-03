document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos HTML
    const courseTitleEl = document.getElementById('course-title');
    const courseDescriptionEl = document.getElementById('course-description');
    const theoryListEl = document.getElementById('theory-module-list');
    const practiceListEl = document.getElementById('practice-module-list');
    const moduleTitleEl = document.getElementById('module-title');
    const moduleDisplayAreaEl = document.getElementById('module-display-area');
    
    // Referências à janela (modal) da prova
    const quizModal = document.getElementById('quiz-modal');
    const openQuizBtn = document.getElementById('custom-quiz-btn');
    const closeQuizBtn = document.querySelector('.close-button');
    const quizSetupForm = document.getElementById('quiz-setup-form');
    const quizModuleOptionsEl = document.getElementById('quiz-module-options');
    const quizErrorMsgEl = document.getElementById('quiz-error-message');

    let allModulesData = []; // Armazenará os dados de todos os 16 módulos

    // Função para buscar TODOS os módulos de uma vez, agora com a exceção
    async function fetchAllModules() {
        try {
            // Define a lista de arquivos na ordem correta de aprendizado
            const moduleFilenames = [
                'modulo_01.json',
                'modulo_02.json',
                'modulo_02b.json', // Nosso novo módulo inserido aqui!
                'modulo_03.json',
                'modulo_04.json',
                'modulo_05.json',
                'modulo_06.json',
                'modulo_07.json',
                'modulo_08.json',
                'modulo_09.json',
                'modulo_10.json',
                'modulo_11.json',
                'modulo_12.json',
                'modulo_13.json',
                'modulo_14.json',
                'modulo_15.json'
            ];

            const fetchPromises = moduleFilenames.map(filename => {
                const url = `./data/${filename}`;
                return fetch(url).then(res => {
                    if (!res.ok) throw new Error(`Falha ao carregar ${filename}`);
                    return res.json();
                });
            });
            
            allModulesData = await Promise.all(fetchPromises);
            return true;
        } catch (error) {
            console.error("Erro fatal ao carregar os dados dos módulos:", error);
            moduleTitleEl.textContent = "Erro ao carregar os dados do curso. Verifique o console.";
            return false;
        }
    }

    // Função para popular as informações do curso e as listas de módulos
    function populateCourseFramework() {
        const firstModuleData = allModulesData[0];
        courseTitleEl.textContent = firstModuleData.courseTitle;
        courseDescriptionEl.textContent = firstModuleData.courseDescription;

        theoryListEl.innerHTML = '';
        practiceListEl.innerHTML = '';
        quizModuleOptionsEl.innerHTML = '';

        allModulesData.forEach((moduleContainer, index) => {
            const module = moduleContainer.modules[0];
            const conceptualModuleId = index + 1; // Usamos o índice para manter a ordem 1-16
            
            const buttonText = `${module.moduleId}: ${module.moduleTitle}`;

            // Botões para a lista de Teoria
            const theoryLi = document.createElement('li');
            const theoryBtn = document.createElement('button');
            theoryBtn.textContent = buttonText;
            theoryBtn.dataset.moduleId = conceptualModuleId;
            theoryBtn.addEventListener('click', () => displayModuleContent(conceptualModuleId, 'theory'));
            theoryLi.appendChild(theoryBtn);
            theoryListEl.appendChild(theoryLi);

            // Botões para a lista de Prática
            const practiceLi = document.createElement('li');
            const practiceBtn = document.createElement('button');
            practiceBtn.textContent = buttonText;
            practiceBtn.dataset.moduleId = conceptualModuleId;
            practiceBtn.addEventListener('click', () => displayModuleContent(conceptualModuleId, 'practice'));
            practiceLi.appendChild(practiceBtn);
            practiceListEl.appendChild(practiceLi);

            // Checkboxes para a prova
            const quizLabel = document.createElement('label');
            const quizCheckbox = document.createElement('input');
            quizCheckbox.type = 'checkbox';
            quizCheckbox.value = conceptualModuleId;
            quizLabel.appendChild(quizCheckbox);
            quizLabel.append(` ${buttonText}`);
            quizModuleOptionsEl.appendChild(quizLabel);
        });
    }

    function displayModuleContent(conceptualModuleId, contentType) {
        const module = allModulesData[conceptualModuleId - 1].modules[0];
        moduleTitleEl.textContent = `${module.moduleId}: ${module.moduleTitle}`;
        let contentHTML = '';

        if (contentType === 'theory') {
            contentHTML = module.content.html;
        } else { // 'practice'
            const flashcardsHTML = `<h3>Flashcards</h3>` + module.flashcards.map(card => `<div class="flashcard"><div class="front">${card.front}</div><div class="back">${card.back}</div></div>`).join('');
            const exercisesHTML = `<h3>Exercícios</h3>` + module.exercises.map((ex, index) => `<div class="exercise"><p class="prompt">${index + 1}. ${ex.prompt}</p><div class="options">${ex.options ? ex.options.map((opt, i) => `<label><input type="radio" name="ex${index}" value="${i}"> ${opt}</label>`).join('') : '<input type="text">'}</div><button class="check-answer" data-explanation="${ex.explanation}">Ver Resposta</button><div class="explanation"></div></div>`).join('');
            contentHTML = flashcardsHTML + exercisesHTML;
        }

        moduleDisplayAreaEl.innerHTML = contentHTML;
        updateActiveButton(conceptualModuleId);

        if (contentType === 'practice') {
            addExerciseListeners();
        }
    }
    
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

    function updateActiveButton(conceptualModuleId) {
        document.querySelectorAll('#nav-left button, #nav-right button').forEach(b => {
            if (b.dataset.moduleId == conceptualModuleId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    // Lógica da Prova Personalizada
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
            const conceptualModuleId = parseInt(checkbox.value, 10);
            const module = allModulesData[conceptualModuleId - 1].modules[0];
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
            displayModuleContent(1, 'theory'); // Carrega o Módulo 1 por padrão
        }
    }

    init();
});
