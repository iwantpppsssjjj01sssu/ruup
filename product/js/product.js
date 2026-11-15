document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const routine = window.luupFindRoutine(params.get('id')) || window.LUUP_ROUTINES[0];
    const $ = (selector) => document.querySelector(selector);

    // 기본 정보
    document.title = `${routine.title} | LUUP`;
    $('[data-detail-category]').textContent = `${window.LUUP_CATEGORIES[routine.category]} 루틴`;
    $('[data-detail-title]').textContent = routine.title;
    $('[data-detail-desc]').textContent = routine.desc;
    $('[data-detail-steps]').textContent = `${routine.steps.length}단계`;
    $('[data-detail-time]').textContent = routine.time;
    $('[data-detail-level]').textContent = routine.level;
    $('[data-detail-people]').textContent = `${window.luupFormatPeople(routine.people)}명`;
    $('[data-detail-icon]').textContent = routine.icon;
    $('[data-detail-tip]').textContent = routine.tip;

    // 내 루틴에 추가 (브라우저에 저장)
    const storageKey = 'luup_my_routines';
    const readMine = () => {
        try {
            return JSON.parse(localStorage.getItem(storageKey)) || [];
        } catch (error) {
            return [];
        }
    };
    const addButton = $('[data-detail-add]');
    const addText = $('[data-detail-add-text]');
    const renderAdd = () => {
        const isAdded = readMine().includes(routine.id);
        addButton.classList.toggle('is-added', isAdded);
        addButton.setAttribute('aria-pressed', String(isAdded));
        addText.textContent = isAdded ? '✓ 내 루틴에 추가됨' : '내 루틴에 추가하기';
    };
    addButton.addEventListener('click', () => {
        const mine = readMine();
        const next = mine.includes(routine.id) ? mine.filter((id) => id !== routine.id) : [...mine, routine.id];
        try {
            localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (error) {
            // 저장이 막혀 있어도 화면은 그대로 동작
        }
        renderAdd();
    });
    renderAdd();

    // 단계 체크
    const list = $('[data-step-list]');
    const count = $('[data-step-count]');
    const bar = $('[data-step-bar]');
    const doneMessage = $('[data-step-done]');
    const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';

    list.innerHTML = routine.steps.map((step, index) => `
        <li>
            <button type="button" class="check" aria-label="${step.name} 완료 표시" aria-pressed="false">${checkIcon}</button>
            <span class="step_number">${String(index + 1).padStart(2, '0')}</span>
            <p>${step.name}</p>
            <small>${step.min}</small>
        </li>
    `).join('');

    const updateSteps = () => {
        const total = routine.steps.length;
        const done = list.querySelectorAll('li.is-done').length;
        count.textContent = `${done} / ${total}`;
        bar.style.setProperty('--value', `${Math.round((done / total) * 100)}%`);
        doneMessage.hidden = done !== total;
    };

    list.querySelectorAll('li').forEach((item) => {
        item.querySelector('.check').addEventListener('click', (event) => {
            const isDone = item.classList.toggle('is-done');
            event.currentTarget.setAttribute('aria-pressed', String(isDone));
            updateSteps();
        });
    });
    updateSteps();

    // 관련 루틴: 같은 카테고리 우선, 부족하면 다른 루틴으로 채우기
    const others = window.LUUP_ROUTINES.filter((item) => item.id !== routine.id);
    const related = [
        ...others.filter((item) => item.category === routine.category),
        ...others.filter((item) => item.category !== routine.category)
    ].slice(0, 3);
    $('[data-related]').innerHTML = related.map((item) => window.luupRoutineCard(item, 'product.html')).join('');
});
