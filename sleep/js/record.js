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
    // 기록 첫 화면: 사진 줄과 기록 목록이 자동으로 다음 기록으로 넘어감, 목록 이름을 누르면 그 기록으로
    const ro = document.querySelector('[data-ro]');
    if (!ro) {
        return;
    }
    const items = [...ro.querySelectorAll('.ro_item')];
    const names = [...ro.querySelectorAll('[data-ro-names] button')];
    const no = ro.querySelector('[data-ro-no]');
    const cat = ro.querySelector('[data-ro-cat]');
    const tag = ro.querySelector('[data-ro-tag]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = items.length;
    let current = 0;
    let timer = null;

    // 지금 기록 기준 위치: -1(위) 0(가운데) 1(아래), 나머지는 아래 밖(2)에 숨김
    const offsetOf = (i) => ((i - current + n + 1) % n) - 1;

    const show = (index) => {
        current = index;
        items.forEach((item, i) => {
            const o = offsetOf(i);
            const before = Number(item.style.getPropertyValue('--o') || o);
            // 아래 밖에서 위로 한 번에 건너가는 카드는 움직임 없이 자리만 옮김
            item.classList.toggle('no-anim', Math.abs(o - before) > 1);
            item.style.setProperty('--o', o);
            item.classList.toggle('is-current', o === 0);
            item.classList.toggle('is-hidden', o > 1);
        });
        names.forEach((name, i) => name.setAttribute('aria-current', String(i === index)));
        no.textContent = index + 1;
        cat.textContent = names[index].dataset.cat;
        tag.textContent = names[index].dataset.tag;
    };

    const start = () => {
        clearInterval(timer);
        if (!reduce) {
            timer = setInterval(() => show((current + 1) % n), 3200);
        }
    };

    names.forEach((name, i) => name.addEventListener('click', () => {
        show(i);
        start();
    }));

    show(0);
    start();
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
