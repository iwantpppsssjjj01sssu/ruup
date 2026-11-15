document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-routine-page]');
    if (!page) {
        return;
    }
    const $ = (selector) => page.querySelector(selector);
    const STORE_KEY = 'luup-routine-plan-v2';
    const DONE_KEY = 'luup-routine-done-v2';
    const MINUTE_STEP = 5;

    // 생활계획표 (시계 방향, 12시 방향부터) · deg는 원에서 차지하는 각도 · tasks는 순서대로 하는 단계
    const DEFAULT_BLOCKS = [
        { name: '일어나기', desc: '상쾌한 아침을 여는 루틴이에요', start: '07:00', end: '07:20', color: '#d6dcfb', deg: 72, tasks: [{ title: '일어나서 물 한 잔', minutes: 5 }, { title: '이불 정리하기', minutes: 5 }, { title: '세수하기', minutes: 10 }] },
        { name: '아침먹기', desc: '든든하게 먹고 학교 갈 준비를 해요', start: '07:20', end: '08:10', color: '#a8b4fb', deg: 54, tasks: [{ title: '아침 식사하기', minutes: 20 }, { title: '등교 준비하기', minutes: 15 }, { title: '양치하기', minutes: 5 }] },
        { name: '숙제하기', desc: '오늘의 학습 루틴 일정을 확인해요', start: '16:00', end: '16:40', color: '#4f6bff', ink: '#fff', deg: 110, tasks: [{ title: '준비하기', minutes: 5 }, { title: '책상에 앉기', minutes: 3 }, { title: '문제 풀기', minutes: 20 }, { title: '쉬는 시간', minutes: 5 }, { title: '정리하기', minutes: 7 }] },
        { name: '씻기', desc: '하루를 깨끗하게 마무리해요', start: '20:00', end: '20:30', color: '#a6ecdf', deg: 54, tasks: [{ title: '샤워하기', minutes: 15 }, { title: '양치하기', minutes: 5 }, { title: '내일 가방 챙기기', minutes: 10 }] },
        { name: '잠자기', desc: '푹 자야 내일도 힘이 나요', start: '21:00', end: '07:00', color: '#d2f5ec', deg: 70, tasks: [{ title: '책 10분 읽기', minutes: 10 }, { title: '불 끄고 잠자리에 들기', minutes: 5 }] }
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
    const state = {
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        view: new Date(today.getFullYear(), today.getMonth(), 1),
        selected: 2,
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

    // ---------- 01 달력 ----------
    const monthName = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' });
    const renderCalendars = () => {
        const todayKey = dateKey(today);
        const selectedKey = dateKey(state.date);
        page.querySelectorAll('[data-cal]').forEach((box) => {
            const offset = Number(box.dataset.cal);
            const first = new Date(state.view.getFullYear(), state.view.getMonth() + offset, 1);
            const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
            const cells = ['일', '월', '화', '수', '목', '금', '토'].map((d) => `<li class="dow" aria-hidden="true">${d}</li>`);
            for (let i = 0; i < first.getDay(); i += 1) {
                cells.push('<li></li>');
            }
            for (let d = 1; d <= daysInMonth; d += 1) {
                const date = new Date(first.getFullYear(), first.getMonth(), d);
                const key = dateKey(date);
                const classes = ['pl_day', key === todayKey && 'is-today', (doneByDate[key] || []).length && 'has-done'].filter(Boolean).join(' ');
                cells.push(`<li><button type="button" class="${classes}" data-pick="${key}" aria-pressed="${key === selectedKey}" aria-label="${first.getMonth() + 1}월 ${d}일">${d}</button></li>`);
            }
            const prev = offset === 0 ? '<button type="button" class="pl_cal_nav" data-month="-1" aria-label="이전 달">‹</button>' : '';
            const next = offset === 1
                ? '<button type="button" class="pl_cal_nav" data-month="1" aria-label="다음 달">›</button>'
                : '<button type="button" class="pl_cal_nav pl_cal_next_m" data-month="1" aria-label="다음 달">›</button>';
            box.innerHTML = `
                <div class="pl_cal_head"><b>${monthName.format(first)}</b><span>${prev}${next}</span></div>
                <ul class="pl_cal_grid">${cells.join('')}</ul>`;
        });
    };

    page.addEventListener('click', (event) => {
        const month = event.target.closest('[data-month]');
        if (month) {
            state.view = new Date(state.view.getFullYear(), state.view.getMonth() + Number(month.dataset.month), 1);
            renderCalendars();
            return;
        }
        const pick = event.target.closest('[data-pick]');
        if (pick) {
            const [y, m, d] = pick.dataset.pick.split('-').map(Number);
            state.date = new Date(y, m - 1, d);
            renderAll();
            page.querySelector(`[data-pick="${pick.dataset.pick}"]`)?.focus();
        }
    });

    // ---------- 01 시간대 버튼 ----------
    const renderSlots = () => {
        $('[data-slots]').innerHTML = blocks.map((block, i) => `
            <button type="button" class="pl_slot" role="radio" aria-checked="${i === state.selected}" tabindex="${i === state.selected ? 0 : -1}" data-slot="${i}">
                ${block.start}<small>${block.name}</small>
            </button>`).join('');
    };

    const select = (index, focusSelector) => {
        state.selected = index;
        renderSlots();
        renderWheel();
        rotateTo(index);
        renderSteps();
        renderSummary();
        if (focusSelector) {
            page.querySelector(focusSelector)?.focus({ preventScroll: true });
        }
    };

    $('[data-slots]').addEventListener('click', (event) => {
        const slot = event.target.closest('[data-slot]');
        if (slot) {
            select(Number(slot.dataset.slot), `[data-slot="${slot.dataset.slot}"]`);
        }
    });
    $('[data-slots]').addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            return;
        }
        event.preventDefault();
        const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        const next = (state.selected + step + blocks.length) % blocks.length;
        select(next, `[data-slot="${next}"]`);
    });

    // ---------- 02 단계 ----------
    const checkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
    const renderSteps = () => {
        const block = blocks[state.selected];
        const done = doneSet();
        const doneCount = block.tasks.filter((_, i) => done.has(`${state.selected}-${i}`)).length;
        const allDone = block.tasks.length > 0 && doneCount === block.tasks.length;
        let clock = toMinutes(block.start);

        $('[data-steps-sub]').textContent = `${block.name} · ${block.desc || `${block.name} 일정을 확인해요`}`;
        $('[data-steps-meta]').textContent = `할 일 ${block.tasks.length}개 · 약 ${totalOf(block)}분 · ${doneCount}/${block.tasks.length}단계 완료`;
        const allButton = $('[data-all-done]');
        allButton.hidden = !block.tasks.length || state.editing;
        allButton.textContent = allDone ? '전체 취소하기' : '✓ 전체 완료하기';

        $('[data-steps]').innerHTML = block.tasks.map((task, i) => {
            const startAt = toTime(clock);
            clock += Number(task.minutes);
            const isDone = done.has(`${state.selected}-${i}`);
            const counter = `
                <div class="pl_counter">
                    <button type="button" data-minus="${i}" aria-label="${task.title} 시간 ${MINUTE_STEP}분 줄이기">−</button>
                    <output aria-live="polite">${task.minutes}분</output>
                    <button type="button" data-plus="${i}" aria-label="${task.title} 시간 ${MINUTE_STEP}분 늘리기">+</button>
                </div>`;
            if (state.editing) {
                return `<li>
                    <div class="pl_row_name"><input class="pl_rename" type="text" maxlength="20" value="${task.title.replace(/"/g, '&quot;')}" aria-label="${i + 1}단계 이름" data-rename="${i}"><small>${i + 1}단계 · ${startAt} 시작</small></div>
                    ${counter}
                    <button type="button" class="pl_delete" data-delete="${i}">삭제</button>
                </li>`;
            }
            return `<li class="${isDone ? 'is-done' : ''}">
                <div class="pl_row_name"><b>${i + 1}. ${task.title}</b><small>${i + 1}단계 · ${startAt} 시작</small></div>
                ${counter}
                <button type="button" class="pl_check" aria-pressed="${isDone}" aria-label="${i + 1}단계 ${task.title} 완료" data-check="${i}">${checkIcon}</button>
            </li>`;
        }).join('') || '<li class="pl_empty">아직 단계가 없어요. 오른쪽 "+ 계획 추가하기"로 넣어 보세요.</li>';
    };

    const saveDone = (done) => {
        doneByDate[dateKey(state.date)] = [...done];
        save(DONE_KEY, doneByDate);
        renderSteps();
        renderSummary();
        renderAll.list();
        renderCalendars();
    };

    $('[data-steps]').addEventListener('click', (event) => {
        const block = blocks[state.selected];
        const check = event.target.closest('[data-check]');
        if (check) {
            const done = doneSet();
            const id = `${state.selected}-${check.dataset.check}`;
            if (done.has(id)) {
                done.delete(id);
            } else {
                done.add(id);
            }
            saveDone(done);
            $(`[data-check="${check.dataset.check}"]`)?.focus();
            return;
        }
        const minus = event.target.closest('[data-minus]');
        const plus = event.target.closest('[data-plus]');
        if (minus || plus) {
            const i = Number((minus || plus).dataset[minus ? 'minus' : 'plus']);
            const task = block.tasks[i];
            task.minutes = Math.min(Math.max(Number(task.minutes) + (plus ? MINUTE_STEP : -MINUTE_STEP), 1), 180);
            save(STORE_KEY, blocks);
            renderSteps();
            renderSummary();
            renderAll.list();
            $(`[data-${minus ? 'minus' : 'plus'}="${i}"]`)?.focus();
            return;
        }
        const remove = event.target.closest('[data-delete]');
        if (remove) {
            const [task] = block.tasks.splice(Number(remove.dataset.delete), 1);
            save(STORE_KEY, blocks);
            renderSteps();
            renderSummary();
            renderAll.list();
            toast(`"${task.title}"을(를) 지웠어요`);
        }
    });

    $('[data-steps]').addEventListener('input', (event) => {
        const input = event.target.closest('[data-rename]');
        if (input && input.value.trim()) {
            blocks[state.selected].tasks[Number(input.dataset.rename)].title = input.value.trim();
            save(STORE_KEY, blocks);
            renderAll.list();
        }
    });

    $('[data-all-done]').addEventListener('click', () => {
        const done = doneSet();
        const ids = blocks[state.selected].tasks.map((_, i) => `${state.selected}-${i}`);
        const allDone = ids.every((id) => done.has(id));
        ids.forEach((id) => (allDone ? done.delete(id) : done.add(id)));
        saveDone(done);
        toast(allDone ? '완료 표시를 모두 지웠어요' : `${blocks[state.selected].name} 루틴을 모두 끝냈어요! 🎉`);
    });

    const editButton = $('[data-edit]');
    editButton.addEventListener('click', () => {
        state.editing = !state.editing;
        editButton.setAttribute('aria-pressed', String(state.editing));
        editButton.textContent = state.editing ? '수정 완료' : '수정하기';
        renderSteps();
        if (state.editing) {
            $('[data-rename]')?.focus();
        } else {
            toast('계획을 저장했어요');
        }
    });

    // ---------- 03 생활계획표 ----------
    const wheel = $('[data-wheel]');
    const R = 100;
    const point = (deg, radius) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return [radius * Math.cos(rad), radius * Math.sin(rad)];
    };

    // 각 영역의 시작·가운데 각도 (12시 방향 0도, 시계 방향)
    const sliceAngles = () => {
        let start = 0;
        return blocks.map((block) => {
            const angles = { start, mid: start + block.deg / 2, end: start + block.deg };
            start += block.deg;
            return angles;
        });
    };

    const renderWheel = () => {
        const slices = sliceAngles().map(({ start, mid, end }, index) => {
            const block = blocks[index];
            const [x1, y1] = point(start, R);
            const [x2, y2] = point(end, R);
            const [lx, ly] = point(mid, R * 0.6);
            const [ox, oy] = point(mid, 6);
            const selected = index === state.selected;
            return `
                <g class="slice${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-slice="${index}"
                   aria-pressed="${selected}" aria-label="${block.name}, ${block.start}부터 ${block.end}까지"
                   style="transform:${selected ? `translate(${ox}px, ${oy}px)` : 'none'}">
                    <path d="M0 0L${x1} ${y1}A${R} ${R} 0 ${block.deg > 180 ? 1 : 0} 1 ${x2} ${y2}Z" fill="${block.color}"/>
                    <text x="${lx}" y="${ly}" fill="${block.ink || '#05080f'}" data-lx="${lx}" data-ly="${ly}">${block.name}</text>
                </g>`;
        }).join('');
        wheel.innerHTML = `
            <circle r="${R + 7}" fill="#fff"/>
            <g data-rotor>${slices}</g>
            <circle r="15" fill="#fff" stroke="#4f6bff" stroke-width="6" pointer-events="none"/>`;
        applyRotation();
    };

    // ---------- 생활계획표 회전 ----------
    // 평소엔 천천히 돌고(60초에 한 바퀴), 영역을 고르면 그 영역이 맨 위(▼)로 돌아와 잠시 멈춤
    const SPIN_DEG_PER_MS = 360 / 60000;
    const HOLD_MS = 4000;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rot = { angle: 0, target: null, holdUntil: 0, paused: false, last: 0, topIndex: -1 };
    const wheelNow = $('[data-wheel-now]');

    const topSliceIndex = () => {
        const at = (((-rot.angle) % 360) + 360) % 360;
        return Math.max(sliceAngles().findIndex(({ start, end }) => at >= start && at < end), 0);
    };

    function applyRotation() {
        const rotor = wheel.querySelector('[data-rotor]');
        if (!rotor) {
            return;
        }
        rotor.setAttribute('transform', `rotate(${rot.angle})`);
        // 글자는 반대로 돌려 항상 똑바로 보이게
        rotor.querySelectorAll('text').forEach((text) => {
            text.setAttribute('transform', `rotate(${-rot.angle} ${text.dataset.lx} ${text.dataset.ly})`);
        });
        const top = topSliceIndex();
        if (top !== rot.topIndex) {
            rot.topIndex = top;
            wheelNow.textContent = `지금 맨 위: ${blocks[top].name} · ${blocks[top].start}`;
        }
    }

    const rotateTo = (index) => {
        const goal = -sliceAngles()[index].mid;
        let delta = ((goal - rot.angle) % 360 + 540) % 360 - 180;
        if (prefersReducedMotion) {
            rot.angle += delta;
            applyRotation();
            return;
        }
        rot.target = rot.angle + delta;
        startSpin();
    };

    const spinFrame = (now) => {
        const dt = Math.min(now - (rot.last || now), 50);
        rot.last = now;
        if (rot.target !== null) {
            rot.angle += (rot.target - rot.angle) * 0.08;
            if (Math.abs(rot.target - rot.angle) < 0.1) {
                rot.angle = rot.target;
                rot.target = null;
                rot.holdUntil = now + HOLD_MS;
            }
        } else if (!rot.paused && now > rot.holdUntil) {
            rot.angle = (rot.angle + dt * SPIN_DEG_PER_MS) % 360;
        }
        applyRotation();
        requestAnimationFrame(spinFrame);
    };

    let spinning = false;
    function startSpin() {
        if (spinning || prefersReducedMotion) {
            return;
        }
        spinning = true;
        requestAnimationFrame(spinFrame);
    }

    // 마우스를 올리거나 키보드로 고르는 중에는 멈춤
    const wheelBox = $('[data-wheel-box]');
    wheelBox.addEventListener('pointerenter', () => {
        rot.paused = true;
    });
    wheelBox.addEventListener('pointerleave', () => {
        rot.paused = false;
    });
    wheelBox.addEventListener('focusin', () => {
        rot.paused = true;
    });
    wheelBox.addEventListener('focusout', () => {
        rot.paused = false;
    });

    wheel.addEventListener('click', (event) => {
        const slice = event.target.closest('[data-slice]');
        if (slice) {
            select(Number(slice.dataset.slice), `[data-slice="${slice.dataset.slice}"]`);
        }
    });
    wheel.addEventListener('keydown', (event) => {
        const slice = event.target.closest('[data-slice]');
        if (!slice) {
            return;
        }
        const index = Number(slice.dataset.slice);
        let next = null;
        if (event.key === 'Enter' || event.key === ' ') {
            next = index;
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            next = (index + 1) % blocks.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            next = (index - 1 + blocks.length) % blocks.length;
        }
        if (next !== null) {
            event.preventDefault();
            select(next, `[data-slice="${next}"]`);
        }
    });

    // ---------- 04 모든 루틴 ----------
    const renderList = () => {
        const done = doneSet();
        $('[data-routine-list]').innerHTML = blocks.flatMap((block, b) => block.tasks.map((task, i) => `
            <li>
                <span class="pl_swatch" style="--slice:${block.color}" aria-hidden="true"></span>
                <b>${task.title}<small>${block.name}${done.has(`${b}-${i}`) ? ' · ✅ 완료' : ''}</small></b>
                <span>${block.start} · ${task.minutes}MIN</span>
            </li>`)).join('') || '<li><b>아직 루틴이 없어요</b></li>';
    };

    // ---------- 영수증 요약 ----------
    const renderSummary = () => {
        const block = blocks[state.selected];
        const done = doneSet();
        const doneCount = block.tasks.filter((_, i) => done.has(`${state.selected}-${i}`)).length;
        const next = blocks[(state.selected + 1) % blocks.length];
        const d = state.date;
        $('[data-sum-name]').innerHTML = `${block.name}:<br>${block.desc || ''}`;
        $('[data-sum-date]').textContent = `${d.getMonth() + 1}월 ${pad(d.getDate())} · ${d.getFullYear()} · ${block.start}`;
        $('[data-sum-tasks]').textContent = `할 일 ${block.tasks.length}개 · 약 ${totalOf(block)}분`;
        $('[data-sum-bar]').style.setProperty('--value', `${block.tasks.length ? (doneCount / block.tasks.length) * 100 : 0}%`);
        $('[data-sum-progress]').textContent = `진행 ${doneCount}/${block.tasks.length}단계`;
        $('[data-sum-next]').textContent = `다음 시간대: ${next.name} · ${next.start}`;
    };

    // ---------- 날짜 표시 ----------
    const renderDate = () => {
        $('[data-date]').textContent = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(state.date);
        $('[data-today-badge]').hidden = dateKey(today) !== dateKey(state.date);
    };

    // ---------- 계획 추가 ----------
    const addDialog = $('[data-add-dialog]');
    const addForm = $('[data-add-form]');
    $('[data-add]').addEventListener('click', () => {
        $('[data-add-block]').innerHTML = blocks.map((block, i) => `<option value="${i}">${block.name} (${block.start} ~ ${block.end})</option>`).join('');
        addForm.reset();
        $('[data-add-block]').value = String(state.selected);
        addDialog.showModal();
    });
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
        select(index);
        renderList();
        toast(`${blocks[index].name}에 "${title}"을(를) 넣었어요`);
    });

    function renderAll() {
        renderDate();
        renderCalendars();
        renderSlots();
        renderSteps();
        renderWheel();
        renderList();
        renderSummary();
    }
    renderAll.list = renderList;
    // 처음엔 고른 시간대(숙제하기)가 맨 위에 오도록 맞춘 뒤 돌기 시작
    rot.angle = -sliceAngles()[state.selected].mid;
    rot.holdUntil = performance.now() + 1500;
    renderAll();
    startSpin();
});
