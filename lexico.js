document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('lexicon-title');
    const navEl = document.getElementById('alphabet-nav');
    const contentEl = document.getElementById('lexicon-content');

    try {
        const response = await fetch('./data/lexico_completo.json');
        if (!response.ok) throw new Error('Não foi possível carregar o arquivo do léxico.');
        
        const lexicon = await response.json();
        
        titleEl.textContent = lexicon.lexiconTitle;

        // Cria a barra de navegação do alfabeto
        lexicon.alphabet.forEach(letter => {
            const letterLink = document.createElement('a');
            letterLink.href = `#lex-${letter}`;
            letterLink.textContent = letter;
            navEl.appendChild(letterLink);
        });

        // Cria as seções e tabelas de palavras
        let allContentHTML = '';
        for (const letter of lexicon.alphabet) {
            if (lexicon.wordsByLetter[letter] && lexicon.wordsByLetter[letter].length > 0) {
                allContentHTML += `
                    <section class="lexicon-section">
                        <h2 id="lex-${letter}">${letter}</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Grego</th>
                                    <th>Informação Gramatical</th>
                                    <th>Tradução Principal</th>
                                    <th>Frequência</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lexicon.wordsByLetter[letter].map(word => `
                                    <tr>
                                        <td>${word.greek}</td>
                                        <td><em>${word.info}</em></td>
                                        <td>${word.portuguese}</td>
                                        <td>${word.frequency}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </section>
                `;
            }
        }
        contentEl.innerHTML = allContentHTML;

    } catch (error) {
        console.error("Erro ao carregar o léxico:", error);
        titleEl.textContent = "Erro ao Carregar";
        contentEl.innerHTML = `<p style="text-align: center;">${error.message}</p>`;
    }
});
