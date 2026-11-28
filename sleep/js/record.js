document.addEventListener('DOMContentLoaded', () => {
    // 오늘의 기록: 루틴 수행 / 감정 / 집중도 / 메모 — 날짜별로 브라우저에 저장
    const rec = document.querySelector('[data-rec]');
    if (!rec) {
        return;
    }

    const today = new Date();
    const key = `luup_record_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const ROUTINES = ['🍚 아침 식사하기', '🎒 등교 준비하기', '✏️ 받아쓰기 10문제', '🔤 영어 단어 외우기', '📖 책 10분 읽기'];
    const MOODS = [
        ['😆', '최고예요'],
        ['🙂', '좋아요'],
        ['😐', '그저 그래요'],
        ['😢', '속상해요'],
        ['😠', '화나요']
    ];

    const load = () => {
        try {
            return JSON.parse(localStorage.getItem(key)) || {};
        } catch {
            return {};
        }
    };
    const data = { done: [], mood: null, focus: 0, memo: '', ...load() };
    const save = () => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch {
            // 저장이 막힌 환경에서도 화면은 그대로 동작
        }
    };

    rec.querySelector('[data-rec-date]').textContent = `${today.getMonth() + 1}월 ${today.getDate()}일의 기록`;

    // 카드 요약 글씨 (접혀 있을 때 오른쪽에 보이는 값)
    const sum = (name) => rec.querySelector(`[data-rec-sum="${name}"]`);
    const updateSummary = () => {
        sum('routine').textContent = `${data.done.length} / ${ROUTINES.length}`;
        const mood = MOODS.find(([emoji]) => emoji === data.mood);
        sum('mood').textContent = mood ? `${mood[0]} ${mood[1]}` : '오늘의 기분';
        sum('focus').textContent = data.focus ? `${data.focus} / 5` : '';
        sum('memo').textContent = data.memo ? '작성함' : '';
    };

    // 루틴 체크
    const checks = rec.querySelector('[data-rec-routines]');
    checks.innerHTML = ROUTINES.map((name, i) => `
        <li><label class="rec_check"><input type="checkbox" value="${i}"${data.done.includes(i) ? ' checked' : ''}><span>${name}</span></label></li>`).join('');
    checks.addEventListener('change', (event) => {
        const i = Number(event.target.value);
        data.done = event.target.checked ? [...data.done, i] : data.done.filter((n) => n !== i);
        save();
        updateSummary();
    });

    // 기분 고르기
    const moods = rec.querySelector('[data-rec-moods]');
    moods.innerHTML = MOODS.map(([emoji, label]) => `
        <button type="button" class="rec_mood" role="radio" aria-checked="${data.mood === emoji}" data-mood="${emoji}"><span aria-hidden="true">${emoji}</span>${label}</button>`).join('');
    moods.addEventListener('click', (event) => {
        const button = event.target.closest('[data-mood]');
        if (!button) {
            return;
        }
        data.mood = button.dataset.mood;
        moods.querySelectorAll('[data-mood]').forEach((b) => b.setAttribute('aria-checked', String(b === button)));
        save();
        updateSummary();
    });

    // 집중도 1~5
    const focus = rec.querySelector('[data-rec-focus]');
    const paintFocus = () => focus.querySelectorAll('[data-focus]').forEach((b) => {
        const n = Number(b.dataset.focus);
        b.classList.toggle('is-on', n <= data.focus);
        b.setAttribute('aria-checked', String(n === data.focus));
    });
    focus.innerHTML = [1, 2, 3, 4, 5].map((n) => `<button type="button" class="rec_dot" role="radio" data-focus="${n}" aria-label="집중도 ${n}">${n}</button>`).join('');
    focus.addEventListener('click', (event) => {
        const button = event.target.closest('[data-focus]');
        if (!button) {
            return;
        }
        data.focus = Number(button.dataset.focus);
        paintFocus();
        save();
        updateSummary();
    });

    // 메모
    const memo = rec.querySelector('[data-rec-memo]');
    memo.value = data.memo;
    memo.addEventListener('input', () => {
        data.memo = memo.value;
        save();
        updateSummary();
    });

    // 카드 펼치기 / 접기 (한 번에 하나만 펼침)
    const toggles = [...rec.querySelectorAll('.rec_toggle')];
    toggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            toggles.forEach((other) => {
                other.setAttribute('aria-expanded', String(other === toggle && open));
                other.closest('.rec_card').classList.toggle('is-open', other === toggle && open);
                document.getElementById(other.getAttribute('aria-controls')).hidden = !(other === toggle && open);
            });
        });
    });

    paintFocus();
    updateSummary();
});

document.addEventListener('DOMContentLoaded', () => {
    // 오늘의 기록: 화면 가운데에 온 카드에 맞춰 오른쪽 큰 사진을 바꿈
    const cards = [...document.querySelectorAll('[data-cx-card]')];
    const photos = [...document.querySelectorAll('[data-cx-media] img')];
    if (!cards.length || !photos.length || !('IntersectionObserver' in window)) {
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const index = cards.indexOf(entry.target);
                photos.forEach((photo, i) => photo.classList.toggle('is-on', i === index));
            }
        });
    }, { rootMargin: '-45% 0px -45% 0px' });
    cards.forEach((card) => observer.observe(card));
});

document.addEventListener('DOMContentLoaded', () => {
    // 우리 아이 기록: 이번 주(최근 7일, 오늘 포함)와 지난주(그 전 7일)를 비교해 카드에 보여 줌
    // - 오늘은 실제로 남긴 기록, 지난 날은 저장된 기록이 있으면 그것을, 없으면 예시 기록(날짜로 고정된 값)을 씀
    const rec = document.querySelector('[data-rec]');
    const dialog = rec?.querySelector('[data-rec-dialog]');
    if (!rec || !dialog) {
        return;
    }
    const MOODS = ['😆', '🙂', '😐', '😢', '😠'];
    const MOOD_NAMES = { '😆': '최고예요', '🙂': '좋아요', '😐': '그저 그래요', '😢': '속상해요', '😠': '화나요' };
    const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
    const SAMPLE_MEMOS = ['받아쓰기를 끝까지 혼자 해냈어요!', '영어 단어 10개 외우기 성공', '동생이랑 같이 책을 읽었어요', '줄넘기 50개 넘었어요', '아침에 알람 없이 일어났어요'];
    const h = (name) => rec.querySelector(`[data-h="${name}"]`);
    const keyOf = (date) => `luup_record_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const read = (date) => {
        try {
            return JSON.parse(localStorage.getItem(keyOf(date)));
        } catch {
            return null;
        }
    };
    // 날짜마다 늘 같은 예시 값이 나오도록 간단한 난수
    const seeded = (n) => {
        const x = Math.sin(n * 9301 + 49297) * 233280;
        return x - Math.floor(x);
    };
    const sample = (date) => {
        const n = Math.floor(date.getTime() / 86400000);
        if (seeded(n) < 0.12) {
            return null; // 가끔은 기록을 쉰 날
        }
        return {
            done: Array.from({ length: 2 + Math.floor(seeded(n + 1) * 4) }, (_, i) => i),
            mood: MOODS[Math.min(4, Math.floor(seeded(n + 2) * seeded(n + 3) * 5))],
            focus: 2 + Math.floor(seeded(n + 4) * 4),
            memo: seeded(n + 5) < 0.45 ? SAMPLE_MEMOS[Math.floor(seeded(n + 6) * SAMPLE_MEMOS.length)] : ''
        };
    };

    // 14일: 앞 7일 = 지난주, 뒤 7일 = 이번 주
    const collect = () => {
        const today = new Date();
        return Array.from({ length: 14 }, (_, i) => {
            const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - i));
            const isToday = i === 13;
            const saved = read(date);
            const day = { done: [], mood: null, focus: 0, memo: '', ...(isToday ? saved : saved || sample(date)) };
            return { date, isToday, ...day, empty: !day.done.length && !day.mood && !day.focus && !day.memo };
        });
    };

    const sum = (arr, fn) => arr.reduce((n, d) => n + fn(d), 0);
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const diff = (now, prev, unit = '', digits = 0) => {
        const d = now - prev;
        const v = digits ? Math.abs(d).toFixed(digits) : Math.abs(Math.round(d));
        return d === 0 || Number(v) === 0 ? '변화 없음' : `${d > 0 ? '+' : '−'}${v}${unit}`;
    };
    const list = (el, rows) => {
        el.innerHTML = rows.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
    };
    // 요일별 막대 2개(지난주 연하게 + 이번 주 진하게) + 요일 글자
    const pairBars = (thisWeek, lastWeek, value) => thisWeek.map((d, i) => `
        <span class="cx_day${d.isToday ? ' is-today' : ''}">
            <i class="cx_prev" style="--v:${value(lastWeek[i])}"></i><i class="cx_now_bar" style="--v:${value(d)}"></i>
            <small>${d.isToday ? '오늘' : WEEKDAYS[d.date.getDay()]}</small>
        </span>`).join('');

    const render = () => {
        const days = collect();
        const lastWeek = days.slice(0, 7);
        const thisWeek = days.slice(7);
        const count = (d) => d.done.length + (d.mood ? 1 : 0) + (d.focus ? 1 : 0) + (d.memo ? 1 : 0);

        // 머리말: "오늘 우리 아이는 ~" (오늘 기록 요약) + 회색 문장 (이번 주 vs 지난주)
        const totalNow = sum(thisWeek, count);
        const totalPrev = sum(lastWeek, count);
        const td = days[13];
        // 문장 조각마다 [가운데에 올 때(~고), 끝에 올 때(~어요)] 두 가지 꼴
        const MOOD_PAST = { '😆': ['최고였고', '최고였어요'], '🙂': ['좋았고', '좋았어요'], '😐': ['그저 그랬고', '그저 그랬어요'], '😢': ['속상했고', '속상했어요'], '😠': ['화가 났고', '화가 났어요'] };
        const parts = [];
        if (td.done.length) {
            const n = `루틴 <b>${td.done.length}개</b>를`;
            parts.push([`${n} 해냈고`, `${n} 해냈어요`]);
        }
        if (td.mood) {
            const [mid, end] = MOOD_PAST[td.mood];
            parts.push([`기분이 <b>${td.mood}</b> ${mid}`, `기분이 <b>${td.mood}</b> ${end}`]);
        }
        if (td.focus) {
            const n = `집중도가 <b>${td.focus}점</b>`;
            parts.push([`${n}이었고`, `${n}이었어요`]);
        }
        h('today-line').innerHTML = parts.length
            ? `오늘 우리 아이는 ${parts.map(([mid, end], i) => (i === parts.length - 1 ? end : mid)).join(', ')}.`
            : '오늘 우리 아이는 아직 기록 전이에요.';
        // 오늘 기록이 없으면 '오늘 기록하기' 버튼 둘레가 살짝 숨 쉬듯 퍼짐
        rec.querySelector('.cx_write')?.classList.toggle('is-empty', !parts.length);
        const weekDiff = totalNow === totalPrev
            ? '지난주와 같은 만큼 꾸준해요.'
            : `지난주보다 ${Math.abs(totalNow - totalPrev)}개 ${totalNow > totalPrev ? '더 많아요.' : '적어요.'}`;
        h('total-diff').textContent = `이번 주엔 ${totalNow}개의 기록을 남겼고, ${weekDiff}`;
        h('days').textContent = `${thisWeek.filter((d) => !d.empty).length} / 7일`;
        let streak = 0;
        for (let i = days.length - (days[13].empty ? 2 : 1); i >= 0 && !days[i].empty; i--) {
            streak += 1;
        }
        h('streak').textContent = `${streak}일`;

        // 루틴
        const doneNow = sum(thisWeek, (d) => d.done.length);
        const donePrev = sum(lastWeek, (d) => d.done.length);
        h('routine-big').textContent = `${doneNow}회`;
        h('routine-label').textContent = `이번 주 끝낸 루틴 · 지난주 ${donePrev}회 (${diff(doneNow, donePrev, '회')})`;
        h('routine-viz').innerHTML = pairBars(thisWeek, lastWeek, (d) => d.done.length / 5);
        const rateNow = Math.round((doneNow / 35) * 100);
        const ratePrev = Math.round((donePrev / 35) * 100);
        list(h('routine-list'), [
            ['이번 주 달성률', `${rateNow}%`],
            ['지난주 달성률', `${ratePrev}%`],
            ['달라진 점', diff(rateNow, ratePrev, '%p')],
            ['5개 모두 끝낸 날', `${thisWeek.filter((d) => d.done.length === 5).length}일`]
        ]);

        // 감정
        const top = (week) => {
            const counts = MOODS.map((m) => week.filter((d) => d.mood === m).length);
            return Math.max(...counts) ? MOODS[counts.indexOf(Math.max(...counts))] : null;
        };
        const topNow = top(thisWeek);
        const topPrev = top(lastWeek);
        const good = (week) => week.filter((d) => d.mood === '😆' || d.mood === '🙂').length;
        const bad = (week) => week.filter((d) => d.mood === '😢' || d.mood === '😠').length;
        h('mood-big').textContent = topNow || '·';
        h('mood-label').textContent = topNow ? `이번 주엔 '${MOOD_NAMES[topNow]}'가 가장 많았어요${topPrev ? ` · 지난주엔 ${topPrev}` : ''}` : '이번 주 기분 기록이 아직 없어요';
        h('mood-viz').innerHTML = thisWeek.map((d, i) => `
            <span class="cx_mood_day${d.isToday ? ' is-today' : ''}"><i>${d.mood || '·'}</i><em>${lastWeek[i].mood || '·'}</em><small>${d.isToday ? '오늘' : WEEKDAYS[d.date.getDay()]}</small></span>`).join('');
        list(h('mood-list'), [
            ['기분 좋은 날', `${good(thisWeek)}일 (지난주 ${good(lastWeek)}일)`],
            ['속상·화난 날', `${bad(thisWeek)}일 (지난주 ${bad(lastWeek)}일)`],
            ['기분을 남긴 날', `${thisWeek.filter((d) => d.mood).length} / 7일`],
            ['달라진 점', diff(good(thisWeek), good(lastWeek), '일')]
        ]);

        // 집중도
        const focusNow = avg(thisWeek.filter((d) => d.focus).map((d) => d.focus));
        const focusPrev = avg(lastWeek.filter((d) => d.focus).map((d) => d.focus));
        h('focus-big').textContent = focusNow.toFixed(1);
        h('focus-label').textContent = `이번 주 평균 집중도 (5점 만점) · 지난주 ${focusPrev.toFixed(1)}`;
        h('focus-viz').innerHTML = pairBars(thisWeek, lastWeek, (d) => d.focus / 5);
        const bestDay = thisWeek.reduce((a, b) => (b.focus > a.focus ? b : a), thisWeek[0]);
        list(h('focus-list'), [
            ['이번 주 평균', focusNow.toFixed(1)],
            ['지난주 평균', focusPrev.toFixed(1)],
            ['달라진 점', diff(focusNow, focusPrev, '점', 1)],
            ['가장 집중한 날', bestDay.focus ? `${WEEKDAYS[bestDay.date.getDay()]}요일 ${bestDay.focus}점` : '-']
        ]);

        // 메모
        const memosNow = thisWeek.filter((d) => d.memo);
        const memosPrev = lastWeek.filter((d) => d.memo);
        h('memo-big').textContent = `${memosNow.length}개`;
        h('memo-label').textContent = `이번 주 남긴 메모 · 지난주 ${memosPrev.length}개`;
        h('memo-viz').innerHTML = memosNow.slice(-2).reverse().map((d) => `<p><small>${d.date.getMonth() + 1}월 ${d.date.getDate()}일</small>${d.memo.replace(/</g, '&lt;')}</p>`).join('') || '<p><small>이번 주</small>아직 메모가 없어요</p>';
        list(h('memo-list'), [
            ['이번 주 메모', `${memosNow.length}개`],
            ['지난주 메모', `${memosPrev.length}개`],
            ['달라진 점', diff(memosNow.length, memosPrev.length, '개')],
            ['오늘 메모', days[13].memo ? '작성함' : '아직']
        ]);
    };

    // 기록하기 버튼 → 팝업 열고 해당 칸으로 이동
    const today = new Date();
    dialog.querySelector('[data-rec-dialog-date]').textContent = `${today.getMonth() + 1}월 ${today.getDate()}일`;
    rec.querySelectorAll('[data-rec-open]').forEach((button) => {
        button.addEventListener('click', () => {
            dialog.showModal();
            const part = dialog.querySelector(`#rec-${button.dataset.recOpen}`);
            part?.scrollIntoView({ block: 'start' });
            part?.querySelector('button, input, textarea')?.focus();
        });
    });
    // 바깥(어두운 배경)을 누르면 닫힘
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    // 팝업에서 고르거나 적으면 카드도 바로 갱신 (저장은 위쪽 코드가 이미 함)
    ['change', 'input', 'click'].forEach((type) => dialog.addEventListener(type, () => setTimeout(render, 0)));
    dialog.addEventListener('close', render);

    render();
});

document.addEventListener('DOMContentLoaded', () => {
    // 우리 아이 기록 제목: 화면에 들어오면 글자가 앞에서부터 한 자씩 색이 채워짐
    // (숫자·문장은 위 코드가 먼저 채워 둔 뒤에 글자를 나눔, 파란 숫자·회색 문장 색은 그대로 유지)
    const title = document.querySelector('.cx_title');
    if (!title) {
        return;
    }
    const split = () => {
        let i = 0;
        const walk = (node) => {
            [...node.childNodes].forEach((child) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const frag = document.createDocumentFragment();
                    [...child.textContent].forEach((ch) => {
                        const span = document.createElement('span');
                        span.className = 'cx_ch';
                        span.style.setProperty('--i', i++);
                        span.textContent = ch;
                        frag.appendChild(span);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    walk(child);
                }
            });
        };
        walk(title);
    };
    const fill = () => requestAnimationFrame(() => requestAnimationFrame(() => title.classList.add('is-filled')));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            observer.disconnect();
            split();
            fill();
        }
    }, { threshold: 0.6 });
    observer.observe(title);
});

document.addEventListener('DOMContentLoaded', () => {
    // 기록 화면 오른쪽 아래 "상세 기록 OFF/ON": 켜면 카드마다 최근 기록 목록이 펼쳐짐
    const detail = document.querySelector('[data-cx-detail]');
    const stage = document.querySelector('.cx_stage');
    if (!detail || !stage) {
        return;
    }
    detail.addEventListener('click', () => {
        const on = detail.getAttribute('aria-pressed') !== 'true';
        detail.setAttribute('aria-pressed', String(on));
        stage.classList.toggle('is-detail', on);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 진단 흐름: 세로로 스크롤하면 패널 줄이 가로로 흘러감 (데스크톱). 좁은 화면은 손가락으로 옆으로 넘김
    const fl = document.querySelector('[data-fl]');
    const track = fl?.querySelector('[data-fl-track]');
    if (!fl || !track) {
        return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 1025px)');
    let distance = 0;
    let ticking = false;

    const setup = () => {
        if (!wide.matches || reduce) {
            fl.style.height = '';
            track.style.transform = '';
            fl.classList.remove('is-flow');
            return;
        }
        fl.classList.add('is-flow');
        distance = Math.max(track.scrollWidth - window.innerWidth, 0);
        fl.style.height = `${window.innerHeight + distance}px`;
        update();
    };
    const update = () => {
        ticking = false;
        if (!fl.classList.contains('is-flow')) {
            return;
        }
        const progress = Math.min(Math.max(-fl.getBoundingClientRect().top / Math.max(distance, 1), 0), 1);
        track.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`;
        fl.style.setProperty('--p', progress.toFixed(4));
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    window.addEventListener('resize', setup);
    window.addEventListener('load', setup);
    setup();
});

document.addEventListener('DOMContentLoaded', () => {
    // 기록 첫 화면 사진 4장: 누르면 바로 아래로 이번 주(최근 7일) 기록이 쭉 펼쳐짐, 다시 누르면 접힘
    const grid = document.querySelector('[data-ro-grid]');
    const detail = document.querySelector('[data-ro-detail]');
    const body = document.querySelector('[data-ro-detail-body]');
    if (!grid || !detail || !body) {
        return;
    }
    const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
    const MOODS = [['😆', '최고예요'], ['🙂', '좋아요'], ['😐', '그저 그래요'], ['😢', '속상해요'], ['😠', '화나요']];
    const MEMOS = ['받아쓰기를 끝까지 혼자 해냈어요!', '영어 단어 10개 외우기 성공', '동생이랑 같이 책을 읽었어요', '줄넘기 50개 넘었어요', '아침에 알람 없이 일어났어요', '숙제를 저녁 먹기 전에 끝냈어요'];
    const ROUTINES = ['아침 식사하기', '등교 준비하기', '받아쓰기 10문제', '영어 단어 외우기', '책 10분 읽기'];
    const seeded = (n) => {
        const x = Math.sin(n * 9301 + 49297) * 233280;
        return x - Math.floor(x);
    };
    // 최근 7일: 열 때마다 오늘 날짜 기준으로 다시 계산 (맨 오른쪽 = 오늘 요일)
    const buildDays = () => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
            const n = Math.floor(date.getTime() / 86400000);
            return {
                label: WEEK[date.getDay()],
                isToday: i === 6,
                date: `${date.getMonth() + 1}/${date.getDate()}`,
                done: 2 + Math.floor(seeded(n + 1) * 4),
                mood: Math.min(4, Math.floor(seeded(n + 2) * seeded(n + 3) * 5)),
                focus: 2 + Math.floor(seeded(n + 4) * 4),
                memo: seeded(n + 5) < 0.85 ? MEMOS[Math.floor(seeded(n + 6) * MEMOS.length)] : ''
            };
        });
    };
    let days = buildDays();
    const dayName = (d) => `${d.label}요일`;
    const avg = (key) => (days.reduce((sum, d) => sum + d[key], 0) / days.length);

    // 펼친 칸 공통 조각: 숫자 3칸 · 지난주와 비교 · 도움말
    const stats = (items) => `<dl class="rd_stats">${items.map(([k, v, note], i) => `<div style="--i:${i}" role="button" tabindex="0" data-stat="${i}" aria-label="${k} 자세히 보기"><dt>${k}</dt><dd>${v}</dd>${note ? `<small>${note}</small>` : ''}<span class="rd_stat_go" aria-hidden="true">↗</span></div>`).join('')}</dl>`;
    const tip = (title, text) => `<div class="rd_tip" style="--i:9"><b>${title}</b><p>${text}</p></div>`;
    const sub = (text) => `<h3 class="rd_sub">${text}</h3>`;
    // 부모님 확인: 이번 주 꼭 살펴볼 것 (체크하면 이 브라우저에 저장)
    const parentCheck = (key, items) => `
        <div class="rd_parent" data-parent-key="${key}">
            <p class="rd_parent_head"><b>부모님이 확인해 주세요</b><span>이번 주 살펴볼 것 ${items.length}가지</span></p>
            <ul>${items.map(([title, text], i) => `<li style="--i:${i}"><label><input type="checkbox" data-parent-item="${i}"><span class="rd_parent_box" aria-hidden="true"></span><span><b>${title}</b><small>${text}</small></span></label></li>`).join('')}</ul>
        </div>`;
    const diffText = (now, prev, unit) => {
        const d = Math.round((now - prev) * 10) / 10;
        return d > 0 ? `지난주보다 +${d}${unit}` : d < 0 ? `지난주보다 ${d}${unit}` : '지난주와 같아요';
    };

    const MEMO_SHOW = 3;

    // 감정 얼굴: 이모지 대신 파스텔 그라데이션 동그라미 + 점 눈 · 선 입 (최고예요 → 화나요)
    const FACE = [
        { a: '#a8f0e2', b: '#6fd3c4', mouth: 'M16 27 Q22 33 28 27' },
        { a: '#c8f2b0', b: '#8fdc8a', mouth: 'M17 27 Q22 31 27 27' },
        { a: '#fff1b0', b: '#f8d97a', mouth: 'M17 28 H27' },
        { a: '#ffd3b5', b: '#f6a98a', mouth: 'M17 30 Q22 26 27 30' },
        { a: '#ffc2cf', b: '#f2879e', mouth: 'M16 31 Q22 25 28 31' }
    ];
    const moodFace = (i, size = 56) => {
        const f = FACE[i];
        const id = `mf${i}_${Math.random().toString(36).slice(2, 7)}`;
        return `<svg class="mood_face" width="${size}" height="${size}" viewBox="0 0 44 44" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.a}"/><stop offset="1" stop-color="${f.b}"/></linearGradient></defs><circle cx="22" cy="22" r="22" fill="url(#${id})"/><circle cx="15" cy="20" r="2.2" fill="#1c1c1e"/><circle cx="29" cy="20" r="2.2" fill="#1c1c1e"/><path d="${f.mouth}" fill="none" stroke="#1c1c1e" stroke-width="2" stroke-linecap="round"/></svg>`;
    };

    // 기분마다 그날의 이유 (예시 기록)
    const MOOD_REASONS = [
        ['받아쓰기 100점을 받았어요', '친구랑 놀이터에서 신나게 놀았어요', '할머니 댁에 놀러 갔어요', '루틴을 5개 모두 해냈어요'],
        ['좋아하는 반찬이 나왔어요', '숙제를 일찍 끝냈어요', '선생님께 칭찬받았어요', '동생이랑 사이좋게 놀았어요'],
        ['특별한 일 없이 평범한 하루였어요', '조금 피곤했어요', '비가 와서 밖에 못 나갔어요', '학원이 늦게 끝났어요'],
        ['친구와 다퉜어요', '받아쓰기를 많이 틀렸어요', '좋아하는 장난감이 망가졌어요', '혼자 남아 숙제를 했어요'],
        ['동생이 숙제를 망가뜨렸어요', '게임 시간이 끝나서 속상했어요', '하기 싫은 공부를 했어요', '친구가 놀렸어요']
    ];

    const views = {
        routine: () => {
            const total = days.reduce((sum, d) => sum + d.done, 0);
            const best = [...days].sort((a, b) => b.done - a.done)[0];
            const full = days.filter((d) => d.done === 5).length;
            const rate = Math.round((total / 35) * 100);
            const perRoutine = ROUTINES.map((name, i) => [name, days.filter((d) => d.done > i).length]);
            const weakest = [...perRoutine].sort((a, b) => a[1] - b[1])[0];
            return {
                title: '루틴 수행 기록',
                lead: `이번 주에 루틴을 모두 <b>${total}번</b> 끝냈어요.<br>하루 평균 <b>${avg('done').toFixed(1)}개</b>이고, 가장 많이 해낸 날은 <b>${dayName(best)}(${best.done}개)</b>이에요.`,
                body: `${stats([['수행률', `${rate}%`, diffText(rate, rate - 6, '%p')], ['모두 해낸 날', `${full}일`, '5개 모두 완료'], ['끝낸 루틴', `${total}번`, '7일 합계']])}
                    ${sub('하루에 끝낸 루틴')}
                    <div class="rd_glow_card" style="--avg:${avg('done') / 5}">
                        <ul class="rd_glow_pills">
                            <li>수행률 <i></i><b>${rate}%</b></li>
                            <li>모두 해낸 날 <i></i><b>${full}일</b></li>
                            <li>하루 평균 <i></i><b>${avg('done').toFixed(1)}개</b></li>
                        </ul>
                        <div class="rd_glow_chart">
                            <span class="rd_glow_avg" aria-hidden="true"><em>1주 <b>평균</b></em></span>
                            <ol class="rd_glow_bars">${days.map((d, i) => `<li style="--i:${i};--v:${d.done / 5}" class="${d.isToday ? 'is-hl' : ''}${d === best && !d.isToday ? ' is-best' : ''}"><span class="rd_glow_bar">${d.isToday ? '<i class="rd_glow_tag">오늘</i>' : ''}</span><b>${d.date}</b><small class="${d.isToday ? 'is-today' : ''}">${d.label}</small></li>`).join('')}</ol>
                        </div>
                    </div>
                    ${sub('루틴별로 해낸 날')}
                    <ul class="rd_list rd_list_days">${perRoutine.map(([name, n], i) => {
                        const week = days.map((d) => `<span class="${d.done > i ? 'is-ok' : 'is-miss'}${d.isToday ? ' is-today' : ''}"><i aria-hidden="true">${d.done > i ? '✓' : '✕'}</i>${d.label}</span>`).join('');
                        const missed = days.filter((d) => d.done <= i).map(dayName);
                        return `<li style="--i:${i}" tabindex="0"><span>${name}</span><i class="rd_meter" style="--v:${n / 7}"></i><b>${n}/7일</b>
                            <div class="rd_day_tip" role="tooltip"><div class="rd_day_row">${week}</div><p>${missed.length ? `못 한 날: <b>${missed.join(', ')}</b>` : '<b>7일 모두</b> 해냈어요'}</p></div></li>`;
                    }).join('')}</ul>
                    ${parentCheck('routine', [
                        ['빠지는 루틴 확인', `<b>${weakest[0]}</b>가 이번 주 ${7 - weakest[1]}번 빠졌어요. 어떤 날 빠졌는지 함께 확인해 주세요.`],
                        ['모두 해낸 날 칭찬하기', `5개를 모두 해낸 날이 ${full}일 있어요. 그날을 구체적으로 칭찬해 주세요.`],
                        ['다음 주 루틴 시간 점검', '시작 시간이 너무 늦거나 겹치는 루틴이 없는지 루틴 페이지에서 확인해 주세요.']
                    ])}
                    ${tip('이렇게 해 보세요', `가장 자주 빠진 루틴은 <b>${weakest[0]}</b>예요 (${weakest[1]}/7일). 시간을 앞당기거나 다른 루틴 바로 뒤에 붙여 보세요.`)}`
            };
        },
        mood: () => {
            const counts = MOODS.map((_, i) => days.filter((d) => d.mood === i).length);
            const top = counts.indexOf(Math.max(...counts));
            const good = counts[0] + counts[1];
            const bad = counts[3] + counts[4];
            const badDays = days.filter((d) => d.mood >= 3).map(dayName);
            return {
                title: '감정 기록',
                lead: `이번 주에는 <b>‘${MOODS[top][1]}’</b>가 가장 많았어요 (${counts[top]}일). 기분이 안 좋았던 날은 <b>${bad}일</b>이에요.`,
                body: `${stats([['좋았던 날', `${good}일`, '최고예요 · 좋아요'], ['보통인 날', `${counts[2]}일`, '그저 그래요'], ['안 좋았던 날', `${bad}일`, '속상해요 · 화나요']])}
                    ${sub('날마다 기분')}
                    <ol class="rd_moods">${days.map((d, i) => `<li style="--i:${i}"><span aria-hidden="true">${moodFace(d.mood)}</span><b>${MOODS[d.mood][1]}</b><small class="${d.isToday ? 'is-today' : ''}">${d.label}</small></li>`).join('')}</ol>
                    ${sub('기분별 횟수')}
                    <ul class="rd_list rd_list_mood">${MOODS.map(([emoji, name], i) => {
                        const hits = days.map((d, k) => ({ d, k })).filter(({ d }) => d.mood === i);
                        const detail = hits.length
                            ? `<ul class="rd_why">${hits.map(({ d, k }) => `<li><b>${dayName(d)}</b><small>${d.date}</small><p>${MOOD_REASONS[i][k % MOOD_REASONS[i].length]}</p></li>`).join('')}</ul>`
                            : '<p class="rd_why_empty">이번 주에는 이 기분이었던 날이 없어요.</p>';
                        return `<li style="--i:${i}"><button type="button" class="rd_mood_row" aria-expanded="false" data-mood-row${hits.length ? '' : ' data-empty'}><span><em aria-hidden="true">${moodFace(i, 26)}</em> ${name}</span><i class="rd_meter" style="--v:${counts[i] / 7}"></i><b>${counts[i]}일</b><i class="rd_chev" aria-hidden="true"></i></button><div class="rd_why_wrap" hidden>${detail}</div></li>`;
                    }).join('')}</ul>
                    ${parentCheck('mood', [
                        ['기분이 안 좋았던 날 대화하기', bad ? `${badDays.join(', ')}에 기분이 안 좋았어요. 무슨 일이 있었는지 들어 주세요.` : '이번 주는 안 좋은 날이 없어요. 좋았던 이유를 물어봐 주세요.'],
                        ['기분과 루틴 연결해 보기', '기분이 안 좋은 날 루틴을 빠뜨렸는지 루틴 기록과 함께 비교해 주세요.'],
                        ['감정 표현 칭찬하기', '자기 기분을 솔직하게 기록한 것 자체를 칭찬해 주세요.']
                    ])}
                    ${tip('이렇게 해 보세요', bad ? `<b>${badDays.join(', ')}</b>에 기분이 안 좋았어요. 그날 무슨 일이 있었는지 짧게 이야기 나눠 보세요.` : '이번 주는 기분이 안 좋았던 날이 없어요. 좋았던 순간을 함께 떠올려 칭찬해 주세요.')}`
            };
        },
        focus: () => {
            const a = avg('focus');
            const best = [...days].sort((x, y) => y.focus - x.focus)[0];
            const low = [...days].sort((x, y) => x.focus - y.focus)[0];
            const high = days.filter((d) => d.focus >= 4).length;
            return {
                title: '집중도 기록',
                lead: `이번 주 평균 집중도는 <b>${a.toFixed(1)}점</b>이에요 (5점 만점). 가장 집중한 날은 <b>${dayName(best)}</b>이에요.`,
                body: `<div class="rd_focus_top"><div class="rd_gauge" style="--v:${a / 5}" aria-label="평균 집중도 ${a.toFixed(1)}점 (5점 만점)"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50"/><circle class="rd_gauge_bar" cx="60" cy="60" r="50" pathLength="100"/></svg><b>${a.toFixed(1)}<small>/5</small></b><span>평균 집중도</span></div>${stats([['지난주와 비교', diffText(a, 4.0, '점').replace('지난주보다 ', ''), '지난주 4.0점'], ['가장 높은 날', `${best.focus}점`, dayName(best)], ['4점 이상', `${high}일`, '잘 집중한 날']])}</div>
                    ${sub('날마다 집중도')}
                    <div class="rd_focus_chart" style="--avg:${a / 5}">
                        <span class="rd_avg_line" aria-hidden="true"><em>평균 ${a.toFixed(1)}</em></span>
                        <ol class="rd_bars rd_bars_focus">${days.map((d, i) => `<li style="--i:${i}" class="${d === best ? 'is-best' : ''}${d === low ? ' is-low' : ''}"><span class="rd_bar" style="--v:${d.focus / 5}"><i></i></span><b>${d.focus}점</b><small class="${d.isToday ? 'is-today' : ''}">${d.label}</small></li>`).join('')}</ol>
                    </div>
                    <p class="rd_legend"><span class="is-best"></span>가장 높은 날 <span class="is-low"></span>가장 낮은 날 <span class="is-avg"></span>이번 주 평균</p>
                    ${parentCheck('focus', [
                        ['집중이 낮은 날 환경 점검', `${dayName(low)}(${low.focus}점)에 공부한 장소와 시간대를 확인해 주세요.`],
                        ['휴대폰 · TV 거리 두기', '공부하는 동안 화면이 보이는 곳에 있지 않았는지 살펴봐 주세요.'],
                        ['잘 집중한 날 이유 찾기', `${dayName(best)}처럼 잘 집중한 날의 비결을 아이와 함께 찾아 보세요.`]
                    ])}
                    ${tip('이렇게 해 보세요', `집중도가 가장 낮았던 날은 <b>${dayName(low)}(${low.focus}점)</b>이에요. 공부 전 5분 쉬는 시간을 넣거나, 책상 위 물건을 정리해 보세요.`)}`
            };
        },
        memo: () => {
            const memos = days.filter((d) => d.memo).reverse();
            // 자주 나온 말: 메모를 낱말로 자르지 않고, 뜻이 통하는 주제 단어로 묶어 셈
            const TOPICS = [
                ['받아쓰기', ['받아쓰기']], ['영어 단어', ['영어']], ['책 읽기', ['책']], ['줄넘기', ['줄넘기']],
                ['동생', ['동생']], ['혼자 해냄', ['혼자']], ['일찍 일어남', ['알람', '일어났']], ['숙제', ['숙제']]
            ];
            const tagHits = TOPICS.map(([name, keys]) => [name, keys, memos.filter((d) => keys.some((k) => d.memo.includes(k)))])
                .filter(([, , hits]) => hits.length)
                .sort((x, y) => y[2].length - x[2].length)
                .slice(0, 6);
            const tags = tagHits.map(([name]) => name);
            return {
                title: '기타메모',
                lead: `이번 주에 남긴 메모는 <b>${memos.length}개</b>예요.`,
                body: `${stats([['남긴 메모', `${memos.length}개`, '7일 중'], ['메모한 날', `${memos.length}일`, `${7 - memos.length}일은 쉬었어요`], ['가장 최근', memos[0] ? memos[0].label : '-', memos[0] ? memos[0].date : '']])}
                    ${tags.length ? `${sub('메모에 자주 나온 이야기')}<ul class="rd_tags">${tags.map((t, i) => {
                        const [, keys, hits] = tagHits[i];
                        const mark = (text) => keys.reduce((out, k) => out.replace(k, `<mark>${k}</mark>`), text);
                        const pop = hits.map((d) => `<li><small>${dayName(d)} · ${d.date}</small><p>${mark(d.memo)}</p></li>`).join('');
                        return `<li style="--i:${i}"><button type="button" class="rd_tag_btn" aria-expanded="false">${t}<em>${hits.length}</em></button><div class="rd_tag_pop" hidden><p class="rd_tag_pop_head"><b>${t}</b> 이야기가 나온 날 · ${hits.length}일</p><ul>${pop}</ul></div></li>`;
                    }).join('')}</ul>` : ''}
                    ${sub('메모 모아 보기')}
                    ${memos.length
                        ? `<ul class="rd_memos" data-memo-list>${memos.map((d, i) => `<li style="--i:${i}"${i >= MEMO_SHOW ? ' hidden' : ''}><small>${d.label} · ${d.date}</small><p>${d.memo}</p></li>`).join('')}</ul>
                            ${memos.length > MEMO_SHOW ? `<button type="button" class="rd_more" aria-expanded="false" data-memo-more>더 보기 <span>+${memos.length - MEMO_SHOW}</span> <i aria-hidden="true">↓</i></button>` : ''}`
                        : '<p class="rd_empty">이번 주에는 아직 메모가 없어요.</p>'}
                    ${parentCheck('memo', [
                        ['메모 함께 읽기', '아이가 남긴 메모를 함께 읽고 짧게 답해 주세요.'],
                        ['걱정되는 내용 확인', '힘들거나 속상하다는 메모가 있었는지 살펴봐 주세요.'],
                        ['쉬었던 날 기록 돕기', `${7 - memos.length}일은 메모가 없어요. 잠들기 전 한 줄 쓰기를 도와주세요.`]
                    ])}
                    ${tip('이렇게 해 보세요', '잘한 일을 메모로 남긴 날은 다음 날 루틴 수행률이 높아요. 잠들기 전 한 줄씩 함께 적어 보세요.')}`
            };
        }
    };

    // 화면을 천천히(약 0.9초) 처음과 끝이 부드러운 곡선으로 내려 줌
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glideTo = (el) => {
        const header = document.querySelector('.site_header');
        const offset = (header ? header.getBoundingClientRect().height : 0) + 16;
        const start = window.scrollY;
        const end = Math.max(0, el.getBoundingClientRect().top + start - offset);
        if (reduceMotion || Math.abs(end - start) < 4) {
            window.scrollTo(0, end);
            return;
        }
        const root = document.documentElement;
        root.style.scrollBehavior = 'auto';
        const duration = 900;
        const t0 = performance.now();
        window.__luupGlide = true;
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const stop = () => { cancelled = true; };
        let cancelled = false;
        window.addEventListener('wheel', stop, { once: true, passive: true });
        window.addEventListener('touchstart', stop, { once: true, passive: true });
        const step = (now) => {
            if (cancelled) {
                root.style.scrollBehavior = '';
                window.__luupGlide = false;
                return;
            }
            const t = Math.min((now - t0) / duration, 1);
            window.scrollTo(0, start + (end - start) * ease(t));
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                root.style.scrollBehavior = '';
                window.__luupGlide = false;
                window.removeEventListener('wheel', stop);
                window.removeEventListener('touchstart', stop);
            }
        };
        requestAnimationFrame(step);
    };

    // 기타메모 "더 보기": 처음엔 3개만, 누르면 나머지 메모가 차례로 펼쳐짐 / 다시 누르면 접기
    body.addEventListener('click', (event) => {
        const more = event.target.closest('[data-memo-more]');
        if (!more) {
            return;
        }
        const open = more.getAttribute('aria-expanded') !== 'true';
        const rest = [...body.querySelectorAll('[data-memo-list] li')].slice(MEMO_SHOW);
        rest.forEach((li, i) => {
            li.hidden = !open;
            li.style.setProperty('--i', i);
            li.classList.toggle('is-more', open);
        });
        more.setAttribute('aria-expanded', String(open));
        more.innerHTML = open ? '접기 <i aria-hidden="true">↑</i>' : `더 보기 <span>+${rest.length}</span> <i aria-hidden="true">↓</i>`;
    });

    // 기분별 횟수: 줄을 누르면 그 기분이었던 요일과 이유가 바로 아래에 펼쳐짐
    body.addEventListener('click', (event) => {
        const row = event.target.closest('[data-mood-row]');
        if (!row) return;
        const wrap = row.nextElementSibling;
        const open = row.getAttribute('aria-expanded') !== 'true';
        row.setAttribute('aria-expanded', String(open));
        wrap.hidden = !open;
    });

    // 자주 나온 말: 단어를 누르면 그 말이 나온 날 · 메모가 살짝 뜸 (다시 누르거나 바깥 누르면 닫힘)
    const closeTagPops = (except) => {
        body.querySelectorAll('.rd_tag_btn[aria-expanded="true"]').forEach((b) => {
            if (b === except) return;
            b.setAttribute('aria-expanded', 'false');
            b.nextElementSibling.hidden = true;
        });
    };
    body.addEventListener('click', (event) => {
        const btn = event.target.closest('.rd_tag_btn');
        if (!btn) {
            if (!event.target.closest('.rd_tag_pop')) closeTagPops();
            return;
        }
        const open = btn.getAttribute('aria-expanded') !== 'true';
        closeTagPops(btn);
        btn.setAttribute('aria-expanded', String(open));
        btn.nextElementSibling.hidden = !open;
    });

    // 부모님 확인 체크: 주(週)마다 따로 저장
    const weekKey = (() => { const d = new Date(); const first = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()); return `${first.getFullYear()}-${first.getMonth() + 1}-${first.getDate()}`; })();
    const parentStore = (k) => `luup-parent-${k}-${weekKey}`;
    const restoreParent = () => {
        body.querySelectorAll('[data-parent-key]').forEach((box) => {
            // 저장된 값이 없으면 처음부터 모두 체크된 상태로
            let saved = null;
            try { saved = JSON.parse(localStorage.getItem(parentStore(box.dataset.parentKey))); } catch { saved = null; }
            box.querySelectorAll('[data-parent-item]').forEach((input) => {
                input.checked = Array.isArray(saved) ? saved.includes(Number(input.dataset.parentItem)) : true;
            });
        });
    };
    body.addEventListener('change', (event) => {
        const input = event.target.closest('[data-parent-item]');
        if (!input) return;
        const box = input.closest('[data-parent-key]');
        const checked = [...box.querySelectorAll('[data-parent-item]')].filter((el) => el.checked).map((el) => Number(el.dataset.parentItem));
        try { localStorage.setItem(parentStore(box.dataset.parentKey), JSON.stringify(checked)); } catch { /* 저장 불가 시 무시 */ }
    });

    const buttons = [...grid.querySelectorAll('[data-ro-open]')];
    let openKey = null;
    const close = () => {
        detail.classList.remove('is-open');
        buttons.forEach((b) => b.setAttribute('aria-expanded', 'false'));
        openKey = null;
        setTimeout(() => {
            if (!openKey) detail.hidden = true;
        }, 500);
    };
    buttons.forEach((button) => button.addEventListener('click', () => {
        const key = button.dataset.roOpen;
        if (openKey === key) {
            close();
            return;
        }
        days = buildDays();
        const view = views[key]();
        body.dataset.view = key;
        body.innerHTML = `
            <div class="rd_head">
                <p class="rd_kicker">이번 주 · 최근 7일</p>
                <h2>${view.title}</h2>
                <p class="rd_lead">${view.lead}</p>
            </div>
            <div class="rd_body">${view.body}</div>
            <button type="button" class="rd_close" data-ro-close>접기 <span aria-hidden="true">↑</span></button>`;
        // "부모님이 확인해 주세요" · "이렇게 해 보세요"는 왼쪽 칸(제목 아래)으로
        const headCol = body.querySelector('.rd_head');
        body.querySelectorAll('.rd_body > .rd_parent, .rd_body > .rd_tip').forEach((el) => headCol.append(el));
        // 오른쪽: 소제목 + 그 아래 내용(다음 소제목 전까지)을 한 판으로 묶어 바탕을 깔아 줌
        body.querySelectorAll('.rd_body > .rd_sub').forEach((subEl) => {
            const panel = document.createElement('section');
            panel.className = 'rd_section';
            subEl.before(panel);
            let next = subEl;
            while (next && !(next !== subEl && next.classList?.contains('rd_sub')) && !next.classList?.contains('rd_more_skip')) {
                const after = next.nextElementSibling;
                panel.append(next);
                next = after;
                if (next && (next.classList.contains('rd_sub') || next.classList.contains('rd_close'))) break;
            }
        });
        // 오른쪽 마지막 판 아래: 이번 주 내용을 글로 정리
        const lastSection = body.querySelector('.rd_body > .rd_section:last-of-type');
        if (lastSection && !lastSection.querySelector('.rd_section_note')) {
            const dn = (d) => `${d.label}요일`;
            const sorted = (k) => [...days].sort((x, y) => y[k] - x[k]);
            const notes = {
                routine: () => {
                    const hi = sorted('done')[0], lo = sorted('done').slice(-1)[0];
                    return [`이번 주에는 <b>${dn(hi)}</b>에 루틴을 가장 많이(${hi.done}개) 해냈고, <b>${dn(lo)}</b>에는 ${lo.done}개로 가장 적었어요.`,
                        '주 초반보다 후반으로 갈수록 꾸준히 해내는 흐름이에요. 적게 한 날은 일정이 많았던 날인지 함께 살펴봐 주세요.'];
                },
                mood: () => {
                    const good = days.filter((d) => d.mood <= 1).length;
                    return [`일주일 중 <b>${good}일</b>은 기분 좋게 보냈어요.`,
                        '기분이 안 좋았던 날에는 루틴 수도 함께 줄어드는 편이에요. 그날의 이야기를 짧게라도 들어 주면 다음 날 회복이 빨라요.'];
                },
                focus: () => {
                    const hi = sorted('focus')[0], lo = sorted('focus').slice(-1)[0];
                    return [`<b>${dn(hi)}</b>에 가장 잘 집중했고(${hi.focus}점), <b>${dn(lo)}</b>에는 집중이 어려웠어요(${lo.focus}점).`,
                        '평균보다 높은 날이 절반 이상이에요. 집중이 낮았던 날은 공부 시간대나 장소가 달랐는지 비교해 보면 원인을 찾기 쉬워요.'];
                },
                memo: () => {
                    const n = days.filter((d) => d.memo).length;
                    return [`7일 중 <b>${n}일</b> 메모를 남겼어요.`,
                        '스스로 해낸 일을 적은 메모가 가장 많아요. 메모를 함께 읽고 짧게 답해 주면 기록하는 습관이 더 오래 이어져요.'];
                }
            };
            const lines = (notes[body.dataset.view] || notes.routine)();
            lastSection.insertAdjacentHTML('beforeend', `<div class="rd_section_note"><h4>이번 주 한눈에 보기</h4>${lines.map((t) => `<p>${t}</p>`).join('')}</div>`);
        }
        restoreParent();
        // 접기 버튼은 두 칸 밖(아래 가운데)으로
        const closeEl = body.querySelector('[data-ro-close]');
        if (closeEl) body.append(closeEl);
        body.querySelector('[data-ro-close]').addEventListener('click', () => {
            close();
            button.focus();
        });
        buttons.forEach((b) => b.setAttribute('aria-expanded', String(b === button)));
        const switching = detail.classList.contains('is-open');
        detail.hidden = false;
        // 숨김 → 보임 직후 한 번 그려 둔 뒤 열어야 높이가 0에서부터 부드럽게 늘어남
        void detail.offsetHeight;
        detail.classList.remove('is-swap');
        if (switching) {
            // 다른 사진으로 바꿀 때: 내용만 다시 떠오르게
            void detail.offsetWidth;
            detail.classList.add('is-swap');
        }
        detail.classList.add('is-open');
        openKey = key;
        // 칸이 열리기 시작하면 화면도 그 칸 위쪽(헤더 바로 아래)까지 부드럽게 내려감
        glideTo(detail);
    }));
});

document.addEventListener('DOMContentLoaded', () => {
    // 제목: "이번 주 기록" → 잠시 뒤 "이번 주 하루님의 기록" (이름 칸이 벌어지며 나타남)
    const who = document.querySelector('.ro_word [data-title-who]');
    if (!who) return;
    try {
        const full = (JSON.parse(localStorage.getItem('luup-my-profile'))?.name || '').trim();
        if (full) who.querySelector('[data-who-name]').textContent = full.length === 3 ? full.slice(1) : full;
    } catch { /* 기본 이름 */ }
    const sr = document.querySelector('.ro_word .sr_only');
    if (sr) sr.textContent = `이번 주 ${who.querySelector('[data-who-name]').textContent}님의 기록`;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(() => {
        who.style.setProperty('--who-w', `${who.scrollWidth}px`);
        who.classList.add('is-in');
    }, reduce ? 0 : 900));
});


document.addEventListener('DOMContentLoaded', () => {
    // 숫자 칸을 누르면 오른쪽에서 상세 페이지(시트)가 밀려 들어옴: 7일 날짜별 기록 + 한 줄 정리
    const body = document.querySelector('[data-ro-detail-body]');
    if (!body) return;
    const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
    const MOOD_NAMES = ['최고예요', '좋아요', '그저 그래요', '속상해요', '화나요'];
    const MEMOS = ['받아쓰기를 끝까지 혼자 해냈어요!', '영어 단어 10개 외우기 성공', '동생이랑 같이 책을 읽었어요', '줄넘기 50개 넘었어요', '아침에 알람 없이 일어났어요', '숙제를 저녁 먹기 전에 끝냈어요'];
    const seeded = (n) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
    const week = () => {
        const t = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(t.getFullYear(), t.getMonth(), t.getDate() - (6 - i));
            const n = Math.floor(date.getTime() / 86400000);
            return {
                day: `${WEEK[date.getDay()]}요일`, date: `${date.getMonth() + 1}/${date.getDate()}`, today: i === 6,
                done: 2 + Math.floor(seeded(n + 1) * 4),
                mood: Math.min(4, Math.floor(seeded(n + 2) * seeded(n + 3) * 5)),
                focus: 2 + Math.floor(seeded(n + 4) * 4),
                memo: seeded(n + 5) < 0.85 ? MEMOS[Math.floor(seeded(n + 6) * MEMOS.length)] : ''
            };
        }).reverse();
    };
    const rows = {
        routine: (d) => [`${d.done}/5개`, d.done === 5 ? '모두 해냈어요' : `${5 - d.done}개 남았어요`, d.done / 5],
        mood: (d) => [MOOD_NAMES[d.mood], d.mood >= 3 ? '이야기를 들어 주세요' : '좋은 하루였어요', (5 - d.mood) / 5],
        focus: (d) => [`${d.focus}점`, d.focus >= 4 ? '잘 집중했어요' : '집중이 어려웠어요', d.focus / 5],
        memo: (d) => [d.memo ? '메모 있음' : '쉬었어요', d.memo || '이날은 메모가 없어요', d.memo ? 1 : 0.08]
    };
    const sheet = document.createElement('div');
    sheet.className = 'rd_sheet';
    sheet.hidden = true;
    sheet.innerHTML = `<div class="rd_sheet_panel" role="dialog" aria-modal="true" aria-labelledby="rd-sheet-title" tabindex="-1">
        <button type="button" class="rd_sheet_close" data-sheet-close aria-label="닫기">✕</button>
        <div data-sheet-body></div></div>`;
    document.body.append(sheet);
    const sb = sheet.querySelector('[data-sheet-body]');
    let lastFocus = null;
    const close = () => {
        sheet.classList.remove('is-in');
        document.documentElement.classList.remove('is-sheet-open');
        setTimeout(() => { sheet.hidden = true; }, 350);
        lastFocus?.focus();
    };
    const open = (card) => {
        lastFocus = card;
        const key = body.dataset.view || 'routine';
        const label = card.querySelector('dt')?.textContent || '';
        const value = card.querySelector('dd')?.textContent || '';
        const note = card.querySelector('small')?.textContent || '';
        const title = body.querySelector('.rd_head h2')?.textContent || '';
        const list = week().map((d) => {
            const [v, text, ratio] = rows[key](d);
            return `<li${d.today ? ' class="is-today"' : ''}><div class="rs_day"><b>${d.day}</b><small>${d.date}${d.today ? ' · 오늘' : ''}</small></div><div class="rs_main"><p><b>${v}</b><span>${text}</span></p><i style="--v:${ratio}"></i></div></li>`;
        }).join('');
        sb.innerHTML = `
            <p class="rs_kicker">${title} · 자세히 보기</p>
            <h2 id="rd-sheet-title">${label}</h2>
            <p class="rs_big">${value}</p>
            ${note ? `<p class="rs_note">${note}</p>` : ''}
            <h3 class="rs_sub">날짜별 기록</h3>
            <ol class="rs_list">${list}</ol>`;
        sheet.hidden = false;
        document.documentElement.classList.add('is-sheet-open');
        requestAnimationFrame(() => {
            sheet.classList.add('is-in');
            sheet.querySelector('.rd_sheet_panel').focus();
        });
    };
    body.addEventListener('click', (e) => {
        const card = e.target.closest('[data-stat]');
        if (card) open(card);
    });
    body.addEventListener('keydown', (e) => {
        const card = e.target.closest('[data-stat]');
        if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(card); }
    });
    sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-sheet-close]')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) close(); });
});

document.addEventListener('DOMContentLoaded', () => {
    // 상세 시트가 열려 있는 동안: 뒤 페이지는 휠 · 터치 · 키로 스크롤되지 않음 (시트 안은 스크롤 가능)
    const root = document.documentElement;
    const insideScrollable = (node, dy) => {
        const panel = node.closest?.('.rd_sheet_panel');
        if (!panel) return false;
        return (dy > 0 && panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1) || (dy < 0 && panel.scrollTop > 0);
    };
    const block = (event, dy) => {
        if (!root.classList.contains('is-sheet-open')) return;
        if (insideScrollable(event.target, dy)) return;
        event.preventDefault();
    };
    window.addEventListener('wheel', (e) => block(e, e.deltaY), { passive: false, capture: true });
    let ty = 0;
    window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', (e) => block(e, ty - e.touches[0].clientY), { passive: false, capture: true });
    window.addEventListener('keydown', (e) => {
        if (!root.classList.contains('is-sheet-open')) return;
        if (e.target.closest?.('.rd_sheet_panel')) return;
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) e.preventDefault();
    }, true);
});

document.addEventListener('DOMContentLoaded', () => {
    // 날짜가 바뀌면(자정이 지나거나, 다른 날 다시 화면을 열면) 열려 있는 기록을 오늘 기준으로 다시 그림
    // → 그래프 맨 오른쪽은 항상 오늘 요일(파랑 + 점), 왼쪽은 그 전 6일
    const grid = document.querySelector('[data-ro-grid]');
    if (!grid) return;
    const dayKey = () => new Date().toDateString();
    let shown = dayKey();
    const refresh = () => {
        const now = dayKey();
        if (now === shown) return;
        shown = now;
        const openBtn = grid.querySelector('[data-ro-open][aria-expanded="true"]');
        if (!openBtn) return;
        openBtn.click();
        setTimeout(() => openBtn.click(), 60);
    };
    setInterval(refresh, 30 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.addEventListener('focus', refresh);
});
