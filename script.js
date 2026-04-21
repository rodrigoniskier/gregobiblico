document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS GLOBAIS E ESTADO ---
    let allModulesData = [];
    let pilhaNavegacao = []; // Guarda o histórico para o botão voltar
    let telaAtual = 'screen-home';

    // --- ELEMENTOS DA INTERFACE ---
    const moduleTitleEl = document.getElementById('module-title');
    const moduleDisplayAreaEl = document.getElementById('module-display-area');
    const lessonsContainer = document.getElementById('lessons-container');
    const listTitle = document.getElementById('list-title');
    const sideMenuLinks = document.getElementById('side-menu-links');
    const sideMenu = document.getElementById('side-menu');

    // --- NAVEGAÇÃO SPA ---
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
            
            // Faz o fetch de todos os arquivos
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
        let contentHTML = '';

        if (contentType === 'theory') {
            contentHTML = module.content.html;
        } else {
            // Monta os exercícios
            const flashcardsHTML = `<h3>Flashcards</h3>` + module.flashcards.map(card => `<div class="flashcard"><div class="front">${card.front}</div><div class="back">${card.back}</div></div>`).join('');
            const exercisesHTML = `<h3>Exercícios</h3>` + module.exercises.map((ex, index) => `<div class="exercise"><p class="prompt">${index + 1}. ${ex.prompt}</p><div class="options">${ex.options ? ex.options.map((opt, i) => `<label><input type="radio" name="ex${index}" value="${i}"> ${opt}</label>`).join('') : '<input type="text">'}</div><button class="check-answer" data-explanation="${ex.explanation}">Ver Resposta</button><div class="explanation"></div></div>`).join('');
            contentHTML = flashcardsHTML + exercisesHTML;
        }

        moduleDisplayAreaEl.innerHTML = contentHTML;
        
        // Ativa os botões de "Ver Resposta" da Prática
        if (contentType === 'practice') {
            document.querySelectorAll('.check-answer').forEach(button => {
                button.addEventListener('click', e => {
                    const explanationText = e.target.dataset.explanation;
                    const explanationDiv = e.target.nextElementSibling;
                    explanationDiv.innerHTML = `<b>Explicação:</b> ${explanationText}`;
                    explanationDiv.style.display = explanationDiv.style.display === 'block' ? 'none' : 'block';
                });
            });
        }

        // Se já está na tela de conteúdo (clicou pelo menu hambúrguer), faz scroll pro topo, senão navega
        if(telaAtual === 'screen-content') {
            window.scrollTo(0, 0);
        } else {
            irPara('screen-content');
        }
    }

    // --- MENU HAMBÚRGUER ---
    window.toggleMenu = function() {
        if (sideMenu.style.width === "250px") {
            sideMenu.style.width = "0";
        } else {
            sideMenu.style.width = "250px";
        }
    };

    // --- ESCRIBA IA (Lógica do Chat) ---
    const sendChatBtn = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (sendChatBtn && chatInput) {
        sendChatBtn.addEventListener('click', enviarMensagemIA);
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') enviarMensagemIA();
        });
    }

   async function enviarMensagemIA() {
        const mensagemUsuario = chatInput.value;
        if (mensagemUsuario.trim() === '') return;

        // 1. Adiciona a mensagem do usuário na tela
        chatMessages.innerHTML += `<p class="msg-user"><strong>Você:</strong> ${mensagemUsuario}</p>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 2. Mostra que o EscribaIA está "pensando"
        const idLoading = "loading-" + Date.now(); // Cria um ID único para a mensagem de loading
        chatMessages.innerHTML += `<p id="${idLoading}" class="msg-ia"><em>EscribaIA está a analisar os pergaminhos...</em></p>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // 3. Faz o pedido ao nosso futuro servidor intermediário
            // NOTA: Vamos substituir 'URL_DO_SEU_BACKEND' pela URL real mais à frente
            const resposta = await fetch('URL_DO_SEU_BACKEND', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mensagem: mensagemUsuario })
            });

            if (!resposta.ok) throw new Error('Falha na comunicação com o servidor.');

            const dados = await resposta.json();
            
            // 4. Remove a mensagem de carregamento e mostra a resposta real
            document.getElementById(idLoading).remove();
            chatMessages.innerHTML += `<p class="msg-ia"><strong>EscribaIA:</strong> ${dados.respostaIA}</p>`;
            
        } catch (erro) {
            console.error(erro);
            document.getElementById(idLoading).remove();
            chatMessages.innerHTML += `<p class="msg-ia" style="color: red;"><strong>EscribaIA:</strong> Perdoe-me, os pergaminhos estão ilegíveis no momento. (Erro de conexão)</p>`;
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- LÉXICO E PROVA PERSONALIZADA ---
    const lexiconBtn = document.getElementById('lexicon-btn');
    if (lexiconBtn) {
        lexiconBtn.addEventListener('click', () => window.open('lexico.html', '_blank'));
    }

    const quizModal = document.getElementById('quiz-modal');
    const openQuizBtn = document.getElementById('custom-quiz-btn');
    const closeQuizBtn = document.querySelector('.close-button');
    const quizSetupForm = document.getElementById('quiz-setup-form');
    const quizErrorMsgEl = document.getElementById('quiz-error-message');

    if (openQuizBtn && quizModal) {
        openQuizBtn.onclick = () => { quizModal.style.display = 'block'; quizErrorMsgEl.textContent = ''; };
        closeQuizBtn.onclick = () => { quizModal.style.display = 'none'; };
        window.onclick = (event) => { if (event.target == quizModal) quizModal.style.display = 'none'; };
        
        quizSetupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const selectedCheckboxes = document.getElementById('quiz-module-options').querySelectorAll('input:checked');
            
            if (selectedCheckboxes.length < 1 || selectedCheckboxes.length > 5) {
                quizErrorMsgEl.textContent = 'Erro: Selecione entre 1 e 5 módulos.'; return;
            }
            
            let hardQuestions = [];
            selectedCheckboxes.forEach(checkbox => {
                const conceptualModuleId = parseInt(checkbox.value, 10);
                const module = allModulesData[conceptualModuleId - 1].modules[0];
                const questions = module.exercises.filter(ex => ex.difficulty === 'hard');
                hardQuestions.push(...questions);
            });
            
            if (hardQuestions.length === 0) {
                quizErrorMsgEl.textContent = 'Os módulos selecionados não possuem questões difíceis.'; return;
            }
            
            localStorage.setItem('customQuizData', JSON.stringify({ title: 'Prova Personalizada', questions: hardQuestions }));
            window.open('prova.html', '_blank'); 
            quizModal.style.display = 'none';
        });
    }

    // Inicializa carregando os dados JSON
    fetchAllModules();
});
