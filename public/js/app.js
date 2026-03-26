// Base Clerk configuration
const CLERK_PUBLISHABLE_KEY = 'pk_test_Zmx1ZW50LWJ1Zy05Ny5jbGVyay5hY2NvdW50cy5kZXYk';

// Load Clerk
const script = document.createElement('script');
script.setAttribute('data-clerk-publishable-key', CLERK_PUBLISHABLE_KEY);
script.async = true;
script.src = `https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
script.crossOrigin = 'anonymous';

script.addEventListener('load', async function () {
    await window.Clerk.load();
    const authContainer = document.getElementById('auth-container');
    
    if (authContainer) {
        authContainer.innerHTML = '';
        if (window.Clerk.user) {
            // Un-hide dashboard link if it exists
            const dashboardLink = document.createElement('a');
            dashboardLink.href = '/dashboard.html';
            dashboardLink.className = 'hidden md:block font-medium text-slateMuted hover:text-slateDark transition-colors px-2';
            dashboardLink.innerText = 'Dashboard';
            authContainer.appendChild(dashboardLink);

            const userBtnDiv = document.createElement('div');
            authContainer.appendChild(userBtnDiv);
            window.Clerk.mountUserButton(userBtnDiv, {
                appearance: {
                    elements: {
                        userButtonAvatarBox: "w-10 h-10 border-2 border-white shadow-sm"
                    }
                }
            });
        } else {
            const signInBtn = document.createElement('a');
            signInBtn.href = '/login.html';
            signInBtn.className = 'hidden md:block font-medium text-slateMuted hover:text-slateDark transition-colors px-2';
            signInBtn.innerText = 'Log in';
            
            const signUpBtn = document.createElement('a');
            signUpBtn.href = '/login.html?mode=signup';
            signUpBtn.className = 'bg-slateDark text-white px-5 py-2.5 rounded-2xl font-medium hover:bg-black transition-colors shadow-sm';
            signUpBtn.innerText = 'Sign up';

            authContainer.appendChild(signInBtn);
            authContainer.appendChild(signUpBtn);
        }
    }
});
document.body.appendChild(script);

// Utility functions
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
}
