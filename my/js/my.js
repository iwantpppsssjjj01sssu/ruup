document.addEventListener('DOMContentLoaded', () => {
    const toastBox = document.querySelector('[data-toast-box]');
    let toastId = null;

    // 아직 페이지가 없는 메뉴는 짧은 안내만 띄움
    const toast = (text) => {
        toastBox.textContent = text;
        toastBox.classList.add('is-show');
        clearTimeout(toastId);
        toastId = setTimeout(() => toastBox.classList.remove('is-show'), 2200);
    };

    document.querySelectorAll('[data-toast]').forEach((button) => {
        button.addEventListener('click', () => toast(button.dataset.toast));
    });

    // 알림: 종 버튼으로 열고, 바깥을 누르거나 Esc로 닫기
    const notiButton = document.querySelector('[data-noti-button]');
    const noti = document.querySelector('[data-noti]');
    const setNoti = (isOpen) => {
        noti.hidden = !isOpen;
        notiButton.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            document.querySelector('[data-noti-dot]')?.remove();
            notiButton.setAttribute('aria-label', '알림');
        }
    };
    notiButton.addEventListener('click', (event) => {
        event.stopPropagation();
        setNoti(noti.hidden);
    });
    document.addEventListener('click', (event) => {
        if (!noti.hidden && !noti.contains(event.target)) {
            setNoti(false);
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !noti.hidden) {
            setNoti(false);
            notiButton.focus();
        }
    });

    // 보호자 공유·연결: 공유 기능이 있으면 공유 창, 없으면 링크 복사
    const shareUrl = new URL('../today/today.html#report', location.href).href;
    document.querySelectorAll('[data-share]').forEach((button) => {
        button.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({ title: '박하루의 이번 주 성장 리포트', url: shareUrl });
                } catch (error) {
                    // 사용자가 공유 창을 닫은 경우
                }
                return;
            }
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast('리포트 링크를 복사했어요. 보호자에게 보내 주세요');
            } catch (error) {
                toast('링크를 복사하지 못했어요');
            }
        });
    });

    // 내 정보 수정: 이 브라우저에 저장하고, 화면의 이름·한 줄 소개에 바로 반영
    const PROFILE_KEY = 'luup-my-profile';
    const form = document.querySelector('[data-profile-form]');
    const formError = document.querySelector('[data-form-error]');
    const DEFAULT_PROFILE = { name: '박하루', motto: '천천히, 꾸준히!', phone: '', email: '', notify: 'each', memo: '', share: false };
    let profile = DEFAULT_PROFILE;
    try {
        profile = { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY)) };
    } catch (error) {
        // 저장 불가 환경은 기본값
    }

    const applyProfile = () => {
        document.querySelectorAll('[data-profile-name]').forEach((el) => {
            el.textContent = profile.name;
        });
        document.querySelectorAll('[data-profile-motto]').forEach((el) => {
            el.textContent = profile.motto || '오늘도 한 걸음씩!';
        });
        Object.entries(profile).forEach(([key, value]) => {
            const field = form.elements[key];
            if (!field) {
                return;
            }
            if (field.type === 'checkbox') {
                field.checked = Boolean(value);
            } else {
                field.value = value;
            }
        });
    };
    applyProfile();

    const showError = (field, message) => {
        formError.textContent = message;
        field.setAttribute('aria-invalid', 'true');
        field.focus();
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        formError.textContent = '';
        form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
        const { name, email, phone } = form.elements;
        if (!name.value.trim()) {
            showError(name, '이름을 적어 주세요.');
            return;
        }
        if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            showError(email, '이메일 주소를 다시 확인해 주세요.');
            return;
        }
        if (phone.value && !/^[0-9\-\s]{9,14}$/.test(phone.value)) {
            showError(phone, '연락처는 숫자와 -만 적어 주세요.');
            return;
        }
        const data = new FormData(form);
        profile = {
            name: name.value.trim(),
            motto: String(data.get('motto')).trim(),
            phone: String(data.get('phone')).trim(),
            email: String(data.get('email')).trim(),
            notify: String(data.get('notify')),
            memo: String(data.get('memo')).trim(),
            share: data.get('share') === 'on'
        };
        try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch (error) {
            // 저장 불가 환경에서도 화면에는 반영
        }
        applyProfile();
        toast('내 정보를 저장했어요');
    });

    // 계정 관리 메뉴 → 폼으로 이동
    const focusField = (field) => {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => field.focus({ preventScroll: true }), 450);
    };
    document.querySelectorAll('[data-focus-form]').forEach((button) => {
        button.addEventListener('click', () => focusField(form.elements.name));
    });
    document.querySelectorAll('[data-focus-notify]').forEach((button) => {
        button.addEventListener('click', () => focusField(form.elements.notify));
    });

    // 로그아웃 확인 (데모: 실제 계정 연결 전)
    const logoutDialog = document.querySelector('[data-logout-dialog]');
    document.querySelector('[data-logout]').addEventListener('click', () => logoutDialog.showModal());
    logoutDialog.addEventListener('close', () => {
        if (logoutDialog.returnValue === 'confirm') {
            toast('로그아웃했어요 (데모)');
        }
        logoutDialog.returnValue = '';
    });
});

// 마이페이지 하단 소식 받기: 서버 연결 전이라 입력만 확인하고 안내 문구를 보여줌
(() => {
    const form = document.querySelector('[data-mf-news]');
    if (!form) {
        return;
    }
    const input = form.querySelector('input[type="email"]');
    const msg = form.querySelector('.mf_news_msg');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const ok = input.value.trim() !== '' && input.checkValidity();
        msg.classList.toggle('is-error', !ok);
        msg.textContent = ok ? '구독 신청이 완료됐어요. 새 소식을 메일로 보내드릴게요!' : '이메일 주소를 다시 확인해 주세요.';
        if (ok) {
            form.reset();
        } else {
            input.focus();
        }
    });
})();

// 프로필 사진 바꾸기: 연필 버튼 → 캐릭터 5가지 · 배경색 5가지 고르기, 또는 내 사진 올리기 (이 브라우저에 저장)
(() => {
    const editBtn = document.querySelector('[data-avatar-edit]');
    const picker = document.querySelector('[data-avatar-picker]');
    const img = document.querySelector('[data-avatar-img]');
    const avatar = img?.closest('.my_avatar');
    if (!editBtn || !picker || !img) {
        return;
    }
    const KEY = 'luup-my-avatar';
    const BGS = {
        blue: 'linear-gradient(145deg, #5b8cff, #2563eb)',
        pink: 'linear-gradient(145deg, #ffb3d1, #ff6fa8)',
        yellow: 'linear-gradient(145deg, #ffe28a, #ffbf3c)',
        mint: 'linear-gradient(145deg, #8ff0d6, #2fc79f)',
        purple: 'linear-gradient(145deg, #c9b5ff, #8b6cff)'
    };
    const read = () => {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || {};
        } catch (error) {
            return {};
        }
    };
    let state = { src: '../img/common_character_towel.png', bg: 'blue', photo: false, ...read() };

    const apply = () => {
        img.src = state.src;
        avatar.classList.toggle('is-photo', !!state.photo);
        avatar.style.background = BGS[state.bg] || BGS.blue;
        picker.querySelectorAll('[data-avatar]').forEach((b) => b.setAttribute('aria-checked', String(!state.photo && b.dataset.avatar === state.src)));
        picker.querySelectorAll('[data-avatar-bg]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.avatarBg === state.bg)));
    };
    const save = () => {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (error) {
            // 사진이 너무 크면 저장되지 않을 수 있음 (화면에는 그대로 보임)
        }
    };
    const setOpen = (open) => {
        picker.hidden = !open;
        editBtn.setAttribute('aria-expanded', String(open));
    };

    editBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        setOpen(picker.hidden);
    });
    picker.addEventListener('click', (event) => {
        event.stopPropagation();
        const pick = event.target.closest('[data-avatar]');
        const bg = event.target.closest('[data-avatar-bg]');
        if (pick) {
            state = { ...state, src: pick.dataset.avatar, photo: false };
        } else if (bg) {
            state = { ...state, bg: bg.dataset.avatarBg };
        } else {
            return;
        }
        apply();
        save();
    });
    picker.querySelector('[data-avatar-file]').addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        // 올린 사진은 작게 줄여서 저장 (최대 240px)
        const reader = new FileReader();
        reader.onload = () => {
            const pic = new Image();
            pic.onload = () => {
                const size = 240;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const scale = Math.max(size / pic.width, size / pic.height);
                const w = pic.width * scale;
                const h = pic.height * scale;
                canvas.getContext('2d').drawImage(pic, (size - w) / 2, (size - h) / 2, w, h);
                state = { ...state, src: canvas.toDataURL('image/jpeg', 0.85), photo: true };
                apply();
                save();
                setOpen(false);
            };
            pic.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
    document.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    });

    apply();
})();
