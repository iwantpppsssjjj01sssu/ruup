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
