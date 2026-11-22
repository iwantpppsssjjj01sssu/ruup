document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-today-page]');
    if (!page) {
        return;
    }
    const $ = (selector) => page.querySelector(selector);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktopQuery = window.matchMedia('(min-width: 1025px)');

    // 오늘의 루틴 데이터 (status: done 완료 / active 진행 중 / todo 예정)
    // log: 오늘 기록 (시작 시각, 일시정지·시간 연장·도움 요청 횟수, 걸린 분)
    const routines = [
        { title: '아침 식사하기', icon: '🍚', minutes: 20, status: 'done', doneAt: '07:40', log: { start: '07:21', pauses: 0, extends: 0, helps: 0, spent: 19 } },
        { title: '등교 준비하기', icon: '🎒', minutes: 15, status: 'done', doneAt: '08:10', log: { start: '07:56', pauses: 0, extends: 0, helps: 0, spent: 14 } },
        { title: '받아쓰기 10문제 연습하기', icon: '✏️', minutes: 20, status: 'active', steps: 10, stepsDone: 7, unit: '문제', left: 16 * 60 + 58, log: { start: '16:03', pauses: 1, extends: 0, helps: 1 } },
        { title: '영어 단어 외우기', icon: '🔤', minutes: 15, status: 'todo', steps: 10, unit: '단어' },
        { title: '책 10분 읽기', icon: '📖', minutes: 10, status: 'todo' }
    ];

    // 보호자 리포트용 최근 기록 (예시 데이터, routines와 같은 순서)
    // week: 지난 6일 [걸린 분, ok 제시간 / late 늦게 / miss 못함], steps: 문제(단어)별 평균 걸린 분
    const REPORTS = [
        {
            week: [[22, 'ok'], [18, 'ok'], [25, 'late'], [19, 'ok'], [30, 'late'], [21, 'ok']],
            issues: [
                { level: 'warn', title: '식사 시간이 들쭉날쭉해요', detail: '대부분 20분 안팎이지만, 가장 오래 걸린 날은 30분이었어요. TV나 장난감이 보이는 자리에서 먹은 날 길어졌어요.', fix: '식탁 주변 물건을 치우고, 10분이 지나면 "반 왔어!" 하고 알려 주기' }
            ],
            good: ['6일 동안 하루도 빠짐없이 아침을 먹었어요', '6일 중 4일은 목표 시간 안에 끝냈어요']
        },
        {
            week: [[14, 'ok'], [13, 'ok'], [16, 'late'], [12, 'ok'], [15, 'ok'], [14, 'ok']],
            issues: [],
            good: ['6일 중 5일을 제시간에 끝냈어요', '준비물 체크를 스스로 해요', '평균 14분으로 목표보다 1분 빨라요']
        },
        {
            week: [[26, 'late'], [24, 'late'], [0, 'miss'], [28, 'late'], [19, 'ok'], [0, 'miss']],
            steps: [1.4, 1.5, 1.4, 1.7, 1.6, 1.9, 2.1, 3.6, 3.9, 3.3],
            issues: [
                { level: 'bad', title: '8번 문제부터 시간이 두 배로 늘어요', detail: '1~7번은 문제당 평균 1분 40초인데, 8~10번은 3분 30초가 넘게 걸려요. 이때 집중력이 크게 떨어져요.', fix: '7번까지 풀면 1분 쉬는 시간을 넣거나, 하루 목표를 7문제로 줄여 보세요' },
                { level: 'bad', title: '6일 중 2일은 시작하지 못했어요', detail: '두 날 모두 방과후 수업이 늦게 끝난 날이에요. 시작 시각이 밀리면 그대로 건너뛰게 돼요.', fix: '바쁜 날을 위한 "5문제 짧은 버전"을 미리 정해 두기' },
                { level: 'warn', title: '도움 요청 4번이 모두 겹받침 문제에서 나왔어요', detail: 'ㄺ, ㄼ 같은 겹받침 단어에서 자주 멈추고 도움을 요청해요.', fix: '시작 전에 오늘 나올 겹받침 단어를 한 번 소리 내어 읽어 주기' }
            ],
            good: ['시작은 항상 정해진 시간에 해요', '1~7번 문제는 빠르고 정확하게 풀어요']
        },
        {
            week: [[0, 'miss'], [16, 'late'], [14, 'ok'], [0, 'miss'], [15, 'ok'], [18, 'late']],
            steps: [1.2, 1.3, 1.1, 1.4, 1.2, 1.5, 1.3, 1.4, 1.6, 1.5],
            issues: [
                { level: 'warn', title: '받아쓰기가 길어진 날엔 영어 단어를 건너뛰어요', detail: '건너뛴 2일 모두 받아쓰기가 25분을 넘긴 날이에요. 앞 루틴의 피로가 그대로 이어지고 있어요.', fix: '받아쓰기 후 5분 쉬고 시작하거나, 영어 단어를 아침 시간으로 옮겨 보세요' },
                { level: 'warn', title: '외운 단어를 확인하는 단계가 없어요', detail: '외우기만 하고 끝나서, 다음 날 기억하는 단어가 절반 정도예요.', fix: '마지막 2분은 엄마·아빠와 퀴즈로 확인하기' }
            ],
            good: ['한 번 시작하면 끝까지 해요', '단어 하나에 1분 남짓, 속도가 고르게 유지돼요']
        },
        {
            week: [[10, 'ok'], [11, 'ok'], [0, 'miss'], [12, 'ok'], [10, 'ok'], [10, 'ok']],
            issues: [
                { level: 'warn', title: '피곤한 날엔 잠들기 전에 빠뜨려요', detail: '하루 건너뛴 날은 잠자리에 든 시간이 평소보다 40분 늦었어요.', fix: '읽기 시간을 저녁 식사 직후로 앞당겨 보세요' }
            ],
            good: ['6일 중 5일 목표 시간을 채웠어요', '스스로 책을 골라 읽어요']
        }
    ];

    const EXTEND_SECONDS = 5 * 60;
    const STATE_LABEL = { done: '완료', active: '진행 중', todo: '예정' };
    const CHEERS = [
        '천천히 해도 괜찮아요. 첫 걸음부터 시작해 봐요!',
        '좋아요, 하나 해냈어요! 다음 것도 할 수 있어요.',
        '벌써 2개나 해냈어요! 지금처럼 하나씩 하면 돼요.',
        '절반을 넘었어요! 정말 잘하고 있어요.',
        '거의 다 왔어요! 마지막 하나만 남았어요.',
        '오늘 루틴을 모두 해냈어요! 최고예요 🎉'
    ];

    const stage = $('[data-stage]');
    const strip = $('[data-view-cards]');
    const track = $('[data-track]');
    const timer = { paused: false, help: false, total: 0, intervalId: null };

    const pad = (number) => String(number).padStart(2, '0');
    const formatTime = (seconds) => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
    const clockNow = () => {
        const now = new Date();
        return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };
    const activeRoutine = () => routines.find((routine) => routine.status === 'active');
    const nextRoutine = () => routines.find((routine) => routine.status === 'todo');
    const announce = (text) => {
        $('[data-announce]').textContent = text;
    };

    $('[data-today-date]').textContent = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());

    // ---------- 모서리 정보 ----------
    const renderCorners = () => {
        const done = routines.filter((routine) => routine.status === 'done');
        const percent = Math.round((done.length / routines.length) * 100);
        const next = nextRoutine();
        $('[data-done-count]').textContent = done.length;
        $('[data-total-count]').textContent = routines.length;
        $('[data-progress-bar]').style.setProperty('--value', `${percent}%`);
        $('[data-progress]').setAttribute('aria-valuenow', percent);
        $('[data-cheer]').textContent = CHEERS[Math.min(done.length, CHEERS.length - 1)];
        $('[data-next]').textContent = next ? `${next.title} · 약 ${next.minutes}분` : '남은 할 일이 없어요';
        $('[data-done-summary]').textContent = done.length ? done.map((routine) => `${routine.title} ${routine.doneAt}`).join(' · ') : '아직 없어요';
        $('[data-counter-total]').textContent = pad(track.children.length);
    };

    // ---------- 카드 ----------
    const focusCardHTML = (routine, index) => `
        <li class="stage_card is-active" data-card="${index}" aria-current="step">
            <div class="card_top">
                <span class="card_no">${pad(index + 1)}</span>
                <span class="card_top_end">
                    <span class="card_state" data-focus-badge>진행 중</span>
                    <button type="button" class="card_go" data-go="${index}" aria-label="${routine.title} 리포트 보기"><span aria-hidden="true">→</span></button>
                </span>
            </div>
            <h2 class="card_title focus_title"><span aria-hidden="true">${routine.icon}</span> ${routine.title}</h2>
            <div class="focus_grid">
                <div class="focus_left">
                    <div class="focus_timer">
                        <svg class="focus_ring" viewBox="0 0 200 200" aria-hidden="true">
                            <defs><linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5cc8f7"/><stop offset="1" stop-color="#2fe0b5"/></linearGradient></defs>
                            <circle class="focus_ring_track" cx="100" cy="100" r="88"/>
                            <circle class="focus_ring_bar" cx="100" cy="100" r="88" pathLength="100" data-timer-ring/>
                        </svg>
                        <div class="focus_time">
                            <small>남은 시간</small>
                            <b role="timer" data-timer>${formatTime(routine.left)}</b>
                            <span class="focus_state" data-timer-state>진행 중</span>
                        </div>
                    </div>
                    <figure class="focus_buddy">
                        <img src="../img/common_character.svg" alt="LUUP 캐릭터" data-buddy>
                        <p class="focus_bubble" data-bubble></p>
                    </figure>
                </div>
                <div class="focus_right">
                    <div class="focus_help" data-help-banner${timer.help ? '' : ' hidden'}>
                        <span aria-hidden="true">🙋</span>
                        <p><b>도움을 요청했어요</b>곧 와 주실 거예요. 그동안 시계는 멈춰 있어요.</p>
                        <button type="button" class="btn btn_small btn_white" data-help-done>도움 받았어요</button>
                    </div>
                    ${routine.steps ? `
                    <div class="focus_steps">
                        <div class="focus_steps_head">
                            <p><b data-steps-done></b>${routine.unit} 완료</p>
                            <p class="is-left">남은 ${routine.unit} <b data-steps-left></b>개</p>
                        </div>
                        <ol class="focus_dots" data-dots></ol>
                        <p class="focus_hint">한 ${routine.unit}를 끝내면 반짝이는 동그라미를 눌러요</p>
                    </div>` : '<button type="button" class="btn btn_gradient focus_finish" data-finish>다 했어요! ✓</button>'}
                    <div class="focus_controls">
                        <button type="button" class="focus_control" data-action="pause"><span aria-hidden="true">⏸</span>일시정지</button>
                        <button type="button" class="focus_control" data-action="resume"><span aria-hidden="true">▶</span>다시 시작</button>
                        <button type="button" class="focus_control" data-action="extend"><span aria-hidden="true">⏱</span>시간 연장<small>+5분</small></button>
                        <button type="button" class="focus_control is-help" data-action="help"><span aria-hidden="true">🙋</span>도움 요청</button>
                    </div>
                </div>
            </div>
        </li>`;

    const cardHTML = (routine, index) => {
        if (routine.status === 'active') {
            return focusCardHTML(routine, index);
        }
        const isNext = routine === nextRoutine();
        const state = isNext ? '다음 할 일' : STATE_LABEL[routine.status];
        const meta = routine.status === 'done' ? `${routine.doneAt}에 끝냈어요` : `약 ${routine.minutes}분 걸려요`;
        // 호버하면 펼쳐지는 미리보기: 최근 6일 점 + 요약 + 살펴볼 점 한 줄
        const data = REPORTS[index];
        const past = data.week;
        const doneDays = past.filter(([, status]) => status !== 'miss').length;
        const doneMinutes = past.filter(([, status]) => status !== 'miss').map(([min]) => min);
        const average = Math.round(doneMinutes.reduce((sum, min) => sum + min, 0) / Math.max(doneMinutes.length, 1));
        const note = data.issues.length ? `살펴보기 · ${data.issues[0].title}` : `잘하고 있어요 · ${data.good[0]}`;
        const dots = past.map(([, status]) => `<i class="dot_${status}"></i>`).join('');
        return `
        <li class="stage_card is-${routine.status}${isNext ? ' is-next' : ''}" data-card="${index}">
            <div class="card_top"><span class="card_no">${pad(index + 1)}</span><span class="card_state">${state}</span></div>
            <div class="card_visual" aria-hidden="true"></div>
            <div class="card_preview" aria-hidden="true">
                <p class="preview_dots">${dots}<span>최근 6일</span></p>
                <p class="preview_sum">해낸 날 <b>${doneDays}/${past.length}일</b> · 평균 <b>${average}분</b></p>
                <p class="preview_note">${note}</p>
            </div>
            <p class="card_meta">${meta}</p>
            <div class="card_bottom">
                <h2 class="card_title">${routine.title}</h2>
                <button type="button" class="card_go" data-go="${index}" aria-label="${routine.title} 리포트 보기"><span aria-hidden="true">→</span></button>
            </div>
        </li>`;
    };

    const clearCardHTML = (index) => `
        <li class="stage_card is-clear" data-card="${index}">
            <img src="../img/common_character.svg" alt="" aria-hidden="true">
            <h2>오늘 루틴을 모두 끝냈어요! 🎉</h2>
            <p>한 걸음씩 해낸 오늘의 나, 정말 멋져요.</p>
        </li>`;

    const renderIndex = () => {
        $('[data-view-list]').innerHTML = routines.map((routine, index) => {
            const state = routine.status === 'done' ? `완료 ${routine.doneAt}` : routine.status === 'active' ? '진행 중' : `예정 · 약 ${routine.minutes}분`;
            return `<li class="is-${routine.status}"><button type="button" data-jump="${index}"><span class="index_no">${pad(index + 1)}</span><b>${routine.title}</b><span class="index_state">${state}</span></button></li>`;
        }).join('');
    };

    const renderCards = () => {
        const html = routines.map(cardHTML).join('');
        track.innerHTML = activeRoutine() ? html : html + clearCardHTML(routines.length);
        renderSteps();
        renderTimer();
        renderIndex();
        renderCorners();
    };

    // ---------- 진행 중 카드 갱신 ----------
    const bubbleText = (routine) => {
        if (timer.help) {
            return '도움을 요청했어요. 곧 와 주실 거예요!';
        }
        if (routine.left <= 0) {
            return '시간이 다 됐어요! 더 필요하면 시간 연장을 눌러요.';
        }
        if (timer.paused) {
            return '잠깐 쉬어도 괜찮아요. 준비되면 다시 시작!';
        }
        if (routine.steps) {
            const left = routine.steps - routine.stepsDone;
            return left === 1 ? `마지막 ${routine.unit}! 거의 다 왔어요!` : `${left}${routine.unit}만 더 하면 끝이에요!`;
        }
        return '천천히, 집중해서 해 봐요!';
    };

    const renderTimer = () => {
        const routine = activeRoutine();
        const card = track.querySelector('.is-active');
        if (!routine || !card) {
            return;
        }
        const timeUp = routine.left <= 0;
        const stopped = timer.paused || timer.help;
        card.querySelector('[data-timer]').textContent = formatTime(Math.max(routine.left, 0));
        card.querySelector('[data-timer-ring]').style.strokeDashoffset = 100 - (Math.max(routine.left, 0) / timer.total) * 100;
        card.querySelector('[data-timer-state]').textContent = timer.help ? '도움 기다리는 중' : timeUp ? '시간 끝' : timer.paused ? '잠깐 멈춤' : '진행 중';
        card.querySelector('[data-focus-badge]').textContent = stopped ? '잠깐 멈춤' : timeUp ? '시간 끝' : '진행 중';
        card.classList.toggle('is-paused', timer.paused);
        card.classList.toggle('is-help', timer.help);
        card.classList.toggle('is-timeup', timeUp && !timer.help);
        card.querySelector('[data-bubble]').textContent = bubbleText(routine);
        card.querySelector('[data-help-banner]').hidden = !timer.help;
        card.querySelector('[data-action="pause"]').disabled = stopped || timeUp;
        card.querySelector('[data-action="resume"]').disabled = !timer.paused || timer.help || timeUp;
        card.querySelector('[data-action="help"]').disabled = timer.help;
    };

    const renderSteps = () => {
        const routine = activeRoutine();
        const dots = track.querySelector('[data-dots]');
        if (!routine?.steps || !dots) {
            return;
        }
        track.querySelector('[data-steps-done]').textContent = routine.stepsDone;
        track.querySelector('[data-steps-left]').textContent = routine.steps - routine.stepsDone;
        dots.innerHTML = Array.from({ length: routine.steps }, (_, index) => {
            const isDone = index < routine.stepsDone;
            const isNext = index === routine.stepsDone;
            const isLast = index === routine.stepsDone - 1;
            const label = isNext ? `${index + 1}번 ${routine.unit} 완료하기` : isLast ? `${index + 1}번 ${routine.unit} 완료 취소하기` : `${index + 1}번 ${routine.unit}`;
            const classes = [isDone && 'is-done', isNext && 'is-next', isLast && 'is-last'].filter(Boolean).join(' ');
            return `<li><button type="button" class="${classes}" data-dot="${index}" aria-label="${label}" aria-pressed="${isDone}"${isNext || isLast ? '' : ' disabled'}>${isDone ? '✓' : index + 1}</button></li>`;
        }).join('');
    };

    const cheerBuddy = () => {
        const buddy = track.querySelector('[data-buddy]');
        if (!buddy) {
            return;
        }
        buddy.classList.remove('is-cheer');
        void buddy.offsetWidth;
        buddy.classList.add('is-cheer');
    };

    // ---------- 타이머 ----------
    const stopTicking = () => {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
    };

    const tick = () => {
        const routine = activeRoutine();
        if (!routine || timer.paused || timer.help) {
            return;
        }
        routine.left -= 1;
        if (routine.left <= 0) {
            routine.left = 0;
            stopTicking();
            announce('시간이 다 됐어요. 더 필요하면 시간 연장을 눌러요.');
        }
        renderTimer();
    };

    const startTicking = () => {
        stopTicking();
        timer.intervalId = setInterval(tick, 1000);
    };

    const completeRoutine = () => {
        const routine = activeRoutine();
        routine.status = 'done';
        routine.doneAt = clockNow();
        routine.log.spent = Math.max(Math.round((timer.total - Math.max(routine.left, 0)) / 60), 1);
        stopTicking();
        timer.paused = false;
        timer.help = false;
        const next = nextRoutine();
        if (next) {
            next.status = 'active';
            next.stepsDone = 0;
            next.left = next.minutes * 60;
            next.log = { start: clockNow(), pauses: 0, extends: 0, helps: 0 };
            timer.total = next.left;
            startTicking();
            announce(`${routine.title} 완료! 다음 루틴: ${next.title}`);
        } else {
            announce('오늘 루틴을 모두 끝냈어요!');
        }
        renderCards();
        cheerBuddy();
        centerOn(track.querySelector('.is-active, .is-clear'));
    };

    // ---------- 가로 스트립: 휠·드래그·키보드로 부드럽게 이동 ----------
    const scroll = { current: 0, target: 0, min: 0, max: 0, rafId: null, snapId: null };
    const isStrip = () => desktopQuery.matches && !stage.classList.contains('is-list');
    const cardCenter = (card) => card.offsetLeft + card.offsetWidth / 2 - stage.clientWidth / 2;
    const clamp = (value) => Math.min(Math.max(value, scroll.min), scroll.max);

    const measure = () => {
        const cards = track.children;
        scroll.min = cardCenter(cards[0]);
        scroll.max = cardCenter(cards[cards.length - 1]);
    };

    const nearestIndex = (position) => {
        let best = 0;
        [...track.children].forEach((card, index) => {
            if (Math.abs(cardCenter(card) - position) < Math.abs(cardCenter(track.children[best]) - position)) {
                best = index;
            }
        });
        return best;
    };

    // 카드를 안쪽으로 휜 큰 원통 위에 배치: 가운데 카드는 정면, 옆 카드는 바깥쪽 모서리가 앞으로 오도록 회전
    const CURVE_RADIUS = 1700;
    const MAX_ANGLE = 0.85;
    const floor = $('[data-floor]');

    const applyCurve = (velocity = 0) => {
        if (!isStrip()) {
            [...track.children].forEach((card) => {
                card.style.transform = '';
            });
            return;
        }
        const skew = prefersReducedMotion ? 0 : Math.max(Math.min(velocity * -0.01, 5), -5);
        [...track.children].forEach((card) => {
            const x = cardCenter(card) - scroll.current;
            const angle = Math.max(Math.min(x / CURVE_RADIUS, MAX_ANGLE), -MAX_ANGLE);
            const shiftX = CURVE_RADIUS * Math.sin(angle) - x;
            const shiftZ = CURVE_RADIUS * (1 - Math.cos(angle));
            card.style.transform = `translateX(${shiftX}px) translateZ(${shiftZ}px) rotateY(${-angle}rad) translateZ(var(--lift)) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) skewX(${skew}deg)`;
        });
        floor?.style.setProperty('--floor-x', `${-scroll.current * 0.6}px`);
    };

    const render = () => {
        const ease = prefersReducedMotion ? 1 : 0.09;
        scroll.current += (scroll.target - scroll.current) * ease;
        const velocity = scroll.target - scroll.current;
        track.style.transform = `translate3d(${-scroll.current}px, -50%, 0)`;
        applyCurve(velocity);
        $('[data-counter]').textContent = pad(nearestIndex(scroll.current) + 1);

        if (Math.abs(velocity) < 0.1) {
            scroll.current = scroll.target;
            track.style.transform = `translate3d(${-scroll.current}px, -50%, 0)`;
            applyCurve();
            scroll.rafId = null;
            return;
        }
        scroll.rafId = requestAnimationFrame(render);
    };

    const move = () => {
        if (!scroll.rafId) {
            scroll.rafId = requestAnimationFrame(render);
        }
    };

    const snap = () => {
        scroll.target = clamp(cardCenter(track.children[nearestIndex(scroll.target)]));
        move();
    };

    function centerOn(card, instant = false) {
        if (!card || !isStrip()) {
            return;
        }
        measure();
        scroll.target = clamp(cardCenter(card));
        if (instant) {
            scroll.current = scroll.target;
        }
        move();
    }

    // 휠: 세로 휠은 그대로 페이지 스크롤, 가로 휠(트랙패드 좌우)만 카드 이동
    stage.addEventListener('wheel', (event) => {
        if (!isStrip() || event.target.closest('dialog')) {
            return;
        }
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
            return;
        }
        const delta = event.deltaX;
        const atEnd = (delta > 0 && scroll.target >= scroll.max - 1) || (delta < 0 && scroll.target <= scroll.min + 1);
        if (atEnd) {
            return;
        }
        event.preventDefault();
        scroll.target = clamp(scroll.target + delta);
        move();
        clearTimeout(scroll.snapId);
        scroll.snapId = setTimeout(snap, 180);
    }, { passive: false });

    // 드래그: 버튼 위에서 시작하면 무시해서 클릭은 그대로 동작
    const drag = { active: false, moved: false, startX: 0, startTarget: 0 };
    strip.addEventListener('pointerdown', (event) => {
        if (!isStrip() || event.button !== 0 || event.target.closest('button')) {
            return;
        }
        drag.active = true;
        drag.moved = false;
        drag.startX = event.clientX;
        drag.startTarget = scroll.target;
    });
    window.addEventListener('pointermove', (event) => {
        if (!drag.active) {
            return;
        }
        const dx = event.clientX - drag.startX;
        if (!drag.moved && Math.abs(dx) > 6) {
            drag.moved = true;
            strip.classList.add('is-dragging');
        }
        if (drag.moved) {
            scroll.target = clamp(drag.startTarget - dx * 1.4);
            move();
        }
    });
    window.addEventListener('pointerup', () => {
        if (!drag.active) {
            return;
        }
        drag.active = false;
        strip.classList.remove('is-dragging');
        if (drag.moved) {
            snap();
        }
    });

    // 카드 호버: 커서 위치로 기울기(--tilt)와 유리 반사광 위치(--mx, --my) 갱신
    // 카드 호버 효과 끔 (기울기·반사광 없음)
    const canHover = false;
    const resetTilt = (card) => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
    };
    if (canHover) {
        track.addEventListener('pointermove', (event) => {
            const card = event.target.closest('.stage_card');
            if (!card || !isStrip() || drag.moved) {
                return;
            }
            const rect = card.getBoundingClientRect();
            const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
            const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
            // 진행 중 카드는 아이가 버튼을 누르는 곳이라 아주 살짝만
            const max = card.classList.contains('is-active') ? 2 : 9;
            card.style.setProperty('--mx', `${x * 100}%`);
            card.style.setProperty('--my', `${y * 100}%`);
            card.style.setProperty('--tilt-x', `${(0.5 - y) * max}deg`);
            card.style.setProperty('--tilt-y', `${(x - 0.5) * max}deg`);
        });
        track.addEventListener('pointerout', (event) => {
            const card = event.target.closest('.stage_card');
            if (card && !card.contains(event.relatedTarget)) {
                resetTilt(card);
            }
        });
    }

    // 카드 클릭: 옆 카드는 가운데로 데려오고, 가운데 카드(또는 → 버튼)는 리포트 열기
    track.addEventListener('click', (event) => {
        if (drag.moved) {
            drag.moved = false;
            return;
        }
        const card = event.target.closest('.stage_card');
        if (!card || card.classList.contains('is-clear')) {
            return;
        }
        const index = Number(card.dataset.card);
        if (event.target.closest('[data-go]')) {
            centerOn(card);
            openReport(index);
            return;
        }
        // 카드 안의 버튼(타이머·문제 동그라미 등)은 원래 동작만 하고, 그 밖의 곳을 누르면 바로 리포트
        if (event.target.closest('button')) {
            return;
        }
        centerOn(card);
        openReport(index);
    });
    track.addEventListener('focusin', (event) => centerOn(event.target.closest('.stage_card')));

    stage.addEventListener('keydown', (event) => {
        if (!isStrip() || !['ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.closest('.focus_dots')) {
            return;
        }
        const index = nearestIndex(scroll.target) + (event.key === 'ArrowRight' ? 1 : -1);
        const card = track.children[Math.min(Math.max(index, 0), track.children.length - 1)];
        event.preventDefault();
        centerOn(card);
    });

    window.addEventListener('resize', () => {
        applyCurve();
        centerOn(track.children[nearestIndex(scroll.target)], true);
    });

    // ---------- 보기 전환 (카드 / 목록) ----------
    const setView = (view) => {
        const isList = view === 'list';
        stage.classList.toggle('is-list', isList);
        $('[data-view-list]').hidden = !isList;
        page.querySelectorAll('[data-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    };

    page.querySelectorAll('[data-view]').forEach((button) => {
        button.addEventListener('click', () => setView(button.dataset.view));
    });

    $('[data-view-list]').addEventListener('click', (event) => {
        const jump = event.target.closest('[data-jump]');
        if (!jump) {
            return;
        }
        setView('cards');
        centerOn(track.children[Number(jump.dataset.jump)]);
    });

    // ---------- 진행 중 카드의 버튼들 ----------
    const helpDialog = $('[data-help-dialog]');
    const requestHelp = () => {
        timer.help = true;
        activeRoutine().log.helps += 1;
        announce('도움을 요청했어요. 곧 와 주실 거예요.');
        renderTimer();
    };

    const actions = {
        pause() {
            timer.paused = true;
            activeRoutine().log.pauses += 1;
            announce('타이머를 잠깐 멈췄어요.');
        },
        resume() {
            timer.paused = false;
            startTicking();
            announce('다시 시작했어요.');
        },
        extend() {
            const routine = activeRoutine();
            const wasTimeUp = routine.left <= 0;
            routine.log.extends += 1;
            routine.left = Math.max(routine.left, 0) + EXTEND_SECONDS;
            timer.total = Math.max(timer.total, routine.left);
            if (wasTimeUp && !timer.paused && !timer.help) {
                startTicking();
            }
            announce('시간을 5분 늘렸어요.');
        },
        help() {
            if (typeof helpDialog.showModal === 'function') {
                helpDialog.showModal();
            } else if (window.confirm('도움을 요청할까요?')) {
                requestHelp();
            }
        }
    };

    track.addEventListener('click', (event) => {
        const routine = activeRoutine();
        if (!routine) {
            return;
        }

        const action = event.target.closest('[data-action]');
        if (action && !action.disabled) {
            actions[action.dataset.action]();
            renderTimer();
            return;
        }

        if (event.target.closest('[data-finish]')) {
            completeRoutine();
            return;
        }

        if (event.target.closest('[data-help-done]')) {
            timer.help = false;
            announce('다시 시작했어요.');
            renderTimer();
            track.querySelector('[data-action="pause"]')?.focus();
            return;
        }

        // 문제 동그라미: 다음 칸을 누르면 완료, 마지막으로 완료한 칸을 누르면 취소
        const dot = event.target.closest('[data-dot]');
        if (!dot) {
            return;
        }
        const index = Number(dot.dataset.dot);
        if (index === routine.stepsDone) {
            routine.stepsDone += 1;
            if (routine.stepsDone === routine.steps) {
                completeRoutine();
                return;
            }
            cheerBuddy();
            announce(`${routine.stepsDone}${routine.unit} 완료. 남은 ${routine.unit} ${routine.steps - routine.stepsDone}개.`);
        } else if (index === routine.stepsDone - 1) {
            routine.stepsDone -= 1;
            announce(`${index + 1}번 ${routine.unit} 완료를 취소했어요.`);
        }
        renderSteps();
        renderTimer();
        renderIndex();
        track.querySelector(`[data-dot="${routine.stepsDone}"]`)?.focus({ preventScroll: true });
    });

    helpDialog.addEventListener('close', () => {
        if (helpDialog.returnValue === 'confirm') {
            requestHelp();
        }
        helpDialog.returnValue = '';
    });

    // ---------- 보호자 리포트 ----------
    const report = $('[data-report]');
    const reportTip = $('[data-report-tip]');
    const STATUS = {
        ok: { tone: 'good', icon: '✓', label: '제시간' },
        late: { tone: 'warn', icon: '!', label: '늦게 끝냄' },
        miss: { tone: 'bad', icon: '✕', label: '못 했어요' },
        live: { tone: 'none', icon: '▶', label: '하는 중' },
        todo: { tone: 'none', icon: '·', label: '예정' }
    };
    const VERDICT = {
        good: { icon: '✓', title: '잘 지키고 있어요', text: '지금처럼 해낸 날을 구체적으로 칭찬해 주세요.' },
        warn: { icon: '!', title: '조금 도와주세요', text: '아래 문제 중 하나만 골라 이번 주에 바꿔 보세요.' },
        bad: { icon: '✕', title: '도움이 필요해요', text: '양을 줄이거나 시간을 옮기는 등 루틴 자체를 조정해 보세요.' }
    };
    const LEVEL = { bad: '꼭 살펴보기', warn: '살펴보기' };
    const formatMinutes = (minutes) => {
        const seconds = Math.round(minutes * 60);
        return seconds % 60 ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초` : `${seconds / 60}분`;
    };

    // 지난 6일 + 오늘 = 7일
    const buildWeek = (routine, data) => {
        const dayName = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' });
        const today = new Date();
        const days = data.week.map(([min, status], index) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (data.week.length - index));
            return { day: dayName.format(date), min, status };
        });
        let todayItem = { min: 0, status: 'todo' };
        if (routine.status === 'done') {
            todayItem = { min: routine.log.spent, status: routine.log.spent <= routine.minutes ? 'ok' : 'late' };
        } else if (routine.status === 'active') {
            todayItem = { min: Math.round((timer.total - Math.max(routine.left, 0)) / 60), status: 'live' };
        }
        days.push({ day: '오늘', today: true, ...todayItem });
        return days;
    };

    const tipAttrs = (text) => `tabindex="0" data-tip="${text}" aria-label="${text}"`;

    const renderReport = (index) => {
        const routine = routines[index];
        const data = REPORTS[index];
        const past = data.week;
        const okDays = past.filter(([, status]) => status === 'ok').length;
        const lateDays = past.filter(([, status]) => status === 'late').length;
        const doneDays = okDays + lateDays;
        const doneMinutes = past.filter(([, status]) => status !== 'miss').map(([min]) => min);
        const average = Math.round(doneMinutes.reduce((sum, min) => sum + min, 0) / Math.max(doneMinutes.length, 1));
        const score = (okDays + lateDays * 0.5) / past.length;
        const verdictKey = score >= 0.75 ? 'good' : score >= 0.5 ? 'warn' : 'bad';
        const verdict = VERDICT[verdictKey];
        let streak = 0;
        for (let i = past.length - 1; i >= 0 && past[i][1] !== 'miss'; i -= 1) {
            streak += 1;
        }

        $('[data-report-title]').textContent = routine.title;
        $('[data-report-lead]').textContent = `최근 ${past.length}일 중 ${doneDays}일 해냈고, 그중 ${okDays}일은 목표 시간(${routine.minutes}분) 안에 끝냈어요. `
            + (data.issues.length ? `가장 먼저 살펴볼 점은 “${data.issues[0].title}”예요.` : '눈에 띄는 문제 없이 잘 이어가고 있어요.');
        $('[data-report-chips]').innerHTML = `
            <button type="button" class="report_jump" data-report-jump aria-label="문제와 해결 방법 보기"><span aria-hidden="true">↓</span></button>
            <span class="report_chip"><small>해낸 날</small><b>${doneDays}<em>/${past.length}일</em></b></span>
            <span class="report_chip"><small>평균 시간</small><b>${average}<em>분</em></b></span>
            <span class="report_chip"><small>연속</small><b>${streak}<em>일</em></b></span>`;
        const verdictBox = $('[data-report-verdict]');
        verdictBox.className = `report_verdict tone_${verdictKey}`;
        verdictBox.innerHTML = `<span aria-hidden="true">${verdict.icon}</span><p><b>${verdict.title}</b>${verdict.text}</p>`;

        // 1) 7일 기록: 상태 줄 + 걸린 시간 막대 (목표선)
        const week = buildWeek(routine, data);
        const max = Math.max(routine.minutes * 1.6, ...week.map((day) => day.min));
        const weekRow = week.map((day) => {
            const status = STATUS[day.status];
            return `<li class="tone_${status.tone}${day.today ? ' is-today' : ''}"><b>${day.day}</b><i aria-hidden="true">${status.icon}</i>${status.label}</li>`;
        }).join('');
        const weekBars = week.map((day) => {
            const status = STATUS[day.status];
            const minutesText = day.min ? `${day.min}분` : '기록 없음';
            const tip = `${day.day} · ${minutesText} · ${status.label}`;
            const color = day.status === 'late' ? 'var(--warn)' : day.status === 'ok' ? 'var(--good)' : 'var(--luup-primary)';
            const bar = day.min ? `<span class="bar" style="--h:${(day.min / max) * 100}%;--bar:${color}"></span>` : '';
            const mark = day.status === 'miss' ? '<span class="bar_mark" aria-hidden="true">✕</span>' : '';
            return `<div class="bar_col${day.status === 'live' ? ' is-live' : ''}" ${tipAttrs(tip)}>${bar}${mark}</div>`;
        }).join('');

        // 3) 문제(단어)별 걸린 시간: 보통보다 1.5배 이상 느린 칸을 표시
        let stepPanel = '';
        if (data.steps) {
            const sorted = [...data.steps].sort((a, b) => a - b);
            const median = (sorted[4] + sorted[5]) / 2;
            const stepMax = Math.max(...data.steps) * 1.15;
            const stepBars = data.steps.map((minutes, i) => {
                const slow = minutes >= median * 1.5;
                const height = (minutes / stepMax) * 100;
                const tip = `${i + 1}번 ${routine.unit} · ${formatMinutes(minutes)}${slow ? ' · 느려요' : ''}`;
                return `<div class="bar_col" ${tipAttrs(tip)}><span class="bar" style="--h:${height}%;${slow ? '--bar:var(--warn)' : ''}"></span>${slow ? `<span class="bar_label" style="--h:${height}%">느려요</span>` : ''}</div>`;
            }).join('');
            stepPanel = `
                <section class="report_panel">
                    <h3>${routine.unit}별 걸린 시간 <small>이번 주 평균 · 보통 ${formatMinutes(median)}</small></h3>
                    <div class="bar_chart" style="--bars:${data.steps.length}">${stepBars}</div>
                    <div class="bar_axis" style="--bars:${data.steps.length}" aria-hidden="true">${data.steps.map((_, i) => `<span>${i + 1}</span>`).join('')}</div>
                </section>`;
        }

        const issues = data.issues.length
            ? `<ul class="issue_list">${data.issues.map((issue) => `
                <li class="tone_${issue.level}">
                    <span class="issue_badge"><span aria-hidden="true">${issue.level === 'bad' ? '✕' : '!'}</span>${LEVEL[issue.level]}</span>
                    <b>${issue.title}</b>
                    <p>${issue.detail}</p>
                    <p class="issue_fix">${issue.fix}</p>
                </li>`).join('')}</ul>`
            : '<p class="issue_empty">🎉 이번 주에는 눈에 띄는 문제가 없어요.</p>';

        const log = routine.log;
        const todayPanel = log
            ? `<dl class="today_log">
                <div><dt>시작</dt><dd>${log.start}</dd></div>
                <div><dt>일시정지</dt><dd>${log.pauses}회</dd></div>
                <div><dt>시간 연장</dt><dd>${log.extends}회</dd></div>
                <div><dt>도움 요청</dt><dd>${log.helps}회</dd></div>
            </dl>`
            : '<p class="issue_empty" style="background:#f1f4f8">아직 시작 전이에요.</p>';

        // 첫 화면: 프로젝트 스크린샷처럼 루틴을 크게 보여주는 대표 이미지
        const heroDots = week.map((day) => `<li class="tone_${STATUS[day.status].tone}${day.today ? ' is-today' : ''}"><i aria-hidden="true">${STATUS[day.status].icon}</i><span>${day.day}</span></li>`).join('');
        const hero = `
            <section class="report_panel report_hero tone_${verdictKey}" aria-label="${routine.title} 한눈에 보기">
                <p class="hero_tag">LUUP · ${routine.title}</p>
                <div class="hero_body">
                    <div class="hero_info">
                        <p class="hero_score"><span>최근 ${past.length}일 중 해낸 날</span><b>${doneDays}<small>/${past.length}일</small></b></p>
                        <p class="hero_pill"><i aria-hidden="true">${verdict.icon}</i>${verdict.title}</p>
                    </div>
                    <div class="hero_stage" aria-hidden="true">
                        <img class="hero_buddy" src="../img/common_character.svg" alt="">
                    </div>
                </div>
                <div class="hero_glass">
                    <ul class="hero_week" aria-label="최근 7일 상태">${heroDots}</ul>
                </div>
            </section>`;

        $('[data-report-panels]').innerHTML = `
            ${hero}
            <section class="report_panel">
                <h3>최근 7일 기록 <small>막대 = 걸린 시간 · 점선 = 목표</small></h3>
                <ul class="week_row">${weekRow}</ul>
                <div class="bar_chart" style="--bars:7">
                    <span class="goal" style="--goal:${(routine.minutes / max) * 100}%"><span>목표 ${routine.minutes}분</span></span>
                    ${weekBars}
                </div>
                <div class="bar_axis" style="--bars:7" aria-hidden="true">${week.map((day) => `<span>${day.day}</span>`).join('')}</div>
            </section>
            <section class="report_panel" data-report-issues>
                <h3>무엇이 문제일까요? <small>${data.issues.length}가지</small></h3>
                ${issues}
            </section>
            ${stepPanel}
            <section class="report_panel">
                <h3>오늘 기록 <small>${routine.status === 'done' ? `${routine.doneAt} 완료` : STATE_LABEL[routine.status]}</small></h3>
                ${todayPanel}
            </section>
            <section class="report_panel">
                <h3>잘하고 있는 점</h3>
                <ul class="good_list">${data.good.map((text) => `<li>${text}</li>`).join('')}</ul>
            </section>`;
        $('[data-report-panels]').scrollTop = 0;
    };

    // 카드 → 패널 확대: 패널을 누른 카드 영역만큼 잘라 두었다가(clip-path) 전체로 펼침
    const ZOOM = 'clip-path 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
    let reportCloseId = null;
    let reportCard = null;

    const cardClip = (card) => {
        const box = report.getBoundingClientRect();
        const rect = card?.getBoundingClientRect();
        if (!rect || !rect.width) {
            return 'inset(45% 45% 45% 45% round 28px)';
        }
        const top = Math.max(rect.top - box.top, 0);
        const left = Math.max(rect.left - box.left, 0);
        const right = Math.max(box.right - rect.right, 0);
        const bottom = Math.max(box.bottom - rect.bottom, 0);
        return `inset(${top}px ${right}px ${bottom}px ${left}px round 28px)`;
    };

    function openReport(index) {
        if (!REPORTS[index] || typeof report.showModal !== 'function') {
            return;
        }
        clearTimeout(reportCloseId);
        reportCard = index;
        const card = track.querySelector(`[data-card="${index}"]`);
        renderReport(index);
        const wasOpen = report.open;
        if (!wasOpen) {
            report.showModal();
        }
        // 닫혀 있는 동안에는 스크롤 위치가 적용되지 않으므로 연 뒤에 맨 위로
        $('[data-report-panels]').scrollTop = 0;
        report.querySelector('.report_summary').scrollTop = 0;
        updateReportProgress();

        if (prefersReducedMotion || wasOpen) {
            report.style.transition = '';
            report.style.clipPath = 'inset(0 round 30px)';
            report.classList.add('is-in');
            return;
        }
        report.style.transition = 'none';
        report.style.clipPath = cardClip(card);
        void report.offsetWidth;
        report.style.transition = ZOOM;
        report.style.clipPath = 'inset(0 round 30px)';
        report.classList.add('is-in');
    }

    const closeReport = () => {
        report.classList.remove('is-in');
        reportTip.hidden = true;
        if (prefersReducedMotion) {
            report.close();
            return;
        }
        // 닫을 때는 반대로, 지금 그 카드가 있는 자리로 줄어듦
        report.style.transition = ZOOM;
        report.style.clipPath = cardClip(track.querySelector(`[data-card="${reportCard}"]`));
        reportCloseId = setTimeout(() => report.close(), 750);
    };

    $('[data-report-close]').addEventListener('click', closeReport);
    report.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeReport();
    });
    report.addEventListener('click', (event) => {
        if (event.target === report) {
            closeReport();
        }
        if (event.target.closest('[data-report-jump]')) {
            $('[data-report-issues]').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
    });

    // 막대 툴팁 (마우스·키보드 모두)
    const showTip = (event) => {
        const target = event.target.closest?.('[data-tip]');
        if (!target) {
            return;
        }
        const rect = target.querySelector('.bar, .bar_mark')?.getBoundingClientRect() || target.getBoundingClientRect();
        reportTip.textContent = target.dataset.tip;
        reportTip.style.left = `${rect.left + rect.width / 2}px`;
        reportTip.style.top = `${rect.top}px`;
        reportTip.hidden = false;
    };
    const hideTip = (event) => {
        if (event.target.closest?.('[data-tip]')) {
            reportTip.hidden = true;
        }
    };
    report.addEventListener('pointerover', showTip);
    report.addEventListener('pointerout', hideTip);
    report.addEventListener('focusin', showTip);
    report.addEventListener('focusout', hideTip);
    // 왼쪽 아래 작은 원: 오른쪽 내용을 얼마나 내려 봤는지 표시
    const reportPanels = $('[data-report-panels]');
    const updateReportProgress = () => {
        const scrollable = reportPanels.scrollHeight - reportPanels.clientHeight;
        const ratio = scrollable > 0 ? reportPanels.scrollTop / scrollable : 1;
        $('[data-report-progress]').style.strokeDashoffset = 100 - ratio * 100;
    };
    reportPanels.addEventListener('scroll', () => {
        reportTip.hidden = true;
        updateReportProgress();
    }, { passive: true });

    // ---------- 시작 ----------
    const current = activeRoutine();
    if (current) {
        timer.total = current.minutes * 60;
        startTicking();
    }
    renderCards();
    centerOn(track.querySelector('.is-active'), true);
    // 웹폰트가 늦게 적용되면 카드 폭이 바뀌므로 한 번 더 맞춤
    window.addEventListener('load', () => centerOn(track.querySelector('.is-active, .is-clear'), true));

    // 로딩 화면(막대 3개)은 없앰 → 바로 화면이 보임
    // 마이페이지의 "리포트 보기"로 들어오면 진행 중인 루틴 리포트를 바로 열기
    if (location.hash === '#report') {
        const target = Math.max(routines.findIndex((routine) => routine.status === 'active'), 0);
        setTimeout(() => openReport(target), prefersReducedMotion ? 0 : 400);
    }
});
