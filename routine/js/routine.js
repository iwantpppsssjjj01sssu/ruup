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
        { name: '일어나기', desc: '상쾌한 아침을 여는 루틴이에요', start: '07:00', end: '07:20', color: '#ff8fb8', tasks: [{ title: '일어나서 물 한 잔', minutes: 5 }, { title: '이불 정리하기', minutes: 5 }, { title: '세수하기', minutes: 10 }] },
        { name: '아침먹기', desc: '든든하게 먹고 학교 갈 준비를 해요', start: '07:20', end: '08:10', color: '#ffc94a', tasks: [{ title: '아침 식사하기', minutes: 20 }, { title: '등교 준비하기', minutes: 15 }, { title: '양치하기', minutes: 5 }] },
        { name: '숙제하기', desc: '오늘의 학습 루틴 일정을 확인해요', start: '16:00', end: '16:40', color: '#5b8cff', tasks: [{ title: '준비하기', minutes: 5 }, { title: '책상에 앉기', minutes: 3 }, { title: '문제 풀기', minutes: 20 }, { title: '쉬는 시간', minutes: 5 }, { title: '정리하기', minutes: 7 }] },
        { name: '씻기', desc: '하루를 깨끗하게 마무리해요', start: '20:00', end: '20:30', color: '#3fd8b0', tasks: [{ title: '샤워하기', minutes: 15 }, { title: '양치하기', minutes: 5 }, { title: '내일 가방 챙기기', minutes: 10 }] },
        { name: '잠자기', desc: '푹 자야 내일도 힘이 나요', start: '21:00', end: '07:00', color: '#a77bff', tasks: [{ title: '책 10분 읽기', minutes: 10 }, { title: '불 끄고 잠자리에 들기', minutes: 5 }] }
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

    // ---------- 날짜마다 다른 하루 계획 ----------
    // 요일별 오후 활동이 다르고(학원·운동·독서·주말 나들이…), 날짜에 따라 시간·할 일도 조금씩 달라짐
    // 사용자가 고친 계획은 그 날짜에만 저장됨
    const PLAN_KEY = 'luup-routine-plans-v3';
    const plans = load(PLAN_KEY, {});
    const AFTERNOON = {
        1: { name: '숙제하기', desc: '월요일 학습 루틴으로 한 주를 시작해요', start: '16:00', tasks: [['책상 정리하기', 5], ['수학 익힘책 풀기', 20], ['쉬는 시간', 5], ['받아쓰기 연습', 10]] },
        2: { name: '피아노 학원', desc: '학원 다녀와서 연습까지 해요', start: '15:30', tasks: [['학원 가방 챙기기', 5], ['피아노 학원', 50], ['집에서 10분 복습', 10]] },
        3: { name: '태권도', desc: '몸을 움직이며 에너지를 써요', start: '16:30', tasks: [['도복 챙기기', 5], ['태권도 수업', 50], ['물 마시고 쉬기', 5]] },
        4: { name: '영어 공부', desc: '영어 단어와 듣기를 해요', start: '16:00', tasks: [['단어 10개 외우기', 15], ['영어 동화 듣기', 15], ['단어 시험 보기', 10]] },
        5: { name: '독서 시간', desc: '좋아하는 책을 골라 읽어요', start: '16:30', tasks: [['읽을 책 고르기', 5], ['책 20분 읽기', 20], ['독서 기록 한 줄 쓰기', 5]] },
        6: { name: '주말 나들이', desc: '가족과 바깥 공기를 쐬어요', start: '13:00', tasks: [['나갈 준비하기', 15], ['공원 산책하기', 60], ['오늘 본 것 그려 보기', 20]] },
        0: { name: '다음 주 준비', desc: '한 주를 미리 준비해요', start: '17:00', tasks: [['시간표 확인하기', 10], ['준비물 챙기기', 15], ['필통 정리하기', 10]] }
    };
    const pick = (list, seed) => list[seed % list.length];
    const makePlan = (date) => {
        const dow = date.getDay();
        const weekend = dow === 0 || dow === 6;
        const seed = date.getDate() + date.getMonth() * 31;
        const wake = weekend ? 8 * 60 + (seed % 3) * 10 : 6 * 60 + 50 + (seed % 3) * 10;
        const after = AFTERNOON[dow];
        const make = (name, desc, start, color, tasks) => {
            const list = tasks.map(([title, minutes]) => ({ title, minutes }));
            const total = list.reduce((sum, t) => sum + t.minutes, 0);
            return { name, desc, start: toTime(start), end: toTime(start + total), color, tasks: list };
        };
        const breakfast = weekend
            ? [['아침 식사하기', 25], [pick(['가족과 대화하기', '아침 산책하기', '식탁 정리 돕기'], seed), 15]]
            : [['아침 식사하기', 20], ['등교 준비하기', 15], ['양치하기', 5]];
        const wash = [['샤워하기', 15], ['양치하기', 5], [weekend ? pick(['내일 입을 옷 고르기', '방 정리하기'], seed) : '내일 가방 챙기기', 10]];
        const sleep = [[pick(['책 10분 읽기', '오늘 일기 한 줄 쓰기', '감사한 일 말하기'], seed), 10], ['불 끄고 잠자리에 들기', 5]];
        const washStart = (weekend ? 20 * 60 + 30 : 19 * 60 + 50) + ((seed * 7) % 3) * 10;
        const plan = [
            make('일어나기', weekend ? '여유로운 주말 아침이에요' : '상쾌한 아침을 여는 루틴이에요', wake, '#ff8fb8', [['일어나서 물 한 잔', 5], ['이불 정리하기', 5], [pick(['세수하기', '스트레칭하기', '창문 열고 환기하기'], seed), 10]]),
            make('아침먹기', weekend ? '천천히 아침을 즐겨요' : '든든하게 먹고 학교 갈 준비를 해요', wake + 20, '#ffc94a', breakfast),
            make(after.name, after.desc, toMinutes(after.start), '#5b8cff', after.tasks),
            make('씻기', '하루를 깨끗하게 마무리해요', washStart, '#3fd8b0', wash),
            make('잠자기', '푹 자야 내일도 힘이 나요', washStart + 50, '#a77bff', sleep)
        ];
        plan[4].end = toTime(wake + (weekend ? 0 : 0));
        return plan;
    };
    // 시간대 색: 분홍 · 노랑 · 파랑 · 민트 · 보라 (예전에 저장된 비슷한 색 계획도 새 색으로 바꿔 보여 줌)
    const OLD_COLORS = { '#d6dcfb': '#ff8fb8', '#a8b4fb': '#ffc94a', '#4f6bff': '#5b8cff', '#a6ecdf': '#3fd8b0', '#d2f5ec': '#a77bff', '#c3c7d1': '#ff9a5c' };
    const recolor = (list) => {
        list.forEach((block) => {
            block.color = OLD_COLORS[block.color] || block.color;
        });
        return list;
    };
    const blocksFor = (date) => (plans[dateKey(date)] ? recolor(plans[dateKey(date)]) : makePlan(date));
    let blocks = blocksFor(state.date);
    const setDate = (date) => {
        state.date = date;
        blocks = blocksFor(date);
    };
    const savePlan = () => {
        plans[dateKey(state.date)] = blocks;
        save(PLAN_KEY, plans);
    };
    const blockDone = (done, b, list = blocks) => list[b].tasks.filter((_, i) => done.has(`${b}-${i}`)).length;
    const isBlockComplete = (done, b, list = blocks) => list[b].tasks.length > 0 && blockDone(done, b, list) === list[b].tasks.length;
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
        // '오늘' 버튼 자리: 이번 달 이름으로 (누르면 이번 달 오늘로 돌아감)
        const todayMonthBtn = page.querySelector('.rc_today_btn');
        if (todayMonthBtn) {
            // 지금 보고 있는 달을 표시 (‹ › 로 넘기면 함께 바뀜), 누르면 이번 달 오늘로 돌아감
            todayMonthBtn.textContent = `${first.getMonth() + 1}월`;
            const sideMonth = document.querySelector('[data-side-month]');
            if (sideMonth) sideMonth.textContent = first.getMonth() + 1;
            todayMonthBtn.setAttribute('aria-label', `지금 ${first.getMonth() + 1}월 보는 중 · 누르면 이번 달(${todayDate.getMonth() + 1}월)로 돌아가기`);
        }

        const cells = [];
        for (let i = 0; i < first.getDay(); i += 1) {
            cells.push('<span class="rc_blank" aria-hidden="true"></span>');
        }
        for (let d = 1; d <= daysInMonth; d += 1) {
            const date = new Date(first.getFullYear(), first.getMonth(), d);
            const key = dateKey(date);
            const done = doneSet(date);
            const dayBlocks = blocksFor(date);
            const completeCount = dayBlocks.filter((_, b) => isBlockComplete(done, b, dayBlocks)).length;
            const isPast = date < todayDate;
            const classes = [
                'rc_day',
                key === todayKey && 'is-today',
                key === selectedKey && 'is-selected',
                isPast && 'is-past',
                completeCount === dayBlocks.length && dayBlocks.length && 'is-all',
                date.getDay() === 0 && 'is-sun',
                date.getDay() === 6 && 'is-sat'
            ].filter(Boolean).join(' ');
            const dots = dayBlocks.map((block, b) => `<i class="${isBlockComplete(done, b, dayBlocks) ? 'is-done' : ''}" style="--c:${block.color}"></i>`).join('');
            const count = completeCount || key === todayKey || isPast ? `<small>${completeCount}/${dayBlocks.length}</small>` : '';
            cells.push(`
                <button type="button" class="${classes}" data-pick="${key}" aria-pressed="${key === selectedKey}"
                    aria-label="${dayLabel.format(date)}${key === todayKey ? ' (오늘)' : ''}, 루틴 ${dayBlocks.length}개 중 ${completeCount}개 완료">
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
                <p class="rc_label rc_label_plain">Today's Plan</p>
                <h2 class="rc_panel_title" tabindex="-1" data-panel-title>${dayLabel.format(state.date)}${isToday ? '<span class="rc_badge">오늘</span>' : ''}</h2>
                <p class="rc_panel_meta">루틴 ${blocks.length}개 중 <b>${completeCount}개 완료</b></p>
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
                <p class="rc_label rc_label_plain">Step by Step</p>
                <h2 class="rc_panel_title" tabindex="-1" data-panel-title><i class="rc_swatch" aria-hidden="true"></i>${escapeHtml(block.name)}</h2>
                <p class="rc_panel_meta rc_step_meta"><span class="rc_step_time">${block.start} – ${block.end}</span>${block.desc ? `<span class="rc_step_desc">${escapeHtml(block.desc)}</span>` : ''}</p>
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
            setDate(todayDate);
            state.view = 'day';
            state.editing = false;
            refresh();
            openPanel();
            return;
        }
        const pick = event.target.closest('[data-pick]');
        if (pick) {
            const [y, m, d] = pick.dataset.pick.split('-').map(Number);
            setDate(new Date(y, m - 1, d));
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
            openAdd(event.target.closest('[data-add]'));
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
            savePlan();
            renderPanel();
            $(`[data-${minus ? 'minus' : 'plus'}="${i}"]`)?.focus();
            return;
        }
        const remove = event.target.closest('[data-delete]');
        if (remove) {
            const [task] = block.tasks.splice(Number(remove.dataset.delete), 1);
            savePlan();
            refresh();
            toast(`"${task.title}"을(를) 지웠어요`);
        }
    });

    page.addEventListener('input', (event) => {
        const input = event.target.closest('[data-rename]');
        if (input && input.value.trim()) {
            blocks[state.selected].tasks[Number(input.dataset.rename)].title = input.value.trim();
            savePlan();
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
    const openAdd = (trigger) => {
        // 누른 버튼 바로 아래에 뜨도록 위치 계산 (화면 밖으로 넘치면 안쪽으로 당김)
        if (trigger && window.matchMedia('(min-width: 601px)').matches) {
            const r = trigger.getBoundingClientRect();
            const width = Math.min(380, window.innerWidth - 32);
            const left = Math.min(Math.max(16, r.left), window.innerWidth - width - 16);
            const top = Math.min(r.bottom + 10, window.innerHeight - 440);
            addDialog.style.setProperty('--dlg-left', `${left}px`);
            addDialog.style.setProperty('--dlg-top', `${Math.max(16, top)}px`);
            addDialog.classList.add('is-anchored');
        } else {
            addDialog.classList.remove('is-anchored');
        }
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
        savePlan();
        state.selected = index;
        state.view = 'routine';
        refresh();
        toast(`${blocks[index].name}에 "${title}"을(를) 넣었어요`);
    });

    renderLegend();

    // 왼쪽 탭 너비: 사이 손잡이를 끌거나(마우스·터치) 방향키로 늘이고 줄임, 고른 너비는 이 브라우저에 기억
    const resizer = $('[data-side-resize]');
    const calBox = $('.rc_cal');
    const SIDE_KEY = 'luup-routine-side-w';
    const SIDE_MIN = 160;
    const SIDE_MAX = 440;
    const setSideW = (w, remember = true) => {
        const width = Math.round(Math.min(Math.max(w, SIDE_MIN), SIDE_MAX));
        calBox.style.setProperty('--side-w', `${width}px`);
        resizer.setAttribute('aria-valuenow', String(width));
        if (remember) {
            save(SIDE_KEY, width);
        }
    };
    const savedSide = load(SIDE_KEY, null);
    if (savedSide) {
        setSideW(savedSide, false);
    }
    resizer?.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        const side = $('.rc_side');
        const startX = event.clientX;
        const startW = side.getBoundingClientRect().width;
        resizer.setPointerCapture(event.pointerId);
        calBox.classList.add('is-resizing');
        const move = (e) => setSideW(startW + (e.clientX - startX));
        const up = () => {
            calBox.classList.remove('is-resizing');
            resizer.removeEventListener('pointermove', move);
            resizer.removeEventListener('pointerup', up);
        };
        resizer.addEventListener('pointermove', move);
        resizer.addEventListener('pointerup', up);
    });
    resizer?.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
        }
        event.preventDefault();
        const now = $('.rc_side').getBoundingClientRect().width;
        setSideW(now + (event.key === 'ArrowRight' ? 20 : -20));
    });
    // 손잡이를 두 번 누르면 기본 너비로
    resizer?.addEventListener('dblclick', () => {
        calBox.style.removeProperty('--side-w');
        save(SIDE_KEY, null);
    });

    // 왼쪽 탭 '+ 할 일 추가하기': 창을 띄우지 않고 버튼 바로 아래에 작은 입력칸이 탭처럼 펼쳐짐 (고른 날짜에 추가)
    const sideAddToggle = $('[data-side-add-toggle]');
    const sideAdd = $('[data-side-add]');
    const setSideAdd = (open) => {
        sideAdd.hidden = !open;
        sideAddToggle.setAttribute('aria-expanded', String(open));
        sideAddToggle.textContent = open ? '− 추가 닫기' : '+ 할 일 추가하기';
        if (open) {
            // 시간은 목록에서 고르지 않고 직접 적음 (기본값: 지금부터 다음 정각)
            const next = new Date();
            $('[data-side-add-hour]').value = String((next.getHours() + 1) % 24);
            $('[data-side-add-minute]').value = '0';
            sideAdd.querySelector('input[name="title"]').focus();
        } else {
            sideAdd.reset();
        }
    };
    sideAddToggle?.addEventListener('click', () => setSideAdd(sideAdd.hidden));
    // 숫자 칸 옆 큰 − / + 버튼: 시는 1시간, 분은 5분씩 (시·분은 끝에서 반대쪽으로 돌아감)
    sideAdd?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-num-step]');
        if (!btn) {
            return;
        }
        const input = btn.parentElement.querySelector('input');
        const min = Number(input.min);
        const max = Number(input.max);
        let value = (Number(input.value) || 0) + Number(btn.dataset.numStep);
        if (input.hasAttribute('data-wrap')) {
            const span = max - min + 1;
            value = ((value - min) % span + span) % span + min;
        } else {
            value = Math.min(Math.max(value, min), max);
        }
        input.value = String(value);
    });


    sideAdd?.querySelector('[data-side-add-cancel]').addEventListener('click', () => setSideAdd(false));
    sideAdd?.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(sideAdd);
        const title = String(data.get('title')).trim();
        const minutes = Number(data.get('minutes')) || 10;
        if (!title) {
            return;
        }
        // 적은 시간과 같은 시간대가 있으면 거기에 넣고, 없으면 그 시간에 새 할 일 칸을 만들어 붙임
        // 시·분을 각각 적은 값으로 시작 시간 만들기 (범위를 벗어나면 안쪽으로 맞춤)
        const hour = Math.min(Math.max(Math.round(Number(data.get('hour')) || 0), 0), 23);
        const minute = Math.min(Math.max(Math.round(Number(data.get('minute')) || 0), 0), 59);
        const start = `${pad(hour)}:${pad(minute)}`;
        let index = blocks.findIndex((block) => block.start === start);
        if (index >= 0) {
            blocks[index].tasks.push({ title, minutes });
        } else {
            blocks.push({ name: title, desc: '직접 추가한 할 일이에요', start, end: toTime(toMinutes(start) + minutes), color: '#ff9a5c', tasks: [{ title, minutes }] });
            index = blocks.length - 1;
        }
        savePlan();
        state.selected = index;
        refresh();
        toast(`${dayLabel.format(state.date)} ${blocks[index].start} ${blocks[index].name}에 "${title}"을(를) 넣었어요`);
        setSideAdd(false);
    });

    // 왼쪽 탭 '오늘 할 일 보기': 오른쪽 창 대신 버튼 바로 아래에 1. 2. … 간단한 목록으로 펼침 (다시 누르면 접힘)
    const todayToggle = $('[data-today-toggle]');
    const todayList = $('[data-today-list]');
    const renderTodayList = () => {
        const list = blocksFor(todayDate);
        const done = doneSet(todayDate);
        todayList.innerHTML = list.map((block, b) => {
            const complete = isBlockComplete(done, b, list);
            return `<li class="${complete ? 'is-done' : ''}"><span>${b + 1}.</span><b>${block.start}</b> ${escapeHtml(block.name)}${complete ? ' <em>완료</em>' : ''}</li>`;
        }).join('');
    };
    todayToggle?.addEventListener('click', () => {
        const open = todayList.hidden;
        if (open) {
            renderTodayList();
        }
        todayList.hidden = !open;
        todayToggle.setAttribute('aria-expanded', String(open));
        todayToggle.textContent = open ? '오늘 할 일 접기' : '오늘 할 일 보기';
    });

    // 왼쪽 탭 맨 위: 오늘 날짜
    const sideToday = $('[data-side-today]');
    if (sideToday) {
        sideToday.textContent = dayLabel.format(todayDate);
    }

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

document.addEventListener('DOMContentLoaded', () => {
    // 제목: "이번 달 루틴" → 잠시 뒤 "이번 달 하루님의 루틴" (가운데 이름이 벌어지며 스르륵 나타남)
    const who = document.querySelector('[data-title-who]');
    if (!who) return;
    try {
        const profile = JSON.parse(localStorage.getItem('luup-my-profile'));
        const full = (profile?.name || '').trim();
        if (full) {
            const short = full.length === 3 ? full.slice(1) : full;
            who.querySelector('[data-who-name]').textContent = short;
            who.closest('h1')?.setAttribute('aria-label', `이번 달 ${short}님의 루틴`);
        }
    } catch { /* 기본 이름 사용 */ }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const open = () => {
        who.style.setProperty('--who-w', `${who.scrollWidth}px`);
        who.classList.add('is-in');
    };
    (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(open, reduce ? 0 : 900));
    window.addEventListener('resize', () => {
        if (who.classList.contains('is-in')) {
            who.style.setProperty('--who-w', 'auto');
            who.style.setProperty('--who-w', `${who.scrollWidth}px`);
        }
    });
});
