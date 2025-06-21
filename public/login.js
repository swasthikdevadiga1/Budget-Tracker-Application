const form = document.getElementById('loginForm');
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response has content and is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server did not return JSON response');
        }

        const result = await response.json();

        if (result.success) {
            // Store user data in localStorage
            if (result.user_id) {
                localStorage.setItem('user_id', result.user_id);
            }
            if (result.username) {
                localStorage.setItem('username', result.username);
            }
            
            // Redirect to dashboard or specified page
            window.location.href = result.redirect || '/dashboard';
        } else {
            alert(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials and try again.');
    }
});