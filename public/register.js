document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        // Check if response is ok
if (response.status === 409) {
    throw new Error('User already exists. Please try a different username or email.');
}
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
            alert(result.message || 'Registration successful!');
            window.location.href = result.redirect || '/login';
        } else {
            alert(result.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});