// Variables globales
let currentMoney = 0;
let selectedColor = null;

// Variables clicker
let clickPower = 1;
let clickLevel = 1;
let autoLevel = 0;
let factoryLevel = 0;
let bankLevel = 0;
let passiveIncome = 0;

let clickCost = 25;
let autoCost = 150;
let factoryCost = 800;
let bankCost = 5000;
let mbGameActive = false;
let mbRevealed = [];

// Variable pour empêcher le spam de la roulette
let rouletteSpinning = false;

// Gestion de la sidebar
function showMenu() {
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('menu').classList.add('active');
    
    // Mettre à jour les items de la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.sidebar-item[onclick*="showMenu"]').classList.add('active');
}

function formatMoney(amount) {
    // PROTECTION : Si undefined ou null, retourner 0
    if (amount === undefined || amount === null || isNaN(amount)) {
        console.warn('formatMoney reçu une valeur invalide:', amount);
        return '0';
    }
    
    // Convertir en nombre
    amount = Number(amount);
    
    if (amount >= 1000000000) {
        return (amount / 1000000000).toFixed(1) + 'B';
    } else if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toString();
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadClickerData();
    startPassiveIncome();
    loadLeaderboard();
    
    // Formater l'argent dans la sidebar
    const sidebarMoney = document.getElementById('sidebarMoney');
    if (sidebarMoney) {
        const amount = parseInt(sidebarMoney.textContent.replace(/[^0-9]/g, ''));
        sidebarMoney.textContent = formatMoney(amount) + ' $';
    }
    
    // Faire disparaître le message de bienvenue
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        setTimeout(() => {
            welcomeMessage.style.transition = 'opacity 0.5s, transform 0.5s';
            welcomeMessage.style.opacity = '0';
            welcomeMessage.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                welcomeMessage.style.display = 'none';
            }, 500);
        }, 4000);
    }
});

async function loadStats() {
    try {
        const response = await fetch('/api/get_stats');
        const stats = await response.json();
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// NOUVEAU : Fonction pour charger le leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const leaderboard = await response.json();
        
        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return; // Si pas sur la page d'accueil
        
        if (leaderboard.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">
                        Aucun joueur pour le moment
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = leaderboard.map(player => {
            let rankBadge;
            if (player.rank === 1) {
                rankBadge = `<span class="rank-badge rank-1">${player.rank}</span>`;
            } else if (player.rank === 2) {
                rankBadge = `<span class="rank-badge rank-2">${player.rank}</span>`;
            } else if (player.rank === 3) {
                rankBadge = `<span class="rank-badge rank-3">${player.rank}</span>`;
            } else {
                rankBadge = `<span class="rank-badge rank-other">${player.rank}</span>`;
            }
            
            const winRateClass = player.win_rate >= 60 ? 'win-rate-high' : 
                                 player.win_rate >= 40 ? 'win-rate-medium' : 'win-rate-low';
            
            const rowClass = player.is_current_user ? 'current-user' : '';
            
            return `
                <tr class="${rowClass}">
                    <td>${rankBadge}</td>
                    <td class="player-name">${player.username}</td>
                    <td class="money-value">${player.money} $</td>
                    <td>${player.total_games}</td>
                    <td>${player.total_wins}</td>
                    <td class="${winRateClass}">${player.win_rate}%</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erreur chargement leaderboard:', error);
        const tbody = document.getElementById('leaderboardBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">
                        Erreur de chargement du classement
                    </td>
                </tr>
            `;
        }
    }
}

async function loadClickerData() {
    try {
        const response = await fetch('/api/clicker/get_data');
        const data = await response.json();
        
        clickPower = data.clickPower;
        clickLevel = data.clickLevel;
        autoLevel = data.autoLevel;
        factoryLevel = data.factoryLevel;
        bankLevel = data.bankLevel;
        
        clickCost = data.clickCost;
        autoCost = data.autoCost;
        factoryCost = data.factoryCost;
        bankCost = data.bankCost;
        
        passiveIncome = data.passiveIncome;
        
        updateClickerDisplay();
    } catch (error) {
        console.error('Erreur chargement clicker:', error);
    }
}

// ============================================
// NAVIGATION - VERSION CORRIGÉE
// ============================================
function startGame(game) {
    // Masquer le menu
    document.getElementById('menu').classList.remove('active');
    
    // Masquer TOUS les autres jeux
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Afficher SEULEMENT le jeu sélectionné
    document.getElementById(game).classList.add('active');
    
    // Mettre à jour les items de la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Activer l'item correspondant dans la sidebar
    const sidebarItem = document.querySelector(`.sidebar-item[onclick*="${game}"]`);
    if (sidebarItem) {
        sidebarItem.classList.add('active');
    }
}

function backToMenu() {
    // Masquer tous les jeux
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Afficher le menu
    document.getElementById('menu').classList.add('active');
    
    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Activer "Accueil" dans la sidebar
    const homeItem = document.querySelector('.sidebar-item[onclick*="showMenu"]');
    if (homeItem) {
        homeItem.classList.add('active');
    }
}

function showMenu() {
    backToMenu(); // Utilise la même logique
}

// ============================================
// GESTION ARGENT
// ============================================
function updateMoneyDisplay(money) {
    currentMoney = money;
    
    const sidebarMoney = document.getElementById('sidebarMoney');
    if (sidebarMoney) {
        sidebarMoney.textContent = formatMoney(money) + ' $';
    }
}

// ============================================
// GESTION STATS
// ============================================
function updateStatsDisplay(stats) {
    const elements = {
        totalGames: document.getElementById('totalGames'),
        totalWins: document.getElementById('totalWins'),
        winRate: document.getElementById('winRate'),
        biggestWin: document.getElementById('biggestWin'),
        totalWagered: document.getElementById('totalWagered'),
        totalProfit: document.getElementById('totalProfit')
    };
    
    for (const [key, element] of Object.entries(elements)) {
        if (element && stats[key] !== undefined) {
            if (key === 'winRate') {
                element.textContent = stats[key] + '%';
            } else if (key === 'biggestWin' || key === 'totalWagered' || key === 'totalProfit') {
                element.textContent = formatMoney(stats[key]) + ' $';
            } else {
                element.textContent = stats[key];
            }
        }
    }
}

// ============================================
// BLACKJACK
// ============================================
async function startBlackjack() {
    const bet = parseInt(document.getElementById('bjBet').value);
    
    try {
        const response = await fetch('/api/blackjack/start', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({bet})
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            return;
        }
        
        const data = await response.json();
        
        updateMoneyDisplay(data.money);
        
        document.getElementById('bjBetting').style.display = 'none';
        document.getElementById('bjGame').style.display = 'block';
        document.getElementById('bjMessage').innerHTML = '';
        
        displayHand('player', data.player_hand, data.player_total);
        displayHand('dealer', data.dealer_hand, data.dealer_total, true);
        
        document.getElementById('hitBtn').disabled = false;
        document.getElementById('standBtn').disabled = false;
        
        // Afficher le bouton Double si possible
        if (data.can_double) {
            document.getElementById('doubleBtn').style.display = 'inline-block';
        } else {
            document.getElementById('doubleBtn').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Blackjack error:', error);
        alert('Connection error');
    }
}

function displayHand(who, cards, total, hideFirst = false) {
    const container = document.getElementById(who + 'Hand');
    container.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        if (hideFirst && index === 0) {
            cardDiv.innerHTML = `
                <div class="card-back">?</div>
            `;
        } else {
            const suitSymbol = {
                'Hearts': '♥',
                'Diamonds': '♦',
                'Clubs': '♣',
                'Spades': '♠'
            }[card.suit];
            
            const color = (card.suit === 'Hearts' || card.suit === 'Diamonds') ? 'red' : 'black';
            
            cardDiv.innerHTML = `
                <div class="card-front ${color}">
                    <div class="card-corner top">${card.rank}${suitSymbol}</div>
                    <div class="card-center">${suitSymbol}</div>
                    <div class="card-corner bottom">${card.rank}${suitSymbol}</div>
                </div>
            `;
        }
        
        container.appendChild(cardDiv);
    });
    
    const totalDiv = document.getElementById(who + 'Total');
    if (hideFirst) {
        totalDiv.textContent = 'Total: ?';
    } else {
        totalDiv.textContent = 'Total: ' + total;
    }
}

async function hit() {
    const btn = document.getElementById('hitBtn');
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/blackjack/hit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        // Vérifier si erreur
        if (!response.ok) {
            const error = await response.json();
            alert('❌ ' + (error.error || 'Erreur inconnue'));
            btn.disabled = false;
            return;
        }
        
        const data = await response.json();
        
        // Vérifier que les données existent
        if (!data.player_hand || !data.dealer_hand) {
            console.error('Données manquantes:', data);
            alert('Erreur: données manquantes');
            btn.disabled = false;
            return;
        }
        
        displayHand('player', data.player_hand, data.player_total);
        displayHand('dealer', data.dealer_hand, data.dealer_total, false);
        
        // Masquer le bouton Double après le premier hit
        document.getElementById('doubleBtn').style.display = 'none';
        
        if (data.game_over) {
            document.getElementById('hitBtn').disabled = true;
            document.getElementById('standBtn').disabled = true;
            
            const msgDiv = document.getElementById('bjMessage');
            msgDiv.className = 'message';
            
            if (data.result === 'win') {
                msgDiv.classList.add('win');
            } else if (data.result === 'draw') {
                msgDiv.classList.add('info');
            } else {
                msgDiv.classList.add('lose');
            }
            
            msgDiv.innerHTML = data.result_message;
            updateMoneyDisplay(data.money);
            
            if (data.stats) {
                updateStatsDisplay(data.stats);
            }
            
            setTimeout(() => {
                document.getElementById('bjGame').style.display = 'none';
                document.getElementById('bjBetting').style.display = 'block';
                msgDiv.innerHTML = '';
            }, 3000);
        } else {
            btn.disabled = false;
        }
        
    } catch (error) {
        console.error('Hit error:', error);
        alert('❌ Erreur de connexion');
        btn.disabled = false;
    }
}

async function stand() {
    const btn = document.getElementById('standBtn');
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/blackjack/stand', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        // Vérifier si erreur
        if (!response.ok) {
            const error = await response.json();
            alert('❌ ' + (error.error || 'Erreur inconnue'));
            btn.disabled = false;
            return;
        }
        
        const data = await response.json();
        
        // Vérifier que les données existent
        if (!data.player_hand || !data.dealer_hand) {
            console.error('Données manquantes:', data);
            alert('Erreur: données manquantes');
            btn.disabled = false;
            return;
        }
        
        displayHand('player', data.player_hand, data.player_total);
        displayHand('dealer', data.dealer_hand, data.dealer_total, false);
        
        const msgDiv = document.getElementById('bjMessage');
        msgDiv.className = 'message';
        
        if (data.result === 'win') {
            msgDiv.classList.add('win');
        } else if (data.result === 'draw') {
            msgDiv.classList.add('info');
        } else {
            msgDiv.classList.add('lose');
        }
        
        msgDiv.innerHTML = data.result_message;
        
        document.getElementById('hitBtn').disabled = true;
        document.getElementById('doubleBtn').style.display = 'none';
        
        updateMoneyDisplay(data.money);
        
        if (data.stats) {
            updateStatsDisplay(data.stats);
        }
        
        setTimeout(() => {
            document.getElementById('bjGame').style.display = 'none';
            document.getElementById('bjBetting').style.display = 'block';
            msgDiv.innerHTML = '';
        }, 3000);
        
    } catch (error) {
        console.error('Stand error:', error);
        alert('❌ Erreur de connexion');
        btn.disabled = false;
    }
}

async function doubleDown() {
    const btn = document.getElementById('doubleBtn');
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/blackjack/double', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        // Vérifier si erreur
        if (!response.ok) {
            const error = await response.json();
            alert('❌ ' + (error.error || 'Erreur inconnue'));
            btn.disabled = false;
            return;
        }
        
        const data = await response.json();
        
        // Vérifier que les données existent
        if (!data.player_hand || !data.dealer_hand) {
            console.error('Données manquantes:', data);
            alert('Erreur: données manquantes');
            btn.disabled = false;
            return;
        }
        
        // Afficher les mains
        displayHand('player', data.player_hand, data.player_total);
        displayHand('dealer', data.dealer_hand, data.dealer_total, false);
        
        // Mettre à jour l'argent
        updateMoneyDisplay(data.money);
        
        // Afficher le résultat
        const msgDiv = document.getElementById('bjMessage');
        msgDiv.className = 'message';
        
        if (data.result === 'win') {
            msgDiv.classList.add('win');
        } else if (data.result === 'draw') {
            msgDiv.classList.add('info');
        } else {
            msgDiv.classList.add('lose');
        }
        
        msgDiv.innerHTML = data.result_message;
        
        // Désactiver les boutons
        document.getElementById('hitBtn').disabled = true;
        document.getElementById('standBtn').disabled = true;
        document.getElementById('doubleBtn').style.display = 'none';
        
        // Mettre à jour les stats
        if (data.stats) {
            updateStatsDisplay(data.stats);
        }
        
        // Retour au menu après 3 secondes
        setTimeout(() => {
            document.getElementById('bjGame').style.display = 'none';
            document.getElementById('bjBetting').style.display = 'block';
            msgDiv.innerHTML = '';
        }, 3000);
        
    } catch (error) {
        console.error('Double Down error:', error);
        alert('❌ Erreur de connexion');
        btn.disabled = false;
    }
}

// ============================================
// ROULETTE - AVEC PROTECTION ANTI-SPAM
// ============================================
function updateRouletteMode() {
    const mode = document.getElementById('rouletteMode').value;
    if (mode === 'color') {
        document.getElementById('colorMode').style.display = 'block';
        document.getElementById('numberMode').style.display = 'none';
    } else {
        document.getElementById('colorMode').style.display = 'none';
        document.getElementById('numberMode').style.display = 'block';
    }
    selectedColor = null;
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

async function spinRoulette() {
    // 🔥 PROTECTION ANTI-SPAM
    if (rouletteSpinning) {
        return; // Empêcher le spam
    }
    
    const bet = parseInt(document.getElementById('rouletteBet').value);
    const mode = document.getElementById('rouletteMode').value;
    
    let choice;
    if (mode === 'color') {
        if (!selectedColor) {
            alert('Veuillez sélectionner une couleur!');
            return;
        }
        choice = selectedColor;
    } else {
        choice = document.getElementById('rouletteNumber').value;
    }
    
    // 🔥 DÉSACTIVER LE BOUTON ET LA VARIABLE
    rouletteSpinning = true;
    const btn = document.querySelector('button[onclick="spinRoulette()"]');
    if (btn) btn.disabled = true;
    
    const wheel = document.getElementById('rouletteWheel');
    const resultCenter = document.getElementById('rouletteResult');
    wheel.classList.add('spinning');
    
    // Réinitialiser le centre
    resultCenter.textContent = '?';
    resultCenter.style.background = '#1e293b';
    resultCenter.style.color = 'white';
    
    try {
        const response = await fetch('/api/roulette/spin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({bet, mode, choice})
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            wheel.classList.remove('spinning');
            // Réactiver le bouton en cas d'erreur
            rouletteSpinning = false;
            if (btn) btn.disabled = false;
            return;
        }
        
        const data = await response.json();
        
        setTimeout(() => {
            wheel.classList.remove('spinning');
            
            // Afficher le numéro avec la couleur correspondante
            resultCenter.textContent = data.number;
            
            if (data.color === 'Green') {
                resultCenter.style.background = '#22c55e';
                resultCenter.style.color = 'white';
            } else if (data.color === 'Red') {
                resultCenter.style.background = '#ef4444';
                resultCenter.style.color = 'white';
            } else { // Black
                resultCenter.style.background = '#1f2937';
                resultCenter.style.color = 'white';
            }
            
            const msgDiv = document.getElementById('rouletteMessage');
            msgDiv.className = 'message';
            
            if (data.result === 'win') {
                msgDiv.classList.add('win');
                msgDiv.innerHTML = `✅ ${data.color} ${data.number}!<br>Vous gagnez ${data.profit} $`;
            } else {
                msgDiv.classList.add('lose');
                msgDiv.innerHTML = `❌ ${data.color} ${data.number}<br>Vous perdez ${bet} $`;
            }
            
            updateMoneyDisplay(data.money);
            updateStatsDisplay(data.stats);
            
            setTimeout(() => {
                msgDiv.innerHTML = '';
                // 🔥 RÉACTIVER LE BOUTON APRÈS 3 SECONDES
                rouletteSpinning = false;
                if (btn) btn.disabled = false;
            }, 3000);
        }, 3000);
        
    } catch (error) {
        console.error('Roulette error:', error);
        wheel.classList.remove('spinning');
        alert('Connection error');
        // Réactiver en cas d'erreur
        rouletteSpinning = false;
        if (btn) btn.disabled = false;
    }
}

// ============================================
// MINEBOMB - CORRIGÉ
// ============================================
async function startMineBomb() {
    const bet = parseInt(document.getElementById('mbBet').value);
    const bombs = parseInt(document.getElementById('mbBombs').value);
    
    if (bombs < 3 || bombs > 10) {
        alert('Le nombre de bombes doit être entre 3 et 10!');
        return;
    }
    
    try {
        const response = await fetch('/api/minebomb/start', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({bet, bombs})
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            return;
        }
        
        const data = await response.json();
        updateMoneyDisplay(data.money);

        mbGameActive = true;
        mbRevealed = [];
        
        document.getElementById('mbBetting').style.display = 'none';
        document.getElementById('mbGame').style.display = 'block';
        document.getElementById('mbMessage').innerHTML = '';
        
        document.getElementById('multiplier').textContent = '1.00';
        document.getElementById('potentialWin').textContent = '0';
        document.getElementById('bombCount').textContent = bombs;
        document.getElementById('diamondCount').textContent = '0';
        
        const grid = document.getElementById('mineGrid');
        grid.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.dataset.index = i;
            cell.onclick = () => revealCell(i);
            grid.appendChild(cell);
        }
        
        document.getElementById('cashoutBtn').disabled = true;
        
    } catch (error) {
        console.error('MineBomb error:', error);
        alert('Connection error');
    }
}

async function revealCell(index) {
    if (!mbGameActive) return;
    if (mbRevealed.includes(index)) return;
    
    // 🔥 DÉSACTIVER IMMÉDIATEMENT LE JEU LOCALEMENT
    const originalActive = mbGameActive;
    mbGameActive = false;
    
    try {
        const response = await fetch('/api/minebomb/reveal', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({index})
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Erreur - réactiver si c'était une erreur de validation
            mbGameActive = originalActive;
            const msgDiv = document.getElementById('mbMessage');
            msgDiv.className = 'message lose';
            msgDiv.innerHTML = data.error || 'Erreur';
            return;
        }
        
        const cell = document.querySelectorAll('.mine-cell')[index];
        mbRevealed.push(index);
        
        if (data.type === 'bomb') {
            // 💣 BOMBE - Le jeu reste désactivé
            mbGameActive = false;
            cell.innerHTML = '💣';
            cell.classList.add('revealed', 'bomb');
            
            setTimeout(() => {
                document.getElementById('cashoutBtn').disabled = true;
                
                // 🔥 CORRECTION : Afficher la grille avec les bonnes couleurs
                data.grid.forEach((type, i) => {
                    const c = document.querySelectorAll('.mine-cell')[i];
                    if (!mbRevealed.includes(i)) {
                        c.innerHTML = type === 'bomb' ? '💣' : '💎';
                        // 🔥 FIX : Les diamants en gris, les bombes en rouge
                        if (type === 'bomb') {
                            c.classList.add('revealed', 'bomb');
                        } else {
                            c.classList.add('revealed');
                            c.style.background = '#64748b'; // Gris pour les diamants non trouvés
                            c.style.borderColor = '#64748b';
                        }
                    }
                });
                
                updateStatsDisplay(data.stats);
                
                const msgDiv = document.getElementById('mbMessage');
                msgDiv.className = 'message lose';
                msgDiv.innerHTML = '💥 BOOM ! Vous avez perdu !';
                
                setTimeout(() => {
                    document.getElementById('mbGame').style.display = 'none';
                    document.getElementById('mbBetting').style.display = 'block';
                    msgDiv.innerHTML = '';
                }, 2000);
            }, 500);
        } else {
            // 💎 DIAMANT - Réactiver le jeu
            mbGameActive = true;
            cell.innerHTML = '💎';
            // 🔥 FIX : Ajouter la classe "diamond" au lieu de "safe" + background vert
            cell.classList.add('revealed', 'diamond');
            cell.style.background = '#22c55e';
            cell.style.borderColor = '#22c55e';
            
            document.getElementById('diamondCount').textContent = data.diamonds_found;
            document.getElementById('multiplier').textContent = data.multiplier;
            document.getElementById('potentialWin').textContent = data.potential_win;
            
            document.getElementById('cashoutBtn').disabled = false;
            
            const msgDiv = document.getElementById('mbMessage');
            msgDiv.className = 'message win';
            msgDiv.innerHTML = `💎 +1 Diamant ! Multiplicateur: x${data.multiplier}`;
            setTimeout(() => msgDiv.innerHTML = '', 2000);
        }
        
    } catch (error) {
        // En cas d'erreur réseau, réactiver
        mbGameActive = originalActive;
        const msgDiv = document.getElementById('mbMessage');
        msgDiv.className = 'message lose';
        msgDiv.innerHTML = 'Erreur de connexion';
    }
}

async function cashout() {
    // Désactiver immédiatement le jeu localement
    mbGameActive = false;
    
    try {
        const response = await fetch('/api/minebomb/cashout', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        const data = await response.json();
        
        // VÉRIFIER SI ERREUR
        if (!response.ok || !data.success) {
            const errorMsg = data.error || 'Erreur inconnue';
            alert('❌ ' + errorMsg);
            
            // Si session expirée, reload la page
            if (errorMsg.includes('session') || errorMsg.includes('partie')) {
                setTimeout(() => location.reload(), 1500);
            }
            
            // Réactiver le jeu si erreur
            mbGameActive = true;
            return;
        }
        
        // SUCCÈS - Mettre à jour l'argent
        if (data.money !== undefined) {
            updateMoneyDisplay(data.money);
        }
        
        if (data.stats) {
            updateStatsDisplay(data.stats);
        }
        
        // 🔥 FIX : Révéler toutes les cases correctement
        if (data.grid) {
            document.querySelectorAll('.mine-cell').forEach((cell, index) => {
                cell.onclick = null;
                
                const cellType = data.grid[index];
                const wasRevealed = mbRevealed.includes(index);
                
                // Si c'était un diamant trouvé, garder le vert
                if (wasRevealed && cellType === 'diamond') {
                    // Déjà vert, ne rien faire
                    return;
                }
                
                // Révéler progressivement les cases non révélées
                if (!wasRevealed) {
                    setTimeout(() => {
                        cell.classList.add('revealed');
                        cell.innerHTML = cellType === 'bomb' ? '💣' : '💎';
                        
                        // 🔥 FIX : Les bombes en gris, les diamants en gris
                        cell.style.background = '#64748b';
                        cell.style.borderColor = '#64748b';
                        cell.style.opacity = '0.6';
                    }, Math.random() * 1000);
                }
            });
        }
        
        const msgDiv = document.getElementById('mbMessage');
        msgDiv.className = 'message win';
        msgDiv.innerHTML = `💰 CASHOUT!<br>Vous gagnez ${data.profit} $ (x${data.multiplier})`;
        
        document.getElementById('cashoutBtn').disabled = true;
        
        setTimeout(() => {
            document.getElementById('mbGame').style.display = 'none';
            document.getElementById('mbBetting').style.display = 'block';
            msgDiv.innerHTML = '';
            // Réinitialiser les variables
            mbGameActive = false;
            mbRevealed = [];
        }, 4000);
        
    } catch (error) {
        console.error('Cashout error:', error);
        alert('❌ Erreur de connexion. Vérifie ta connexion internet.');
        // Réactiver le jeu en cas d'erreur réseau
        mbGameActive = true;
    }
}

// ============================================
// SLOT MACHINE
// ============================================
async function spinSlots() {
    const bet = parseInt(document.getElementById('slotsBet').value);
    const btn = document.getElementById('spinSlotsBtn');
    
    btn.disabled = true;
    
    try {
        const reel1 = document.getElementById('reel1');
        const reel2 = document.getElementById('reel2');
        const reel3 = document.getElementById('reel3');
        
        const symbols = ['🎰', '🍋', '🍊', '🍇', '7️⃣', '💎'];
        
        let count = 0;
        const interval = setInterval(() => {
            reel1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            reel3.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            count++;
            
            if (count >= 20) {
                clearInterval(interval);
            }
        }, 100);
        
        const response = await fetch('/api/slots/spin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({bet})
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            btn.disabled = false;
            clearInterval(interval);
            return;
        }
        
        const data = await response.json();
        
        setTimeout(() => {
            clearInterval(interval);
            
            reel1.textContent = data.reels[0];
            reel2.textContent = data.reels[1];
            reel3.textContent = data.reels[2];
            
            const msgDiv = document.getElementById('slotsMessage');
            msgDiv.className = 'message';
            
            if (data.result === 'win') {
                msgDiv.classList.add('win');
                let jackpotMsg = '';
                if (data.multiplier === 100) {
                    jackpotMsg = '🎊 MEGA JACKPOT! 🎊<br>';
                } else if (data.multiplier === 50) {
                    jackpotMsg = '🎉 JACKPOT! 🎉<br>';
                }
                msgDiv.innerHTML = `${jackpotMsg}✅ ${data.reels.join(' ')}!<br>Vous gagnez ${data.profit} $ (x${data.multiplier})`;
            } else {
                msgDiv.classList.add('lose');
                msgDiv.innerHTML = `❌ ${data.reels.join(' ')}<br>Vous perdez ${bet} $`;
            }
            
            updateMoneyDisplay(data.money);
            updateStatsDisplay(data.stats);
            
            setTimeout(() => {
                msgDiv.innerHTML = '';
                btn.disabled = false;
            }, 3000);
        }, 2000);
        
    } catch (error) {
        console.error('Slots error:', error);
        alert('Connection error');
        btn.disabled = false;
    }
}

// ============================================
// Plinko le sang de la veine
// ============================================

let plinkoCanvas = null;
let plinkoCtx = null;
let plinkoBall = null;
let plinkoAnimating = false;
let plinkoMultipliers = [];
let plinkoPegs = [];

const PLINKO_ROWS = 16;
const PLINKO_PEG_RADIUS = 5;
const PLINKO_BALL_RADIUS = 10;
const PLINKO_SPACING = 48;
const PLINKO_START_X = 425;
const PLINKO_START_Y = 70;
const GRAVITY = 0.5;
const BOUNCE = 0.65;

class PlinkoBall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 0;
        this.radius = PLINKO_BALL_RADIUS;
    }

    update() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Collision avec les pegs
        plinkoPegs.forEach(peg => {
            const dx = this.x - peg.x;
            const dy = this.y - peg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.radius + peg.radius) {
                peg.hit = true;

                const angle = Math.atan2(dy, dx);
                const targetX = peg.x + Math.cos(angle) * (this.radius + peg.radius);
                const targetY = peg.y + Math.sin(angle) * (this.radius + peg.radius);

                this.x = targetX;
                this.y = targetY;

                const normalX = dx / dist;
                const normalY = dy / dist;

                const dotProduct = this.vx * normalX + this.vy * normalY;
                this.vx = (this.vx - 2 * dotProduct * normalX) * BOUNCE;
                this.vy = (this.vy - 2 * dotProduct * normalY) * BOUNCE;

                this.vx += (Math.random() - 0.5) * 3;
            }
        });

        // Bordures
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -BOUNCE;
        }
        if (this.x + this.radius > plinkoCanvas.width) {
            this.x = plinkoCanvas.width - this.radius;
            this.vx *= -BOUNCE;
        }
    }

    draw(ctx) {
        // Ombre
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Gradient
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius * 1.5
        );
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Contour
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Reflet
        ctx.beginPath();
        ctx.arc(
            this.x - this.radius * 0.4,
            this.y - this.radius * 0.4,
            this.radius * 0.4,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }

    isAtBottom() {
        return this.y > plinkoCanvas.height - this.radius - 100;
    }

    getFinalSlot() {
        const slotWidth = plinkoCanvas.width / 17;
        return Math.floor(this.x / slotWidth);
    }
}

async function dropPlinkoBall() {
    if (plinkoAnimating) return;

    const bet = parseInt(document.getElementById('plinkoBet').value);
    const risk = document.getElementById('plinkoRisk').value;

    const btn = document.querySelector('#plinko button[onclick="dropPlinkoBall()"]');
    btn.disabled = true;
    plinkoAnimating = true;

    // Reset pegs
    plinkoPegs.forEach(peg => peg.hit = false);

    // Lancer la balle
    plinkoBall = new PlinkoBall(PLINKO_START_X, PLINKO_START_Y);

    try {
        const response = await fetch('/api/plinko/drop', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({bet, risk})
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            btn.disabled = false;
            plinkoAnimating = false;
            plinkoBall = null;
            return;
        }

        const data = await response.json();

        // Attendre l'animation
        await animatePlinko(data.slot);

        // Afficher le résultat
        const msgDiv = document.getElementById('plinkoMessage');
        msgDiv.className = 'message';

        if (data.result === 'win') {
            msgDiv.classList.add('win');
            msgDiv.innerHTML = `✅ Slot ${data.slot}!<br>Vous gagnez ${data.profit} $ (x${data.multiplier})`;
        } else {
            msgDiv.classList.add('lose');
            msgDiv.innerHTML = `❌ Slot ${data.slot}<br>Vous perdez ${Math.abs(data.profit)} $ (x${data.multiplier})`;
        }

        updateMoneyDisplay(data.money);
        updateStatsDisplay(data.stats);

        setTimeout(() => {
            msgDiv.innerHTML = '';
        }, 3000);

    } catch (error) {
        console.error('Plinko error:', error);
        alert('Connection error');
    } finally {
        btn.disabled = false;
        plinkoAnimating = false;
    }
}

function initPlinkoCanvas() {
    plinkoCanvas = document.getElementById('plinkoCanvas');
    if (!plinkoCanvas) return;

    plinkoCanvas.width = 850;
    plinkoCanvas.height = 950;
    plinkoCtx = plinkoCanvas.getContext('2d');

    // Créer les pegs
    plinkoPegs = [];
    for (let row = 0; row < PLINKO_ROWS; row++) {
        const pegsInRow = row + 3;
        const rowY = PLINKO_START_Y + row * PLINKO_SPACING;
        const startX = PLINKO_START_X - ((pegsInRow - 1) * PLINKO_SPACING / 2);

        for (let col = 0; col < pegsInRow; col++) {
            plinkoPegs.push({
                x: startX + col * PLINKO_SPACING,
                y: rowY,
                radius: PLINKO_PEG_RADIUS,
                hit: false
            });
        }
    }

    // Dessiner le board initial
    drawPlinkoBoard();
}

function drawPlinkoBoard() {
    if (!plinkoCtx) return;

    // Clear
    plinkoCtx.clearRect(0, 0, plinkoCanvas.width, plinkoCanvas.height);

    // Dessiner les pegs avec effet 3D
    plinkoPegs.forEach(peg => {
        // Ombre du peg
        plinkoCtx.beginPath();
        plinkoCtx.arc(peg.x + 1, peg.y + 2, peg.radius, 0, Math.PI * 2);
        plinkoCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        plinkoCtx.fill();

        // Peg principal avec gradient
        const gradient = plinkoCtx.createRadialGradient(
            peg.x - peg.radius * 0.3,
            peg.y - peg.radius * 0.3,
            0,
            peg.x,
            peg.y,
            peg.radius * 1.5
        );
        
        if (peg.hit) {
            gradient.addColorStop(0, '#fbbf24');
            gradient.addColorStop(1, '#f59e0b');
        } else {
            gradient.addColorStop(0, '#60a5fa');
            gradient.addColorStop(1, '#2563eb');
        }

        plinkoCtx.beginPath();
        plinkoCtx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        plinkoCtx.fillStyle = gradient;
        plinkoCtx.fill();

        // Contour brillant
        plinkoCtx.strokeStyle = peg.hit ? 'rgba(251, 191, 36, 0.8)' : 'rgba(96, 165, 250, 0.5)';
        plinkoCtx.lineWidth = 2;
        plinkoCtx.stroke();

        // Reflet
        plinkoCtx.beginPath();
        plinkoCtx.arc(peg.x - peg.radius * 0.4, peg.y - peg.radius * 0.4, peg.radius * 0.4, 0, Math.PI * 2);
        plinkoCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        plinkoCtx.fill();
    });
}

async function animatePlinko(finalSlot) {
    return new Promise((resolve) => {
        let stuckFrames = 0;
        let lastY = 0;
        
        const animate = () => {
            drawPlinkoBoard();
            
            if (plinkoBall) {
                plinkoBall.update();
                plinkoBall.draw(plinkoCtx);

                // Détection si la balle est coincée
                if (Math.abs(plinkoBall.y - lastY) < 0.1) {
                    stuckFrames++;
                } else {
                    stuckFrames = 0;
                }
                lastY = plinkoBall.y;

                // Fin si au fond OU coincée trop longtemps
                if (plinkoBall.isAtBottom() || stuckFrames > 60) {
                    const slot = plinkoBall.getFinalSlot();
                    highlightMultiplier(slot);
                    plinkoBall = null;
                    resolve();
                    return;
                }
            }

            requestAnimationFrame(animate);
        };

        animate();
    });
}

function updatePlinkoMultipliers(risk) {
    const multipliers = {
        'low': [1.5, 1.3, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5],
        'medium': [5.0, 3.0, 2.0, 1.5, 1.0, 0.5, 0.3, 0.2, 0.1, 0.2, 0.3, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0],
        'high': [50, 20, 5, 2, 0.5, 0.2, 0.1, 0.0, 0.0, 0.0, 0.1, 0.2, 0.5, 2, 5, 20, 50]
    };

    plinkoMultipliers = multipliers[risk];

    const container = document.getElementById('plinkoMultipliers');
    container.innerHTML = plinkoMultipliers.map((mult, i) => {
        let color = '#64748b';
        let bgColor = 'rgba(100, 116, 139, 0.1)';
        
        if (mult >= 10) {
            color = '#fbbf24';
            bgColor = 'rgba(251, 191, 36, 0.2)';
        } else if (mult >= 2) {
            color = '#22c55e';
            bgColor = 'rgba(34, 197, 94, 0.2)';
        } else if (mult >= 1) {
            color = '#3b82f6';
            bgColor = 'rgba(59, 130, 246, 0.2)';
        } else {
            color = '#ef4444';
            bgColor = 'rgba(239, 68, 68, 0.2)';
        }

        return `
            <div id="mult-${i}" style="
                flex: 1;
                padding: 10px 4px;
                background: ${bgColor};
                border: 2px solid ${color};
                border-radius: 8px;
                font-weight: bold;
                color: ${color};
                font-size: 13px;
                text-align: center;
                transition: all 0.3s;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            ">
                x${mult}
            </div>
        `;
    }).join('');
}

function highlightMultiplier(position) {
    const multEl = document.getElementById(`mult-${position}`);
    if (multEl) {
        multEl.style.transform = 'scale(1.3) translateY(-8px)';
        multEl.style.boxShadow = '0 8px 24px currentColor';
        multEl.style.zIndex = '10';
        
        setTimeout(() => {
            multEl.style.transform = 'scale(1) translateY(0)';
            multEl.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            multEl.style.zIndex = '1';
        }, 2500);
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    const plinkoTab = document.getElementById('plinko');
    if (plinkoTab) {
        const observer = new MutationObserver(() => {
            if (plinkoTab.classList.contains('active') && !plinkoCanvas) {
                setTimeout(() => {
                    initPlinkoCanvas();
                    updatePlinkoMultipliers('medium');
                }, 100);
            }
        });
        
        observer.observe(plinkoTab, { attributes: true, attributeFilter: ['class'] });
    }
});



let clickTimes = [];
let clickWarnings = 0;
const CLICK_THRESHOLD = 30; // Max 30 clics par seconde (humainement impossible de maintenir)
const WARNING_THRESHOLD = 3; // 3 avertissements avant blocage
const TIME_WINDOW = 1000; // Fenêtre de 1 seconde

async function doClick() {
    const now = Date.now();
    
    // Nettoyer les clics de plus d'1 seconde
    clickTimes = clickTimes.filter(time => now - time < TIME_WINDOW);
    
    // Ajouter le clic actuel
    clickTimes.push(now);
    
    // Vérifier si autoclick détecté (plus de X clics en 1 seconde)
    if (clickTimes.length > CLICK_THRESHOLD) {
        clickWarnings++;
        
        if (clickWarnings >= WARNING_THRESHOLD) {
            alert('❌ ANTI-AUTOCLICKER\nVous avez été temporairement bloqué pour 30 secondes.\nRaison: Plus de 30 clics par seconde détectés.');
            document.getElementById('clickButton').disabled = true;
            clickTimes = [];
            setTimeout(() => {
                document.getElementById('clickButton').disabled = false;
                clickWarnings = 0;
            }, 30000);
            return;
        } else {
            alert(`⚠️ ANTI-AUTOCLICKER\nAvertissement ${clickWarnings}/${WARNING_THRESHOLD}\n${clickTimes.length} clics en 1 seconde détectés (max: ${CLICK_THRESHOLD})`);
            clickTimes = [];
        }
        return;
    }
    
    try {
        const response = await fetch('/api/clicker/click', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        const data = await response.json();
        updateMoneyDisplay(data.money);
        
        const btn = document.getElementById('clickButton');
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 100);
        
        showFloatingNumber(clickPower);
        
    } catch (error) {
        console.error('Erreur clic:', error);
    }
}

async function buyClickUpgrade() {
    try {
        const response = await fetch('/api/clicker/buy/click', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            return;
        }
        
        const data = await response.json();
        
        clickPower = data.clickPower;
        clickLevel = data.clickLevel;
        clickCost = data.clickCost;
        
        updateMoneyDisplay(data.money);
        updateClickerDisplay();
        
    } catch (error) {
        console.error('Erreur achat:', error);
        alert('Connection error');
    }
}

async function buyAutoUpgrade() {
    try {
        const response = await fetch('/api/clicker/buy/auto', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            return;
        }
        
        const data = await response.json();
        
        autoLevel = data.autoLevel;
        autoCost = data.autoCost;
        passiveIncome = data.passiveIncome;
        
        updateMoneyDisplay(data.money);
        updateClickerDisplay();
        
    } catch (error) {
        console.error('Erreur achat:', error);
        alert('Connection error');
    }
}

async function buyFactoryUpgrade() {
    try {
        const response = await fetch('/api/clicker/buy/factory', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            return;
        }
        
        const data = await response.json();
        
        factoryLevel = data.factoryLevel;
        factoryCost = data.factoryCost;
        passiveIncome = data.passiveIncome;
        
        updateMoneyDisplay(data.money);
        updateClickerDisplay();
        
    } catch (error) {
        console.error('Erreur achat:', error);
        alert('Connection error');
    }
}

async function buyBankUpgrade() {
    try {
        const response = await fetch('/api/clicker/buy/bank', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
            return;
        }
        
        const data = await response.json();
        
        bankLevel = data.bankLevel;
        bankCost = data.bankCost;
        passiveIncome = data.passiveIncome;
        
        updateMoneyDisplay(data.money);
        updateClickerDisplay();
        
    } catch (error) {
        console.error('Erreur achat:', error);
        alert('Connection error');
    }
}

function updateClickerDisplay() {
    document.getElementById('clickPower').textContent = clickPower;
    document.getElementById('clickLevel').textContent = clickLevel;
    document.getElementById('clickCost').textContent = formatMoney(clickCost) + ' $';
    
    document.getElementById('autoLevel').textContent = autoLevel;
    document.getElementById('autoCost').textContent = formatMoney(autoCost) + ' $';
    
    document.getElementById('factoryLevel').textContent = factoryLevel;
    document.getElementById('factoryCost').textContent = formatMoney(factoryCost) + ' $';
    
    document.getElementById('bankLevel').textContent = bankLevel;
    document.getElementById('bankCost').textContent = formatMoney(bankCost) + ' $';
    
    const incomePerSec = passiveIncome;
    document.getElementById('sidebarIncome').textContent = '+' + formatMoney(incomePerSec) + ' $/s';
}

function showFloatingNumber(amount) {
    const btn = document.getElementById('clickButton');
    const rect = btn.getBoundingClientRect();
    
    const float = document.createElement('div');
    float.className = 'floating-number';
    float.textContent = '+' + amount;
    float.style.left = (rect.left + rect.width / 2) + 'px';
    float.style.top = (rect.top + rect.height / 2) + 'px';
    
    document.body.appendChild(float);
    
    setTimeout(() => {
        float.remove();
    }, 1000);
}

function startPassiveIncome() {
    setInterval(async () => {
        if (passiveIncome > 0) {
            try {
                const response = await fetch('/api/clicker/passive');
                const data = await response.json();
                updateMoneyDisplay(data.money);
            } catch (error) {
                console.error('Erreur passive income:', error);
            }
        }
    }, 1000);
}