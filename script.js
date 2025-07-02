// Aguarda o carregamento completo do HTML antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    
    // Constantes e variáveis globais
    const TOTAL_MODULES = 15;
    const courseTitleEl = document.getElementById('course-title');
    const courseDescriptionEl = document.getElementById('course-description');
    const moduleListEl = document.getElementById('module-list');
    const moduleTitleEl = document.getElementById('module-title');
    const contentHtmlEl = document.getElementById('content-html');
    const flashcardsContainerEl = document.getElementById('flashcards-container');
    const exercisesContainerEl = document.getElementById('exercises-container');
    let courseData = {};

    // Função principal para carregar e exibir um módulo
    async function loadModule(moduleId) {
        try {
            // Se os dados do curso ainda não foram carregados, carrega o primeiro módulo para obter os títulos
            if (!courseData.courseTitle) {
                const response = await fetch(`./data/modulo_01.json`);
                if (!response.ok) throw new Error(`Erro ao carregar dados iniciais: ${response.statusText}`);
                courseData = await response.json();
                displayCourseInfo();
            }

            // Carrega o JSON do módulo específico
            const response = await fetch(`./data/modulo_${String(moduleId).padStart(2, '0')}.json`);
            if (!response.ok) throw new Error(`Erro ao carregar módulo ${moduleId}: ${response.statusText}`);
            const moduleData = (await response.json()).modules[0];
            
            displayModule(moduleData);
            updateActiveButton(moduleId);

        } catch (error) {
            console.error("Falha ao carregar o módulo:", error);
            moduleTitleEl.textContent = "Erro ao carregar módulo.";
            contentHtmlEl.innerHTML = `<p>Não foi possível encontrar o arquivo do módulo. Verifique se o arquivo 'modulo_${String(moduleId).padStart(2, '0')}.json' existe na pasta 'data'.</p>`;
        }
    }

    // Exibe as informações globais do curso (título e descrição)
    function displayCourseInfo() {
        courseTitleEl.textContent = courseData.courseTitle;
        courseDescriptionEl.textContent = courseData.courseDescription;
    }

    // Renderiza o conteúdo de um módulo na página
    function displayModule(module) {
        moduleTitleEl.textContent = `${module.moduleId}: ${module.moduleTitle}`;
        contentHtmlEl.innerHTML = module.content.html;
        
        // Renderiza os flashcards
        flashcardsContainerEl.innerHTML = module.flashcards.map(card => `
            <div class="flashcard">
                <div class="front">${card.front}</div>
                <div class="back">${card.back}</div>
            </div>
        `).join('');

        // Renderiza os exercícios
        exercisesContainerEl.innerHTML = module.exercises.map((ex, index) => `
            <div class="exercise">
                <p class="prompt">${index + 1}. ${ex.prompt}</p>
                <div class="options">
                    ${ex.options ? ex.options.map((opt, i) => `
                        <label>
                            <input type="radio" name="ex${index}" value="${i}"> ${opt}
                        </label>
                    `).join('') : '<input type="text" name="ex' + index + '">'}
                </div>
                <button class="check-answer" data-ex-index="${index}">Verificar Resposta</button>
                <div class="explanation" id="exp${index}"></div>
            </div>
        `).join('');

        // Adiciona funcionalidade aos botões de "Verificar Resposta"
        addExerciseListeners(module.exercises);
    }

    // Adiciona os "escutadores" de eventos para os botões dos exercícios
    function addExerciseListeners(exercises) {
        document.querySelectorAll('.check-answer').forEach(button => {
            button.addEventListener('click', (event) => {
                const exIndex = event.target.dataset.exIndex;
                const exercise = exercises[exIndex];
                const explanationEl = document.getElementById(`exp${exIndex}`);
                
                explanationEl.innerHTML = `<b>Explicação:</b> ${exercise.explanation}`;
                explanationEl.style.display = 'block'; // Mostra a explicação
            });
        });
    }
    
    // Cria a lista de navegação dos módulos
    function createModuleList() {
        for (let i = 1; i <= TOTAL_MODULES; i++) {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = `Módulo ${i}`;
            button.dataset.moduleId = i;
            button.addEventListener('click', () => loadModule(i));
            li.appendChild(button);
            moduleListEl.appendChild(li);
        }
    }

    // Atualiza qual botão de módulo está "ativo"
    function updateActiveButton(moduleId) {
        document.querySelectorAll('#module-list button').forEach(button => {
            if (button.dataset.moduleId == moduleId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // Função de inicialização
    function init() {
        createModuleList();
        loadModule(1); // Carrega o primeiro módulo por padrão
    }

    init(); // Inicia o site
});
