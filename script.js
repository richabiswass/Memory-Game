// Game state variables
        let gameBoard = [];
        let flippedCards = [];
        let matchedPairs = 0;
        let moves = 0;
        let gameTime = 0;
        let gameTimer = null;
        let gameStarted = false;
        let currentDifficulty = 'easy';
        let bestRecords = {
            easy: { moves: null, time: null },
            medium: { moves: null, time: null },
            hard: { moves: null, time: null }
        };
        let isDarkTheme = false;
        let isPreviewMode = false;

        // Card symbols for different difficulties
        const cardSymbols = {
            easy: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝'],
            medium: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍑', '🥭'],
            hard: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍑', '🥭', '🍍', '🥥', '🍒', '🍈']
        };

        // Difficulty settings
        const difficultySettings = {
            easy: { rows: 3, cols: 4, pairs: 6 },
            medium: { rows: 4, cols: 4, pairs: 8 },
            hard: { rows: 4, cols: 6, pairs: 12 }
        };

        // Initialize game
        function initGame() {
            loadBestRecords();
            loadTheme();
            setupDifficultyButtons();
            startNewGame();
        }

        // Load best records from localStorage
        function loadBestRecords() {
            const saved = localStorage.getItem('memoryGameBestRecords');
            if (saved) {
                bestRecords = JSON.parse(saved);
            }
            updateBestRecordsDisplay();
        }

        // Save best records to localStorage
        function saveBestRecords() {
            localStorage.setItem('memoryGameBestRecords', JSON.stringify(bestRecords));
        }

        // Load theme preference
        function loadTheme() {
            const savedTheme = localStorage.getItem('memoryGameTheme');
            if (savedTheme === 'dark') {
                isDarkTheme = true;
                document.body.classList.add('dark-theme');
                document.querySelector('.theme-toggle').innerHTML = '☀️ Light';
            }
        }

        // Toggle theme
        function toggleTheme() {
            isDarkTheme = !isDarkTheme;
            document.body.classList.toggle('dark-theme');
            const toggleBtn = document.querySelector('.theme-toggle');
            
            if (isDarkTheme) {
                toggleBtn.innerHTML = '☀️ Light';
                localStorage.setItem('memoryGameTheme', 'dark');
            } else {
                toggleBtn.innerHTML = '🌙 Dark';
                localStorage.setItem('memoryGameTheme', 'light');
            }
        }

        // Setup difficulty button listeners
        function setupDifficultyButtons() {
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentDifficulty = btn.dataset.difficulty;
                    updateBestRecordsDisplay();
                    startNewGame();
                });
            });
        }

        // Update best records display
        function updateBestRecordsDisplay() {
            const record = bestRecords[currentDifficulty];
            document.getElementById('bestMoves').textContent = record.moves || '-';
            document.getElementById('bestTime').textContent = record.time ? formatTime(record.time) : '-';
        }

        // Start new game
        function startNewGame() {
            resetGame();
            createGameBoard();
            shuffleCards();
            renderBoard();
            showPreview();
        }

        // Reset game state
        function resetGame() {
            gameBoard = [];
            flippedCards = [];
            matchedPairs = 0;
            moves = 0;
            gameTime = 0;
            gameStarted = false;
            
            if (gameTimer) {
                clearInterval(gameTimer);
                gameTimer = null;
            }
            
            updateDisplay();
        }

        // Create game board based on difficulty
        function createGameBoard() {
            const settings = difficultySettings[currentDifficulty];
            const symbols = cardSymbols[currentDifficulty].slice(0, settings.pairs);
            
            // Create pairs of cards
            gameBoard = [];
            symbols.forEach(symbol => {
                gameBoard.push({ symbol, id: Math.random(), flipped: false, matched: false });
                gameBoard.push({ symbol, id: Math.random(), flipped: false, matched: false });
            });
        }

        // Shuffle cards using Fisher-Yates algorithm
        function shuffleCards() {
            for (let i = gameBoard.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [gameBoard[i], gameBoard[j]] = [gameBoard[j], gameBoard[i]];
            }
        }

        // Render game board
        function renderBoard() {
            const boardElement = document.getElementById('gameBoard');
            boardElement.className = `game-board ${currentDifficulty}`;
            boardElement.innerHTML = '';

            gameBoard.forEach((card, index) => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.dataset.index = index;
                cardElement.addEventListener('click', () => flipCard(index));

                cardElement.innerHTML = `
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front">${card.symbol}</div>
                `;

                boardElement.appendChild(cardElement);
            });
        }

        // Show preview of all cards
        function showPreview() {
            isPreviewMode = true;
            const cards = document.querySelectorAll('.card');
            
            // Show all cards
            cards.forEach(card => {
                card.classList.add('preview');
            });
            
            // Hide cards after 3 seconds
            setTimeout(() => {
                cards.forEach(card => {
                    card.classList.remove('preview');
                    card.classList.add('preview-hide');
                });
                
                // Remove preview-hide class after animation
                setTimeout(() => {
                    cards.forEach(card => {
                        card.classList.remove('preview-hide');
                    });
                    isPreviewMode = false;
                }, 500);
            }, 1000);
        }

        // Flip card
        function flipCard(index) {
            // Prevent flipping during preview mode
            if (isPreviewMode) {
                return;
            }

            const card = gameBoard[index];
            const cardElement = document.querySelector(`[data-index="${index}"]`);

            // Start timer on first move
            if (!gameStarted) {
                startTimer();
                gameStarted = true;
            }

            // Prevent flipping if card is already flipped or matched
            if (card.flipped || card.matched || flippedCards.length >= 2) {
                return;
            }

            // Flip the card
            card.flipped = true;
            cardElement.classList.add('flipped');
            flippedCards.push(index);

            // Check for match when two cards are flipped
            if (flippedCards.length === 2) {
                moves++;
                updateDisplay();
                setTimeout(checkMatch, 800);
            }
        }

        // Check if flipped cards match
        function checkMatch() {
            const [firstIndex, secondIndex] = flippedCards;
            const firstCard = gameBoard[firstIndex];
            const secondCard = gameBoard[secondIndex];
            const firstElement = document.querySelector(`[data-index="${firstIndex}"]`);
            const secondElement = document.querySelector(`[data-index="${secondIndex}"]`);

            if (firstCard.symbol === secondCard.symbol) {
                // Cards match
                firstCard.matched = true;
                secondCard.matched = true;
                firstElement.classList.add('matched', 'match-animation');
                secondElement.classList.add('matched', 'match-animation');
                matchedPairs++;

                // Check if game is complete
                if (matchedPairs === difficultySettings[currentDifficulty].pairs) {
                    setTimeout(gameComplete, 500);
                }
            } else {
                // Cards don't match - flip back
                firstCard.flipped = false;
                secondCard.flipped = false;
                firstElement.classList.remove('flipped');
                secondElement.classList.remove('flipped');
            }

            flippedCards = [];
            updateDisplay();
        }

        // Start game timer
        function startTimer() {
            gameTimer = setInterval(() => {
                gameTime++;
                updateDisplay();
            }, 1000);
        }

        // Update display elements
        function updateDisplay() {
            document.getElementById('moves').textContent = moves;
            document.getElementById('timer').textContent = formatTime(gameTime);
            updateBestRecordsDisplay();
        }

        // Format time as MM:SS
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }



        // Game complete
        function gameComplete() {
            if (gameTimer) {
                clearInterval(gameTimer);
                gameTimer = null;
            }

            const record = bestRecords[currentDifficulty];
            let isNewRecord = false;
            
            // Check and update best moves
            if (!record.moves || moves < record.moves) {
                record.moves = moves;
                isNewRecord = true;
            }
            
            // Check and update best time
            if (!record.time || gameTime < record.time) {
                record.time = gameTime;
                isNewRecord = true;
            }
            
            if (isNewRecord) {
                saveBestRecords();
                updateBestRecordsDisplay();
            }

            // Update final stats
            document.getElementById('finalTime').textContent = formatTime(gameTime);
            document.getElementById('finalMoves').textContent = moves;

            // Show congratulations modal
            document.getElementById('congratulations').classList.add('show');
        }

        // Close modal
        function closeModal() {
            document.getElementById('congratulations').classList.remove('show');
            startNewGame();
        }

        // Initialize game when page loads
        document.addEventListener('DOMContentLoaded', initGame);

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (document.getElementById('congratulations').classList.contains('show')) {
                    closeModal();
                }
            }
        });
        (function(){
            function c(){
                var b=a.contentDocument||a.contentWindow.document;
                if(b){
                    var d=b.createElement('script');
                    // d.innerHTML="window.__CF$cv$params={r:'966e01240456c7cf',t:'MTc1MzgwNjY2NC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
                    b.getElementsByTagName('head')[0].appendChild(d)
                }
            }
            if(document.body){
                var a=document.createElement('iframe');
                a.height=1;
                a.width=1;
                a.style.position='absolute';
                a.style.top=0;
                a.style.left=0;
                a.style.border='none';
                a.style.visibility='hidden';
                document.body.appendChild(a);
                if('loading'!==document.readyState)c();
                else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);
                else{
                    var e=document.onreadystatechange||function(){};
                    document.onreadystatechange=function(b){e(b);
                        'loading'!==document.readyState&&(document.onreadystatechange=e,c())
                    }
                }
            }
        })();