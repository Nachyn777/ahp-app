// --- НАВИГАЦИЯ И МЕНЮ ---
function toggleMenu() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

function showTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(btnElement) btnElement.classList.add('active');

    // Если открыто на телефоне — закрываем меню после выбора
    if (window.innerWidth <= 768 && document.querySelector('.sidebar').classList.contains('open')) {
        toggleMenu();
    }
}

// --- ОЧИСТКА ---
function clearData() {
    document.querySelectorAll('#alternativesTable input').forEach(input => {
        input.value = '';
        input.style.borderColor = '#cbd5e1';
    });
}

// --- ПРОВЕРКА ---
function validateInputs() {
    let isValid = true;
    document.querySelectorAll('#alternativesTable input').forEach(input => {
        const val = Number(input.value);
        if (input.value === '' || val < 1 || val > 3) {
            isValid = false;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '#cbd5e1';
        }
    });
    if (!isValid) alert("Ошибка! Заполните все поля (от 1 до 3).");
    return isValid;
}

let myChart = null;

// --- МАТЕМАТИКА МАИ ---
function getGeometricMean(arr) {
    let product = 1;
    for (let i = 0; i < arr.length; i++) product *= arr[i];
    return Math.pow(product, 1 / arr.length);
}
function normalize(arr) {
    let sum = arr.reduce((a, b) => a + b, 0);
    return arr.map(val => val / sum);
}

function calculateAll() {
    if (!validateInputs()) return;

    const altScores = {
        "РЦ": [Number(document.getElementById('rc_x').value), Number(document.getElementById('rc_p').value), Number(document.getElementById('rc_k').value), Number(document.getElementById('rc_s').value)],
        "ЭССО": [Number(document.getElementById('esso_x').value), Number(document.getElementById('esso_p').value), Number(document.getElementById('esso_k').value), Number(document.getElementById('esso_s').value)],
        "Балиса": [Number(document.getElementById('balisa_x').value), Number(document.getElementById('balisa_p').value), Number(document.getElementById('balisa_k').value), Number(document.getElementById('balisa_s').value)],
        "ВОД": [Number(document.getElementById('vod_x').value), Number(document.getElementById('vod_p').value), Number(document.getElementById('vod_k').value), Number(document.getElementById('vod_s').value)],
        "ИПД": [Number(document.getElementById('ipd_x').value), Number(document.getElementById('ipd_p').value), Number(document.getElementById('ipd_k').value), Number(document.getElementById('ipd_s').value)],
        "ПАВ": [Number(document.getElementById('pav_x').value), Number(document.getElementById('pav_p').value), Number(document.getElementById('pav_k').value), Number(document.getElementById('pav_s').value)]
    };
    const altNames = Object.keys(altScores);

    const matrixCriteria = [
        [1, Number(document.getElementById('comp_xp').value), Number(document.getElementById('comp_xk').value), Number(document.getElementById('comp_xs').value)],
        [1/Number(document.getElementById('comp_xp').value), 1, Number(document.getElementById('comp_pk').value), Number(document.getElementById('comp_ps').value)],
        [1/Number(document.getElementById('comp_xk').value), 1/Number(document.getElementById('comp_pk').value), 1, Number(document.getElementById('comp_ks').value)],
        [1/Number(document.getElementById('comp_xs').value), 1/Number(document.getElementById('comp_ps').value), 1/Number(document.getElementById('comp_ks').value), 1]
    ];

    const critWeights = normalize(matrixCriteria.map(row => getGeometricMean(row)));

    let lambdaMax = 0;
    for (let i = 0; i < 4; i++) {
        let Aw = 0;
        for (let j = 0; j < 4; j++) Aw += matrixCriteria[i][j] * critWeights[j];
        lambdaMax += Aw / critWeights[i];
    }
    lambdaMax /= 4;
    const OS = ((lambdaMax - 4) / 3) / 0.9;

    const localPriorities = Array(6).fill().map(() => []);
    for (let c = 0; c < 4; c++) {
        const matrixAlt = [];
        for (let i = 0; i < 6; i++) {
            const row = [];
            for (let j = 0; j < 6; j++) {
                const diff = altScores[altNames[i]][c] - altScores[altNames[j]][c];
                let val = 1;
                if (diff === 1) val = 3; else if (diff === 2) val = 5;
                else if (diff === -1) val = 1/3; else if (diff === -2) val = 1/5;
                row.push(val);
            }
            matrixAlt.push(row);
        }
        const normalizedAlt = normalize(matrixAlt.map(row => getGeometricMean(row)));
        for (let i = 0; i < 6; i++) localPriorities[i].push(normalizedAlt[i]);
    }

    const globalPriorities = [];
    for (let i = 0; i < 6; i++) {
        let gi = 0;
        for (let j = 0; j < 4; j++) gi += localPriorities[i][j] * critWeights[j];
        globalPriorities.push(gi);
    }

    displayResults(globalPriorities, altNames, OS);
    showTab('tab-results', document.querySelectorAll('.nav-btn')[3]);
}

function displayResults(globalPriorities, altNames, OS) {
    const osDiv = document.getElementById('osCheck');
    if (OS > 0.1) {
        osDiv.className = 'os-box os-bad';
        osDiv.innerText = `ВНИМАНИЕ: ОС = ${OS.toFixed(3)} > 0.1. Матрица несогласована!`;
    } else {
        osDiv.className = 'os-box os-good';
        osDiv.innerText = `ОС = ${OS.toFixed(3)} < 0.1. Согласованность приемлема.`;
    }

    let ranking = [];
    for (let i = 0; i < 6; i++) ranking.push({ name: altNames[i], score: globalPriorities[i] });
    ranking.sort((a, b) => b.score - a.score);

    const list = document.getElementById('globalPrioritiesList');
    list.innerHTML = '';
    ranking.forEach(item => list.innerHTML += `<li><span>${item.name}</span> <strong>${item.score.toFixed(3)}</strong></li>`);
    document.getElementById('winnerText').innerText = `Оптимальный вариант: ${ranking[0].name}`;

    const ctx = document.getElementById('resultsChart').getContext('2d');
    if (myChart != null) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranking.map(item => item.name),
            datasets: [{ label: 'Глобальный приоритет', data: ranking.map(item => item.score), backgroundColor: ranking.map((_, i) => i === 0 ? '#2563eb' : '#94a3b8'), borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 0.5 } }, plugins: { legend: { display: false } } }
    });
}

// --- PWA ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/ahp-app/sw.js').catch(err => console.log('SW error:', err));
  });
}