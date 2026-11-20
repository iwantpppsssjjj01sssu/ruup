// 나의 루틴: 이번 달 캘린더 → 날짜를 누르면 그날 할 일(시간대별 루틴) → 할 일을 누르면 단계
document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-routine-page]');
    if (!page) {
        return;
    }
    const $ = (selector) => page.querySelector(selector);
    const STORE_KEY = 'luup-routine-plan-v2';
    const DONE_KEY = 'luup-routine-done-v2';
    const MINUTE_STEP = 5;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 하루 시간대별 루틴 · tasks는 순서대로 하는 단계
    const DEFAULT_BLOCKS = [
        { name: '일어나기', desc: '상쾌한 아침을 여는 루틴이에요', start: '07:00', end: '07:20', color: '#d6dcfb', tasks: [{ title: '일어나서 물 한 잔', minutes: 5 }, { title: '이불 정리하기', minutes: 5 }, { title: '세수하기', minutes: 10 }] },
        { name: '아침먹기', desc: '든든하게 먹고 학교 갈 준비를 해요', start: '07:20', end: '08:10', color: '#a8b4fb', tasks: [{ title: '아침 식사하기', minutes: 20 }, { title: '등교 준비하기', minutes: 15 }, { title: '양치하기', minutes: 5 }] },
        { name: '숙제하기', desc: '오늘의 학습 루틴 일정을 확인해요', start: '16:00', end: '16:40', color: '#4f6bff', tasks: [{ title: '준비하기', minutes: 5 }, { title: '책상에 앉기', minutes: 3 }, { title: '문제 풀기', minutes: 20 }, { title: '쉬는 시간', minutes: 5 }, { title: '정리하기', minutes: 7 }] },
        { name: '씻기', desc: '하루를 깨끗하게 마무리해요', start: '20:00', end: '20:30', color: '#a6ecdf', tasks: [{ title: '샤워하기', minutes: 15 }, { title: '양치하기', minutes: 5 }, { title: '내일 가방 챙기기', minutes: 10 }] },
        { name: '잠자기', desc: '푹 자야 내일도 힘이 나요', start: '21:00', end: '07:00', color: '#d2f5ec', tasks: [{ title: '책 10분 읽기', minutes: 10 }, { title: '불 끄고 잠자리에 들기', minutes: 5 }] }
    ];

    // 계획과 체크 기록은 이 브라우저에만 저장 (저장이 막힌 환경에서도 화면은 동작)
    const load = (key, fallback) => {
        try {
            return JSON.parse(localStorage.getItem(key)) || fallback;
        } catch (error) {
            return fallback;
        }
    };
    const save = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // 저장 불가 환경
        }
    };

    const blocks = load(STORE_KEY, DEFAULT_BLOCKS);
    const doneByDate = load(DONE_KEY, {});
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const state = {
        date: todayDate,
        month: new Date(today.getFullYear(), today.getMonth(), 1),
        view: 'day',
        selected: 0,
        editing: false
    };

    const pad = (number) => String(number).padStart(2, '0');
    const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const toMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    const toTime = (minutes) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
    const doneSet = (date = state.date) => new Set(doneByDate[dateKey(date)] || []);
    const totalOf = (block) => block.tasks.reduce((sum, task) => sum + Number(task.minutes), 0);
    const blockDone = (done, b) => blocks[b].tasks.filter((_, i) => done.has(`${b}-${i}`)).length;
    const isBlockComplete = (done, b) => blocks[b].tasks.length > 0 && blockDone(done, b) === blocks[b].tasks.length;
    const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const dayLabel = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
    const monthLabel = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' });

    const toast = (() => {
        const box = $('[data-toast]');
        let timerId = null;
        return (text) => {
            box.textContent = text;
            box.classList.add('is-show');
            clearTimeout(timerId);
            timerId = setTimeout(() => box.classList.remove('is-show'), 2200);
        };
    })();

    // ---------- 1. 이번 달 캘린더 ----------
    const renderLegend = () => {
        $('[data-legend]').innerHTML = blocks.map((block) => `
            <li><i style="--c:${block.color}"></i>${escapeHtml(block.name)}</li>`).join('')
            + '<li class="rc_legend_note"><i class="is-empty"></i>아직 안 함</li>';
    };

    const renderCalendar = () => {
        const first = state.month;
        const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        const todayKey = dateKey(todayDate);
        const selectedKey = dateKey(state.date);
        $('[data-month-label]').textContent = monthLabel.format(first);

        const cells = [];
        for (let i = 0; i < first.getDay(); i += 1) {
            cells.push('<span class="rc_blank" aria-hidden="true"></span>');
        }
        for (let d = 1; d <= daysInMonth; d += 1) {
            const date = new Date(first.getFullYear(), first.getMonth(), d);
            const key = dateKey(date);
            const done = doneSet(date);
            const completeCount = blocks.filter((_, b) => isBlockComplete(done, b)).length;
            const isPast = date < todayDate;
            const classes = [
                'rc_day',
                key === todayKey && 'is-today',
                key === selectedKey && 'is-selected',
                isPast && 'is-past',
                completeCount === blocks.length && blocks.length && 'is-all',
                date.getDay() === 0 && 'is-sun',
                date.getDay() === 6 && 'is-sat'
            ].filter(Boolean).join(' ');
            const dots = blocks.map((block, b) => `<i class="${isBlockComplete(done, b) ? 'is-done' : ''}" style="--c:${block.color}"></i>`).join('');
            const count = completeCount || key === todayKey || isPast ? `<small>${completeCount}/${blocks.length}</small>` : '';
            cells.push(`
                <button type="button" class="${classes}" data-pick="${key}" aria-pressed="${key === selectedKey}"
                    aria-label="${dayLabel.format(date)}${key === todayKey ? ' (오늘)' : ''}, 루틴 ${blocks.length}개 중 ${completeCount}개 완료">
                    <b>${d}</b>
                    <span class="rc_dots" aria-hidden="true">${dots}</span>
                    ${count}
                </button>`);
        }
        // 마지막 줄 뒤 빈칸도 채워 격자가 반듯하게 끝나도록
        while (cells.length % 7) {
            cells.push('<span class="rc_blank" aria-hidden="true"></span>');
        }
        $('[data-cal-grid]').innerHTML = cells.join('');
    };

    // ---------- 2. 고른 날의 할 일 목록 ----------
    const arrowIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
    const checkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';

    const renderDay = () => {
        const done = doneSet();
        const completeCount = blocks.filter((_, b) => isBlockComplete(done, b)).length;
        const isToday = dateKey(state.date) === dateKey(todayDate);
        const items = blocks.map((block, b) => {
            const count = blockDone(done, b);
            const total = block.tasks.length;
            const complete = isBlockComplete(done, b);
            return `
                <li>
                    <button type="button" class="rc_item${complete ? ' is-complete' : ''}" data-open="${b}" style="--c:${block.color}">
                        <span class="rc_item_time">${block.start}<small>~ ${block.end}</small></span>
                        <span class="rc_item_body">
                            <b>${escapeHtml(block.name)}${complete ? '<em>완료</em>' : ''}</b>
                            <small>할 일 ${total}개 · 약 ${totalOf(block)}분</small>
                            <span class="rc_item_bar" aria-hidden="true"><i style="--value:${total ? (count / total) * 100 : 0}%"></i></span>
                        </span>
                        <span class="rc_item_count">${count}/${total}</span>
                        <span class="rc_item_arrow">${arrowIcon}</span>
                    </button>
                </li>`;
        }).join('');
        $('[data-panel]').innerHTML = `
            <div class="rc_panel_head">
                <p class="rc_label">TODAY'S PLAN</p>
                <h2 class="rc_panel_title" tabindex="-1" data-panel-title>${dayLabel.format(state.date)}${isToday ? '<span class="rc_badge">오늘</span>' : ''}</h2>
                <p class="rc_panel_meta">루틴 ${blocks.length}개 중 <b>${completeCount}개 완료</b> · 하나를 누르면 단계가 나와요</p>
            </div>
            <ol class="rc_list">${items}</ol>
            <button type="button" class="rc_add" data-add>+ 할 일 추가하기</button>`;
    };

    // ---------- 3. 고른 할 일의 단계 ----------
    const renderRoutine = () => {
        const b = state.selected;
        const block = blocks[b];
        const done = doneSet();
        const count = blockDone(done, b);
        const total = block.tasks.length;
        const allDone = isBlockComplete(done, b);
        const next = blocks[b + 1];
        let clock = toMinutes(block.start);
        const steps = block.tasks.map((task, i) => {
            const startAt = toTime(clock);
            clock += Number(task.minutes);
            const isDone = done.has(`${b}-${i}`);
            if (state.editing) {
                return `
                    <li class="rc_step is-edit">
                        <span class="rc_step_no">${i + 1}</span>
                        <span class="rc_step_body">
                            <input class="rc_rename" type="text" maxlength="20" value="${escapeHtml(task.title)}" aria-label="${i + 1}단계 이름" data-rename="${i}">
                            <small>${startAt} 시작</small>
                        </span>
                        <span class="rc_counter">
                            <button type="button" data-minus="${i}" aria-label="${escapeHtml(task.title)} 시간 ${MINUTE_STEP}분 줄이기">−</button>
                            <output aria-live="polite">${task.minutes}분</output>
                            <button type="button" data-plus="${i}" aria-label="${escapeHtml(task.title)} 시간 ${MINUTE_STEP}분 늘리기">+</button>
                        </span>
                        <button type="button" class="rc_delete" data-delete="${i}">삭제</button>
                    </li>`;
            }
            return `
                <li class="rc_step${isDone ? ' is-done' : ''}">
                    <span class="rc_step_no">${isDone ? checkIcon : i + 1}</span>
                    <span class="rc_step_body">
                        <b>${escapeHtml(task.title)}</b>
                        <small>${startAt} 시작 · ${task.minutes}분</small>
                    </span>
                    <button type="button" class="rc_check" aria-pressed="${isDone}" aria-label="${i + 1}단계 ${escapeHtml(task.title)} 완료" data-check="${i}">${isDone ? '완료' : '체크'}</button>
                </li>`;
        }).join('') || '<li class="rc_empty">아직 단계가 없어요. 아래 "+ 단계 추가하기"로 넣어 보세요.</li>';

        $('[data-panel]').innerHTML = `
            <button type="button" class="rc_back" data-back>← ${dayLabel.format(state.date)} 일정</button>
            <div class="rc_panel_head rc_routine_head" style="--c:${block.color}">
                <p class="rc_label">STEP BY STEP</p>
                <h2 class="rc_panel_title" tabindex="-1" data-panel-title><i class="rc_swatch" aria-hidden="true"></i>${escapeHtml(block.name)}</h2>
                <p class="rc_panel_meta">${block.start} ~ ${block.end} · ${escapeHtml(block.desc || '')}</p>
                <div class="rc_progress" aria-hidden="true"><i style="--value:${total ? (count / total) * 100 : 0}%"></i></div>
                <div class="rc_tools">
                    <p><b>${count}/${total}단계</b> 완료 · 약 ${totalOf(block)}분</p>
                    <span>
                        ${total && !state.editing ? `<button type="button" class="rc_text_btn" data-all-done>${allDone ? '전체 취소' : '✓ 전체 완료'}</button>` : ''}
                        <button type="button" class="rc_text_btn" aria-pressed="${state.editing}" data-edit>${state.editing ? '수정 완료' : '수정하기'}</button>
                    </span>
                </div>
            </div>
            <ol class="rc_steps">${steps}</ol>
            <button type="button" class="rc_add" data-add>+ 단계 추가하기</button>
            ${next ? `<button type="button" class="rc_next" data-open="${b + 1}">다음 할 일 · <b>${escapeHtml(next.name)}</b> ${next.start} <span aria-hidden="true">→</span></button>` : ''}`;
    };

    const renderPanel = (focusTitle = false) => {
        if (state.view === 'routine') {
            renderRoutine();
        } else {
            renderDay();
        }
        if (focusTitle) {
            $('[data-panel-title]')?.focus({ preventScroll: true });
        }
    };

    const refresh = () => {
        renderCalendar();
        renderPanel();
    };

    const saveDone = (done) => {
        doneByDate[dateKey(state.date)] = [...done];
        save(DONE_KEY, doneByDate);
        refresh();
    };

    // 좁은 화면에서는 캘린더 아래 패널이 보이도록 내려 줌
    // 넓은 화면: 달력이 화면을 꽉 채우고, 날짜를 누르면 오른쪽에서 할 일 창이 미끄러져 나옴
    // 좁은 화면: 달력 아래 할 일 창으로 내려감
    const board = $('.rc_board');
    const openPanel = () => board.classList.add('is-panel');
    const closePanel = () => board.classList.remove('is-panel');
    const showPanelOnMobile = () => {
        openPanel();
        if (window.matchMedia('(max-width: 900px)').matches) {
            $('[data-panel]').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
    };
    $('[data-close]').addEventListener('click', closePanel);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && board.classList.contains('is-panel')) {
            closePanel();
        }
    });

    // ---------- 클릭 처리 ----------
    page.addEventListener('click', (event) => {
        const month = event.target.closest('[data-month]');
        if (month) {
            state.month = new Date(state.month.getFullYear(), state.month.getMonth() + Number(month.dataset.month), 1);
            renderCalendar();
            return;
        }
        if (event.target.closest('[data-go-today]')) {
            state.month = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
            state.date = todayDate;
            state.view = 'day';
            state.editing = false;
            refresh();
            openPanel();
            return;
        }
        const pick = event.target.closest('[data-pick]');
        if (pick) {
            const [y, m, d] = pick.dataset.pick.split('-').map(Number);
            state.date = new Date(y, m - 1, d);
            state.view = 'day';
            state.editing = false;
            refresh();
            page.querySelector(`[data-pick="${pick.dataset.pick}"]`)?.focus();
            showPanelOnMobile();
            return;
        }
        const open = event.target.closest('[data-open]');
        if (open) {
            state.selected = Number(open.dataset.open);
            state.view = 'routine';
            state.editing = false;
            renderPanel(true);
            showPanelOnMobile();
            return;
        }
        if (event.target.closest('[data-back]')) {
            state.view = 'day';
            state.editing = false;
            renderPanel(true);
            return;
        }
        if (event.target.closest('[data-add]')) {
            openAdd();
            return;
        }

        // 아래는 단계 화면 안의 버튼
        if (state.view !== 'routine') {
            return;
        }
        const b = state.selected;
        const block = blocks[b];
        const check = event.target.closest('[data-check]');
        if (check) {
            const done = doneSet();
            const id = `${b}-${check.dataset.check}`;
            if (done.has(id)) {
                done.delete(id);
            } else {
                done.add(id);
            }
            const wasComplete = isBlockComplete(doneSet(), b);
            saveDone(done);
            if (!wasComplete && isBlockComplete(done, b)) {
                toast(`${block.name} 루틴을 모두 끝냈어요! 🎉`);
            }
            $(`[data-check="${check.dataset.check}"]`)?.focus();
            return;
        }
        if (event.target.closest('[data-all-done]')) {
            const done = doneSet();
            const ids = block.tasks.map((_, i) => `${b}-${i}`);
            const allDone = ids.every((id) => done.has(id));
            ids.forEach((id) => (allDone ? done.delete(id) : done.add(id)));
            saveDone(done);
            toast(allDone ? '완료 표시를 모두 지웠어요' : `${block.name} 루틴을 모두 끝냈어요! 🎉`);
            return;
        }
        if (event.target.closest('[data-edit]')) {
            state.editing = !state.editing;
            renderPanel();
            if (state.editing) {
                $('[data-rename]')?.focus();
            } else {
                $('[data-edit]')?.focus();
                toast('계획을 저장했어요');
            }
            return;
        }
        const minus = event.target.closest('[data-minus]');
        const plus = event.target.closest('[data-plus]');
        if (minus || plus) {
            const i = Number((minus || plus).dataset[minus ? 'minus' : 'plus']);
            const task = block.tasks[i];
            task.minutes = Math.min(Math.max(Number(task.minutes) + (plus ? MINUTE_STEP : -MINUTE_STEP), 1), 180);
            save(STORE_KEY, blocks);
            renderPanel();
            $(`[data-${minus ? 'minus' : 'plus'}="${i}"]`)?.focus();
            return;
        }
        const remove = event.target.closest('[data-delete]');
        if (remove) {
            const [task] = block.tasks.splice(Number(remove.dataset.delete), 1);
            save(STORE_KEY, blocks);
            refresh();
            toast(`"${task.title}"을(를) 지웠어요`);
        }
    });

    page.addEventListener('input', (event) => {
        const input = event.target.closest('[data-rename]');
        if (input && input.value.trim()) {
            blocks[state.selected].tasks[Number(input.dataset.rename)].title = input.value.trim();
            save(STORE_KEY, blocks);
        }
    });

    // 캘린더 방향키 이동 (왼/오른쪽 하루, 위/아래 일주일)
    $('[data-cal-grid]').addEventListener('keydown', (event) => {
        const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        if (!(event.key in moves) || !event.target.closest('[data-pick]')) {
            return;
        }
        event.preventDefault();
        const [y, m, d] = event.target.closest('[data-pick]').dataset.pick.split('-').map(Number);
        const target = new Date(y, m - 1, d + moves[event.key]);
        if (target.getMonth() !== state.month.getMonth() || target.getFullYear() !== state.month.getFullYear()) {
            state.month = new Date(target.getFullYear(), target.getMonth(), 1);
            renderCalendar();
        }
        page.querySelector(`[data-pick="${dateKey(target)}"]`)?.focus();
    });

    // ---------- 할 일·단계 추가 ----------
    const addDialog = $('[data-add-dialog]');
    const addForm = $('[data-add-form]');
    const openAdd = () => {
        $('[data-add-block]').innerHTML = blocks.map((block, i) => `<option value="${i}">${escapeHtml(block.name)} (${block.start} ~ ${block.end})</option>`).join('');
        addForm.reset();
        $('[data-add-block]').value = String(state.selected);
        addDialog.showModal();
    };
    addDialog.addEventListener('close', () => {
        if (addDialog.returnValue !== 'confirm') {
            return;
        }
        const data = new FormData(addForm);
        const title = String(data.get('title')).trim();
        const index = Number(data.get('block'));
        if (!title) {
            return;
        }
        blocks[index].tasks.push({ title, minutes: Number(data.get('minutes')) || 10 });
        save(STORE_KEY, blocks);
        state.selected = index;
        state.view = 'routine';
        refresh();
        toast(`${blocks[index].name}에 "${title}"을(를) 넣었어요`);
    });

    renderLegend();

    // 왼쪽 탭: 시간대를 고르면 달력 막대에서 그 시간대만 진하게 보임 (다시 누르거나 '전체'를 누르면 모두)
    const cal = $('.rc_cal');
    const filters = $('[data-filters]');
    const renderFilters = () => {
        const active = cal.dataset.filter ?? 'all';
        const rows = [{ key: 'all', name: '모든 루틴', time: '', color: '' }]
            .concat(blocks.map((block, i) => ({ key: String(i), name: block.name, time: block.start, color: block.color })));
        filters.innerHTML = rows.map((row) => `
            <button type="button" class="rc_side_tag" data-filter="${row.key}" aria-pressed="${active === row.key}">
                <i class="${row.key === 'all' ? 'is-all' : ''}" style="--c:${row.color}" aria-hidden="true"></i>
                <span>${escapeHtml(row.name)}</span>
                ${row.time ? `<small>${row.time}</small>` : ''}
            </button>`).join('');
    };
    filters.addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter]');
        if (!button) {
            return;
        }
        const key = button.dataset.filter;
        cal.dataset.filter = key === 'all' || cal.dataset.filter === key ? 'all' : key;
        renderFilters();
    });
    cal.dataset.filter = 'all';
    renderFilters();
    refresh();
});
