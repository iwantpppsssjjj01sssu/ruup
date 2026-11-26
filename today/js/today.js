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
        { title: '아침 식사하기', at: '07:20', icon: '🍚', minutes: 20, status: 'done', doneAt: '07:40', log: { start: '07:21', pauses: 0, extends: 0, helps: 0, spent: 19 } },
        { title: '등교 준비하기', at: '07:55', icon: '🎒', minutes: 15, status: 'done', doneAt: '08:10', log: { start: '07:56', pauses: 0, extends: 0, helps: 0, spent: 14 } },
        { title: '받아쓰기 10문제 연습하기', at: '16:00', icon: '✏️', minutes: 20, status: 'active', steps: 10, stepsDone: 7, unit: '문제', left: 16 * 60 + 58, log: { start: '16:03', pauses: 1, extends: 0, helps: 1 } },
        { title: '영어 단어 외우기', at: '17:00', icon: '🔤', minutes: 15, status: 'todo', steps: 10, unit: '단어' },
        { title: '책 10분 읽기', at: '20:30', icon: '📖', minutes: 10, status: 'todo' }
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
        $('[data-step-count]').textContent = routines.length;
        $('[data-progress]').setAttribute('aria-valuenow', percent);
        // 진행 막대: 루틴마다 한 칸씩 (끝냄 = 꽉 참, 하는 중 = 진행만큼, 예정 = 빈 칸)
        // 칸이 왼쪽부터 차례로 차오르는 움직임을 일정 간격으로 반복
        const bar = $('[data-progress]');
        bar.classList.add('seg_bar');
        bar.innerHTML = routines.map((routine, i) => {
            const fill = routine.status === 'done' ? 1
                : routine.status === 'active' ? (routine.steps ? routine.stepsDone / routine.steps : 0.5) : 0;
            return `<span class="seg is-${routine.status}" style="--i:${i};--fill:${fill}"><i></i></span>`;
        }).join('');
        $('[data-counter-total]').textContent = pad(track.children.length);
    };

    // ---------- 카드 ----------
    const focusCardHTML = (routine, index) => `
        <li class="stage_card is-active" data-card="${index}" aria-current="step">
            <div class="card_top">
                <span class="card_no">${pad(index + 1)}<small> · ${routine.at}</small></span>
                <span class="card_top_end">
                    <span class="card_state" data-focus-badge>진행 중</span>
                    <button type="button" class="card_go" data-go="${index}" aria-label="${routine.title} 리포트 보기"><span aria-hidden="true">→</span></button>
                </span>
            </div>
            <h2 class="card_title focus_title">${splitTitle(routine.title)}</h2>
            <p class="card_meta focus_meta">${routine.steps ? `${routine.steps}${routine.unit} 중 ${routine.stepsDone}${routine.unit} 했어요` : '지금 하고 있어요'}</p>
            <div class="card_visual focus_art" aria-hidden="true">${cardArt(index)}</div>
            <div class="card_bottom focus_more">
                <button type="button" class="card_go" data-go="${index}" aria-label="${routine.title} 리포트 보기"><i aria-hidden="true">↗</i><span aria-hidden="true">리포트 보기</span></button>
            </div>
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
                        <svg class="focus_help_icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10V4a1.5 1.5 0 0 1 3 0v6"/><path d="M14 10V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.2a6 6 0 0 1-4.6-2.2L4.3 15.4a1.6 1.6 0 0 1 2.5-2L8 15"/></svg>
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
                        <button type="button" class="focus_control" data-action="pause"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>일시정지</button>
                        <button type="button" class="focus_control" data-action="resume"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z"/></svg>다시 시작</button>
                        <button type="button" class="focus_control" data-action="extend"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M10 3h4"/></svg>시간 연장<small>+5분</small></button>
                        <button type="button" class="focus_control is-help" data-action="help"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10V4a1.5 1.5 0 0 1 3 0v6"/><path d="M14 10V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.2a6 6 0 0 1-4.6-2.2L4.3 15.4a1.6 1.6 0 0 1 2.5-2L8 15"/></svg>도움 요청</button>
                    </div>
                </div>
            </div>
        </li>`;


    // 카드 그림: 루틴마다 입체감 있는 물건 하나 (밥그릇 · 가방 · 연필 · 단어 블록 · 책)
    const CARD_ART = [
        `<svg viewBox="0 0 200 200"><defs>
            <linearGradient id="ca-bowl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd8ee"/></linearGradient>
            <linearGradient id="ca-bowl-band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#2f5fe0"/></linearGradient>
            <radialGradient id="ca-rice" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9edf5"/></radialGradient>
        </defs>
            <ellipse cx="100" cy="176" rx="62" ry="9" fill="#0b1a3a" opacity=".12"/>
            <path d="M52 50 L132 96" stroke="#c9894a" stroke-width="7" stroke-linecap="round"/>
            <path d="M64 42 L140 92" stroke="#e0a565" stroke-width="7" stroke-linecap="round"/>
            <path d="M40 100 Q100 92 160 100 Q160 160 100 166 Q40 160 40 100Z" fill="url(#ca-bowl)"/>
            <path d="M44 122 Q100 132 156 122 L152 134 Q100 144 48 134Z" fill="url(#ca-bowl-band)"/>
            <ellipse cx="100" cy="100" rx="60" ry="14" fill="#dfe5f2"/>
            <path d="M46 100 Q60 70 100 68 Q140 70 154 100 Q100 112 46 100Z" fill="url(#ca-rice)"/>
            <circle cx="84" cy="84" r="3" fill="#fff"/><circle cx="110" cy="80" r="3" fill="#fff"/><circle cx="124" cy="90" r="2.5" fill="#fff"/>
            <path d="M58 112 Q62 140 82 152" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/>
        </svg>`,
        `<svg viewBox="0 0 200 200"><defs>
            <linearGradient id="ca-bag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb36b"/><stop offset="1" stop-color="#f26b3a"/></linearGradient>
            <linearGradient id="ca-pocket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffaa3b"/></linearGradient>
        </defs>
            <ellipse cx="100" cy="180" rx="58" ry="8" fill="#0b1a3a" opacity=".12"/>
            <path d="M76 52 Q76 28 100 28 Q124 28 124 52" stroke="#b8481f" stroke-width="9" fill="none" stroke-linecap="round"/>
            <rect x="46" y="48" width="108" height="128" rx="34" fill="url(#ca-bag)"/>
            <path d="M58 60 Q60 52 72 52" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>
            <rect x="62" y="104" width="76" height="58" rx="18" fill="url(#ca-pocket)"/>
            <path d="M62 120 H138" stroke="#e58a22" stroke-width="3"/>
            <rect x="94" y="114" width="12" height="14" rx="4" fill="#5b8cff"/>
            <path d="M58 84 Q100 96 142 84" stroke="#d9562a" stroke-width="3" fill="none"/>
        </svg>`,
        `<svg viewBox="0 0 200 200"><defs>
            <linearGradient id="ca-pen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#f2a516"/></linearGradient>
            <linearGradient id="ca-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe7f7"/></linearGradient>
        </defs>
            <ellipse cx="100" cy="182" rx="64" ry="8" fill="#0b1a3a" opacity=".12"/>
            <g transform="rotate(-8 100 110)">
                <rect x="40" y="52" width="110" height="124" rx="12" fill="url(#ca-paper)"/>
                <path d="M56 84 H134 M56 104 H134 M56 124 H120 M56 144 H110" stroke="#b9c7ea" stroke-width="3" stroke-linecap="round"/>
                <path d="M58 82 l6 6 l12 -14" stroke="#3fd8b0" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <g transform="rotate(38 130 90)">
                <rect x="118" y="20" width="26" height="112" rx="4" fill="url(#ca-pen)"/>
                <rect x="118" y="14" width="26" height="16" rx="5" fill="#ff8fb8"/>
                <rect x="118" y="28" width="26" height="6" fill="#c9d2e6"/>
                <path d="M118 132 L131 160 L144 132Z" fill="#f6d7a8"/>
                <path d="M127 152 L131 160 L135 152Z" fill="#33384a"/>
                <path d="M124 40 V124" stroke="#fff" stroke-width="3" opacity=".6"/>
            </g>
        </svg>`,
        `<svg viewBox="0 0 200 200"><defs>
            <linearGradient id="ca-blk1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset="1" stop-color="#4a74f0"/></linearGradient>
            <linearGradient id="ca-blk2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9fc8"/><stop offset="1" stop-color="#f0609c"/></linearGradient>
            <linearGradient id="ca-blk3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ff0d0"/><stop offset="1" stop-color="#22b892"/></linearGradient>
        </defs>
            <ellipse cx="100" cy="182" rx="70" ry="8" fill="#0b1a3a" opacity=".12"/>
            <g transform="rotate(-6 70 140)"><rect x="34" y="108" width="68" height="68" rx="16" fill="url(#ca-blk1)"/><text x="68" y="157" text-anchor="middle" font-family="Paperlogy, sans-serif" font-weight="700" font-size="40" fill="#fff">A</text></g>
            <g transform="rotate(5 132 142)"><rect x="98" y="110" width="68" height="68" rx="16" fill="url(#ca-blk2)"/><text x="132" y="159" text-anchor="middle" font-family="Paperlogy, sans-serif" font-weight="700" font-size="40" fill="#fff">B</text></g>
            <g transform="rotate(-10 100 76)"><rect x="66" y="42" width="68" height="68" rx="16" fill="url(#ca-blk3)"/><text x="100" y="91" text-anchor="middle" font-family="Paperlogy, sans-serif" font-weight="700" font-size="40" fill="#fff">C</text></g>
            <path d="M44 120 Q46 114 54 114" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>
            <path d="M76 54 Q78 48 86 48" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>
        </svg>`,
        `<svg viewBox="0 0 200 200"><defs>
            <linearGradient id="ca-cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b79bff"/><stop offset="1" stop-color="#7a52f0"/></linearGradient>
            <linearGradient id="ca-page" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6e9f5"/></linearGradient>
        </defs>
            <ellipse cx="100" cy="176" rx="74" ry="9" fill="#0b1a3a" opacity=".12"/>
            <path d="M22 70 Q60 58 100 76 Q140 58 178 70 V160 Q140 148 100 166 Q60 148 22 160Z" fill="url(#ca-cover)"/>
            <path d="M30 62 Q64 50 100 68 V154 Q64 138 30 150Z" fill="url(#ca-page)"/>
            <path d="M170 62 Q136 50 100 68 V154 Q136 138 170 150Z" fill="url(#ca-page)"/>
            <path d="M100 68 V154" stroke="#c9cfe3" stroke-width="2"/>
            <path d="M44 80 Q66 72 88 82 M44 96 Q66 88 88 98 M44 112 Q66 104 88 114" stroke="#c4cbe4" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M112 82 Q134 72 156 80 M112 98 Q134 88 156 96 M112 114 Q134 104 156 112" stroke="#c4cbe4" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M128 66 V40 l10 8 l10 -8 V62" fill="#ff8fb8"/>
            <circle cx="60" cy="34" r="5" fill="#ffc94a"/><circle cx="150" cy="24" r="3.5" fill="#ffc94a"/><circle cx="40" cy="48" r="3" fill="#fff"/>
        </svg>`
    ];
    // 카드 제목 두 줄: 앞부분은 진하게, 마지막 낱말은 연하게 (예: 아침 / 식사하기)
    const splitTitle = (title) => {
        const cut = title.lastIndexOf(' ');
        return cut < 0 ? `<b>${title}</b>` : `<b>${title.slice(0, cut)}</b><span>${title.slice(cut + 1)}</span>`;
    };
    const cardArt = (index) => `<div class="card_art">${CARD_ART[index % CARD_ART.length]}</div>`;

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
            <div class="card_top"><span class="card_no">${pad(index + 1)}<small> · ${routine.at}</small></span><span class="card_state">${state}</span></div>
            <h2 class="card_title">${splitTitle(routine.title)}</h2>
            <p class="card_meta">${meta}</p>
            <div class="card_visual" aria-hidden="true">${cardArt(index)}</div>
            <div class="card_preview" aria-hidden="true">
                <p class="preview_dots">${dots}<span>최근 6일</span></p>
                <p class="preview_sum">해낸 날 <b>${doneDays}/${past.length}일</b> · 평균 <b>${average}분</b></p>
                <p class="preview_note">${note}</p>
            </div>
            <div class="card_bottom">
                <button type="button" class="card_go" data-go="${index}" aria-label="${routine.title} 리포트 보기"><i aria-hidden="true">↗</i><span aria-hidden="true">리포트 보기</span></button>
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

    const openSection = (key) => {
        $('[data-report-panels]').querySelectorAll('.rp_item').forEach((item) => {
            const open = item.dataset.acc === key;
            item.classList.toggle('is-open', open);
            item.querySelector('.rp_tab').setAttribute('aria-expanded', String(open));
        });
    };
    $('[data-report-panels]').addEventListener('click', (event) => {
        const tab = event.target.closest('[data-acc-open]');
        if (tab) {
            openSection(tab.dataset.accOpen);
        }
    });

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
            // 문제별 시간 소견: 느려지는 구간 · 앞뒤 평균 비교 · 가장 빠른/느린 문제 · 권고
            const steps = data.steps;
            const slowIdx = steps.map((m, i) => (m >= median * 1.5 ? i : -1)).filter((i) => i >= 0);
            const firstSlow = slowIdx[0];
            const avgOf = (list) => list.reduce((sum, m) => sum + m, 0) / Math.max(list.length, 1);
            const before = firstSlow > 0 ? avgOf(steps.slice(0, firstSlow)) : avgOf(steps);
            const after = slowIdx.length ? avgOf(slowIdx.map((i) => steps[i])) : 0;
            const fastI = steps.indexOf(Math.min(...steps));
            const slowI = steps.indexOf(Math.max(...steps));
            const total = steps.reduce((sum, m) => sum + m, 0);
            const stepOpinion = `
                    <div class="step_opinion">
                        <p class="step_op_label">LUUP 소견</p>
                        <p>${routine.unit} ${steps.length}개를 푸는 데 평균 <b>${formatMinutes(total)}</b>이 걸렸으며, 한 ${routine.unit}당 보통 <b>${formatMinutes(median)}</b> 정도가 소요되었습니다. 가장 빨리 끝낸 것은 <b>${fastI + 1}번(${formatMinutes(steps[fastI])})</b>, 가장 오래 걸린 것은 <b>${slowI + 1}번(${formatMinutes(steps[slowI])})</b>입니다.</p>
                        ${slowIdx.length
                            ? `<p><b>${firstSlow + 1}번 ${routine.unit}부터</b> 소요 시간이 뚜렷하게 늘어나는 경향을 보였습니다. 앞부분은 평균 ${formatMinutes(before)}였으나, 느려진 ${slowIdx.length}개는 평균 ${formatMinutes(after)}로 약 <b>${(after / before).toFixed(1)}배</b> 길어졌습니다. 후반부로 갈수록 집중력이 떨어지는 것으로 판단됩니다.</p>
                               <p>따라서 ${firstSlow}번까지 마친 뒤 <b>1분 정도 짧게 쉬는 시간</b>을 두거나, 어려운 ${routine.unit}를 앞쪽에 배치해 집중력이 높을 때 해결하도록 하는 것을 권장합니다.</p>`
                            : `<p>모든 ${routine.unit}에서 비슷한 속도를 유지하여 <b>집중력이 끝까지 안정적</b>인 것으로 보입니다. 지금의 방식을 유지하시길 권장합니다.</p>`}
                    </div>`;
            stepPanel = `
                <section class="report_panel">
                    <h3>${routine.unit}별 걸린 시간 <small>이번 주 평균 · 보통 ${formatMinutes(median)}</small></h3>
                    <div class="bar_chart" style="--bars:${data.steps.length}">${stepBars}</div>
                    <div class="bar_axis" style="--bars:${data.steps.length}" aria-hidden="true">${data.steps.map((_, i) => `<span>${i + 1}</span>`).join('')}</div>
                    ${stepOpinion}
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

        // 오른쪽: 세로로 길쭉한 알약들 = 리포트 항목들 (요약 · 최근 7일 · 문제점 · 문제별 시간 · 오늘 · 잘한 점)
        // 하나만 크게 펼쳐지고, 다른 알약을 누르면 그 항목이 펼쳐짐
        // 해요체 → 합니다체 (소견서 말투로)
        const formal = (text) => text
            .replace(/이에요/g, '입니다').replace(/예요/g, '입니다')
            .replace(/했어요/g, '했습니다').replace(/였어요/g, '였습니다').replace(/졌어요/g, '졌습니다')
            .replace(/었어요/g, '었습니다').replace(/았어요/g, '았습니다').replace(/겼어요/g, '겼습니다')
            .replace(/돼요/g, '됩니다').replace(/해요/g, '합니다').replace(/져요/g, '집니다')
            .replace(/려요/g, '립니다').replace(/늘어요/g, '늘어납니다').replace(/어요/g, '습니다');
        // 권고 문장: "~해 보세요" → "~해 보는 것을", "~하기" → "~하기를"
        const recommend = (fix) => {
            const f = fix.trim().replace(/[.!]$/, '');
            if (/보세요$/.test(f)) {
                return `${f.replace(/보세요$/, '보는 것')}을`;
            }
            const last = f.charCodeAt(f.length - 1);
            const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
            return `${f}${hasBatchim ? '을' : '를'}`;
        };
        // 요약 소견: 의사 소견서처럼 한 덩어리 글로 (관찰된 경향 → 원인 추정 → 권고)
        const pastDays = week.filter((day) => !day.today);
        const timed = pastDays.filter((day) => day.min);
        const slowest = [...timed].sort((x, y) => y.min - x.min)[0];
        const fastest = [...timed].sort((x, y) => x.min - y.min)[0];
        const half = Math.floor(timed.length / 2);
        const avgOf = (list) => list.length ? Math.round(list.reduce((sum, day) => sum + day.min, 0) / list.length) : 0;
        const early = avgOf(timed.slice(0, half));
        const late = avgOf(timed.slice(half));
        const missDays = past.length - doneDays;
        const spread = slowest && fastest ? slowest.min - fastest.min : 0;
        const trend = late < early - 1 ? `후반으로 갈수록 평균 ${early}분에서 ${late}분으로 줄어드는 <b>개선 경향</b>을 보였습니다`
            : late > early + 1 ? `후반으로 갈수록 평균 ${early}분에서 ${late}분으로 늘어나는 <b>지연 경향</b>을 보였습니다`
            : `기간 내내 평균 ${average}분 안팎으로 <b>비교적 일정한 경향</b>을 보였습니다`;
        const consistency = missDays === 0 ? '하루도 거르지 않고 수행하여 루틴이 생활 속에 안정적으로 자리 잡은 것으로 보입니다'
            : missDays === 1 ? `${missDays}일을 제외하고 꾸준히 수행하여 습관 형성이 진행 중인 단계로 판단됩니다`
            : `${missDays}일을 수행하지 못해 아직 습관으로 자리 잡는 과정에 있는 것으로 판단됩니다`;
        const variability = spread >= routine.minutes * 0.5
            ? `다만 가장 빨리 끝낸 날(${fastest.day}요일, ${fastest.min}분)과 가장 오래 걸린 날(${slowest.day}요일, ${slowest.min}분)의 차이가 ${spread}분으로 커서, 그날의 컨디션이나 주변 환경의 영향을 크게 받는 편입니다.`
            : spread ? `날마다의 편차도 ${spread}분 이내로 크지 않아 수행 리듬이 안정적입니다.` : '';
        const cause = data.issues.length
            ? `특히 다음과 같은 양상이 관찰되었습니다. ${formal(data.issues[0].detail)}`
            : `기록상 눈에 띄는 어려움은 관찰되지 않았으며, ${data.good[0].replace(/요\.?$/, '').replace(/[.!]$/, '')}는 점이 긍정적입니다.`;
        const advice = data.issues.length
            ? `따라서 ${recommend(data.issues[0].fix)} 권장합니다. ${verdictKey === 'good' ? '현재의 흐름은 좋으므로 해낸 날을 구체적으로 칭찬해 주시면 유지에 도움이 됩니다.' : '한 번에 여러 가지를 바꾸기보다 한 가지부터 일주일간 적용해 보시길 권합니다.'}`
            : '지금의 방식을 유지하되, 해낸 날을 구체적으로 칭찬해 주시면 동기 유지에 도움이 됩니다.';
        const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date());
        const summaryDetail = `
            <p class="sum_label">LUUP 소견</p>
            <p>최근 ${past.length}일간 ‘${routine.title}’ 루틴을 관찰한 결과, ${doneDays}일을 수행했고 그중 ${okDays}일은 목표 시간(${routine.minutes}분) 안에 마쳤습니다. ${consistency}. 소요 시간은 ${trend}. ${variability}</p>
            <p>${cause}</p>
            <p>${advice}</p>
            <p class="sum_sign">${today} · LUUP 루틴 분석</p>`;

        // 최근 7일 기록 소견: 제시간 · 늦은 날 · 평균과 목표 차이 · 가장 빨랐던/늦었던 날 · 권고
        const timedDays = week.filter((day) => day.min && !day.today);
        const lateList = week.filter((day) => day.status === 'late').map((day) => `${day.day}요일`);
        const missList = week.filter((day) => day.status === 'miss').map((day) => `${day.day}요일`);
        const quick = [...timedDays].sort((x, y) => x.min - y.min)[0];
        const slow = [...timedDays].sort((x, y) => y.min - x.min)[0];
        const gap = average - routine.minutes;
        const weekOpinion = `
                <div class="step_opinion">
                    <p class="step_op_label">LUUP 소견</p>
                    <p>최근 ${past.length}일 중 <b>${okDays}일은 목표 시간(${routine.minutes}분) 안에</b> 마쳤고${lateDays ? `, <b>${lateDays}일은 목표보다 늦게</b> 끝냈습니다` : ', 늦게 끝낸 날은 없었습니다'}${missList.length ? `. ${missList.join(', ')}에는 수행하지 못했습니다` : ''}. 평균 소요 시간은 <b>${average}분</b>으로 목표보다 ${gap > 0 ? `${gap}분 길었습니다` : gap < 0 ? `${-gap}분 짧았습니다` : '정확히 맞았습니다'}.</p>
                    ${quick && slow ? `<p>가장 빨리 끝낸 날은 <b>${quick.day}요일(${quick.min}분)</b>, 가장 오래 걸린 날은 <b>${slow.day}요일(${slow.min}분)</b>로 ${slow.min - quick.min}분 차이가 났습니다.${lateList.length ? ` 늦게 끝낸 날은 ${lateList.join(', ')}로, 이날의 일정이나 컨디션을 함께 살펴볼 필요가 있습니다.` : ' 날마다 큰 차이 없이 안정적인 속도를 유지했습니다.'}</p>` : ''}
                    <p>${lateDays ? '따라서 늦어진 날의 시작 시각을 10분 정도 앞당기거나, 시작 전에 필요한 준비물을 미리 챙겨 두는 것을 권장합니다.' : '현재의 속도와 시간대를 그대로 유지하시길 권장합니다.'}</p>
                </div>`;

        const sections = [
            { key: 'summary', label: '요약', icon: verdict.icon, tone: verdictKey, html: `
                <p class="hero_tag">LUUP · ${routine.title}</p>
                <div class="sum_main">
                    <p class="hero_score"><span>최근 ${past.length}일 중 해낸 날</span><b>${doneDays}<small>/${past.length}일</small></b></p>
                    <p class="hero_pill"><i aria-hidden="true">${verdict.icon}</i>${verdict.title}</p>
                    <div class="sum_detail">${summaryDetail}</div>
                </div>` },
            { key: 'week', label: '최근 7일 기록', icon: '7', tone: 'blue', html: `
                <h3>최근 7일 기록 <small>막대 = 걸린 시간 · 점선 = 목표</small></h3>
                <ul class="week_row">${weekRow}</ul>
                <div class="bar_chart" style="--bars:7">
                    <span class="goal" style="--goal:${(routine.minutes / max) * 100}%"><span>목표 ${routine.minutes}분</span></span>
                    ${weekBars}
                </div>
                <div class="bar_axis" style="--bars:7" aria-hidden="true">${week.map((day) => `<span>${day.day}</span>`).join('')}</div>
                ${weekOpinion}` },
            { key: 'issues', label: '무엇이 문제일까요', icon: data.issues.length ? '!' : '✓', tone: data.issues.length ? 'warn' : 'good', html: `
                <h3>무엇이 문제일까요? <small>${data.issues.length}가지</small></h3>
                ${issues}` },
            ...(stepPanel ? [{ key: 'steps', label: `${routine.unit}별 걸린 시간`, icon: '⏱', tone: 'purple', html: stepPanel.replace(/<\/?section[^>]*>/g, '') }] : []),
            { key: 'today', label: '오늘 기록', icon: '●', tone: 'sky', html: `
                <h3>오늘 기록 <small>${routine.status === 'done' ? `${routine.doneAt} 완료` : STATE_LABEL[routine.status]}</small></h3>
                ${todayPanel}` },
            { key: 'good', label: '잘하고 있는 점', icon: '★', tone: 'good', html: `
                <h3>잘하고 있는 점</h3>
                <ul class="good_list">${data.good.map((text) => `<li>${text}</li>`).join('')}</ul>` }
        ];

        $('[data-report-panels]').innerHTML = `
            <div class="rp_acc">
                ${sections.map((sec, i) => `
                <section class="rp_item rp_${sec.key} tone_${sec.tone}${i === 0 ? ' is-open' : ''}" data-acc="${sec.key}"${sec.key === 'issues' ? ' data-report-issues' : ''}>
                    <button type="button" class="rp_tab" data-acc-open="${sec.key}" aria-expanded="${i === 0}">
                        <span class="rp_label">${sec.label}</span>
                        <i aria-hidden="true">L</i>
                    </button>
                    <div class="rp_body report_panel${sec.key === 'summary' ? ` report_hero tone_${verdictKey}` : ''}">${sec.html}</div>
                </section>`).join('')}
            </div>`;
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
            document.documentElement.classList.add('is-report-open');
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

    // 리포트가 닫히면(✕ · Esc · 바깥) 뒷배경 스크롤 다시 허용
    report.addEventListener('close', () => document.documentElement.classList.remove('is-report-open'));

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
            openSection('issues');
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


    // ---------- 첫 등장 인터렉션 (페이지 들어올 때 한 번) ----------
    // 1) 인사 문구가 낱말마다 흐린 회색 → 진하게
    // 2) 가운데에 지금 하는 카드 한 장이 기울어진 채 떠오름
    // 3) 나머지 카드가 그 뒤에 겹쳐 쌓였다가
    // 4) 부채처럼 촤르륵 펼쳐지며 제자리로
    const splitWords = (el) => {
        [...el.childNodes].forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const frag = document.createDocumentFragment();
                node.textContent.split(/(\s+)/).forEach((part) => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) {
                        frag.append(part);
                        return;
                    }
                    const span = document.createElement('span');
                    span.className = 'intro_word';
                    span.textContent = part;
                    frag.append(span);
                });
                node.replaceWith(frag);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                node.classList.add('intro_word');
            }
        });
        [...el.querySelectorAll('.intro_word')].forEach((word, i) => word.style.setProperty('--i', i));
    };

    const playIntro = () => {
        const stage = $('[data-stage]');
        if (!stage.querySelector('.stage_glow')) {
            stage.insertAdjacentHTML('afterbegin', '<div class="stage_glow" aria-hidden="true"><span class="glow_edge"></span></div>');
        }
        // 카드가 모였다 펼쳐지는 첫 등장은 뺌 → 카드는 처음부터 제자리, 색만 아래에서 위로 차오름
        if (prefersReducedMotion || !isStrip()) {
            stage.classList.add('is-filled', 'is-filled-now');
            return;
        }
        if (!stage.dataset.introDone) {
            stage.dataset.introDone = '1';
            setTimeout(() => stage.classList.add('is-filled'), 300);
        }
        return;
        stage.dataset.introDone = '1';
        splitWords($('#today-title'));
        stage.classList.add('is-intro');

        const cards = [...track.children];
        const center = track.querySelector('.is-active, .is-clear') || cards[0];
        const centerIndex = cards.indexOf(center);
        const mid = center.offsetLeft + center.offsetWidth / 2;
        const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

        cards.forEach((card, i) => {
            const offset = i - centerIndex;
            const dx = mid - (card.offsetLeft + card.offsetWidth / 2);
            card.style.transition = 'none';
            card.style.zIndex = String(20 - Math.abs(offset));
            card.style.opacity = '0';
            // 3D 곡선에서 가장자리 카드가 앞으로 나와 있으므로(translateZ) 그만큼 되돌리고, 가운데 카드가 맨 위에 오게 깊이를 줌
            const curveZ = Number((card.style.transform.match(/translateZ\(([-\d.]+)px\)/) || [0, 0])[1]);
            const z = 0;
            card.dataset.introZ = String(z);
            card.style.translate = `${dx + offset * 26}px 60px ${z}px`;
            card.style.rotate = `${-6 + offset * 3}deg`;
            card.style.scale = card === center ? '0.82' : '0.9';
            card.dataset.introDx = String(dx);
        });
        void track.offsetWidth;

        // 2) 가운데 카드 한 장
        setTimeout(() => {
            center.style.transition = `opacity 0.6s ease, translate 0.9s ${EASE}, scale 0.9s ${EASE}, rotate 0.9s ${EASE}`;
            center.style.opacity = '1';
            center.style.translate = `0 0 ${center.dataset.introZ}px`;
            center.style.scale = '1';
            center.style.rotate = '-6deg';
        }, 350);

        // 3) 나머지가 뒤에 겹쳐 쌓임
        setTimeout(() => {
            cards.forEach((card, i) => {
                if (card === center) return;
                const offset = i - centerIndex;
                const dx = Number(card.dataset.introDx);
                card.style.transition = `opacity 0.4s ease ${Math.abs(offset) * 70}ms, translate 0.6s ${EASE} ${Math.abs(offset) * 70}ms, scale 0.6s ${EASE}`;
                card.style.opacity = '1';
                card.style.translate = `${dx + offset * 34}px 0 ${card.dataset.introZ}px`;
                card.style.scale = '0.94';
            });
        }, 1100);

        // 4) 부채처럼 펼쳐짐
        setTimeout(() => {
            cards.forEach((card, i) => {
                const delay = Math.abs(i - centerIndex) * 60;
                card.style.transition = `translate 1.1s ${EASE} ${delay}ms, rotate 1.1s ${EASE} ${delay}ms, scale 1.1s ${EASE} ${delay}ms, opacity 0.3s ease`;
                card.style.translate = '0 0';
                card.style.rotate = '0deg';
                card.style.scale = '1';
            });
        }, 1900);

        // 끝나면 깨끗이 정리
        setTimeout(() => {
            cards.forEach((card) => {
                ['transition', 'zIndex', 'opacity', 'translate', 'rotate', 'scale'].forEach((prop) => { card.style[prop] = ''; });
                delete card.dataset.introDx;
                delete card.dataset.introZ;
            });
            stage.classList.remove('is-intro');
            // 카드가 멈춘 뒤: 파랑·분홍 빛이 아래에서 위로 차오름
            stage.classList.add('is-filled');
        }, 3400);
    };

    // ---------- 지금 시각 · 지금 해야 할 단계 · 지금 하고 있는 단계 (카드 왼쪽 패널) ----------
    const nowPanel = $('[data-now]');
    const toMin = (hhmm) => {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    };
    const renderNow = () => {
        if (!nowPanel) {
            return;
        }
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        nowPanel.querySelector('[data-now-time]').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        // 일정상 지금 해야 할 단계: 시작 시각이 지났고 다음 단계 시작 전인 것
        let planIndex = -1;
        routines.forEach((routine, i) => {
            if (toMin(routine.at) <= nowMin) planIndex = i;
        });
        const doingIndex = routines.findIndex((routine) => routine.status === 'active');
        const plan = routines[planIndex];
        const doing = routines[doingIndex];
        nowPanel.querySelector('[data-now-plan]').innerHTML = plan
            ? `<b>${pad(planIndex + 1)}단계</b> ${plan.title} <small>${plan.at}~</small>`
            : `<b>시작 전</b> 첫 단계는 ${routines[0].at}부터`;
        nowPanel.querySelector('[data-now-doing]').innerHTML = doing
            ? `<b>${pad(doingIndex + 1)}단계</b> ${doing.title}${doing.steps ? ` <small>${doing.stepsDone}/${doing.steps}${doing.unit}</small>` : ''}`
            : '<b>모두 끝</b> 오늘 루틴을 다 했어요';
        const status = nowPanel.querySelector('[data-now-status]');
        let text = '';
        let tone = 'ok';
        if (!doing) {
            text = '오늘 할 일을 모두 마쳤어요';
        } else if (planIndex < 0) {
            text = '일정보다 먼저 시작했어요';
        } else if (doingIndex === planIndex) {
            text = '지금 해야 할 단계를 제때 하고 있어요';
        } else if (doingIndex < planIndex) {
            text = `일정보다 ${planIndex - doingIndex}단계 늦어요`;
            tone = 'late';
        } else {
            text = `일정보다 ${doingIndex - planIndex}단계 앞서 있어요`;
        }
        status.textContent = text;
        nowPanel.dataset.tone = tone;
    };
    renderNow();
    setInterval(renderNow, 30 * 1000);

    // ---------- 시작 ----------
    const current = activeRoutine();
    if (current) {
        timer.total = current.minutes * 60;
        startTicking();
    }
    renderCards();
    centerOn(track.querySelector('.is-active'), true);
    // 웹폰트가 늦게 적용되면 카드 폭이 바뀌므로 한 번 더 맞춤
    window.addEventListener('load', () => {
        centerOn(track.querySelector('.is-active, .is-clear'), true);
        playIntro();
    });

    // 로딩 화면(막대 3개)은 없앰 → 바로 화면이 보임
    // 마이페이지의 "리포트 보기"로 들어오면 진행 중인 루틴 리포트를 바로 열기
    if (location.hash === '#report') {
        const target = Math.max(routines.findIndex((routine) => routine.status === 'active'), 0);
        setTimeout(() => openReport(target), prefersReducedMotion ? 0 : 400);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 제목: "오늘의 루틴" → 잠시 뒤 "오늘 하루님의 루틴" ("의"가 사라지고 이름 칸이 벌어지며 나타남)
    const who = document.querySelector('.td_title [data-title-who]');
    if (!who) return;
    try {
        const full = (JSON.parse(localStorage.getItem('luup-my-profile'))?.name || '').trim();
        if (full) who.querySelector('[data-who-name]').textContent = full.length === 3 ? full.slice(1) : full;
    } catch { /* 기본 이름 */ }
    const of = document.querySelector('.td_title .td_of');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(() => {
        if (of) {
            of.style.setProperty('--of-w', `${of.scrollWidth}px`);
            requestAnimationFrame(() => of.classList.add('is-out'));
        }
        who.style.setProperty('--who-w', `${who.scrollWidth}px`);
        who.classList.add('is-in');
    }, reduce ? 0 : 900));
});
