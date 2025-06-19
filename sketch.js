// --- SELETORES GLOBAIS E CONSTANTES ---
// Mapeamento dos elementos de tela para fácil acesso.
const screens = {
    start: document.getElementById('start-screen'),
    harvest: document.getElementById('harvest-screen'),
    transport: document.getElementById('transport-screen'),
    delivery: document.getElementById('delivery-screen'),
    transition: document.getElementById('transition-screen'),
    end: document.getElementById('end-screen'),
};
// Seleciona os botões principais do jogo.
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const nextPhaseButton = document.getElementById('next-phase-button');

// --- ESTADO GERAL DO JOGO ---
// Variáveis que controlam o estado atual do jogo.
let score = 0; // Pontuação total do jogador.
let gameActive = false; // Flag para controlar se uma fase está ativa.
let currentPhase = 0; // Identifica a fase atual (1: Colheita, 2: Transporte, 3: Entrega).
let collectedItems = []; // Array para armazenar os itens coletados na fase 1.

// --- FUNÇÕES DE CONTROLE DO JOGO ---
/**
 * Alterna a tela visível para o jogador.
 * @param {string} targetScreenKey - A chave da tela a ser exibida (ex: 'start', 'harvest').
 */
function switchScreen(targetScreenKey) {
    // Remove a classe 'active' de todas as telas para escondê-las.
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    // Adiciona a classe 'active' na tela alvo para exibi-la.
    screens[targetScreenKey].classList.add('active');
}

/**
 * Inicia ou reinicia o jogo, resetando as variáveis de estado.
 */
function startGame() {
    score = 0;
    collectedItems = [];
    currentPhase = 1;
    switchScreen('harvest'); // Muda para a tela da primeira fase.
    startHarvestPhase(); // Inicia a lógica da fase de colheita.
}

// --- FASE 1: LÓGICA DA COLHEITA ---
// Seletores e variáveis específicas da fase de colheita.
const harvestArea = document.getElementById('harvest-area');
const harvestScoreDisplay = document.querySelector('#harvest-score span');
const harvestTimerDisplay = document.querySelector('#harvest-timer span');
let harvestTimer = 30; // Tempo em segundos para a fase.
let harvestTimerInterval; // Variável para guardar o ID do setInterval do timer.

// Define os tipos de itens que podem aparecer, incluindo se estão maduros e sua categoria.
const itemTypes = [
    // Itens maduros (pontos positivos)
    { emoji: '🍎', ripe: true, type: 'fruta' }, { emoji: '🍓', ripe: true, type: 'fruta' },
    { emoji: '🍇', ripe: true, type: 'fruta' }, { emoji: '🥕', ripe: true, type: 'legume' },
    { emoji: '🥦', ripe: true, type: 'legume' }, { emoji: '🍅', ripe: true, type: 'legume' },
    { emoji: '🌶️', ripe: true, type: 'especial' }, { emoji: '🌽', ripe: true, type: 'especial' },
    { emoji: '🥒', ripe: true, type: 'especial' },
    // Itens não maduros (pontos negativos)
    { emoji: '🍏', ripe: false, type: 'unripe' }, { emoji: '🥬', ripe: false, type: 'unripe' }
];

/**
 * Prepara e inicia a fase de colheita.
 */
function startHarvestPhase() {
    gameActive = true;
    harvestScoreDisplay.textContent = score; // Atualiza a exibição da pontuação.
    harvestTimer = 30; // Reseta o timer.
    harvestTimerDisplay.textContent = harvestTimer;
    harvestArea.innerHTML = ''; // Limpa a área de colheita de itens anteriores.
    clearInterval(harvestTimerInterval); // Garante que nenhum timer antigo esteja rodando.
    
    spawnHarvestItems(); // Inicia o aparecimento de novos itens.

    // Inicia o cronômetro regressivo.
    harvestTimerInterval = setInterval(() => {
        if (--harvestTimer <= 0) {
            harvestTimer = 0;
            endHarvestPhase(); // Finaliza a fase quando o tempo acaba.
        }
        harvestTimerDisplay.textContent = harvestTimer;
    }, 1000);
}

/**
 * Controla o intervalo de criação de novos itens na colheita.
 */
function spawnHarvestItems() {
    // Se o jogo não estiver ativo ou não for a fase correta, para.
    if (!gameActive || currentPhase !== 1) return;

    // Cria um novo item em um intervalo de tempo.
    const spawnInterval = setInterval(() => {
        // Se o jogo parar no meio, limpa o intervalo para não criar mais itens.
        if (!gameActive || currentPhase !== 1) return clearInterval(spawnInterval);
        createHarvestItem();
    }, 800); // Um novo item a cada 800ms.
}

/**
 * Cria e posiciona um único item de colheita na tela.
 */
function createHarvestItem() {
    const itemData = itemTypes[Math.floor(Math.random() * itemTypes.length)]; // Escolhe um item aleatório.
    const el = document.createElement('div');
    el.className = `harvest-item emoji-sprite ${itemData.ripe ? 'ripe' : 'unripe'}`; // Aplica classes CSS.
    el.textContent = itemData.emoji;
    // Armazena dados sobre o item (maduro, tipo) no próprio elemento HTML.
    Object.assign(el.dataset, { ripe: itemData.ripe, type: itemData.type });
    // Posiciona o item aleatoriamente dentro da área de colheita.
    el.style.left = `${Math.random() * (harvestArea.clientWidth - 40)}px`;
    el.style.top = `${Math.random() * (harvestArea.clientHeight - 40)}px`;
    
    // Adiciona um listener de clique que só pode ser acionado uma vez.
    el.addEventListener('click', handleHarvestClick, { once: true });
    harvestArea.appendChild(el);
    
    // O item desaparece após um tempo para manter o jogo dinâmico.
    setTimeout(() => el.style.opacity = '0', 2500); // Começa a desaparecer.
    setTimeout(() => el.remove(), 3000); // Remove completamente do DOM.
}

/**
 * Lida com o clique em um item de colheita.
 * @param {Event} e - O evento de clique.
 */
function handleHarvestClick(e) {
    if (!gameActive) return;
    const item = e.target;
    const isRipe = item.dataset.ripe === 'true'; // Verifica se o item clicado estava maduro.

    if (isRipe) {
        score += 10; // Ganha pontos por item maduro.
    } else {
        score -= 15; // Perde pontos por item não maduro.
        showErrorIndicator(); // Mostra um 'X' para indicar o erro.
    }
    if (score < 0) score = 0; // A pontuação não pode ser negativa.

    // Adiciona o item (bom ou ruim) à lista de itens coletados para a fase 3.
    collectedItems.push({ emoji: item.textContent, type: item.dataset.type, ripe: isRipe });
    harvestScoreDisplay.textContent = score; // Atualiza a pontuação na tela.
    item.classList.add('clicked'); // Adiciona classe para a animação de coleta.
    setTimeout(() => item.remove(), 500); // Remove o item após a animação.
}

/**
 * Finaliza a fase de colheita e prepara a transição para a próxima fase.
 */
function endHarvestPhase() {
    gameActive = false;
    clearInterval(harvestTimerInterval); // Para o cronômetro.
    currentPhase = 2;
    // Mostra a tela de transição com a pontuação e o botão para a próxima fase.
    showTransition("Colheita Concluída!", `Você fez ${score} pontos. Agora, para a estrada!`, startTransportPhase);
}

// --- FASE 2: LÓGICA DO TRANSPORTE (CANVAS) ---
// Seletores e variáveis específicas da fase de transporte.
const canvas = document.getElementById('transport-canvas');
const ctx = canvas.getContext('2d'); // Contexto 2D para desenhar no canvas.
const transportScoreDisplay = document.querySelector('#transport-score span');
const transportTimeDisplay = document.querySelector('#transport-time span');

// Carrega a imagem do caminhão.
const truckImg = new Image();
truckImg.src = 'caminhão.png'; // Tenta carregar a imagem local.
// Define um 'onerror' para caso a imagem não seja encontrada.
truckImg.onerror = () => {
    // Se 'caminhão.png' falhar, usa uma imagem de placeholder.
    truckImg.src = 'https://placehold.co/80x45/4caf50/ffffff?text=CAMINHÃO';
    truckImg.onerror = null; // Evita um loop infinito se o placeholder também falhar.
};

let player, obstacles, animationFrameId, keysPressed = {};
let baseObstacleSpeed = 3; // Velocidade inicial dos obstáculos.
let transportTimer = 45; // Tempo da fase em segundos.
let transportTimerInterval;
let roadStripeX = 0; // Posição para animar as faixas da estrada.

/**
 * Configura o estado inicial da fase de transporte.
 */
function setupTransportPhase() {
    // Ajusta o tamanho do canvas ao tamanho do seu contêiner.
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Define as propriedades do jogador (o caminhão).
    player = { 
        x: 60, // Posição inicial X.
        y: canvas.height / 2, // Posição inicial Y (centro).
        w: 80, h: 45, // Largura e altura.
        img: truckImg, // A imagem carregada do caminhão.
        emoji: '🚛', // Emoji como fallback caso a imagem não carregue.
        velocityY: 0, acceleration: 0.8, friction: 0.9, maxSpeed: 10 // Física do movimento.
    };
    
    obstacles = []; // Limpa a lista de obstáculos.
    baseObstacleSpeed = 3;
    keysPressed = {};
    transportScoreDisplay.textContent = score;
    
    // Limpa e adiciona listeners de teclado para o movimento.
    window.removeEventListener('keydown', handleKeys);
    window.removeEventListener('keyup', handleKeys);
    window.addEventListener('keydown', handleKeys);
    window.addEventListener('keyup', handleKeys);
    
    spawnObstacle(); // Começa a criar obstáculos.

    // Configura e inicia o cronômetro da fase.
    transportTimer = 45;
    transportTimeDisplay.textContent = transportTimer;
    clearInterval(transportTimerInterval);
    transportTimerInterval = setInterval(() => {
        transportTimer--;
        baseObstacleSpeed += 0.05; // Aumenta a dificuldade com o tempo.
        if(transportTimer <= 0) {
            transportTimer = 0;
            endTransportPhase(); // Termina a fase quando o tempo acaba.
        }
        transportTimeDisplay.textContent = transportTimer;
    }, 1000);
}

/**
 * Inicia a fase de transporte, chamando o setup e o loop de animação.
 */
function startTransportPhase() {
    gameActive = true; currentPhase = 2;
    switchScreen('transport');
    setupTransportPhase();
    if (animationFrameId) cancelAnimationFrame(animationFrameId); // Cancela qualquer loop anterior.
    transportGameLoop(); // Inicia o novo loop de jogo.
}

/**
 * Manipula os eventos de pressionar/soltar tecla para movimento vertical.
 * @param {KeyboardEvent} e - O evento do teclado.
 */
const handleKeys = e => {
  const verticalKeys = ['ArrowUp', 'ArrowDown', 'w', 's'];
  // Previne o comportamento padrão do navegador para as setas (rolar a página).
  if (verticalKeys.includes(e.key)) {
    e.preventDefault();
    // Atualiza o estado da tecla (pressionada ou não).
    keysPressed[e.key.toLowerCase()] = e.type === 'keydown';
  }
};

/**
 * O loop principal do jogo para a fase de transporte (executado a cada frame).
 */
function transportGameLoop() {
    if (!gameActive || currentPhase !== 2) return; // Só executa se a fase estiver ativa.
    updateTransportState(); // Calcula novas posições.
    drawTransportState();   // Desenha tudo na tela.
    // Pede ao navegador para chamar esta função novamente no próximo frame.
    animationFrameId = requestAnimationFrame(transportGameLoop);
}

/**
 * Atualiza a posição do jogador e dos obstáculos.
 */
function updateTransportState() {
    const moveUp = keysPressed['arrowup'] || keysPressed['w'];
    const moveDown = keysPressed['arrowdown'] || keysPressed['s'];
    
    // Aplica aceleração baseada nas teclas pressionadas.
    if (moveUp) player.velocityY -= player.acceleration;
    if (moveDown) player.velocityY += player.acceleration;
    
    player.velocityY *= player.friction; // Aplica atrito para desacelerar.
    // Limita a velocidade máxima.
    if (Math.abs(player.velocityY) > player.maxSpeed) player.velocityY = player.velocityY > 0 ? player.maxSpeed : -player.maxSpeed;
    player.y += player.velocityY; // Atualiza a posição vertical.

    // Impede o jogador de sair da tela.
    if (player.y < player.h / 2) player.y = player.h / 2;
    if (player.y > canvas.height - player.h / 2) player.y = canvas.height - player.h / 2;

    // Move e verifica colisões para cada obstáculo.
    obstacles.forEach((obs, index) => {
        obs.x += obs.speed; // Move o obstáculo (velocidade é negativa).
        // Remove o obstáculo se ele sair da tela.
        if (obs.x < -obs.w) {
            obstacles.splice(index, 1);
        }
        // Verifica colisão com o jogador.
        if (isColliding(player, obs)) {
            score -= 25; // Penalidade por colisão.
            if(score < 0) score = 0;
            transportScoreDisplay.textContent = score;
            showErrorIndicator();
            obstacles.splice(index, 1); // Remove o obstáculo após a colisão.
        }
    });
}

/**
 * Verifica se dois retângulos (jogador e obstáculo) estão colidindo.
 * Usa detecção de colisão AABB (Axis-Aligned Bounding Box).
 * @param {object} rect1 - O primeiro objeto (jogador).
 * @param {object} rect2 - O segundo objeto (obstáculo).
 * @returns {boolean} - True se houver colisão, false caso contrário.
 */
function isColliding(rect1, rect2) {
    return Math.abs(rect1.x - rect2.x) * 2 < (rect1.w + rect2.w) &&
           Math.abs(rect1.y - rect2.y) * 2 < (rect1.h + rect2.h);
}

/**
 * Desenha todos os elementos no canvas.
 */
function drawTransportState() {
    // Desenha o fundo da estrada.
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Anima as faixas amarelas da estrada.
    roadStripeX = (roadStripeX - baseObstacleSpeed) % 80;
    ctx.fillStyle = '#FFC107'; 
    for (let x = roadStripeX; x < canvas.width; x += 80) {
        ctx.fillRect(x, canvas.height / 2 - 5, 40, 10);
    }

    // Desenha os obstáculos (emojis).
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    obstacles.forEach(obs => { ctx.font = `${obs.h}px sans-serif`; ctx.fillText(obs.emoji, obs.x, obs.y); });
    
    // Tenta desenhar a imagem do caminhão.
    if (player.img && player.img.complete && player.img.naturalHeight !== 0) {
        // A imagem é desenhada a partir do canto superior esquerdo, então ajustamos para centralizá-la.
        ctx.drawImage(player.img, player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);
    } else {
        // Se a imagem não carregar, desenha o emoji como alternativa.
        ctx.font = `40px sans-serif`;
        ctx.fillText(player.emoji, player.x, player.y);
    }
}

/**
 * Cria um novo obstáculo em uma posição aleatória e agenda a criação do próximo.
 */
function spawnObstacle() {
    if (!gameActive || currentPhase !== 2) return;
    obstacles.push({
        x: canvas.width + 40, // Começa fora da tela, à direita.
        y: Math.random() * (canvas.height - 40) + 20, // Posição vertical aleatória.
        w: 40, h: 40,
        speed: -(baseObstacleSpeed + Math.random() * 2), // Velocidade aleatória para a esquerda.
        emoji: ['🚐', '🚗', '🚧', '🚙'][Math.floor(Math.random()*4)] // Emoji aleatório.
    });
    // Agenda a próxima criação de obstáculo com um tempo que diminui conforme o jogo acelera.
    setTimeout(spawnObstacle, Math.max(400, 1500 - (baseObstacleSpeed * 100)));
}

/**
 * Finaliza a fase de transporte e prepara a transição.
 */
function endTransportPhase() {
    if (!gameActive) return;
    gameActive = false; currentPhase = 3;
    cancelAnimationFrame(animationFrameId); // Para o loop de animação.
    clearInterval(transportTimerInterval); // Para o timer.
    // Remove os listeners de teclado para não interferir em outras fases.
    window.removeEventListener('keydown', handleKeys); window.removeEventListener('keyup', handleKeys);
    showTransition("Transporte Finalizado!", "Chegamos à cidade. Hora de fazer as entregas!", startDeliveryPhase);
}

// Listener para redimensionar o canvas se a janela do navegador mudar de tamanho.
window.addEventListener('resize', () => {
  if(currentPhase === 2 && screens.transport.classList.contains('active')) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    player.y = canvas.height / 2; // Centraliza o jogador novamente.
  }
});

// --- FASE 3: LÓGICA DA ENTREGA ---
const itemsBox = document.getElementById('delivery-items-box');
const deliveryTargets = document.querySelectorAll('.delivery-target');
const deliveryScoreDisplay = document.querySelector('#delivery-score span');
const deliveryTimerDisplay = document.querySelector('#delivery-timer span');
let deliveryTimer = 60; // Tempo em segundos.
let deliveryTimerInterval;

/**
 * Prepara e inicia a fase de entrega.
 */
function startDeliveryPhase() {
    gameActive = true; currentPhase = 3;
    switchScreen('delivery');
    itemsBox.innerHTML = ''; // Limpa a caixa de itens.
    deliveryScoreDisplay.textContent = score;

    // Se o jogador não coletou nenhum item, o jogo termina.
    if(collectedItems.length === 0){
        showTransition("Cesta Vazia!", "Você não colheu nenhum item. A jornada termina aqui.", showEndScreen);
        return;
    }
    
    // Cria um elemento arrastável para cada item coletado na fase 1.
    collectedItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'delivery-item emoji-sprite'; 
        el.textContent = item.emoji;
        el.draggable = true; // Torna o elemento arrastável.
        // Armazena os dados do item como uma string JSON para a transferência (drag-and-drop).
        el.dataset.itemData = JSON.stringify(item);
        
        // Evento disparado quando o arrasto começa.
        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('application/json', e.target.dataset.itemData);
            setTimeout(() => e.target.classList.add('dragging'), 0); // Adiciona estilo visual ao item arrastado.
        });
        // Evento disparado quando o arrasto termina.
        el.addEventListener('dragend', e => e.target.classList.remove('dragging'));
        itemsBox.appendChild(el);
    });

    // Configura e inicia o timer da fase.
    deliveryTimer = 60;
    deliveryTimerDisplay.textContent = deliveryTimer;
    clearInterval(deliveryTimerInterval);
    deliveryTimerInterval = setInterval(() => {
        if (--deliveryTimer <= 0) {
            deliveryTimer = 0;
            endDeliveryPhase(); // Termina a fase quando o tempo acaba.
        }
        deliveryTimerDisplay.textContent = deliveryTimer;
    }, 1000);
}

// Adiciona os listeners de drag-and-drop para cada alvo de entrega.
deliveryTargets.forEach(target => {
    // Permite que um item seja solto no alvo.
    target.addEventListener('dragover', e => { e.preventDefault(); target.classList.add('over'); });
    // Remove o realce visual quando o item arrastado sai do alvo.
    target.addEventListener('dragleave', () => target.classList.remove('over'));
    // Lida com o evento de soltar o item no alvo.
    target.addEventListener('drop', e => {
        e.preventDefault();
        target.classList.remove('over');
        // Obtém os dados do item que foi solto.
        const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
        const targetAccepts = target.dataset.accepts; // O tipo de item que o alvo aceita.
        const draggedEl = document.querySelector('.delivery-item.dragging');
        
        if(draggedEl) {
            // Verifica se a entrega está correta.
            // A entrega é correta se:
            // 1. O alvo aceita 'unripe' e o item não está maduro.
            // 2. O alvo NÃO aceita 'unripe', o item ESTÁ maduro e o tipo do item corresponde ao do alvo.
            const isCorrect = (targetAccepts === 'unripe' && !itemData.ripe) || 
                              (targetAccepts !== 'unripe' && itemData.ripe && targetAccepts.includes(itemData.type));

            if (isCorrect) {
                score += 20; // Recompensa por entrega correta.
            } else {
                score -= 10; // Penalidade por entrega errada.
                if(score < 0) score = 0;
                showErrorIndicator();
            }
            
            draggedEl.remove(); // Remove o item da cesta.
            deliveryScoreDisplay.textContent = score; // Atualiza a pontuação.
        }

        // Se todos os itens foram entregues, a fase termina.
        if(itemsBox.children.length === 0) endDeliveryPhase();
    });
});

/**
 * Mostra um X vermelho na tela para indicar um erro.
 */
function showErrorIndicator() {
  const indicator = document.getElementById('error-indicator');
  indicator.classList.add('show');
  // Remove a classe após a animação para que possa ser mostrado novamente.
  setTimeout(() => { indicator.classList.remove('show'); }, 600);
}

/**
 * Finaliza a fase de entrega.
 */
function endDeliveryPhase(){
    if (!gameActive) return;
    gameActive = false;
    clearInterval(deliveryTimerInterval); // Para o timer.
    currentPhase = 0; // Reseta a fase.
    showEndScreen(); // Mostra a tela final.
}

// --- TELAS DE TRANSIÇÃO E FIM ---
/**
 * Exibe uma tela de transição entre as fases.
 * @param {string} title - O título da tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {function} nextAction - A função a ser chamada quando o botão 'Continuar' for clicado.
 */
function showTransition(title, message, nextAction) {
    document.getElementById('transition-title').textContent = title;
    document.getElementById('transition-message').textContent = message;
    nextPhaseButton.onclick = nextAction; // Define a ação do botão.
    switchScreen('transition');
}

/**
 * Exibe a tela final com a pontuação total.
 */
function showEndScreen() {
    document.getElementById('final-score').textContent = `Pontuação Final: ${score}`;
    switchScreen('end');
}

// --- EVENT LISTENERS GERAIS ---
// Inicia o jogo quando o botão 'Começar' é clicado.
startButton.addEventListener('click', startGame);
// Reinicia o jogo quando o botão 'Jogar Novamente' é clicado.
restartButton.addEventListener('click', startGame);