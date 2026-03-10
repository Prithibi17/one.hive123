// Supabase Configuration for OneHive
const SUPABASE_URL = "https://adtdjzohzcyrczpnsusc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uxkUIgza1mQIPrxNxkrv6Q_4DO6xpRm";

// Initialize the Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for global use
window.supabaseClient = _supabase;

// --- PREMIUM GLOBAL NOTIFICATION SYSTEM ---
(function () {
    // Inject Toast CSS
    const styles = `
        .toast-container { 
            position: fixed; 
            bottom: 32px; 
            right: 32px; 
            z-index: 10000; 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            pointer-events: none; 
        }
        .toast-card { 
            background: rgba(15, 23, 42, 0.85); 
            backdrop-filter: blur(20px); 
            -webkit-backdrop-filter: blur(20px); 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            color: white; 
            padding: 16px 24px; 
            border-radius: 16px; 
            font-size: 14px; 
            font-weight: 500; 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); 
            display: flex; 
            align-items: center; 
            gap: 14px; 
            min-width: 300px; 
            max-width: 450px; 
            pointer-events: auto; 
            animation: toast-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); 
            transition: 0.4s; 
        }
        .toast-card.fade-out { 
            opacity: 0; 
            transform: translateX(30px) scale(0.95); 
        }
        @keyframes toast-in { 
            from { opacity: 0; transform: translateX(50px) scale(0.9); } 
            to { opacity: 1; transform: translateX(0) scale(1); } 
        }
        .toast-icon { 
            width: 36px; 
            height: 36px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 10px; 
            background: linear-gradient(135deg, #3B82F6, #2563EB); 
            color: white; 
            flex-shrink: 0; 
            font-size: 16px; 
            box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
        }
        .toast-message {
            line-height: 1.4;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Override Global Alert
    window.alert = function (message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-card';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-bell"></i></div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Auto remove after 4.5s
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    };
})();
