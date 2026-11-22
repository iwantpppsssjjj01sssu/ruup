// Growth(성장 리포트) 페이지
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canObserve = 'IntersectionObserver' in window;

    // 화면에 들어오면 한 번만 실행
    const onceInView = (elements, callback, threshold = 0.35) => {
        if (prefersReducedMotion || !canObserve) {
            elements.forEach((el) => callback(el, true));
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    observer.unobserve(entry.target);
                    callback(entry.target, false);
                }
            });
        }, { threshold });
        elements.forEach((el) => observer.observe(el));
    };

    // 큰 숫자: 0부터 목표값까지 올라감
    onceInView(document.querySelectorAll('[data-count]'), (el, instant) => {
        const target = Number(el.dataset.count);
        if (instant) {
            el.textContent = target.toLocaleString('ko-KR');
            return;
        }
        const duration = 1400;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased).toLocaleString('ko-KR');
            if (t < 1) {
                requestAnimationFrame(step);
            }
        };
        el.textContent = '0';
        requestAnimationFrame(step);
    }, 0.6);

    // "실천율 42% → 81%": 화면에 들어오면 차례로 나타나고, 81은 42부터 세어 올라감
    const rate = document.querySelector('[data-rate]');
    if (rate && !prefersReducedMotion && 'IntersectionObserver' in window) {
        const num = rate.querySelector('[data-rate-num]');
        const from = Number(num.dataset.from);
        const to = Number(num.dataset.to);
        rate.classList.add('is-wait');
        num.textContent = String(from);
        const rateObserver = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting) {
                return;
            }
            rateObserver.disconnect();
            rate.classList.remove('is-wait');
            setTimeout(() => {
                const start = performance.now();
                const step = (now) => {
                    const t = Math.min((now - start) / 1100, 1);
                    num.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))));
                    if (t < 1) {
                        requestAnimationFrame(step);
                    } else {
                        rate.classList.add('is-done');
                    }
                };
                requestAnimationFrame(step);
                // 프레임이 멈춰도 최종 숫자는 반드시 맞게
                setTimeout(() => {
                    num.textContent = String(to);
                }, 1250);
            }, 800);
        }, { threshold: 0.6 });
        rateObserver.observe(rate);
    }

    // 첫 화면 오른쪽 위: 오늘 날짜 (예: 2026.11.16 (월))
    const todayDate = document.querySelector('[data-today-date]');
    if (todayDate) {
        const d = new Date();
        const two = (n) => String(n).padStart(2, '0');
        const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
        todayDate.textContent = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())} (${day})`;
        todayDate.setAttribute('datetime', `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`);
    }

    // 첫 화면 제목: 잠시 뒤 "나의" → "우리 아이의"로 바뀜 (칸 폭도 새 글자에 맞게 부드럽게 늘어남)
    const swap = document.querySelector('[data-title-swap]');
    if (swap) {
        const from = swap.querySelector('.gr_swap_from');
        const to = swap.querySelector('.gr_swap_to');
        const widthOf = (el) => `${el.getBoundingClientRect().width}px`;
        const run = () => {
            swap.classList.add('is-swapped');
            swap.style.setProperty('--swap-w', widthOf(to));
        };
        const start = () => {
            swap.style.setProperty('--swap-w', widthOf(from));
            if (prefersReducedMotion) {
                run();
            } else {
                setTimeout(run, 1800);
            }
        };
        // 웹폰트가 적용된 뒤에 폭을 재야 정확함
        (document.fonts?.ready || Promise.resolve()).then(start);
        window.addEventListener('resize', () => {
            swap.style.setProperty('--swap-w', widthOf(swap.classList.contains('is-swapped') ? to : from));
        });
    }

    // 달성한 목표: "이번 주 목표 현황 확인하기"를 누르면 목표 블록이 차례로 올라오며 펼쳐짐 (다시 누르면 접힘)
    const goalsToggle = document.querySelector('[data-goals-toggle]');
    const goals = document.querySelector('[data-goals]');
    if (goalsToggle && goals) {
        const goalsLabel = goalsToggle.querySelector('[data-goals-label]');
        const goalsHint = goalsToggle.querySelector('small');
        goalsToggle.addEventListener('click', () => {
            const open = !goals.classList.contains('is-open');
            goals.classList.toggle('is-open', open);
            // 닫혀 있을 땐 안의 내용에 키보드·스크린리더가 닿지 않게
            goals.inert = !open;
            goalsToggle.setAttribute('aria-expanded', String(open));
            goalsLabel.textContent = open ? '목표 현황 접기' : '이번 주 목표 현황 확인하기';
            goalsHint.textContent = open ? '눌러서 접기' : '눌러서 펼쳐 보기';
            if (open) {
                // 공통 스크롤 등장 효과(reveal)는 바로 보이게 하고, 여기서는 펼침 애니메이션만 씀 (화면은 움직이지 않음)
                goals.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-in'));
                goals.classList.remove('is-opening');
                void goals.offsetWidth;
                goals.classList.add('is-opening');
            }
        });
    }

    // 완료한 일: 기간 탭을 누르면 제목·기간·분야별 숫자와 막대가 바뀜
    const done = document.querySelector('[data-done]');
    if (done) {
        const rows = done.querySelectorAll('.gr_cats li');
        const periodText = done.querySelector('[data-done-period]');
        const totalText = done.querySelector('[data-done-total]');
        const rangeText = done.querySelector('[data-done-range]');
        const animateNumber = (el, to) => {
            const from = Number(el.textContent.replace(/[^0-9]/g, '')) || 0;
            if (prefersReducedMotion || from === to) {
                el.textContent = to.toLocaleString('ko-KR');
                return;
            }
            const start = performance.now();
            const token = Symbol('count');
            el.countToken = token;
            const step = (now) => {
                if (el.countToken !== token) {
                    return;
                }
                const t = Math.min((now - start) / 500, 1);
                el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))).toLocaleString('ko-KR');
                if (t < 1) {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
            // 탭이 백그라운드라 프레임이 멈춰도 최종 숫자는 반드시 맞게
            setTimeout(() => {
                if (el.countToken === token) {
                    el.textContent = to.toLocaleString('ko-KR');
                }
            }, 560);
        };
        window.luupChips(done.querySelector('[data-done-tabs]'), (button) => {
            const period = button.dataset.period;
            const values = [...rows].map((row) => Number(row.dataset[period]));
            const max = Math.max(...values);
            const total = values.reduce((sum, v) => sum + v, 0);
            rows.forEach((row, i) => {
                row.style.setProperty('--v', (values[i] / max).toFixed(2));
                animateNumber(row.querySelector('b'), values[i]);
            });
            periodText.textContent = button.dataset.label;
            totalText.textContent = `${total.toLocaleString('ko-KR')}개`;
            rangeText.textContent = button.dataset.range;
        });
    }

    // 그래프 선 그리기 · 달력 칸 채우기
    // 달력은 칸이 크고 높아서, 위쪽이 보이기 시작하면 바로(20%) 시작해야 칸이 떠오르는 모습이 보임
    onceInView(document.querySelectorAll('[data-chart]'), (el) => el.classList.add('is-in'));
    onceInView(document.querySelectorAll('.gr_heat'), (el) => el.classList.add('is-in'), 0.2);

    // 작은 대문자 라벨: 글자가 잠깐 뒤섞였다가 왼쪽부터 제자리로
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    onceInView(document.querySelectorAll('[data-scramble-label]'), (el, instant) => {
        if (instant) {
            return;
        }
        const text = el.textContent;
        el.setAttribute('aria-label', text);
        const frames = 14;
        let frame = 0;
        const tick = () => {
            const settled = Math.floor((frame / frames) * text.length);
            el.textContent = [...text].map((ch, i) => (
                i < settled || !/[A-Z0-9]/.test(ch) ? ch : pool[Math.floor(Math.random() * pool.length)]
            )).join('');
            frame += 1;
            if (frame <= frames) {
                setTimeout(tick, 28);
            } else {
                el.textContent = text;
            }
        };
        tick();
    }, 0.6);
});

document.addEventListener('DOMContentLoaded', () => {
    // 성장 일지 카드 4장: 누르면 가운데에 큰 일지가 펼쳐지며 자세한 기록(실천율 · 최장 연속 등)이 나옴
    const board = document.querySelector('.gr_log');
    const detail = board?.querySelector('[data-gl-detail]');
    const body = detail?.querySelector('[data-gl-body]');
    if (!board || !detail || !body) {
        return;
    }
    const cards = [...board.querySelectorAll('[data-gl-open]')];
    const rates = [42, 48, 51, 58, 63, 67, 74, 81];
    const heat = [...document.querySelectorAll('.gr_heat .gr_day')].map((day) => (day.className.match(/lv(\d)/) || [0, 0])[1]);
    const goals = [...document.querySelectorAll('.gr_item')].map((item) => ({
        name: item.querySelector('.gr_name')?.textContent || '',
        rate: item.querySelector('.gr_meta b')?.textContent || '',
        date: item.querySelector('.gr_meta dd')?.textContent || ''
    }));

    const views = {
        rate: {
            no: '01', title: '성장률', big: '+43%',
            lead: `8주 전 <b>${rates[0]}%</b>였던 실천율이 이번 주 <b>${rates[rates.length - 1]}%</b>까지 올랐어요. 한 주도 빠짐없이 조금씩 올라간 것이 가장 큰 변화예요.`,
            html: () => {
                const xs = rates.map((_, i) => 20 + i * (460 / (rates.length - 1)));
                const ys = rates.map((r) => 180 - (r / 100) * 160);
                const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x} ${ys[i]}`).join(' ');
                return `<svg class="gld_line" viewBox="0 0 500 210" role="img" aria-label="주별 실천율 ${rates.join('%, ')}%">
                    <path class="gld_area" d="${line} L${xs[xs.length - 1]} 180 L${xs[0]} 180 Z"/>
                    <path class="gld_stroke" d="${line}" pathLength="1"/>
                    ${xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="${i === xs.length - 1 ? 6 : 4}"/><text x="${x}" y="${ys[i] - 12}">${rates[i]}%</text><text class="gld_x" x="${x}" y="204">${i + 1}주</text>`).join('')}
                </svg>`;
            }
        },
        streak: {
            no: '02', title: '연속 기록', big: '최장 18일',
            lead: '최근 5주 동안 가장 길게 이어간 기록은 <b>18일 연속</b>이에요. 마지막 2주는 하루도 빠지지 않았어요.',
            html: () => `<ol class="gld_heat">${heat.map((lv) => `<li class="lv${lv}"></li>`).join('')}</ol>
                <p class="gld_legend"><span class="lv0"></span>기록 없음 <span class="lv1"></span>일부 <span class="lv2"></span>대부분 <span class="lv3"></span>모두 완료</p>`
        },
        done: {
            no: '03', title: '완료한 할 일', big: '126개',
            lead: '최근 8주 동안 완료한 할 일은 모두 <b>126개</b>예요. <b>생활 습관</b>이 가장 많고, 그다음은 <b>공부</b>예요.',
            html: () => {
                const cats = [['생활 습관', 48], ['공부', 36], ['운동', 24], ['독서', 18]];
                return `<ul class="gld_cats">${cats.map(([name, n]) => `<li><span>${name}</span><i style="--v:${n / 48}"></i><b>${n}개</b></li>`).join('')}</ul>`;
            }
        },
        goals: {
            no: '04', title: '해낸 목표', big: '7개',
            lead: '지금까지 끝까지 해낸 목표는 <b>7개</b>예요. 최근에 달성한 목표 4개를 모았어요.',
            html: () => `<ul class="gld_goals">${goals.map((g) => `<li><span>${g.name}</span><small>${g.date} 달성</small><b>${g.rate}</b></li>`).join('')}</ul>`
        }
    };

    let openKey = null;
    const close = () => {
        detail.classList.remove('is-open');
        board.classList.remove('is-detail');
        cards.forEach((c) => c.setAttribute('aria-expanded', 'false'));
        const last = cards.find((c) => c.dataset.glOpen === openKey);
        openKey = null;
        setTimeout(() => {
            if (!openKey) detail.hidden = true;
        }, 400);
        last?.focus();
    };
    const open = (card) => {
        const key = card.dataset.glOpen;
        if (openKey === key) {
            close();
            return;
        }
        const v = views[key];
        body.innerHTML = `
            <p class="gld_head">No.${v.no} · 자세히 보기</p>
            <h3 id="gl-detail-title" class="gld_title">${v.title}</h3>
            <p class="gld_big">${v.big}</p>
            <p class="gld_lead">${v.lead}</p>
            <div class="gld_body">${v.html()}</div>`;
        cards.forEach((c) => c.setAttribute('aria-expanded', String(c === card)));
        detail.hidden = false;
        board.classList.add('is-detail');
        requestAnimationFrame(() => detail.classList.add('is-open'));
        openKey = key;
    };
    // 카드를 누르면 아래에 있는 해당 섹션(주별 실천율 · 연속 달력 · 완료한 일 · 달성한 목표)으로 부드럽게 내려감
    const targets = { rate: '#gr-rate-title', streak: '#gr-streak-title', done: '#gr-done-title', goals: '#gr-goal-title' };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const goTo = (card) => {
        const section = document.querySelector(targets[card.dataset.glOpen])?.closest('section');
        if (!section) {
            open(card);
            return;
        }
        const header = document.querySelector('.site_header');
        const offset = (header ? header.getBoundingClientRect().height : 0) + 24;
        const start = window.scrollY;
        const end = section.getBoundingClientRect().top + start - offset;
        const root = document.documentElement;
        const finish = () => {
            root.style.scrollBehavior = '';
            section.classList.remove('gl_flash');
            void section.offsetWidth;
            section.classList.add('gl_flash');
            if (card.dataset.glOpen === 'goals') {
                const toggle = section.querySelector('[data-goals-toggle]');
                if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
            }
        };
        if (reduceMotion) {
            window.scrollTo(0, end);
            finish();
            return;
        }
        root.style.scrollBehavior = 'auto';
        const duration = 1000;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const step = (now) => {
            const t = Math.min((now - t0) / duration, 1);
            window.scrollTo(0, start + (end - start) * ease(t));
            if (t < 1) requestAnimationFrame(step);
            else finish();
        };
        requestAnimationFrame(step);
    };
    cards.forEach((card) => {
        card.addEventListener('click', () => open(card));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open(card);
            }
        });
    });
    detail.querySelector('[data-gl-close]').addEventListener('click', close);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && openKey) close();
    });
});
