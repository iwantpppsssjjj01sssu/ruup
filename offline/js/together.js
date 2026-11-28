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
    document.querySelectorAll('[data-today-date]').forEach((todayDate) => {
        const d = new Date();
        const two = (n) => String(n).padStart(2, '0');
        const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
        todayDate.textContent = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())} (${day})`;
        todayDate.setAttribute('datetime', `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`);
    });

    // 첫 화면 제목: 잠시 뒤 "나의" → "우리 아이의"로 바뀜 (칸 폭도 새 글자에 맞게 부드럽게 늘어남)
    const swap = document.querySelector('[data-title-swap]');
    if (swap) {
        const from = swap.querySelector('.gr_swap_from');
        const to = swap.querySelector('.gr_swap_to');
        const widthOf = (el) => `${el.getBoundingClientRect().width}px`;
        const run = () => {
            swap.classList.add('is-swapped');
            swap.style.setProperty('--swap-w', widthOf(to));
            // 바뀐 뒤에는 고정 폭을 풀어 글자 크기가 바뀌어도 "성장"과 겹치지 않게
            setTimeout(() => swap.classList.add('is-done'), prefersReducedMotion ? 0 : 1200);
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
            if (!swap.classList.contains('is-done')) {
                swap.style.setProperty('--swap-w', widthOf(swap.classList.contains('is-swapped') ? to : from));
            }
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
            const stack = done.querySelectorAll('[data-done-stack] span');
            rows.forEach((row, i) => {
                row.style.setProperty('--v', (values[i] / max).toFixed(2));
                animateNumber(row.querySelector('b'), values[i]);
                const share = row.querySelector('[data-share]');
                if (share) share.textContent = `${Math.round((values[i] / total) * 100)}%`;
                if (stack[i]) stack[i].style.flexGrow = values[i];
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

document.addEventListener('DOMContentLoaded', () => {
    // 성장 리포트 목차: 네모를 누르면 해당 페이지가 아래에 한 장 추가됨 (다시 누르면 뺌)
    const tiles = [...document.querySelectorAll('[data-add-page]')];
    if (!tiles.length) {
        return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pages = [...document.querySelectorAll('[data-page]')];
    const glide = (el) => {
        const header = document.querySelector('.site_header');
        const offset = (header ? header.getBoundingClientRect().height : 0) + 20;
        const start = window.scrollY;
        const end = el.getBoundingClientRect().top + start - offset;
        if (reduce) {
            window.scrollTo(0, end);
            return;
        }
        const root = document.documentElement;
        root.style.scrollBehavior = 'auto';
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const step = (now) => {
            const t = Math.min((now - t0) / 900, 1);
            window.scrollTo(0, start + (end - start) * ease(t));
            if (t < 1) requestAnimationFrame(step);
            else root.style.scrollBehavior = '';
        };
        requestAnimationFrame(step);
    };
    const renumber = () => {
        const shown = pages.filter((page) => !page.hidden);
        const total = shown.length + 1;
        shown.forEach((page, i) => page.setAttribute('data-page-no', `${i + 2} / ${total}`));
        document.querySelector('.gr_report')?.setAttribute('data-page-total', `1 / ${total}`);
    };
    tiles.forEach((tile) => tile.addEventListener('click', () => {
        const page = pages.find((p) => p.dataset.page === tile.dataset.addPage);
        if (!page) return;
        const add = page.hidden;
        page.hidden = !add;
        tile.setAttribute('aria-pressed', String(add));
        tile.querySelector('i').textContent = add ? '✓' : '+';
        renumber();
        if (add) {
            page.classList.remove('is-new');
            void page.offsetWidth;
            page.classList.add('is-new');
            // 안쪽 숫자·그래프 등장 연출이 바로 보이도록 reveal 표시
            page.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in', 'is-visible'));
            page.querySelectorAll('[data-chart], .gr_heat').forEach((el) => el.classList.add('is-in'));
            setTimeout(() => glide(page), 60);
        }
    }));
    renumber();
});

document.addEventListener('DOMContentLoaded', () => {
    // 핵심 지표 기둥 4개: 누르면 그 기둥이 화면 전체로 펼쳐짐 (✕ · Esc · 다시 누르면 닫힘)
    const wrap = document.querySelector('[data-cols]');
    if (!wrap) {
        return;
    }
    const cols = [...wrap.querySelectorAll('.gc_col')];
    const closeBtn = wrap.querySelector('[data-col-close]');
    const close = () => {
        wrap.classList.remove('is-open');
        cols.forEach((c) => {
            c.classList.remove('is-open');
            c.querySelector('[data-col-open]').setAttribute('aria-expanded', 'false');
        });
        closeBtn.hidden = true;
    };
    cols.forEach((col) => {
        const btn = col.querySelector('[data-col-open]');
        btn.addEventListener('click', () => {
            if (col.classList.contains('is-open')) {
                close();
                return;
            }
            cols.forEach((c) => {
                c.classList.toggle('is-open', c === col);
                c.querySelector('[data-col-open]').setAttribute('aria-expanded', String(c === col));
            });
            wrap.classList.add('is-open');
            closeBtn.hidden = false;
        });
    });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && wrap.classList.contains('is-open')) close();
    });
    // "보기" 버튼: 목차의 해당 페이지를 추가하고 그리로 이동
    wrap.querySelectorAll('[data-col-go]').forEach((go) => {
        go.addEventListener('click', () => {
            const tile = document.querySelector(`[data-add-page="${go.dataset.colGo}"]`);
            if (tile && tile.getAttribute('aria-pressed') !== 'true') {
                tile.click();
            } else {
                document.querySelector(`[data-page="${go.dataset.colGo}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 성장 리포트 = 기둥 4개로 통일: 기존 페이지(주별 실천율 · 연속 달력 · 완료한 일 · 달성 목표)를 각 기둥 안 상세 칸으로 옮김
    const wrap = document.querySelector('[data-cols]');
    if (!wrap) {
        return;
    }
    wrap.querySelectorAll('[data-col-detail]').forEach((detail) => {
        const key = detail.dataset.colDetail;
        const page = document.querySelector(`[data-page="${key}"]`);
        const intro = detail.closest('.gc_col').querySelector('.gc_more p');
        if (intro) {
            const lead = document.createElement('p');
            lead.className = 'gc_detail_lead';
            lead.textContent = intro.textContent;
            detail.append(lead);
        }
        if (page) {
            page.hidden = false;
            page.removeAttribute('data-page');
            page.classList.add('gc_page');
            detail.append(page);
        }
    });
    // 기둥을 열면: 그래프 선 · 달력 · 숫자 등장 연출을 바로 보여 주고, 목표 목록은 펼쳐 둠
    wrap.querySelectorAll('[data-col-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const col = btn.closest('.gc_col');
            const detail = col.querySelector('.gc_detail');
            setTimeout(() => {
                if (!col.classList.contains('is-open')) return;
                detail.scrollTop = 0;
                detail.querySelectorAll('[data-chart], .gr_heat').forEach((el) => el.classList.add('is-in'));
                detail.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in', 'is-visible'));
                const toggle = detail.querySelector('[data-goals-toggle]');
                if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
            }, 500);
        });
    });
    // 종합 소견은 기둥 아래 한 줄 판으로 늘 보이게
    const opinion = document.querySelector('[data-page="opinion"]');
    if (opinion) {
        opinion.hidden = false;
        opinion.removeAttribute('data-page');
        opinion.classList.add('gc_opinion');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // "다음 단계 · 새 루틴 만들기"를 페이지 맨 아래에서 제목 옆 오른쪽 위로 옮김
    const end = document.querySelector('.gr_report > .gr_end');
    const hero = document.querySelector('.gr_report > .gr_hero');
    if (end && hero) {
        end.classList.add('gr_end_top');
        hero.append(end);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 펼친 기둥: 사진 위에 흰 글씨 설명 + 동그란 미리보기(그래프 · 달력 · 비율 · 개수)
    // 동그라미나 "자세히 보기"를 누르면 그때 상세 카드가 열림
    const wrap = document.querySelector('[data-cols]');
    if (!wrap) {
        return;
    }
    const rates = [42, 48, 51, 58, 63, 67, 74, 81];
    const orbArt = {
        rate: () => {
            // 참고 그래프처럼: 세로 격자선 · 부드러운 곡선(왼쪽은 흐리게 → 오른쪽 진하게) · 끝 점 후광 · 떠 있는 값 카드 · 아래 주차
            const xs = rates.map((_, i) => 12 + i * (76 / (rates.length - 1)));
            const ys = rates.map((r) => 70 - ((r - 40) / 45) * 46);
            let d = `M${xs[0]} ${ys[0]}`;
            for (let i = 1; i < xs.length; i += 1) {
                const cx = (xs[i - 1] + xs[i]) / 2;
                d += ` C${cx} ${ys[i - 1]} ${cx} ${ys[i]} ${xs[i]} ${ys[i]}`;
            }
            const ex = xs[xs.length - 1];
            const ey = ys[ys.length - 1];
            const grid = [2, 4, 6, 7].map((i) => `<line x1="${xs[i]}" y1="18" x2="${xs[i]}" y2="76" stroke="rgba(17,19,24,.07)" stroke-width=".6"/>`).join('');
            return `<svg viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                    <linearGradient id="orbLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2563eb" stop-opacity="0"/><stop offset=".45" stop-color="#2563eb" stop-opacity=".45"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
                    <radialGradient id="orbHalo"><stop offset="0" stop-color="#2563eb" stop-opacity=".28"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></radialGradient>
                </defs>
                ${grid}
                <path class="orb_line" d="${d}" pathLength="1" fill="none" stroke="url(#orbLine)" stroke-width="2.4" stroke-linecap="round"/>
                <circle class="orb_dot" cx="${ex}" cy="${ey}" r="9" fill="url(#orbHalo)"/>
                <circle class="orb_dot" cx="${ex}" cy="${ey}" r="3.6" fill="#2563eb" stroke="#fff" stroke-width="1.4"/>
                
                <text x="${xs[2]}" y="87" font-size="4.6" text-anchor="middle" fill="#c4cad4">3주</text>
                <text x="${xs[4]}" y="87" font-size="4.6" text-anchor="middle" fill="#9aa1ab">5주</text>
                <text x="${xs[6]}" y="87" font-size="4.6" text-anchor="middle" fill="#6b7280">7주</text>
                <text x="${ex}" y="87" font-size="4.6" text-anchor="middle" font-weight="700" fill="#2563eb">8주</text>
            </svg>`;
        },
        streak: () => {
            const cells = [...document.querySelectorAll('.gr_heat .gr_day')].slice(-21).map((el, i) => `<i class="${(el.className.match(/lv\d/) || ['lv0'])[0]}" style="--k:${i}"></i>`).join('');
            return `<span class="orb_heat">${cells}</span><b>18일 연속 달성</b>`;
        },
        done: () => {
            const vals = [9, 7, 5, 3];
            const total = vals.reduce((a, b) => a + b, 0);
            let acc = 0;
            const colors = ['#1d4ed8', '#4f8cf5', '#93b4f5', '#c7d7fa'];
            const stops = vals.map((v, i) => { const from = acc; acc += (v / total) * 360; return `${colors[i]} ${from}deg ${acc}deg`; }).join(',');
            return `<span class="orb_donut" style="background:conic-gradient(${stops})"></span><b>이번 주 24개</b>`;
        },
        goals: () => {
            // 네모 블록 7개가 위에서 떨어져 쌓임 (아래 4 · 위 3)
            const spots = [[0, 0], [1, 0], [2, 0], [3, 0], [0.5, 1], [1.5, 1], [2.5, 1]];
            const blocks = spots.map(([x, y], i) => `<i style="--x:${x};--y:${y};--k:${i}"></i>`).join('');
            return `<span class="orb_stack">${blocks}</span><b>7개 달성</b>`;
        }
    };
    wrap.querySelectorAll('.gc_col').forEach((col) => {
        const key = col.dataset.col;
        const text = col.querySelector('.gc_more p')?.textContent || '';
        const layer = document.createElement('div');
        layer.className = 'gc_layer';
        layer.innerHTML = `
            <button type="button" class="gc_orb" aria-label="자세히 보기">${orbArt[key] ? orbArt[key]() : ''}<i class="gc_orb_go" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></i></button>
            <p class="gc_caption">${text}</p>
            <button type="button" class="gc_hint">자세히 보기 <i aria-hidden="true">↘</i></button>`;
        col.append(layer);
        const toggleDetail = () => col.classList.toggle('is-detail');
        layer.querySelector('.gc_hint').addEventListener('click', toggleDetail);
        // 기둥을 닫거나 다른 기둥을 열면 상세 카드도 닫힘
        col.querySelector('[data-col-open]').addEventListener('click', () => {
            wrap.querySelectorAll('.gc_col').forEach((c) => c.classList.remove('is-detail'));
        });
    });
    wrap.querySelector('[data-col-close]')?.addEventListener('click', () => {
        wrap.querySelectorAll('.gc_col').forEach((c) => c.classList.remove('is-detail'));
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 기둥을 누르면 판 전체가 화면을 꽉 채움 (양옆 여백 · 위 제목까지 덮음), 열려 있는 동안 페이지 스크롤 잠금
    // 원래 자리에서 화면 전체로 넓어지는 움직임(clip-path), 닫으면 다시 원래 자리로 줄어듦
    const wrap = document.querySelector('[data-cols]');
    if (!wrap) {
        return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const spacer = document.createElement('div');
    spacer.className = 'gc_spacer';
    const insetOf = (r) => `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 6px)`;
    let full = false;
    const goFull = () => {
        if (full) return;
        full = true;
        const r = wrap.getBoundingClientRect();
        spacer.style.height = `${wrap.offsetHeight}px`;
        wrap.before(spacer);
        wrap.classList.add('is-full');
        root.classList.add('is-col-open');
        if (!reduce) {
            wrap.style.transition = 'none';
            wrap.style.clipPath = insetOf(r);
            void wrap.offsetWidth;
            wrap.style.transition = 'clip-path 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
            wrap.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
        }
    };
    const exitFull = () => {
        if (!full) return;
        full = false;
        const finish = () => {
            wrap.classList.remove('is-full');
            wrap.style.clipPath = '';
            wrap.style.transition = '';
            spacer.remove();
            root.classList.remove('is-col-open');
        };
        if (reduce) {
            finish();
            return;
        }
        const r = spacer.getBoundingClientRect();
        wrap.style.transition = 'clip-path 0.7s cubic-bezier(0.76, 0, 0.24, 1)';
        wrap.style.clipPath = insetOf({ top: r.top, bottom: r.bottom, left: r.left + (spacer.offsetLeft - spacer.getBoundingClientRect().left), right: r.right });
        setTimeout(finish, 700);
    };
    // 열림 상태(is-open) 변화를 지켜보며 전체 화면 켜고 끄기
    new MutationObserver(() => {
        if (wrap.classList.contains('is-open')) goFull();
        else exitFull();
    }).observe(wrap, { attributes: true, attributeFilter: ['class'] });
});

document.addEventListener('DOMContentLoaded', () => {
    // 큰 제목 아래 "성장 기록 살펴보기": 첫 번째 기둥(성장률)을 펼침
    document.querySelector('[data-cols-explore]')?.addEventListener('click', () => {
        document.querySelector('[data-col="rate"] [data-col-open]')?.click();
    });
});


document.addEventListener('DOMContentLoaded', () => {
    // 펼친 기둥 위의 글 · 도형마다 서로 다른 정보 카드
    // 위 작은 글 → 실천 팁 / 큰 이름 → 지난달과 비교 / 동그라미 → 세부 숫자 / 아래 설명 → LUUP 해석
    const wrap = document.querySelector('[data-cols]');
    if (!wrap) {
        return;
    }
    const INFO = {
        rate: {
            top: ['주마다 오른 폭', '<ul><li>1→2주 <b>+6%p</b></li><li>2→3주 <b>+3%p</b></li><li>3→4주 <b>+7%p</b></li><li>4→5주 <b>+5%p</b></li><li>5→6주 <b>+4%p</b></li><li>6→7주 <b>+7%p</b></li><li>7→8주 <b>+7%p</b></li></ul>'],
            name: ['지난달과 비교', '<p>지난달 평균 실천율 <b>38%</b> → 이번 달 <b>81%</b></p><p>한 달 사이 <b>+43%p</b> 올랐어요. 같은 또래 평균(62%)보다 19%p 높아요.</p>'],
            orb: ['가장 많이 · 적게 오른 주', '<p>가장 크게 오른 주: <b>3→4주 · 6→7주 · 7→8주 (+7%p)</b></p><p>가장 적게 오른 주: <b>2→3주 (+3%p)</b> — 학교 행사가 많던 주예요.</p>'],
            caption: ['LUUP 해석', '<p class="pop_turn"><span>변화가 시작된 날</span><b>10월 22일 (4주차)</b></p><p>이날 <b>아침 8시 기상</b> 루틴을 시작한 뒤로 실천율이 주마다 평균 <b>+3%p → +6%p</b>로 두 배 빨리 올랐어요.</p><p>한 주도 내려가지 않은 건 루틴이 <b>습관으로 자리 잡는 신호</b>예요. 새 루틴은 한 번에 하나씩만 더해 보세요.</p>']
        },
        streak: {
            top: ['빠짐없이 이어 가는 요령', '<ul><li>잠들기 전 <b>내일 할 일 1개</b>만 정해 두기</li><li>가장 쉬운 루틴을 <b>하루 첫 루틴</b>으로</li><li>바쁜 날은 <b>짧은 버전</b>이라도 체크</li></ul>'],
            name: ['연속 기록 변화', '<p>지난달 최장 연속 <b>9일</b> → 이번 달 <b>18일</b></p><p>2배로 늘었어요. 지금은 <b>14일째</b> 이어 가는 중이에요.</p>'],
            orb: ['요일별 실천', '<ul><li>월 · 화 · 수 <b>모두 완료가 가장 많아요</b></li><li>토요일 <b>빠진 날 2일</b></li><li>일요일 <b>일부만 한 날 3일</b></li></ul>'],
            caption: ['LUUP 해석', '<p class="pop_turn"><span>연속 기록이 시작된 날</span><b>11월 6일 (목)</b></p><p>이날 <b>토요일 아침 가족 산책</b>을 루틴에 넣은 뒤로 주말에도 빠지지 않고 18일째 이어 가고 있어요.</p><p>그 전에는 주말마다 끊겨 최장 9일이었어요.</p>']
        },
        done: {
            top: ['하루 평균 완료', '<p>하루 평균 <b>2.3개</b>를 완료했어요.</p><p>가장 많이 한 날은 <b>11월 12일 (6개)</b>예요.</p>'],
            name: ['지난달과 비교', '<p>지난달 <b>94개</b> → 이번 달 <b>126개</b></p><p>32개 더 해냈어요 (<b>+34%</b>).</p>'],
            orb: ['분야별 비율', '<ul><li>생활 습관 <b>48개 · 38%</b></li><li>공부 <b>36개 · 29%</b></li><li>운동 <b>24개 · 19%</b></li><li>독서 <b>18개 · 14%</b></li></ul>'],
            caption: ['LUUP 해석', '<p class="pop_turn"><span>완료가 늘기 시작한 날</span><b>11월 3일 (월)</b></p><p>이날 <b>저녁 루틴을 8시 → 7시</b>로 옮긴 뒤 하루 평균 완료가 <b>1.8개 → 2.8개</b>로 늘었어요.</p><p>다만 <b>독서</b> 비중은 아직 가장 낮아요. 10분짜리로 줄여 보세요.</p>']
        },
        goals: {
            top: ['목표 달성 팁', '<ul><li>목표는 <b>2~3주 길이</b>가 가장 잘 지켜져요</li><li>달성하면 <b>작은 보상</b>을 함께 정해 두세요</li></ul>'],
            name: ['달성 기록', '<p>지금까지 <b>7개</b> 달성 · 진행 중 <b>2개</b></p><p>최근 달성: 아침 8시 기상 21일 (11.12)</p>'],
            orb: ['달성률이 높은 목표', '<ul><li>아침 8시 기상 21일 <b>100%</b></li><li>물 8잔 마시기 2주 <b>100%</b></li><li>하루 20페이지 독서 <b>93%</b></li><li>하루 30분 걷기 <b>93%</b></li></ul>'],
            caption: ['LUUP 해석', '<p class="pop_turn"><span>달성이 이어진 시작점</span><b>10월 22일 (4주차)</b></p><p>이날 시작한 <b>아침 8시 기상 21일</b>을 11월 12일에 끝까지 해낸 뒤로, 3주 사이 목표 <b>3개</b>를 연달아 달성했어요.</p><p>다음 목표도 <b>숫자로 정해진 짧은 목표</b>로 세워 보세요.</p>']
        }
    };
    const pop = document.createElement('div');
    pop.className = 'gc_pop';
    pop.setAttribute('role', 'dialog');
    pop.hidden = true;
    wrap.append(pop);
    let current = null;
    const hide = () => {
        pop.classList.remove('is-in');
        pop.hidden = true;
        current?.classList.remove('is-active');
        current = null;
    };
    const show = (el, key, part) => {
        const info = INFO[key]?.[part];
        if (!info) return;
        if (current === el) { hide(); return; }
        current?.classList.remove('is-active');
        current = el;
        el.classList.add('is-active');
        pop.innerHTML = `<p class="gc_pop_title">${info[0]}</p><div class="gc_pop_body">${info[1]}</div>`;
        pop.hidden = false;
        const wr = wrap.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const w = Math.min(320, wr.width - 32);
        let left = r.left - wr.left + r.width / 2 - w / 2;
        left = Math.max(16, Math.min(left, wr.width - w - 16));
        const below = r.bottom - wr.top + 12;
        pop.style.width = `${w}px`;
        pop.style.left = `${left}px`;
        if (below + 220 < wr.height) {
            pop.style.top = `${below}px`;
            pop.style.bottom = 'auto';
        } else {
            pop.style.top = 'auto';
            pop.style.bottom = `${wr.bottom - r.top + 12}px`;
        }
        requestAnimationFrame(() => pop.classList.add('is-in'));
    };
    wrap.querySelectorAll('.gc_col').forEach((col) => {
        const key = col.dataset.col;
        const parts = [['.gc_top', 'top'], ['.gc_name', 'name'], ['.gc_orb', 'orb'], ['.gc_caption', 'caption']];
        // 열려 있을 때 이 글 · 도형을 누르면 기둥이 닫히지 않고 정보 카드가 뜸
        col.addEventListener('click', (event) => {
            if (!col.classList.contains('is-open') || col.classList.contains('is-detail')) return;
            for (const [sel, part] of parts) {
                const el = event.target.closest(sel);
                if (el && col.contains(el)) {
                    event.preventDefault();
                    event.stopPropagation();
                    show(el, key, part);
                    return;
                }
            }
        }, true);
        parts.forEach(([sel]) => col.querySelectorAll(sel).forEach((el) => el.classList.add('gc_tap')));
    });
    document.addEventListener('click', (event) => {
        if (!pop.hidden && !pop.contains(event.target) && !event.target.closest('.gc_tap')) hide();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !pop.hidden) hide();
    });
    new MutationObserver(() => { if (!wrap.classList.contains('is-open')) hide(); }).observe(wrap, { attributes: true, attributeFilter: ['class'] });
    wrap.querySelectorAll('.gc_hint').forEach((h) => h.addEventListener('click', hide));
});


document.addEventListener('DOMContentLoaded', () => {
    // ✕ 버튼: 상세 카드가 열려 있으면 상세만 닫고 사진(동그라미 화면)으로 돌아감 → 그다음 ✕로 기둥 전체 닫기
    const wrap = document.querySelector('[data-cols]');
    const closeBtn = wrap?.querySelector('[data-col-close]');
    if (!closeBtn) {
        return;
    }
    closeBtn.addEventListener('click', (event) => {
        const detailCol = wrap.querySelector('.gc_col.is-open.is-detail');
        if (detailCol) {
            event.stopImmediatePropagation();
            detailCol.classList.remove('is-detail');
        }
    }, true);
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const detailCol = wrap.querySelector('.gc_col.is-open.is-detail');
        if (detailCol) {
            event.stopImmediatePropagation();
            detailCol.classList.remove('is-detail');
        }
    }, true);
});

document.addEventListener('DOMContentLoaded', () => {
    // 종합 소견: 페이지에는 숨기고, 다른 페이지로 가려 할 때(링크 클릭) 알림 창으로 한 번 띄움
    // "그래도 이동" → 원래 가려던 곳으로, "더 보기" → 이 페이지에 머묾 (이번 방문에 한 번만)
    const opinion = document.querySelector('.gc_opinion');
    if (!opinion) {
        return;
    }
    const body = opinion.querySelector('.rp_op_body');
    opinion.hidden = true;
    opinion.style.display = 'none';

    const modal = document.createElement('div');
    modal.className = 'op_alert';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="op_alert_box" role="alertdialog" aria-modal="true" aria-labelledby="op-alert-title">
            <p class="op_alert_kicker"><span aria-hidden="true"></span>나가기 전에 확인해 주세요</p>
            <h2 id="op-alert-title">이번 달 종합 소견</h2>
            <div class="op_alert_body">${body ? body.innerHTML : ''}</div>
            <div class="op_alert_actions">
                <button type="button" class="op_stay" data-op-stay>리포트 더 보기</button>
                <a class="op_go" data-op-go href="#">확인하고 이동 <i aria-hidden="true">→</i></a>
            </div>
        </div>`;
    document.body.append(modal);
    const goBtn = modal.querySelector('[data-op-go]');
    let shown = false;
    const close = () => {
        modal.classList.remove('is-in');
        document.documentElement.classList.remove('is-op-alert');
        setTimeout(() => { modal.hidden = true; }, 250);
    };
    const open = (href) => {
        shown = true;
        goBtn.href = href;
        modal.hidden = false;
        document.documentElement.classList.add('is-op-alert');
        requestAnimationFrame(() => modal.classList.add('is-in'));
        goBtn.focus();
    };
    document.addEventListener('click', (event) => {
        if (shown || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        const link = event.target.closest('a[href]');
        if (!link || modal.contains(link)) return;
        const url = new URL(link.href, location.href);
        if (url.pathname === location.pathname || link.target === '_blank') return;
        event.preventDefault();
        open(link.href);
    }, true);
    modal.querySelector('[data-op-stay]').addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) close(); });
});

document.addEventListener('DOMContentLoaded', () => {
    // "리포트 더 보기": 알림을 닫고 → 기둥 4개를 차례로 둘러보는 '리포트 둘러보기'로 들어감
    // 1번(성장률)을 펼쳐 상세까지 보여 주고, 아래 진행 막대 + 이전 · 다음 버튼으로 4가지 기록을 넘겨 봄
    const wrap = document.querySelector('[data-cols]');
    const stay = document.querySelector('[data-op-stay]');
    if (!wrap) {
        return;
    }
    const order = ['rate', 'streak', 'done', 'goals'];
    const names = { rate: '성장률', streak: '연속 기록', done: '완료한 일', goals: '해낸 목표' };
    const tour = document.createElement('div');
    tour.className = 'gc_tour';
    tour.hidden = true;
    tour.innerHTML = `
        <button type="button" class="gc_tour_btn" data-tour="prev" aria-label="이전 기록">←</button>
        <ol class="gc_tour_steps">${order.map((k, i) => `<li data-step="${k}"><span>${String(i + 1).padStart(2, '0')}</span>${names[k]}</li>`).join('')}</ol>
        <button type="button" class="gc_tour_btn" data-tour="next" aria-label="다음 기록">→</button>`;
    wrap.append(tour);

    const openCol = (key, detail) => {
        const col = wrap.querySelector(`[data-col="${key}"]`);
        if (!col) return;
        if (!col.classList.contains('is-open')) {
            col.querySelector('[data-col-open]').click();
        }
        wrap.querySelectorAll('.gc_col').forEach((c) => c.classList.toggle('is-detail', c === col && detail));
        tour.querySelectorAll('li').forEach((li) => li.classList.toggle('is-on', li.dataset.step === key));
    };
    const currentKey = () => wrap.querySelector('.gc_col.is-open')?.dataset.col;
    const step = (dir) => {
        const i = order.indexOf(currentKey());
        const next = order[(i + dir + order.length) % order.length];
        // 다른 기둥으로: 닫았다가 바로 새 기둥 펼침
        wrap.querySelector('[data-col-close]')?.click();
        wrap.querySelector('[data-col-close]')?.click();
        setTimeout(() => openCol(next, false), 50);
    };
    tour.querySelector('[data-tour="prev"]').addEventListener('click', () => step(-1));
    tour.querySelector('[data-tour="next"]').addEventListener('click', () => step(1));
    tour.querySelectorAll('li').forEach((li) => li.addEventListener('click', () => {
        if (li.dataset.step === currentKey()) return;
        wrap.querySelector('[data-col-close]')?.click();
        wrap.querySelector('[data-col-close]')?.click();
        setTimeout(() => openCol(li.dataset.step, false), 50);
    }));
    // 기둥이 열려 있는 동안 늘 둘러보기 막대 표시 + 현재 칸 표시
    new MutationObserver(() => {
        const key = currentKey();
        tour.hidden = !wrap.classList.contains('is-open');
        tour.querySelectorAll('li').forEach((li) => li.classList.toggle('is-on', li.dataset.step === key));
    }).observe(wrap, { attributes: true, attributeFilter: ['class'], subtree: true });

    // "리포트 더 보기"는 알림만 닫고 보던 화면(팝업 뜨기 전) 그대로 머묾
});

document.addEventListener('DOMContentLoaded', () => {
    // 기둥을 펼친 동안: 페이지(뒤 배경)는 휠 · 터치 · 키로 스크롤되지 않음 → 헤더도 그 자리에 고정
    // (상세 카드 안처럼 스스로 스크롤되는 칸은 그대로 스크롤)
    const root = document.documentElement;
    const scrollableInside = (node, dy) => {
        for (let el = node; el && el !== document.body; el = el.parentElement) {
            const st = getComputedStyle(el);
            if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 1) {
                if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
            }
        }
        return false;
    };
    const block = (event, dy) => {
        if (!root.classList.contains('is-col-open')) return;
        if (scrollableInside(event.target, dy)) return;
        event.preventDefault();
    };
    window.addEventListener('wheel', (event) => block(event, event.deltaY), { passive: false, capture: true });
    let ty = 0;
    window.addEventListener('touchstart', (event) => { ty = event.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', (event) => block(event, ty - event.touches[0].clientY), { passive: false, capture: true });
    window.addEventListener('keydown', (event) => {
        if (!root.classList.contains('is-col-open')) return;
        if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) event.preventDefault();
    }, true);
});


document.addEventListener('DOMContentLoaded', () => {
    // 동그라미 속 도형: 기둥을 펼칠 때마다 처음부터 다시 채워지게 (클래스 다시 붙이기)
    const wrap = document.querySelector('[data-cols]');
    if (!wrap) return;
    wrap.querySelectorAll('.gc_col').forEach((col) => {
        new MutationObserver(() => {
            const orb = col.querySelector('.gc_orb');
            if (!orb) return;
            if (col.classList.contains('is-open')) {
                orb.classList.remove('is-fill');
                void orb.offsetWidth;
                orb.classList.add('is-fill');
            } else {
                orb.classList.remove('is-fill');
            }
        }).observe(col, { attributes: true, attributeFilter: ['class'] });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // "새 루틴 만들기": 글자+화살표를 오른쪽 끝까지 보낼 거리 계산
    const link = document.querySelector('.gr_end_top .gr_biglink, .gr_end .gr_biglink');
    if (!link) return;
    const measure = () => {
        const cs = getComputedStyle(link);
        const inner = [...link.children].reduce((w, el) => w + el.getBoundingClientRect().width, 0)
            + (parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0) * Math.max(link.children.length - 1, 0);
        const room = link.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - inner;
        link.style.setProperty('--slide', `${Math.max(0, room)}px`);
    };
    link.addEventListener('mouseenter', measure);
    link.closest('.gr_end_top')?.addEventListener('mouseenter', measure);
    link.addEventListener('focus', measure);
    window.addEventListener('resize', measure);
    (document.fonts?.ready || Promise.resolve()).then(measure);
});

document.addEventListener('DOMContentLoaded', () => {
    // 상세 카드 아래: "변화가 시작된 날" + "아이가 잘 따라온 루틴" (기둥마다 다른 내용)
    const MORE = {
        rate: {
            turn: ['10월 22일 (4주차)', '아침 8시 기상 루틴을 시작한 날이에요. 이날 이후 실천율이 주마다 평균 +3%p → +6%p로 두 배 빨리 올랐어요.'],
            before: '시작 전 평균 49%', after: '시작 후 평균 71%',
            best: [['아침 8시 기상', 100], ['물 8잔 마시기', 96], ['양치 · 세수', 93], ['받아쓰기 10문제', 78]]
        },
        streak: {
            turn: ['11월 6일 (목)', '토요일 아침 가족 산책을 루틴에 넣은 주예요. 그 뒤로 주말에도 끊기지 않고 18일째 이어 가는 중이에요.'],
            before: '그 전 최장 9일', after: '지금 18일째',
            best: [['토요일 가족 산책', 100], ['아침 8시 기상', 100], ['잠들기 전 책 10분', 89], ['영어 단어 10개', 72]]
        },
        done: {
            turn: ['11월 3일 (월)', '저녁 루틴을 8시에서 7시로 옮긴 날이에요. 피곤해지기 전에 끝내면서 하루 완료 수가 눈에 띄게 늘었어요.'],
            before: '하루 평균 1.8개', after: '하루 평균 2.8개',
            best: [['가방 챙기기 (생활 습관)', 98], ['숙제 먼저 하기 (공부)', 90], ['줄넘기 50개 (운동)', 82], ['책 10분 읽기 (독서)', 61]]
        },
        goals: {
            turn: ['10월 22일 (4주차)', '첫 목표 "아침 8시 기상 21일"을 시작한 날이에요. 11월 12일에 끝까지 해낸 뒤 3주 사이 목표 3개를 연달아 달성했어요.'],
            before: '그 전 달성 4개', after: '그 뒤 달성 +3개',
            best: [['아침 8시 기상 21일', 100], ['물 8잔 마시기 2주', 100], ['하루 20페이지 독서', 93], ['하루 30분 걷기', 93]]
        }
    };
    document.querySelectorAll('[data-col-detail]').forEach((detail) => {
        const m = MORE[detail.dataset.colDetail];
        if (!m) return;
        const block = document.createElement('div');
        block.className = 'gd_more';
        block.innerHTML = `
            <section class="gd_turn">
                <p class="gd_kicker">변화가 시작된 날</p>
                <p class="gd_date">${m.turn[0]}</p>
                <p class="gd_text">${m.turn[1]}</p>
                <div class="gd_compare"><span>${m.before}</span><i aria-hidden="true">→</i><b>${m.after}</b></div>
            </section>
            <section class="gd_best">
                <p class="gd_kicker">아이가 잘 따라온 루틴</p>
                <ol>${m.best.map(([name, v], i) => `<li><span class="gd_rank">${i + 1}</span><span class="gd_name">${name}</span><i class="gd_bar" style="--v:${v / 100}"></i><b>${v}%</b></li>`).join('')}</ol>
                <p class="gd_note">실천율이 높은 순서예요. 1위 루틴은 시간을 바꾸지 말고 그대로 유지해 주세요.</p>
            </section>`;
        detail.append(block);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // "다음 목표를 세워 볼까요": 글자를 한 자씩 나눠 두고, 카드를 가리키면 한 자씩 차례로 통통 튀며 색이 바뀜
    const title = document.querySelector('.gr_end_top .gr_end_title');
    if (!title || title.dataset.split) return;
    title.dataset.split = '1';
    const text = title.textContent;
    title.setAttribute('aria-label', text);
    title.innerHTML = [...text].map((ch, i) => (ch === ' ' ? ' ' : `<span class="ge_ch" aria-hidden="true" style="--c:${i}">${ch}</span>`)).join('');
});
